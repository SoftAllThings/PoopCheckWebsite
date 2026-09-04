/**
 * Builds the public aggregate dataset behind /data/.
 *
 * Reads app.poop (Supabase Postgres, read-only) and writes aggregate counts to
 * src/data/poop-index.json. Only aggregates ever leave the database — no row,
 * no user_id, no image key. Buckets below MIN_CELL are suppressed so nothing
 * is re-identifiable (GDPR Art. 9 health data).
 *
 * Deliberately excludes every time-based cut: created_at is backfilled
 * (139,562 rows share 2,129 distinct timestamps) so day/hour/month trends
 * would be import artefacts, not behaviour.
 *
 *   node scripts/build-poop-index.mjs
 *
 * Never runs in CI — the committed JSON is what the site builds from, so a
 * deploy never needs database access.
 */
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

// Credentials live with the admin backend that owns this database, not here —
// this repo never gets a copy. Override with POOP_DB_ENV when it moves.
dotenv.config({
  path:
    process.env.POOP_DB_ENV ||
    path.resolve(process.cwd(), '../softallthings/webappAdminBe/.env'),
});

const MIN_CELL = 50; // suppress any bucket smaller than this
const OUT = path.join(process.cwd(), 'src/data/poop-index.json');

const LABELS = {
  color: ['Black', 'White', 'Green', 'Yellow', 'Red', 'Brown', 'Orange'],
  consistency: ['Hard', 'Soft', 'Normal', 'Liquid'],
  shape: ['Sausage', 'Lumpy', 'Flat', 'Blob', 'Liquid'],
  quantity: ['Small', 'Normal', 'Large'],
  health: ['Healthy', 'Flagged'],
  floating: ['Sinks', 'Floats'],
};

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: +(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 2,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 20000,
  query_timeout: 180000,
});

const emptyBucket = () => ({
  n: 0,
  color: {}, consistency: {}, shape: {}, quantity: {}, health: {}, floating: {},
  bloodPresent: 0, mucusPresent: 0, painSum: 0, smellSum: 0,
});

function accumulate(bucket, row) {
  bucket.n += 1;
  for (const field of Object.keys(LABELS)) {
    bucket[field][row[field]] = (bucket[field][row[field]] || 0) + 1;
  }
  bucket.bloodPresent += row.blood_p;
  bucket.mucusPresent += row.mucus_p;
  bucket.painSum += row.pain_level;
  bucket.smellSum += row.smell_level;
}

/** Percentage distribution, with small buckets suppressed. */
function distribution(bucket, field) {
  return LABELS[field].map((label, value) => {
    const count = bucket[field][value] || 0;
    return {
      label,
      value,
      count: count < MIN_CELL ? null : count,
      pct: count < MIN_CELL ? null : +((100 * count) / bucket.n).toFixed(2),
    };
  });
}

function summarise(bucket) {
  const out = { n: bucket.n };
  for (const field of Object.keys(LABELS)) out[field] = distribution(bucket, field);
  out.bloodPct = +((100 * bucket.bloodPresent) / bucket.n).toFixed(2);
  out.mucusPct = +((100 * bucket.mucusPresent) / bucket.n).toFixed(2);
  out.painAvg = +(bucket.painSum / bucket.n).toFixed(2);
  out.smellAvg = +(bucket.smellSum / bucket.n).toFixed(2);
  return out;
}

try {
  const { rows } = await pool.query(`
    SELECT bristol_type, color, consistency, shape, quantity, health, floating,
           (blood > 0)::int AS blood_p, (mucus > 0)::int AS mucus_p,
           pain_level, smell_level
    FROM app.poop
    WHERE bristol_type BETWEEN 1 AND 7
  `);

  const all = emptyBucket();
  const byType = Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((t) => [t, emptyBucket()]));
  for (const row of rows) {
    accumulate(all, row);
    accumulate(byType[row.bristol_type], row);
  }

  const index = {
    generatedAt: new Date().toISOString().slice(0, 10),
    totalRecords: all.n,
    minCellSize: MIN_CELL,
    bristol: [1, 2, 3, 4, 5, 6, 7].map((t) => ({
      type: t,
      count: byType[t].n,
      pct: +((100 * byType[t].n) / all.n).toFixed(2),
    })),
    all: summarise(all),
    byType: Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((t) => [t, summarise(byType[t])])),
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(index, null, 2));
  console.log(`Wrote ${OUT} — ${index.totalRecords.toLocaleString()} records`);
} finally {
  await pool.end();
}
