import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

// Simple deterministic logo generator (no font dependency).
// Produces a 512x512 PNG with a bold geometric pattern.
// Usage: node make_logo.mjs <outPath>

const outPath = process.argv[2] || path.resolve(process.cwd(), 'tools/moltium/local/tokendeploy/pumpfun/logo.png');
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

// Palette
const bg = [15, 18, 25];          // near-black
const c1 = [0, 214, 255];         // cyan
const c2 = [255, 77, 166];        // magenta
const c3 = [255, 214, 0];         // yellow
const white = [240, 240, 245];

for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    // base background
    let r = bg[0], g = bg[1], b = bg[2];

    // diagonal band pattern
    const d = (x + y) % 80;
    if (d < 14) [r, g, b] = c1;
    else if (d < 28) [r, g, b] = c2;
    else if (d < 34) [r, g, b] = c3;

    // center "badge"
    const cx = x - size / 2;
    const cy = y - size / 2;
    const dist2 = cx * cx + cy * cy;
    if (dist2 < (150 * 150)) {
      // inner gradient
      const t = Math.min(1, Math.max(0, (150 * 150 - dist2) / (150 * 150)));
      r = Math.round(r * 0.4 + white[0] * 0.6 * t);
      g = Math.round(g * 0.4 + white[1] * 0.6 * t);
      b = Math.round(b * 0.4 + white[2] * 0.6 * t);
    }

    // border ring
    if (dist2 > (150 * 150) && dist2 < (165 * 165)) {
      [r, g, b] = white;
    }

    setPixel(x, y, r, g, b, 255);
  }
}

const buf = PNG.sync.write(png);
fs.writeFileSync(outPath, buf);

const b64 = buf.toString('base64');
console.log(JSON.stringify({ ok: true, outPath, bytes: buf.length, base64: b64 }, null, 2));
