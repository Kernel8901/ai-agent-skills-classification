// Minimal Dexscreener public API client (helper tool; external endpoint)
// Dexscreener API client (helper tool; external endpoint)
// Official reference: https://docs.dexscreener.com/api/reference
// Common endpoints:
// - /token-profiles/latest/v1
// - /community-takeovers/latest/v1
// - /ads/latest/v1
// - /token-boosts/latest/v1
// - /token-boosts/top/v1
// - /orders/v1/{chainId}/{tokenAddress}
// - /latest/dex/pairs/{chainId}/{pairId}
// - /latest/dex/search?q=...
// - /token-pairs/v1/{chainId}/{tokenAddress}
// - /tokens/v1/{chainId}/{tokenAddresses}

const BASE = 'https://api.dexscreener.com';

export async function fetchJson(url, { timeoutMs = 15_000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(new Error('timeout')), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'user-agent': 'openclaw-local/1.0',
      },
      signal: ctrl.signal,
    });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch {}
    if (!res.ok) {
      const msg = json?.message || json?.error || text || `HTTP ${res.status}`;
      const err = new Error(`Dexscreener HTTP ${res.status}: ${msg}`);
      err.status = res.status;
      err.body = json || text;
      throw err;
    }
    return json;
  } finally {
    clearTimeout(t);
  }
}

export function buildUrl(path, params = null) {
  const u = new URL(BASE + path);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      u.searchParams.set(k, String(v));
    }
  }
  return u.toString();
}

export async function getTokenProfilesLatest(opts = {}) {
  return fetchJson(buildUrl('/token-profiles/latest/v1'), opts);
}

export async function getCommunityTakeoversLatest(opts = {}) {
  return fetchJson(buildUrl('/community-takeovers/latest/v1'), opts);
}

export async function getAdsLatest(opts = {}) {
  return fetchJson(buildUrl('/ads/latest/v1'), opts);
}

export async function getTokenBoostsLatest(opts = {}) {
  return fetchJson(buildUrl('/token-boosts/latest/v1'), opts);
}

export async function getTokenBoostsTop(opts = {}) {
  return fetchJson(buildUrl('/token-boosts/top/v1'), opts);
}

export async function getOrders(chainId, tokenAddress, opts = {}) {
  if (!chainId || !tokenAddress) throw new Error('chainId and tokenAddress required');
  return fetchJson(buildUrl(`/orders/v1/${chainId}/${tokenAddress}`), opts);
}

export async function getPair(chainId, pairId, opts = {}) {
  if (!chainId || !pairId) throw new Error('chainId and pairId required');
  return fetchJson(buildUrl(`/latest/dex/pairs/${chainId}/${pairId}`), opts);
}

export async function searchPairs(query, opts = {}) {
  if (!query) throw new Error('query required');
  return fetchJson(buildUrl('/latest/dex/search', { q: query }), opts);
}

export async function getTokenPools(chainId, tokenAddress, opts = {}) {
  if (!chainId || !tokenAddress) throw new Error('chainId and tokenAddress required');
  return fetchJson(buildUrl(`/token-pairs/v1/${chainId}/${tokenAddress}`), opts);
}

export async function getPairsByTokenAddresses(chainId, tokenAddresses, opts = {}) {
  const addrs = Array.isArray(tokenAddresses) ? tokenAddresses : [tokenAddresses];
  if (!chainId) throw new Error('chainId required');
  if (!addrs.length) throw new Error('tokenAddresses empty');
  if (addrs.length > 30) throw new Error('tokenAddresses max 30');
  return fetchJson(buildUrl(`/tokens/v1/${chainId}/${addrs.join(',')}`), opts);
}

// Legacy endpoint (still used in the wild)
export async function legacyGetPairsByTokenAddresses(tokenAddresses, opts = {}) {
  const addrs = Array.isArray(tokenAddresses) ? tokenAddresses : [tokenAddresses];
  if (!addrs.length) throw new Error('tokenAddresses empty');
  const path = `/latest/dex/tokens/${addrs.join(',')}`;
  return fetchJson(buildUrl(path), opts);
}
