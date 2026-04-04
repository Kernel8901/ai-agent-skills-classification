import fs from 'node:fs';
import path from 'node:path';
import { Connection } from '@solana/web3.js';

const DEFAULT_RPC = 'https://api.mainnet-beta.solana.com';

function readTextIfExists(p) {
  try {
    if (!fs.existsSync(p)) return null;
    const u = fs.readFileSync(p, 'utf8').trim();
    return u || null;
  } catch {
    return null;
  }
}

function loadMultiRpcConfig() {
  const p = path.resolve(process.cwd(), '.secrets', 'rpc', 'config.json');
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function listRpcUrlsFromSecretsDir() {
  const dir = path.resolve(process.cwd(), '.secrets', 'rpc');
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.txt'));
  const out = [];
  for (const f of files) {
    const name = path.basename(f, '.txt');
    const url = readTextIfExists(path.resolve(dir, f));
    if (url) out.push({ name, url });
  }
  return out;
}

export function listRpcCandidates() {
  // 1) env override
  if (process.env.SOLANA_RPC) return [{ name: 'env:SOLANA_RPC', url: process.env.SOLANA_RPC }];

  // 2) multi-rpc directory
  const cfg = loadMultiRpcConfig();
  const map = new Map(listRpcUrlsFromSecretsDir().map(x => [x.name, x.url]));
  const out = [];

  if (cfg?.priority && Array.isArray(cfg.priority)) {
    for (const name of cfg.priority) {
      const url = map.get(String(name));
      if (url) out.push({ name: String(name), url });
    }
  }

  if (cfg?.default && map.get(String(cfg.default))) {
    // ensure default is early if not already
    const def = String(cfg.default);
    if (!out.find(x => x.name === def)) out.unshift({ name: def, url: map.get(def) });
  }

  // include any remaining urls (so they are "ready" once user drops files)
  for (const [name, url] of map.entries()) {
    if (!out.find(x => x.name === name)) out.push({ name, url });
  }

  // 3) legacy files
  const legacy = [
    { name: 'legacy:helius', path: path.resolve(process.cwd(), '.secrets', 'solana-rpc-helius.txt') },
    { name: 'legacy:moltium', path: path.resolve(process.cwd(), '.secrets', 'moltium-rpc.txt') },
  ];
  for (const l of legacy) {
    const url = readTextIfExists(l.path);
    if (url) out.push({ name: l.name, url });
  }

  // 4) fallback
  out.push({ name: 'public', url: DEFAULT_RPC });

  // de-dupe by url
  const seen = new Set();
  const deduped = [];
  for (const x of out) {
    if (seen.has(x.url)) continue;
    seen.add(x.url);
    deduped.push(x);
  }
  return deduped;
}

export function loadRpcUrl() {
  return listRpcCandidates()[0]?.url || DEFAULT_RPC;
}

export function getConnection(commitment = 'confirmed') {
  const rpcUrl = loadRpcUrl();
  return { rpcUrl, conn: new Connection(rpcUrl, commitment) };
}

// Optional: async selection with a lightweight healthcheck.
// Useful for higher reliability, but keep sync getConnection() for compatibility.
export async function getConnectionAuto({ commitment = 'confirmed', timeoutMs = 2000 } = {}) {
  const candidates = listRpcCandidates();

  async function isHealthy(url) {
    try {
      const c = new Connection(url, commitment);
      const ctrl = AbortSignal.timeout ? AbortSignal.timeout(timeoutMs) : undefined;
      // getLatestBlockhash is a lightweight, commonly supported call
      await c.getLatestBlockhash(commitment, ctrl ? { signal: ctrl } : undefined);
      return true;
    } catch {
      return false;
    }
  }

  for (const c of candidates) {
    if (await isHealthy(c.url)) {
      return { rpcUrl: c.url, conn: new Connection(c.url, commitment), selected: c.name, candidates };
    }
  }

  const rpcUrl = candidates[0]?.url || DEFAULT_RPC;
  return { rpcUrl, conn: new Connection(rpcUrl, commitment), selected: candidates[0]?.name || 'public', candidates };
}
