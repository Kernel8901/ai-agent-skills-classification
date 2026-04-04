import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function parseJsonFromStdout(stdout) {
  // our CLI scripts print a single JSON blob
  const s = String(stdout || '').trim();
  if (!s) return null;
  // tolerate extra logs by taking last {...}
  const lastBrace = s.lastIndexOf('{');
  if (lastBrace > 0) {
    const maybe = s.slice(lastBrace);
    try { return JSON.parse(maybe); } catch {}
  }
  return JSON.parse(s);
}

export async function pumpfunBuyCurve({
  mint,
  solAmount,
  creator,
  slippagePct = 10,
  cuPrice,
  cuLimit,
  feeTo,
  feeBps,
  simulate = false,
} = {}) {
  if (!mint || !creator) throw new Error('pumpfunBuyCurve: {mint, creator} required');
  if (!Number.isFinite(Number(solAmount)) || Number(solAmount) <= 0) throw new Error('pumpfunBuyCurve: solAmount must be > 0');

  const script = 'tools/moltium/local/pumpfun_bonding/local_buy_curve.mjs';
  const args = [script, mint, String(solAmount), creator, String(slippagePct)];
  if (cuLimit) args.push('--cu-limit', String(cuLimit));
  if (cuPrice) args.push('--cu-price', String(cuPrice));
  if (feeTo) args.push('--fee-to', String(feeTo));
  if (feeBps !== undefined && feeBps !== null) args.push('--fee-bps', String(feeBps));
  if (simulate) args.push('--simulate');

  const { stdout, stderr } = await execFileAsync('node', args, { maxBuffer: 10 * 1024 * 1024 });
  const json = parseJsonFromStdout(stdout);
  return { ok: true, json, stderr: String(stderr || '') };
}

export async function pumpfunSellCurveAll({
  mint,
  creator,
  slippagePct = 10,
  cuPrice,
  cuLimit,
  feeTo,
  feeBps,
  simulate = false,
} = {}) {
  if (!mint || !creator) throw new Error('pumpfunSellCurveAll: {mint, creator} required');

  const script = 'tools/moltium/local/pumpfun_bonding/local_sell_curve_all.mjs';
  const args = [script, mint, creator, String(slippagePct)];
  if (cuLimit) args.push('--cu-limit', String(cuLimit));
  if (cuPrice) args.push('--cu-price', String(cuPrice));
  if (feeTo) args.push('--fee-to', String(feeTo));
  if (feeBps !== undefined && feeBps !== null) args.push('--fee-bps', String(feeBps));
  if (simulate) args.push('--simulate');

  const { stdout, stderr } = await execFileAsync('node', args, { maxBuffer: 10 * 1024 * 1024 });
  const json = parseJsonFromStdout(stdout);
  return { ok: true, json, stderr: String(stderr || '') };
}
