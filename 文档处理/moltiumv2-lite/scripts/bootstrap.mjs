#!/usr/bin/env node
// MoltiumV2 Clawhub-lite bootstrapper
// - Downloads the latest MoltiumV2 skillpack from MOLTIUMV2_BASE_URL (default https://moltium.fun)
// - Extracts to MOLTIUMV2_DIR (default MoltiumV2)
// - Runs npm install + ctl init/doctor
//
// Usage:
//   node scripts/bootstrap.mjs
//
// Env:
//   MOLTIUMV2_DIR=<folder>
//   MOLTIUMV2_BASE_URL=https://moltium.fun

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const BASE_URL = process.env.MOLTIUMV2_BASE_URL || 'https://moltium.fun';
const TARGET_DIR = process.env.MOLTIUMV2_DIR || 'MoltiumV2';
const ARCHIVE = 'MoltiumV2-skillpack-latest.tar.gz';

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: false, ...opts });
  if (r.status !== 0) throw new Error(`${cmd} failed with exit code ${r.status}`);
}

function has(cmd) {
  const which = process.platform === 'win32' ? 'where' : 'which';
  const r = spawnSync(which, [cmd], { stdio: 'ignore', shell: false });
  return r.status === 0;
}

async function download(url, outPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed: ${res.status} ${res.statusText}`);
  const ab = await res.arrayBuffer();
  fs.writeFileSync(outPath, Buffer.from(ab));
}

(async () => {
  console.log(`[MoltiumV2] base: ${BASE_URL}`);
  console.log(`[MoltiumV2] target: ${TARGET_DIR}`);

  fs.mkdirSync(TARGET_DIR, { recursive: true });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'moltiumv2_'));
  const archivePath = path.join(tmpDir, ARCHIVE);

  console.log(`[MoltiumV2] downloading ${BASE_URL}/${ARCHIVE}`);
  await download(`${BASE_URL}/${ARCHIVE}`, archivePath);

  console.log('[MoltiumV2] extracting');
  if (!has('tar')) {
    throw new Error('tar not found on this system. Please install a tar-capable environment (or use the website installers).');
  }
  // Extract and strip top-level folder if present: use --strip-components=1 (bsdtar/gnu tar support)
  // Some tar implementations may not support it; we try and fallback.
  let ok = true;
  try {
    run('tar', ['-xzf', archivePath, '-C', TARGET_DIR, '--strip-components=1']);
  } catch {
    ok = false;
  }
  if (!ok) {
    // fallback: extract without strip
    run('tar', ['-xzf', archivePath, '-C', TARGET_DIR]);
  }

  console.log('[MoltiumV2] npm install');
  if (!has('npm')) {
    throw new Error('npm not found. Install Node.js (20+) and retry.');
  }
  run('npm', ['install'], { cwd: TARGET_DIR });

  console.log('[MoltiumV2] init');
  run('node', ['tools/moltium/local/ctl.mjs', 'init', '--pretty'], { cwd: TARGET_DIR });

  console.log('[MoltiumV2] doctor');
  // doctor might exit non-zero if wallet is missing/not funded, etc.
  spawnSync('node', ['tools/moltium/local/ctl.mjs', 'doctor', '--pretty'], { cwd: TARGET_DIR, stdio: 'inherit' });

  console.log('[MoltiumV2] capabilities');
  console.log('- pump.fun deploy (create + optional initial buy)');
  console.log('- pump.fun bonding curve trading (complete=false)');
  console.log('- PumpSwap trading + creator fee claim');
  console.log('- Raydium AMM v4 trading');
  console.log('- autostrategy runtime (tick + state + lock + watchdog)');

  console.log('[MoltiumV2] done');
})().catch((e) => {
  console.error(`[MoltiumV2] ERROR: ${String(e?.message || e)}`);
  process.exit(1);
});
