// Clawhub bootstrap for MoltiumV2 (self-contained pack)
// Run from the Clawhub pack root folder.
//
// Usage:
//   node scripts/bootstrap.mjs
//   node scripts/bootstrap.mjs --no-install

import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const noInstall = process.argv.includes('--no-install');

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: false, ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const hasNodeModules = fs.existsSync('node_modules');

if (!noInstall && !hasNodeModules) {
  console.log('[MoltiumV2] Installing npm dependencies...');
  run('npm', ['install']);
}

console.log('[MoltiumV2] init');
run('node', ['tools/moltium/local/ctl.mjs', 'init', '--pretty']);

console.log('[MoltiumV2] doctor');
// doctor may exit non-zero if wallet is missing / not funded; that's OK for first run.
spawnSync('node', ['tools/moltium/local/ctl.mjs', 'doctor', '--pretty'], { stdio: 'inherit' });

console.log('[MoltiumV2] Capabilities');
console.log('- pump.fun deploy (create + optional initial buy)');
console.log('- pump.fun bonding curve trading (complete=false)');
console.log('- PumpSwap trading + creator fee claim');
console.log('- Raydium AMM v4 trading');
console.log('- autostrategy runtime (tick + state + lock + watchdog)');
