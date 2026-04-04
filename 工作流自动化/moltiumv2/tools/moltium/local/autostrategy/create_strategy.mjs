import fs from 'node:fs';
import path from 'node:path';
import { defaultStrategy, applyPreset, PRESETS } from './lib/schema.mjs';
import { ensureDir, writeJsonAtomic } from './lib/fs_state.mjs';

function arg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : null;
}

function has(name) {
  return process.argv.includes(name);
}

function num(v) {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const id = arg('--id');
if (!id) {
  console.error('usage: create_strategy.mjs --id <id> [--preset SAFE|DEGEN] [--tick-sec N] ...');
  process.exit(2);
}

let s = defaultStrategy();
s.id = id;

const preset = (arg('--preset') || 'SAFE').toUpperCase();
if (!PRESETS.includes(preset)) throw new Error(`unknown preset: ${preset}`);
s = applyPreset(s, preset);

// overrides
const tickSec = num(arg('--tick-sec'));
if (tickSec) s.tickSec = tickSec;

const minSol = num(arg('--min-sol'));
if (minSol !== null) s.budgets.minSolBalance = minSol;

const buySol = num(arg('--buy-sol'));
if (buySol !== null) s.budgets.buySolPerTrade = buySol;

const maxPos = num(arg('--max-pos'));
if (maxPos !== null) s.budgets.maxOpenPositions = maxPos;

const mcMin = num(arg('--mc-min'));
if (mcMin !== null) s.discovery.filters.marketCapMin = mcMin;
const mcMax = num(arg('--mc-max'));
if (mcMax !== null) s.discovery.filters.marketCapMax = mcMax;

const volMin = num(arg('--vol-min'));
if (volMin !== null) s.discovery.filters.volume24hMin = volMin;

const ageMinSec = num(arg('--age-min-sec'));
if (ageMinSec !== null) s.discovery.filters.tokenAgeMinSec = ageMinSec;

const exitAfterSec = num(arg('--exit-after-sec'));
if (exitAfterSec !== null) s.execution.exitAfterSec = exitAfterSec;

const cooldownAfterSellSec = num(arg('--cooldown-after-sell-sec'));
if (cooldownAfterSellSec !== null) s.execution.cooldownAfterSellSec = cooldownAfterSellSec;

if (has('--use-new-coins')) s.discovery.usePumpfunNewCoins = true;
if (has('--dry-run')) s.execution.dryRun = true;
if (has('--disabled')) s.enabled = false;

const dir = path.resolve('tools/moltium/local/autostrategy/strategies', id);
ensureDir(dir);
writeJsonAtomic(path.join(dir, 'strategy.json'), s);

console.log(JSON.stringify({ ok: true, id, preset, path: dir, strategy: s }, null, 2));
