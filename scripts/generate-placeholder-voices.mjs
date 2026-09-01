/**
 * Writes short silent WAV files used as stand-ins for the real voice messages.
 * Replace the files in `public/voices` with actual recordings when ready.
 *
 * Usage: node scripts/generate-placeholder-voices.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 8000;
const OUTPUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'voices');

const FILES = [
  { name: 'placeholder-1.wav', seconds: 4 },
  { name: 'placeholder-2.wav', seconds: 6 },
  { name: 'placeholder-3.wav', seconds: 5 },
  { name: 'placeholder-4.wav', seconds: 7 },
];

function silentWav(seconds) {
  const samples = SAMPLE_RATE * seconds;
  const dataSize = samples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}

mkdirSync(OUTPUT_DIR, { recursive: true });

for (const file of FILES) {
  writeFileSync(join(OUTPUT_DIR, file.name), silentWav(file.seconds));
  console.log(`created ${file.name} (${file.seconds}s)`);
}
