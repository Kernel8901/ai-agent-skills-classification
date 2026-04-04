// pumpfunAPI (helper tools)
// External endpoints (direct pump.fun, no Moltium in the middle).
//
// Upstreams used:
// - https://frontend-api-v3.pump.fun
// - https://swap-api.pump.fun
// - https://livestream-api.pump.fun
//
// NOTE: These are unofficial/unstable endpoints. Parse defensively.

export const FRONTEND_BASE = 'https://frontend-api-v3.pump.fun';
export const SWAP_BASE = 'https://swap-api.pump.fun';
export const LIVESTREAM_BASE = 'https://livestream-api.pump.fun';

export async function fetchJson(url, { timeoutMs = 15_000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(new Error('timeout')), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json', 'user-agent': 'openclaw-local/1.0' },
      signal: ctrl.signal,
    });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch {}
    if (!res.ok) {
      const msg = json?.message || json?.error?.message || json?.error || text || `HTTP ${res.status}`;
      const err = new Error(`pumpfunAPI HTTP ${res.status}: ${msg}`);
      err.status = res.status;
      err.body = json || text;
      throw err;
    }
    return json;
  } finally {
    clearTimeout(t);
  }
}

export function buildUrl(base, path, params = null) {
  const u = new URL(base + path);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      u.searchParams.set(k, String(v));
    }
  }
  return u.toString();
}

// ---- frontend-api-v3.pump.fun ----

export async function listCoins({ offset = 0, limit = 10, sort = 'created_timestamp', order = 'DESC', includeNsfw = false } = {}, opts = {}) {
  return fetchJson(buildUrl(FRONTEND_BASE, '/coins', { offset, limit, sort, order, includeNsfw }), opts);
}

export async function getCoin(mint, opts = {}) {
  if (!mint) throw new Error('mint required');
  return fetchJson(buildUrl(FRONTEND_BASE, `/coins/${mint}`), opts);
}

export async function getUserCreatedCoins(walletAddress, { limit = 1000, offset = 0 } = {}, opts = {}) {
  // NOTE: Some environments expose /coins/user-created-coins/<wallet>, but it's 404 for us.
  // /coins?creator=<wallet> works and returns the creator's coins.
  if (!walletAddress) throw new Error('walletAddress required');
  return fetchJson(buildUrl(FRONTEND_BASE, '/coins', { creator: walletAddress, limit, offset }), opts);
}

// ---- swap-api.pump.fun ----

export async function getTrades(mint, { limit = 100, cursor = 0, minSolAmount = 0.05 } = {}, opts = {}) {
  if (!mint) throw new Error('mint required');
  return fetchJson(buildUrl(SWAP_BASE, `/v2/coins/${mint}/trades`, { limit, cursor, minSolAmount }), opts);
}

export async function getCandles(mint, { createdTs, interval = '1m', limit = 500 } = {}, opts = {}) {
  if (!mint) throw new Error('mint required');
  if (createdTs === undefined || createdTs === null) throw new Error('createdTs required');
  return fetchJson(buildUrl(SWAP_BASE, `/v2/coins/${mint}/candles`, { createdTs, interval, limit }), opts);
}

export async function getCreatorFeesTotal(devWalletAddress, opts = {}) {
  if (!devWalletAddress) throw new Error('devWalletAddress required');
  return fetchJson(buildUrl(SWAP_BASE, `/v1/creators/${devWalletAddress}/fees/total`), opts);
}

// ---- livestream-api.pump.fun ----

export async function getLivestream(mintId, opts = {}) {
  if (!mintId) throw new Error('mintId required');
  return fetchJson(buildUrl(LIVESTREAM_BASE, '/livestream', { mintId }), opts);
}
