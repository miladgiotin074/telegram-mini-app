/**
 * Writes placeholder post artwork used by the profile grid.
 * Replace the files in `public/posts` with real photos when ready.
 *
 * Usage: node scripts/generate-placeholder-posts.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUTPUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'posts');

const PALETTES = [
  ['#ff4d79', '#7c3aed'],
  ['#e0355f', '#312e81'],
  ['#a855f7', '#be3455'],
  ['#ff8aa7', '#6d28d9'],
  ['#c2408f', '#1e1b4b'],
  ['#f472b6', '#4c1d95'],
];

function poster(index, [from, to]) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <linearGradient id="g${index}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}" />
      <stop offset="100%" stop-color="${to}" />
    </linearGradient>
    <radialGradient id="s${index}" cx="0.5" cy="0.35" r="0.55">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="600" height="600" fill="url(#g${index})" />
  <rect width="600" height="600" fill="url(#s${index})" />
  <circle cx="300" cy="240" r="86" fill="#ffffff" fill-opacity="0.85" />
  <path d="M140 520c0-84 72-152 160-152s160 68 160 152z" fill="#ffffff" fill-opacity="0.85" />
</svg>
`;
}

mkdirSync(OUTPUT_DIR, { recursive: true });

PALETTES.forEach((palette, index) => {
  const name = `post-${index + 1}.svg`;
  writeFileSync(join(OUTPUT_DIR, name), poster(index + 1, palette));
  console.log(`created ${name}`);
});
