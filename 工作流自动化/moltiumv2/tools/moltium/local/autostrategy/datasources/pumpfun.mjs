import { listCoins } from '../../pumpfunAPI/client.mjs';

function unwrapCoins(json) {
  return Array.isArray(json?.coins) ? json.coins : Array.isArray(json) ? json : [];
}

export async function pumpfunListRecent({ limit = 50, offset = 0, includeNsfw = false } = {}) {
  const json = await listCoins({ limit, offset, sort: 'created_timestamp', order: 'DESC', includeNsfw });
  return unwrapCoins(json);
}

// Best-effort: ask pump.fun to sort by market cap (field names are unofficial).
export async function pumpfunListTrending({ limit = 50, offset = 0, includeNsfw = false } = {}) {
  const trySorts = [
    { sort: 'market_cap', order: 'DESC' },
    { sort: 'usd_market_cap', order: 'DESC' },
    { sort: 'reply_count', order: 'DESC' },
    { sort: 'last_trade_timestamp', order: 'DESC' },
  ];
  for (const s of trySorts) {
    try {
      const json = await listCoins({ limit, offset, includeNsfw, ...s });
      const coins = unwrapCoins(json);
      if (coins.length) return coins;
    } catch {}
  }
  // fallback to recent
  return pumpfunListRecent({ limit, offset, includeNsfw });
}
