// autostrategy control utility (local).
// Provides a simple CLI to list/status/enable/disable strategies.
// Cron start/stop is handled via OpenClaw cron tool (agent-side), but this prints the intended job names.
//
// Usage:
//   node tools/moltium/local/autostrategy/ctl.mjs list
//   node tools/moltium/local/autostrategy/ctl.mjs status [--id <id>]
//   node tools/moltium/local/autostrategy/ctl.mjs enable --id <id>
//   node tools/moltium/local/autostrategy/ctl.mjs disable --id <id>

import fs from 'node:fs';
import path from 'node:path';
import { readJsonIfExists, writeJsonAtomic } from './lib/fs_state.mjs';

function arg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : null;
}

const cmd = process.argv[2];
const id = arg('--id');

const baseDir = path.resolve('tools/moltium/local/autostrategy');
const strategiesDir = path.join(baseDir, 'strategies');

function listIds() {
  if (!fs.existsSync(strategiesDir)) return [];
  return fs.readdirSync(strategiesDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
}

function strategyPath(id) {
  return path.join(strategiesDir, id, 'strategy.json');
}

function loadStrategy(id) {
  const p = strategyPath(id);
  const s = readJsonIfExists(p, null);
  if (!s) throw new Error(`strategy not found: ${id}`);
  return { p, s };
}

if (!cmd || cmd === 'help') {
  console.log(JSON.stringify({
    ok: true,
    usage: [
      'ctl.mjs list',
      'ctl.mjs status [--id <id>]',
      'ctl.mjs enable --id <id>',
      'ctl.mjs disable --id <id>',
    ],
  }, null, 2));
  process.exit(0);
}

if (cmd === 'list') {
  const ids = listIds();
  const items = ids.map(id => {
    const s = readJsonIfExists(strategyPath(id), {});
    return { id, enabled: !!s.enabled, riskProfile: s.riskProfile, tickSec: s.tickSec };
  });
  console.log(JSON.stringify({ ok: true, strategies: items }, null, 2));
  process.exit(0);
}

if (cmd === 'enable' || cmd === 'disable') {
  if (!id) throw new Error('missing --id');
  const { p, s } = loadStrategy(id);
  s.enabled = (cmd === 'enable');
  writeJsonAtomic(p, s);
  console.log(JSON.stringify({ ok: true, id, enabled: !!s.enabled, path: p }, null, 2));
  process.exit(0);
}

if (cmd === 'status') {
  // Delegate to status.mjs for now (keeps one source of truth).
  const { spawnSync } = await import('node:child_process');
  const args = ['tools/moltium/local/autostrategy/status.mjs'];
  const out = spawnSync('node', args, { encoding: 'utf8' });
  if (out.status !== 0) {
    console.error(out.stderr || out.stdout);
    process.exit(out.status || 1);
  }
  const json = JSON.parse(out.stdout);
  if (id) {
    json.strategies = (json.strategies || []).filter(s => s.id === id);
  }
  console.log(JSON.stringify(json, null, 2));
  process.exit(0);
}

throw new Error(`unknown cmd: ${cmd}`);
