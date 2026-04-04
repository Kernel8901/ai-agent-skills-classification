import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function parseJsonFromStdout(stdout) {
  const s = String(stdout || '').trim();
  if (!s) return null;
  const lastBrace = s.lastIndexOf('{');
  if (lastBrace > 0) {
    const maybe = s.slice(lastBrace);
    try { return JSON.parse(maybe); } catch {}
  }
  return JSON.parse(s);
}

export async function pumpswapBuy({ baseMint, solAmount, slippagePct = 10, feeTo, feeBps, simulate = false } = {}) {
  if (!baseMint) throw new Error('pumpswapBuy: {baseMint} required');
  if (!Number.isFinite(Number(solAmount)) || Number(solAmount) <= 0) throw new Error('pumpswapBuy: solAmount must be > 0');
  const script = 'tools/moltium/local/pumpswap/local_buy.mjs';
  const args = [script, baseMint, String(solAmount), String(slippagePct)];
  if (feeTo) args.push('--fee-to', String(feeTo));
  if (feeBps !== undefined && feeBps !== null) args.push('--fee-bps', String(feeBps));
  if (simulate) args.push('--simulate');
  const { stdout, stderr } = await execFileAsync('node', args, { maxBuffer: 10 * 1024 * 1024 });
  const json = parseJsonFromStdout(stdout);
  return { ok: true, json, stderr: String(stderr || '') };
}

export async function pumpswapSellAll({ baseMint, slippagePct = 10, feeTo, feeBps, simulate = false } = {}) {
  if (!baseMint) throw new Error('pumpswapSellAll: {baseMint} required');
  const script = 'tools/moltium/local/pumpswap/local_sell_all.mjs';
  const args = [script, baseMint, String(slippagePct)];
  if (feeTo) args.push('--fee-to', String(feeTo));
  if (feeBps !== undefined && feeBps !== null) args.push('--fee-bps', String(feeBps));
  if (simulate) args.push('--simulate');
  const { stdout, stderr } = await execFileAsync('node', args, { maxBuffer: 10 * 1024 * 1024 });
  const json = parseJsonFromStdout(stdout);
  return { ok: true, json, stderr: String(stderr || '') };
}
