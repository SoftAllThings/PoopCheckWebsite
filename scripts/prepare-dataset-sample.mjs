/**
 * De-identify a raw PoopCheck export into a publishable dataset sample.
 *
 * The raw export in `samples/` is real user health data and must never be
 * published or committed as-is. A Sep 2026 review of a 20-image export found:
 *
 *   - `app_payload.externalIndividualId` — a live Firebase Auth UID in every
 *     record, i.e. a production account identifier for a real person.
 *   - EXIF on every image (Apple / samsung / Google device make and model),
 *     including a GPS IFD on 2 of 20. A geotagged photo taken in a bathroom
 *     is a home address.
 *   - Millisecond-precision `created_at`, which combined with the profile
 *     fields below is strongly re-identifying.
 *   - `profile_snapshot` carrying age band, sex, height, weight, stress,
 *     alcohol habits and medical sensitivities (e.g. lactose intolerance) —
 *     a classic quasi-identifier set, and special-category health data under
 *     GDPR Art. 9.
 *
 * This script strips all of the above and emits `dataset-sample/`.
 *
 * De-identification is necessary but NOT sufficient: publishing still requires
 * a lawful basis and, for special-category data, almost certainly the explicit
 * consent of the people whose images these are. That is a human decision and
 * this script does not make it.
 *
 * Usage:  node scripts/prepare-dataset-sample.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const SRC = resolve('samples');
const OUT = resolve('dataset-sample');

/** Dropped outright: direct identifiers and anything with no research value. */
const DROP_KEYS = new Set(['app_payload', 'externalIndividualId']);

/**
 * Profile fields kept. Age band and sex are coarse and genuinely useful as
 * research covariates. Height, weight, sensitivities, stress and alcohol are
 * dropped: together they single people out, and none is needed to train or
 * evaluate a stool classifier.
 */
const PROFILE_KEEP = new Set(['age', 'sex']);

/** Clinical + lifestyle fields that are safe at their existing granularity. */
function cleanLog(log, index) {
  const out = {};
  for (const [k, v] of Object.entries(log)) {
    if (DROP_KEYS.has(k)) continue;

    if (k === 'created_at') {
      // Keep only the day offset within the user's own series. Absolute
      // timestamps plus a profile are re-identifying; relative ordering is
      // what a longitudinal model actually needs.
      continue;
    }

    if (k === 'image_file') {
      out.image_file = `images/${log.sample_id}.jpg`;
      continue;
    }

    if (k === 'profile_snapshot' && v && typeof v === 'object') {
      out.profile = Object.fromEntries(
        Object.entries(v).filter(([pk]) => PROFILE_KEEP.has(pk))
      );
      continue;
    }

    out[k] = v;
  }
  out.sequence_index = index;
  return out;
}

function main() {
  if (!existsSync(SRC)) {
    console.error(`No raw export at ${SRC}. Nothing to do.`);
    process.exit(1);
  }

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(join(OUT, 'images'), { recursive: true });

  const raw = JSON.parse(readFileSync(join(SRC, 'sample.json'), 'utf8'));

  let logCount = 0;
  const users = raw.users.map((u) => ({
    user_id: u.user_id, // already a pseudonym (user_1…); no mapping is retained
    logs: u.logs
      .slice()
      // Order by real timestamp, then discard it — preserves the series.
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map((l, i) => {
        logCount++;
        return cleanLog(l, i);
      }),
  }));

  writeFileSync(
    join(OUT, 'metadata.json'),
    JSON.stringify({ users }, null, 2) + '\n'
  );

  // Re-encode every image. sharp drops all metadata unless withMetadata() is
  // called, so this removes EXIF, GPS and ICC in one pass rather than trying
  // to surgically edit tags.
  const files = readdirSync(join(SRC, 'images')).filter((f) => /\.jpe?g$/i.test(f));
  return Promise.all(
    files.map((f) =>
      sharp(join(SRC, 'images', f))
        .rotate() // bake in EXIF orientation before it is discarded
        .jpeg({ quality: 92 })
        .toFile(join(OUT, 'images', f))
    )
  ).then(async () => {
    // Verify, don't assume.
    let residual = 0;
    for (const f of files) {
      const meta = await sharp(join(OUT, 'images', f)).metadata();
      if (meta.exif || meta.icc || meta.iptc || meta.xmp) residual++;
    }
    console.log(`users:            ${users.length}`);
    console.log(`logs:             ${logCount}`);
    console.log(`images written:   ${files.length}`);
    console.log(`residual EXIF:    ${residual}  ${residual === 0 ? '(clean)' : '(FAILED — do not publish)'}`);
    console.log(`\noutput: ${OUT}`);
    if (residual > 0) process.exit(1);
  });
}

await main();
