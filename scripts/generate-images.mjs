#!/usr/bin/env node
/**
 * Generates every raster image the site serves, from SVG sources built here.
 *
 * Run locally, commit the output. This is deliberately NOT part of `npm run build`:
 * it shells out to `rsvg-convert` (brew install librsvg), which isn't available on
 * the Cloudflare/CI builder. The PNGs are checked into git and served as static assets.
 *
 *   npm run images
 *
 * Outputs:
 *   public/images/og/default.png            1200x630  site-wide social card
 *   public/images/og/blog/<slug>.png        1200x630  per-post hero + social card
 *   public/images/charts/*.png              embeddable link-bait charts
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const TMP = join(ROOT, '.astro', 'image-gen');

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
function backgroundOf(absPath, fallback = '#F4D7C7') {
  try {
    const out = execFileSync('magick', [absPath, '-format', '%[hex:p{2,2}]', 'info:'], {
      encoding: 'utf8',
    }).trim();
    return `#${out.slice(0, 6)}`;
  } catch {
    return fallback;
  }
}

/** Width of an auto-sized pill for a short uppercase-ish label. */
const pillWidth = (label, fontSize) => Math.ceil(label.length * fontSize * 0.56) + 36;

/** Render an SVG string to PNG at the given pixel size. */
function render(svg, outRel, width, height) {
  mkdirSync(TMP, { recursive: true });
  const tmpSvg = join(TMP, 'frame.svg');
  writeFileSync(tmpSvg, svg);
  const out = join(PUBLIC, outRel);
  mkdirSync(dirname(out), { recursive: true });
  execFileSync('rsvg-convert', ['-w', String(width), '-h', String(height), tmpSvg, '-o', out]);
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

function ogDefault() {
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
  render(svg, 'images/og/default.png', 1200, 630);
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

function postCard({ title, category, slug }) {
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
  render(svg, `images/og/blog/${slug}.png`, 1200, 630);
}

function blogCards() {
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
    postCard({ title: pick('title'), category: pick('category'), slug });
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
    render(svg, `images/og/guides/${slug}.png`, 1200, 630);
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

function bristolTypeImages() {
  const bristol = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'bristol.json'), 'utf8'));
  const manifest = [];
  for (const t of bristol.types) {
    const src = join(PUBLIC, 'images', 'types', `${t.type}.png`);
    const plate = backgroundOf(src);
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
    render(svg, rel, 1200, 630);
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

function bristolChart() {
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

  const rows = bristol.types
    .map((t, i) => {
      const y = HEADER + i * ROW;
      const accent = signalColor[t.health_signal] || C.accent;
      const typePath = join(PUBLIC, 'images', 'types', `${t.type}.png`);
      const img = dataUri(typePath);
      const plate = backgroundOf(typePath);
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
    .join('');

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
  render(svg, 'images/charts/bristol-stool-chart.png', W, H);
  console.log(`  charts/bristol-stool-chart.png (${W}x${H})`);
}

// ---------------------------------------------------------------------------
// 4. Poop Colour Chart — second embeddable asset
// ---------------------------------------------------------------------------

const colorData = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'stool-colors.json'), 'utf8'));
const STOOL_COLORS = colorData.colors;
const FLAG = colorData.flags;

function colorChart() {
  const W = 1200;
  const HEADER = 210;
  const ROW = 132;
  const FOOTER = 108;
  const H = HEADER + ROW * STOOL_COLORS.length + FOOTER;

  const rows = STOOL_COLORS.map((c, i) => {
    const y = HEADER + i * ROW;
    const flag = FLAG[c.flag];
    const desc = wrap(c.meaning, 20, 640, 2);
    const pw = pillWidth(flag.label, 15);
    const px = 1102 - pw;
    return `
  <g>
    <rect x="60" y="${y}" width="1080" height="${ROW - 20}" rx="16" fill="${C.surface}"/>
    <rect x="84" y="${y + 20}" width="72" height="72" rx="16" fill="${c.hex}"
          stroke="#FFFFFF" stroke-opacity="0.14"/>
    <text x="184" y="${y + 50}" font-family="${FONT}" font-size="26" font-weight="700" fill="${C.text}">
      ${esc(c.name)}
    </text>
    <text x="184" y="${y + 80}" font-family="${FONT}" font-size="19" fill="${C.muted}">
      ${desc.map((l, k) => `<tspan x="184" dy="${k === 0 ? 0 : 25}">${esc(l)}</tspan>`).join('')}
    </text>
    <rect x="${px}" y="${y + 36}" width="${pw}" height="40" rx="20" fill="${flag.color}" fill-opacity="0.13"
          stroke="${flag.color}" stroke-opacity="0.32"/>
    <text x="${px + pw / 2}" y="${y + 62}" text-anchor="middle" font-family="${FONT}" font-size="15"
          font-weight="600" fill="${flag.color}">${esc(flag.label)}</text>
  </g>`;
  }).join('');

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  <text x="600" y="88" text-anchor="middle" font-family="${FONT}" font-size="54" font-weight="700"
        fill="${C.text}" letter-spacing="-1.5">The Poop Color Chart</text>
  <text x="600" y="130" text-anchor="middle" font-family="${FONT}" font-size="23" fill="${C.muted}">
    What every stool color means — and which ones are worth a doctor&apos;s visit
  </text>
  <rect x="360" y="158" width="480" height="1.5" rx="1" fill="url(#hairline)"/>
  ${rows}
  <text x="60" y="${H - 50}" font-family="${FONT}" font-size="18" fill="${C.muted}">
    Informational only — not a diagnosis. Red, black, or pale stool warrants medical advice.
  </text>
  ${wordmark(1140, H - 50, 26, 'end')}
</svg>`;
  render(svg, 'images/charts/poop-color-chart.png', W, H);
  console.log(`  charts/poop-color-chart.png (${W}x${H})`);
}

// ---------------------------------------------------------------------------
// 5. Publisher logo — schema.org requires a real raster at a stable URL
// ---------------------------------------------------------------------------

function publisherLogo() {
  const svg = `<svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  <rect width="600" height="600" rx="120" fill="${C.bg}"/>
  <text x="300" y="272" text-anchor="middle" font-family="${FONT}" font-size="86" font-weight="700"
        fill="${C.text}" letter-spacing="-2">Poop</text>
  <text x="300" y="372" text-anchor="middle" font-family="${FONT}" font-size="86" font-weight="700"
        fill="url(#brand)" letter-spacing="-2">Check</text>
</svg>`;
  render(svg, 'images/logo/poopcheck-logo.png', 600, 600);
  console.log('  logo/poopcheck-logo.png');
}

// ---------------------------------------------------------------------------

console.log('Generating images…');
try {
  execFileSync('rsvg-convert', ['--version'], { stdio: 'ignore' });
} catch {
  console.error('rsvg-convert not found. Install it with: brew install librsvg');
  process.exit(1);
}

publisherLogo();
ogDefault();
blogCards();
bristolTypeImages();
bristolChart();
colorChart();
rmSync(TMP, { recursive: true, force: true });
console.log('Done.');
