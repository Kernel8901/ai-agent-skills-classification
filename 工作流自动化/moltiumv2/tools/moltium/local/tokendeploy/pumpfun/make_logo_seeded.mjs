import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { PNG } from 'pngjs';

// Deterministic seeded logo generator (no font dependency).
// Usage:
//   node make_logo_seeded.mjs <outPath> [seed]
//
// Produces a 512x512 PNG with a "glitch matrix" pattern.

const outPath = process.argv[2] || path.resolve(process.cwd(), 'tools/moltium/local/tokendeploy/pumpfun/logo_seeded.png');
const seed = String(process.argv[3] || 'default-seed');
fs.mkdirSync(path.dirname(outPath), { recursive: true });

const size = 512;
const png = new PNG({ width: size, height: size });

function setPixel(x, y, r, g, b, a = 255) {
  const idx = (png.width * y + x) << 2;
  png.data[idx] = r;
  png.data[idx + 1] = g;
  png.data[idx + 2] = b;
  png.data[idx + 3] = a;
}

function hashBytes(...parts) {
  const h = crypto.createHash('sha256');
  for (const p of parts) h.update(String(p));
  return h.digest();
}

// Palette (no yellow / lemon vibes)
const bg = [10, 12, 18];          // deep navy
const teal = [0, 230, 200];       // neon teal
const violet = [170, 90, 255];    // violet
const coral = [255, 80, 140];     // coral-pink
const ice = [235, 245, 255];      // near-white

for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    let r = bg[0], g = bg[1], b = bg[2];

    // seeded cell noise
    const cell = 8;
    const cx = Math.floor(x / cell);
    const cy = Math.floor(y / cell);
    const hb = hashBytes(seed, cx, cy);
    const v = hb[0];

    // glitch stripes + blocks
    const stripe = (x ^ (y * 3)) & 63;
    if (stripe < 4) [r, g, b] = teal;
    if (v > 220) [r, g, b] = violet;
    if (v < 18) [r, g, b] = coral;

    // center badge (rounded square-ish)
    const dx = x - size / 2;
    const dy = y - size / 2;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    const radius = 140;
    const inBadge = (Math.max(adx, ady) < radius) && ((adx * adx + ady * ady) < (radius + 30) * (radius + 30));
    if (inBadge) {
      const t = 1 - Math.min(1, (Math.max(adx, ady) / radius));
      r = Math.round(r * 0.35 + ice[0] * 0.65 * t);
      g = Math.round(g * 0.35 + ice[1] * 0.65 * t);
      b = Math.round(b * 0.35 + ice[2] * 0.65 * t);
    }

    // crisp border
    const border = Math.max(adx, ady);
    if (border >= radius && border <= radius + 2 && (adx * adx + ady * ady) < (radius + 35) * (radius + 35)) {
      [r, g, b] = ice;
    }

    setPixel(x, y, r, g, b, 255);
  }
}

const buf = PNG.sync.write(png);
fs.writeFileSync(outPath, buf);
console.log(JSON.stringify({ ok: true, outPath, bytes: buf.length, seed }, null, 2));
