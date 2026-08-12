#!/usr/bin/env node
/**
 * Generates every raster image the site serves, from SVG sources built here.
 *
 *   npm run images
 *
 * Rasterises with sharp, which ships prebuilt librsvg — so this runs anywhere
 * `npm ci` runs, including the scheduled cloud agent that writes the weekly blog
 * post. It is deliberately NOT part of `npm run build`: the PNGs are committed
 * and served as static assets, so the Cloudflare builder never has to do this work.
 *
 * Fonts are the one environment-dependent part. librsvg resolves font-family
 * through the host's fontconfig, so a machine without Inter falls back to its
 * default sans (Helvetica on macOS, DejaVu/Liberation on Linux). Cards stay
 * legible either way; re-run this locally and commit to normalise the set.
 *
 * Outputs:
 *   public/images/og/default.png            1200x630  site-wide social card
 *   public/images/og/blog/<slug>.png        1200x630  per-post hero + social card
 *   public/images/bristol/*.png             1200x630  per-type illustrations
 *   public/images/charts/*.png              embeddable link-bait charts
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');

const C = {
  bg: '#121212',
  surface: '#1A1A1A',
  elevated: '#222222',
  primary: '#A3FFBF',
  accent: '#9BF0FF',
  text: '#F5F2E9',
  muted: '#A0A0A0',
};

const FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

/** Escape text for embedding in XML content. */
const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/**
 * Greedy word wrap using a per-character width estimate. Inter at weight 700
 * averages ~0.52em per char; we bias slightly wide so long titles never overflow.
 */
function wrap(text, fontSize, maxWidth, maxLines = 3) {
  const perChar = fontSize * 0.54;
  const maxChars = Math.floor(maxWidth / perChar);
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) break;
    } else {
      line = candidate;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    const last = lines[maxLines - 1];
    lines[maxLines - 1] = last.replace(/[\s.,;:]+\S*$/, '') + '…';
  }
  return lines;
}

function dataUri(absPath) {
  return `data:image/png;base64,${readFileSync(absPath).toString('base64')}`;
}

/**
 * The stool illustrations are drawn on their own flat pastel backgrounds, which
 * differ per type. Sample one to letterbox the card in a matching colour so the
 * artwork can be contained (not cropped) without a visible seam.
 */
async function backgroundOf(absPath, fallback = '#F4D7C7') {
  try {
    const { data } = await sharp(absPath)
      .extract({ left: 2, top: 2, width: 1, height: 1 })
      .raw()
      .toBuffer({ resolveWithObject: true });
    const hex = [data[0], data[1], data[2]].map((n) => n.toString(16).padStart(2, '0')).join('');
    return `#${hex}`;
  } catch {
    return fallback;
  }
}

/** Width of an auto-sized pill for a short uppercase-ish label. */
const pillWidth = (label, fontSize) => Math.ceil(label.length * fontSize * 0.56) + 36;

/** Render an SVG string to PNG at the given pixel size. */
async function render(svg, outRel, width, height) {
  const out = join(PUBLIC, outRel);
  mkdirSync(dirname(out), { recursive: true });
  await sharp(Buffer.from(svg), { density: 96 })
    .resize(width, height, { fit: 'fill' })
    // Every card paints a full-bleed opaque background rect, so the alpha
    // channel is always fully opaque — dropping it is ~25% off each file.
    .flatten({ background: C.bg })
    .png({ compressionLevel: 9 })
    .toFile(out);
  return out;
}

// ---------------------------------------------------------------------------
// Shared chrome
// ---------------------------------------------------------------------------

const defs = `
  <defs>
    <linearGradient id="brand" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${C.accent}"/>
      <stop offset="100%" stop-color="${C.primary}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="42%" r="55%">
      <stop offset="0%" stop-color="${C.accent}" stop-opacity="0.10"/>
      <stop offset="60%" stop-color="${C.accent}" stop-opacity="0.03"/>
      <stop offset="100%" stop-color="${C.accent}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="hairline" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${C.accent}" stop-opacity="0"/>
      <stop offset="25%" stop-color="${C.accent}" stop-opacity="0.45"/>
      <stop offset="75%" stop-color="${C.primary}" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="${C.primary}" stop-opacity="0"/>
    </linearGradient>
  </defs>`;

/** Small "PoopCheck" wordmark, anchored at (x, y) baseline. */
const wordmark = (x, y, size = 28, anchor = 'start') => `
  <text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${FONT}" font-size="${size}"
        font-weight="700" letter-spacing="-0.5">
    <tspan fill="${C.text}">Poop</tspan><tspan fill="url(#brand)">Check</tspan>
  </text>`;

// ---------------------------------------------------------------------------
// 1. Default OG card
// ---------------------------------------------------------------------------

async function ogDefault() {
  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  <rect width="1200" height="630" fill="${C.bg}"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <text x="600" y="300" text-anchor="middle" font-family="${FONT}" font-size="104" font-weight="700" letter-spacing="-3">
    <tspan fill="${C.text}">Poop</tspan><tspan fill="url(#brand)">Check</tspan>
  </text>
  <rect x="380" y="336" width="440" height="1.5" rx="1" fill="url(#hairline)"/>
  <text x="600" y="394" text-anchor="middle" font-family="${FONT}" font-size="27" font-weight="400"
        fill="${C.text}" opacity="0.62" letter-spacing="0.4">AI-Powered Stool Analysis &amp; Gut Health Tracking</text>
  <text x="600" y="470" text-anchor="middle" font-family="${FONT}" font-size="19" font-weight="500"
        fill="${C.muted}" letter-spacing="2.5">BRISTOL STOOL SCALE · GUT HEALTH SCORE · DAILY LOG</text>
</svg>`;
  await render(svg, 'images/og/default.png', 1200, 630);
  console.log('  og/default.png');
}

// ---------------------------------------------------------------------------
// 2. Per-post OG / hero cards
// ---------------------------------------------------------------------------

const CATEGORY = {
  'gut-health': { label: 'Gut Health', hue: C.primary },
  'stool-analysis': { label: 'Stool Analysis', hue: C.accent },
  'bristol-stool-scale': { label: 'Bristol Stool Scale', hue: '#FFD98E' },
  nutrition: { label: 'Nutrition', hue: '#B8F5A3' },
  conditions: { label: 'Conditions', hue: '#FFB3B3' },
  'app-updates': { label: 'App Updates', hue: C.accent },
  research: { label: 'Research', hue: '#D9B8FF' },
};

async function postCard({ title, category, slug }) {
  const cat = CATEGORY[category] || CATEGORY['gut-health'];
  const lines = wrap(title, 60, 940, 3);
  const startY = 300 - (lines.length - 1) * 37;
  const tspans = lines
    .map((l, i) => `<tspan x="90" dy="${i === 0 ? 0 : 74}">${esc(l)}</tspan>`)
    .join('');

  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  <rect width="1200" height="630" fill="${C.bg}"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect x="0" y="0" width="10" height="630" fill="${cat.hue}"/>

  <rect x="90" y="72" width="${cat.label.length * 11 + 44}" height="40" rx="20"
        fill="${cat.hue}" fill-opacity="0.14" stroke="${cat.hue}" stroke-opacity="0.35"/>
  <text x="${90 + (cat.label.length * 11 + 44) / 2}" y="98" text-anchor="middle" font-family="${FONT}"
        font-size="16" font-weight="600" fill="${cat.hue}" letter-spacing="0.6">${esc(cat.label)}</text>

  <text y="${startY}" font-family="${FONT}" font-size="60" font-weight="700"
        fill="${C.text}" letter-spacing="-1.5">${tspans}</text>

  <rect x="90" y="510" width="1020" height="1.5" rx="1" fill="url(#hairline)"/>
  ${wordmark(90, 566, 30)}
  <text x="1110" y="566" text-anchor="end" font-family="${FONT}" font-size="19"
        fill="${C.muted}" letter-spacing="0.3">poopcheck.app</text>
</svg>`;
  await render(svg, `images/og/blog/${slug}.png`, 1200, 630);
}

async function blogCards() {
  const generated = { blog: [], guides: [] };
  const dir = join(ROOT, 'src', 'content', 'blog');
  const files = readdirSync(dir).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'));
  for (const file of files) {
    const raw = readFileSync(join(dir, file), 'utf8');
    const fm = raw.split(/^---$/m)[1] || '';
    const pick = (key) => {
      const m = fm.match(new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, 'm'));
      return m ? m[1] : '';
    };
    const slug = file.replace(/\.mdx?$/, '');
    await postCard({ title: pick('title'), category: pick('category'), slug });
    generated.blog.push(slug);
  }
  console.log(`  og/blog/*.png (${files.length} posts)`);

  const guideDir = join(ROOT, 'src', 'content', 'guides');
  const guides = readdirSync(guideDir).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'));
  for (const file of guides) {
    const raw = readFileSync(join(guideDir, file), 'utf8');
    const fm = raw.split(/^---$/m)[1] || '';
    const m = fm.match(/^title:\s*["']?(.+?)["']?\s*$/m);
    const slug = file.replace(/\.mdx?$/, '');
    const cat = CATEGORY['bristol-stool-scale'];
    const lines = wrap(m ? m[1] : slug, 60, 940, 3);
    const startY = 300 - (lines.length - 1) * 37;
    const tspans = lines.map((l, i) => `<tspan x="90" dy="${i === 0 ? 0 : 74}">${esc(l)}</tspan>`).join('');
    const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  <rect width="1200" height="630" fill="${C.bg}"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect x="0" y="0" width="10" height="630" fill="${cat.hue}"/>
  <rect x="90" y="72" width="120" height="40" rx="20" fill="${cat.hue}" fill-opacity="0.14"
        stroke="${cat.hue}" stroke-opacity="0.35"/>
  <text x="150" y="98" text-anchor="middle" font-family="${FONT}" font-size="16" font-weight="600"
        fill="${cat.hue}" letter-spacing="0.6">Guide</text>
  <text y="${startY}" font-family="${FONT}" font-size="60" font-weight="700" fill="${C.text}"
        letter-spacing="-1.5">${tspans}</text>
  <rect x="90" y="510" width="1020" height="1.5" rx="1" fill="url(#hairline)"/>
  ${wordmark(90, 566, 30)}
  <text x="1110" y="566" text-anchor="end" font-family="${FONT}" font-size="19" fill="${C.muted}">poopcheck.app</text>
</svg>`;
    await render(svg, `images/og/guides/${slug}.png`, 1200, 630);
    generated.guides.push(slug);
  }
  console.log(`  og/guides/*.png (${guides.length} guides)`);

  // Consumed by postImage()/guideImage() so a post whose card hasn't been
  // generated yet falls back to the site card instead of a broken <img>.
  writeFileSync(
    join(ROOT, 'src', 'data', 'generated-images.json'),
    JSON.stringify(
      { $comment: 'Generated by scripts/generate-images.mjs — do not edit by hand.', ...generated },
      null,
      2
    ) + '\n'
  );
}

// ---------------------------------------------------------------------------
// 3. Per-type illustrations, normalised and given descriptive filenames.
//
// The source art lives at /images/types/4.png — a filename that tells Google
// Images nothing. These copies are uniform 1200x630 (so they double as the OG
// card for each type page) and named for what they actually depict.
// ---------------------------------------------------------------------------

async function bristolTypeImages() {
  const bristol = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'bristol.json'), 'utf8'));
  const manifest = [];
  for (const t of bristol.types) {
    const src = join(PUBLIC, 'images', 'types', `${t.type}.png`);
    const plate = await backgroundOf(src);
    const img = dataUri(src);
    const name = t.name.replace(/^Type \d+:\s*/, '');
    const fileSlug = `bristol-stool-type-${t.type}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
    const rel = `images/bristol/${fileSlug}.png`;

    const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  <rect width="1200" height="630" fill="${plate}"/>
  <image href="${img}" x="60" y="40" width="1080" height="470" preserveAspectRatio="xMidYMid meet"/>
  <text x="600" y="565" text-anchor="middle" font-family="${FONT}" font-size="38" font-weight="700"
        fill="#2A2018" letter-spacing="-0.8">Bristol Stool Type ${t.type} — ${esc(name)}</text>
  <text x="600" y="600" text-anchor="middle" font-family="${FONT}" font-size="21"
        fill="#2A2018" opacity="0.62">${esc(t.health_signal_label)} · poopcheck.app</text>
</svg>`;
    await render(svg, rel, 1200, 630);
    manifest.push({ type: t.type, slug: t.slug, file: `/${rel}`, name, alt: `Bristol Stool Chart Type ${t.type}: ${t.appearance}` });
  }
  writeFileSync(
    join(ROOT, 'src', 'data', 'bristol-images.json'),
    JSON.stringify({ $comment: 'Generated by scripts/generate-images.mjs — do not edit by hand.', width: 1200, height: 630, images: manifest }, null, 2) + '\n'
  );
  console.log(`  bristol/*.png (${manifest.length} types) + src/data/bristol-images.json`);
}

// ---------------------------------------------------------------------------
// 4. Bristol Stool Chart — the embeddable, link-earning asset
// ---------------------------------------------------------------------------

async function bristolChart() {
  const bristol = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'bristol.json'), 'utf8'));
  const W = 1200;
  const HEADER = 210;
  const ROW = 196;
  const FOOTER = 96;
  const H = HEADER + ROW * 7 + FOOTER;

  const signalColor = {
    'severe-constipation': '#FF6B6B',
    'mild-constipation': '#FFB86B',
    healthy: C.primary,
    ideal: C.primary,
    'borderline-loose': '#FFD98E',
    'mild-diarrhea': '#FFB86B',
    diarrhea: '#FF6B6B',
  };

  const rows = (await Promise.all(
    bristol.types.map(async (t, i) => {
      const y = HEADER + i * ROW;
      const accent = signalColor[t.health_signal] || C.accent;
      const typePath = join(PUBLIC, 'images', 'types', `${t.type}.png`);
      const img = dataUri(typePath);
      const plate = await backgroundOf(typePath);
      const name = t.name.replace(/^Type \d+:\s*/, '');
      const desc = wrap(t.appearance, 20, 440, 3);
      const label = t.health_signal_label;
      const pw = Math.min(pillWidth(label, 15), 240);
      const px = 1102 - pw;
      return `
  <g>
    <rect x="60" y="${y}" width="1080" height="${ROW - 22}" rx="18" fill="${C.surface}"/>
    <rect x="60" y="${y}" width="6" height="${ROW - 22}" rx="3" fill="${accent}"/>

    <clipPath id="clip-${t.type}"><rect x="86" y="${y + 18}" width="238" height="${ROW - 58}" rx="12"/></clipPath>
    <g clip-path="url(#clip-${t.type})">
      <rect x="86" y="${y + 18}" width="238" height="${ROW - 58}" fill="${plate}"/>
      <image href="${img}" x="86" y="${y + 18}" width="238" height="${ROW - 58}"
             preserveAspectRatio="xMidYMid meet"/>
    </g>

    <text x="356" y="${y + 52}" font-family="${FONT}" font-size="30" font-weight="700" fill="${C.text}">
      Type ${t.type}
    </text>
    <text x="${356 + 108}" y="${y + 52}" font-family="${FONT}" font-size="26" font-weight="500" fill="${accent}">
      ${esc(name)}
    </text>
    <text x="356" y="${y + 88}" font-family="${FONT}" font-size="20" fill="${C.muted}">
      ${desc.map((l, k) => `<tspan x="356" dy="${k === 0 ? 0 : 27}">${esc(l)}</tspan>`).join('')}
    </text>

    <rect x="${px}" y="${y + 28}" width="${pw}" height="38" rx="19" fill="${accent}" fill-opacity="0.13"
          stroke="${accent}" stroke-opacity="0.32"/>
    <text x="${px + pw / 2}" y="${y + 53}" text-anchor="middle" font-family="${FONT}" font-size="15"
          font-weight="600" fill="${accent}">${esc(label)}</text>
  </g>`;
    })
  )).join('');

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  <text x="600" y="88" text-anchor="middle" font-family="${FONT}" font-size="54" font-weight="700"
        fill="${C.text}" letter-spacing="-1.5">The Bristol Stool Chart</text>
  <text x="600" y="130" text-anchor="middle" font-family="${FONT}" font-size="23" fill="${C.muted}">
    All 7 stool types, what each one looks like, and what it means for your gut
  </text>
  <rect x="360" y="158" width="480" height="1.5" rx="1" fill="url(#hairline)"/>
  ${rows}
  <text x="60" y="${H - 40}" font-family="${FONT}" font-size="19" fill="${C.muted}">
    Types 3–4 are the healthy range.
  </text>
  ${wordmark(1140, H - 40, 26, 'end')}
</svg>`;
  await render(svg, 'images/charts/bristol-stool-chart.png', W, H);
  console.log(`  charts/bristol-stool-chart.png (${W}x${H})`);
}

// ---------------------------------------------------------------------------
// 4. Themed chart renderers
//
// Each chart ships twice: the dark on-brand version for the page, and a light
// "printable" version. Printable variants matter more than they look — "printable"
// is a heavy modifier on these queries, and a chart someone prints and pins to a
// fridge is a chart they came to the site to get.
// ---------------------------------------------------------------------------

const THEMES = {
  dark: {
    id: 'dark',
    bg: C.bg,
    surface: C.surface,
    text: C.text,
    muted: C.muted,
    hairline: 'url(#hairline)',
    stroke: '#FFFFFF',
    strokeOpacity: 0.14,
    fillOpacity: 0.13,
    // Flag/accent colours read fine on near-black.
    remap: (hex) => hex,
    wordmarkFill: null,
  },
  print: {
    id: 'print',
    bg: '#FFFFFF',
    surface: '#F4F4F2',
    text: '#161616',
    muted: '#585858',
    hairline: '#D8D8D4',
    stroke: '#000000',
    strokeOpacity: 0.16,
    fillOpacity: 0.16,
    // The dark theme's pastels are illegible on white; swap for the site's
    // documented light-mode tokens and darker warn/urgent tones.
    remap: (hex) =>
      ({
        '#A3FFBF': '#0D7A32',
        '#9BF0FF': '#046A88',
        '#FFB86B': '#B45309',
        '#FFD98E': '#8A6100',
        '#FF6B6B': '#B91C1C',
      })[String(hex).toUpperCase()] || hex,
    wordmarkFill: '#161616',
  },
};

/**
 * Footnote on the left, wordmark on the right, on separate baselines so a long
 * disclaimer can never run underneath the logo.
 */
const footnoteBlock = (t, footnote, H) => {
  const lines = wrap(footnote, 17, 980, 2);
  const first = H - 46 - (lines.length - 1) * 22;
  return `
  <text x="60" y="${first}" font-family="${FONT}" font-size="17" fill="${t.muted}">
    ${lines.map((l, i) => `<tspan x="60" dy="${i === 0 ? 0 : 22}">${esc(l)}</tspan>`).join('')}
  </text>
  ${themedWordmark(t, 1140, H - 46)}`;
};

/** Wordmark that stays legible on a white sheet. */
const themedWordmark = (t, x, y, size = 26, anchor = 'end') =>
  t.wordmarkFill
    ? `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${FONT}" font-size="${size}"
             font-weight="700" fill="${t.wordmarkFill}">PoopCheck</text>`
    : wordmark(x, y, size, anchor);

/**
 * Rows of: colour swatch, name, one-line meaning, status pill.
 * Backs both the poop colour chart and the baby poop colour chart.
 */
async function swatchChart({ items, flags, title, subtitle, footnote, out, meta }, theme) {
  const t = THEMES[theme];
  const W = 1200;
  const HEADER = 210;
  const hasWhen = items.some((i) => i.when);
  const ROW = hasWhen ? 148 : 132;
  const FOOTER = 108;
  const H = HEADER + ROW * items.length + FOOTER;

  const rows = items
    .map((c, i) => {
      const y = HEADER + i * ROW;
      const flag = flags[c.flag];
      const flagColor = t.remap(flag.color);
      const desc = wrap(c.meaning, 20, hasWhen ? 560 : 640, 2);
      const pw = pillWidth(flag.label, 15);
      const px = 1102 - pw;
      return `
  <g>
    <rect x="60" y="${y}" width="1080" height="${ROW - 20}" rx="16" fill="${t.surface}"/>
    <rect x="84" y="${y + 20}" width="72" height="72" rx="16" fill="${c.hex}"
          stroke="${t.stroke}" stroke-opacity="${t.strokeOpacity}"/>
    <text x="184" y="${y + 46}" font-family="${FONT}" font-size="26" font-weight="700" fill="${t.text}">
      ${esc(c.name)}
    </text>
    ${c.when ? `<text x="184" y="${y + 72}" font-family="${FONT}" font-size="17" font-style="italic" fill="${t.muted}">${esc(c.when)}</text>` : ''}
    <text x="184" y="${y + (c.when ? 102 : 78)}" font-family="${FONT}" font-size="19" fill="${t.muted}">
      ${desc.map((l, k) => `<tspan x="184" dy="${k === 0 ? 0 : 25}">${esc(l)}</tspan>`).join('')}
    </text>
    <rect x="${px}" y="${y + (ROW - 20) / 2 - 20}" width="${pw}" height="40" rx="20" fill="${flagColor}"
          fill-opacity="${t.fillOpacity}" stroke="${flagColor}" stroke-opacity="0.34"/>
    <text x="${px + pw / 2}" y="${y + (ROW - 20) / 2 + 6}" text-anchor="middle" font-family="${FONT}"
          font-size="15" font-weight="600" fill="${flagColor}">${esc(flag.label)}</text>
  </g>`;
    })
    .join('');

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  <rect width="${W}" height="${H}" fill="${t.bg}"/>
  <text x="600" y="88" text-anchor="middle" font-family="${FONT}" font-size="54" font-weight="700"
        fill="${t.text}" letter-spacing="-1.5">${esc(title)}</text>
  <text x="600" y="130" text-anchor="middle" font-family="${FONT}" font-size="23" fill="${t.muted}">${esc(subtitle)}</text>
  <rect x="360" y="158" width="480" height="1.5" rx="1" fill="${t.hairline}"/>
  ${rows}
  ${footnoteBlock(t, footnote, H)}
</svg>`;
  await render(svg, out, W, H);
  if (meta) meta.push({ out, width: W, height: H });
  return { width: W, height: H };
}

/** Horizontal bar chart with a target reference line. Backs the fibre chart. */
async function barChart({ items, title, subtitle, unit, target, targetLabel, footnote, out, meta }, theme) {
  const t = THEMES[theme];
  const W = 1200;
  const HEADER = 226;
  const ROW = 56;
  const FOOTER = 112;
  const H = HEADER + ROW * items.length + FOOTER;

  const LABEL_W = 430;
  const BAR_X = LABEL_W + 80;
  const BAR_MAX = 1100 - BAR_X - 70;
  // Scale to the target when it exceeds every bar. No single food hits a full
  // day's fiber, and that gap is the point of the chart — a line floating off
  // the right edge would hide it.
  const max = Math.max(...items.map((i) => i.value), target || 0);
  const accent = t.remap(C.primary);
  const targetX = target ? BAR_X + (target / max) * BAR_MAX : null;

  const rows = items
    .map((it, i) => {
      const y = HEADER + i * ROW;
      const w = Math.max(4, (it.value / max) * BAR_MAX);
      return `
  <g>
    ${i % 2 === 0 ? `<rect x="60" y="${y - 6}" width="1080" height="${ROW - 6}" rx="10" fill="${t.surface}"/>` : ''}
    <text x="84" y="${y + 26}" font-family="${FONT}" font-size="20" font-weight="600" fill="${t.text}">${esc(it.name)}</text>
    <text x="${84 + LABEL_W - 90}" y="${y + 26}" text-anchor="end" font-family="${FONT}" font-size="16"
          fill="${t.muted}">${esc(it.serving)}</text>
    <rect x="${BAR_X}" y="${y + 8}" width="${w}" height="24" rx="6" fill="${accent}" fill-opacity="0.85"/>
    <text x="${BAR_X + w + 12}" y="${y + 26}" font-family="${FONT}" font-size="18" font-weight="700"
          fill="${t.text}">${it.value}${unit}</text>
  </g>`;
    })
    .join('');

  // Flip the label to the inside when the line sits near the right edge,
  // which it does whenever the target exceeds every bar.
  const labelRight = targetX !== null && targetX > W - 320;
  const targetLine =
    targetX !== null
      ? `<line x1="${targetX}" y1="${HEADER - 22}" x2="${targetX}" y2="${HEADER + ROW * items.length - 4}"
              stroke="${t.remap(C.accent)}" stroke-width="2" stroke-dasharray="6 5" opacity="0.85"/>
         <text x="${labelRight ? targetX - 10 : targetX + 8}" y="${HEADER - 30}"
               text-anchor="${labelRight ? 'end' : 'start'}" font-family="${FONT}" font-size="15"
               font-weight="600" fill="${t.remap(C.accent)}">${esc(targetLabel)}</text>`
      : '';

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  <rect width="${W}" height="${H}" fill="${t.bg}"/>
  <text x="600" y="88" text-anchor="middle" font-family="${FONT}" font-size="52" font-weight="700"
        fill="${t.text}" letter-spacing="-1.5">${esc(title)}</text>
  <text x="600" y="130" text-anchor="middle" font-family="${FONT}" font-size="22" fill="${t.muted}">${esc(subtitle)}</text>
  <rect x="360" y="158" width="480" height="1.5" rx="1" fill="${t.hairline}"/>
  ${targetLine}
  ${rows}
  ${footnoteBlock(t, footnote, H)}
</svg>`;
  await render(svg, out, W, H);
  if (meta) meta.push({ out, width: W, height: H });
  return { width: W, height: H };
}

/** Two-column allowed/avoid lists per category. Backs the FODMAP chart. */
async function listChart({ groups, title, subtitle, lowLabel, highLabel, footnote, out, meta }, theme) {
  const t = THEMES[theme];
  const W = 1200;
  const HEADER = 250;
  const FOOTER = 112;
  const LINE = 27;
  const COL_W = 470;

  const ok = t.remap(C.primary);
  const no = t.remap('#FF6B6B');

  // Height depends on the longest column in each group.
  const blocks = groups.map((g) => {
    const lowLines = g.low.flatMap((s) => wrap(`• ${s}`, 18, COL_W - 40, 2));
    const highLines = g.high.flatMap((s) => wrap(`• ${s}`, 18, COL_W - 40, 2));
    const h = 58 + Math.max(lowLines.length, highLines.length) * LINE + 26;
    return { g, lowLines, highLines, h };
  });
  const H = HEADER + blocks.reduce((s, b) => s + b.h + 16, 0) + FOOTER;

  let y = HEADER;
  const body = blocks
    .map(({ g, lowLines, highLines, h }) => {
      const top = y;
      y += h + 16;
      const col = (lines, x) =>
        lines
          .map((l, k) => `<tspan x="${x}" dy="${k === 0 ? 0 : LINE}">${esc(l)}</tspan>`)
          .join('');
      return `
  <g>
    <rect x="60" y="${top}" width="1080" height="${h}" rx="16" fill="${t.surface}"/>
    <text x="84" y="${top + 38}" font-family="${FONT}" font-size="24" font-weight="700" fill="${t.text}">${esc(g.name)}</text>
    <text x="108" y="${top + 74}" font-family="${FONT}" font-size="18" fill="${t.text}" opacity="0.92">
      ${col(lowLines, 108, ok)}
    </text>
    <text x="${108 + COL_W + 60}" y="${top + 74}" font-family="${FONT}" font-size="18" fill="${t.text}" opacity="0.92">
      ${col(highLines, 108 + COL_W + 60, no)}
    </text>
    <rect x="${108 + COL_W + 22}" y="${top + 52}" width="2" height="${h - 74}" rx="1" fill="${t.muted}" opacity="0.25"/>
  </g>`;
    })
    .join('');

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  <rect width="${W}" height="${H}" fill="${t.bg}"/>
  <text x="600" y="88" text-anchor="middle" font-family="${FONT}" font-size="52" font-weight="700"
        fill="${t.text}" letter-spacing="-1.5">${esc(title)}</text>
  <text x="600" y="130" text-anchor="middle" font-family="${FONT}" font-size="22" fill="${t.muted}">${esc(subtitle)}</text>
  <rect x="360" y="158" width="480" height="1.5" rx="1" fill="${t.hairline}"/>
  <text x="108" y="${HEADER - 34}" font-family="${FONT}" font-size="19" font-weight="700" fill="${ok}">${esc(lowLabel)}</text>
  <text x="${108 + COL_W + 60}" y="${HEADER - 34}" font-family="${FONT}" font-size="19" font-weight="700" fill="${no}">${esc(highLabel)}</text>
  ${body}
  ${footnoteBlock(t, footnote, H)}
</svg>`;
  await render(svg, out, W, H);
  if (meta) meta.push({ out, width: W, height: H });
  return { width: W, height: H };
}

// ---------------------------------------------------------------------------
// 5. The chart set
// ---------------------------------------------------------------------------

const colorData = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'stool-colors.json'), 'utf8'));
const babyData = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'baby-stool-colors.json'), 'utf8'));
const fiberData = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'fiber-foods.json'), 'utf8'));
const fodmapData = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'fodmap-foods.json'), 'utf8'));

const BABY_FLAGS = {
  normal: { label: 'Normal', color: C.primary },
  watch: { label: 'Usually fine', color: '#FFB86B' },
  urgent: { label: 'Call a doctor', color: '#FF6B6B' },
};

async function charts() {
  /** @type {Array<{out: string, width: number, height: number}>} */
  const built = [];

  for (const theme of ['dark', 'print']) {
    const suffix = theme === 'print' ? '-printable' : '';

    await swatchChart(
      {
        items: colorData.colors,
        flags: colorData.flags,
        title: 'The Poop Color Chart',
        subtitle: "What every stool color means — and which ones are worth a doctor's visit",
        footnote: 'Informational only — not a diagnosis. Red, black, or pale stool warrants medical advice.',
        out: `images/charts/poop-color-chart${suffix}.png`,
        meta: built,
      },
      theme
    );

    await swatchChart(
      {
        items: babyData.colors,
        flags: BABY_FLAGS,
        title: 'Baby Poop Color Chart',
        subtitle: 'What each diaper color means — from meconium to solids, and the three to act on',
        footnote: 'White, red, or black stool needs a doctor the same day. Photograph the diaper in natural light.',
        out: `images/charts/baby-poop-color-chart${suffix}.png`,
        meta: built,
      },
      theme
    );

    await barChart(
      {
        items: fiberData.foods.map((f) => ({ name: f.name, serving: f.serving, value: f.grams })),
        title: 'High-Fiber Foods Chart',
        subtitle: 'Grams of dietary fiber per standard serving',
        unit: 'g',
        target: fiberData.targets.women,
        targetLabel: `${fiberData.targets.women} g — daily target (women)`,
        footnote: `Values from ${fiberData.source.label}. Adults need ${fiberData.targets.women}–${fiberData.targets.men} g/day; average intake is about ${fiberData.targets.averageIntake} g.`,
        out: `images/charts/high-fiber-foods-chart${suffix}.png`,
        meta: built,
      },
      theme
    );

    await listChart(
      {
        groups: fodmapData.groups,
        title: 'Low FODMAP Food List',
        subtitle: 'What to eat and what to pause during the elimination phase',
        lowLabel: 'LOW FODMAP — enjoy',
        highLabel: 'HIGH FODMAP — pause',
        footnote: `FODMAP content is portion-dependent. Based on ${fodmapData.attribution.label}; check their app for tested serving sizes.`,
        out: `images/charts/low-fodmap-food-list${suffix}.png`,
        meta: built,
      },
      theme
    );
  }

  // Dimensions are needed by the pages to set width/height and avoid layout shift.
  const manifest = Object.fromEntries(
    built.map((b) => [b.out.replace('images/charts/', '').replace('.png', ''), { src: `/${b.out}`, width: b.width, height: b.height }])
  );
  writeFileSync(
    join(ROOT, 'src', 'data', 'chart-images.json'),
    JSON.stringify({ $comment: 'Generated by scripts/generate-images.mjs — do not edit by hand.', charts: manifest }, null, 2) + '\n'
  );
  for (const b of built) console.log(`  ${b.out.replace('images/', '')} (${b.width}x${b.height})`);
}

// ---------------------------------------------------------------------------
// 5. Publisher logo — schema.org requires a real raster at a stable URL
// ---------------------------------------------------------------------------

async function publisherLogo() {
  const svg = `<svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  <rect width="600" height="600" rx="120" fill="${C.bg}"/>
  <text x="300" y="272" text-anchor="middle" font-family="${FONT}" font-size="86" font-weight="700"
        fill="${C.text}" letter-spacing="-2">Poop</text>
  <text x="300" y="372" text-anchor="middle" font-family="${FONT}" font-size="86" font-weight="700"
        fill="url(#brand)" letter-spacing="-2">Check</text>
</svg>`;
  await render(svg, 'images/logo/poopcheck-logo.png', 600, 600);
  console.log('  logo/poopcheck-logo.png');
}

// ---------------------------------------------------------------------------

console.log('Generating images…');

await publisherLogo();
await ogDefault();
await blogCards();
await bristolTypeImages();
await bristolChart();
await charts();
console.log('Done.');
