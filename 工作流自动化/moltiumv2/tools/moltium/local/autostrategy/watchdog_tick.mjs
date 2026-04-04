import path from 'node:path';
import fs from 'node:fs';
import { readJsonIfExists } from './lib/fs_state.mjs';

function arg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : null;
}

const id = arg('--id');
const maxStaleSec = Number(arg('--max-stale-sec') || 180);
if (!id) {
  console.error('usage: watchdog_tick.mjs --id <strategyId> [--max-stale-sec 180]');
  process.exit(2);
}

const baseDir = path.resolve('tools/moltium/local/autostrategy');
const statePath = path.join(baseDir, 'state', `${id}.json`);
const lockPath = path.join(baseDir, 'state', `${id}.lock`);

const st = readJsonIfExists(statePath, null);
const now = Date.now();
const lastOk = st?.lastOkAt || 0;
const stale = (now - lastOk) / 1000;

let lockStale = false;
if (fs.existsSync(lockPath)) {
  const mtime = fs.statSync(lockPath).mtimeMs;
  lockStale = (now - mtime) / 1000 > maxStaleSec;
}

console.log(JSON.stringify({
  ok: true,
  id,
  lastOkAt: lastOk || null,
  staleSec: stale,
  maxStaleSec,
  lockPresent: fs.existsSync(lockPath),
  lockStale,
  recommendation: (stale > maxStaleSec || lockStale) ? 'restart_tick_job' : 'healthy',
}, null, 2));
