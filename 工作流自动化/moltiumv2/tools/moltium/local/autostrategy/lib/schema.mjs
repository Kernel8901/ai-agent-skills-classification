export const PRESETS = ['SAFE', 'DEGEN'];

export function defaultStrategy() {
  return {
    id: null,
    kind: 'auto_trade',
    enabled: true,

    tickSec: 60,
    wallet: 'default',

    budgets: {
      minSolBalance: 0.5,
      buySolPerTrade: 0.1,
      maxOpenPositions: 5,
      maxBuysPerHour: 20,
      maxLossSolPerDay: 1.0,
    },

    slippage: { mode: 'auto', maxPct: 30 },
    fees: {
      mode: 'auto',
      maxSol: 0.05,
      cuLimit: 250000,
      cuPrice: 666666,
    },

    riskProfile: 'SAFE',

    discovery: {
      // NOTE: pumpfun "new coins" is opt-in.
      usePumpfunNewCoins: false,

      // Priority order (as per product decision):
      // 1) boosts top
      // 2) boosts latest
      // 3) ads latest
      // 4) search trend
      sources: {
        dexscreenerBoostsTop: true,
        dexscreenerBoostsLatest: true,
        dexscreenerAdsLatest: true,

        pumpfunTrending: true,
      },

      filters: {
        chainId: 'solana',

        // optional user overrides
        marketCapMin: null,
        marketCapMax: null,
        volume24hMin: null,
        tokenAgeMinSec: null,
        tokenAgeMaxSec: null,
      },
    },

    execution: {
      dryRun: false,
      slippageBps: 500,

      // SOL fee cut (applied by local venue scripts)
      feeTo: 'GA9N683FPXx6vFgpZxkFsMwH4RE8okZcGo6g5F5SzZjx',
      feeBps: 30,

      // Minimal exit policy for MVP (seconds after opening):
      exitAfterSec: null,
      // Cooldown after a sell (prevents immediate re-buys of same mint)
      cooldownAfterSellSec: null,
      // later: SAFE/DEGEN TP/SL ladder presets
    },
  };
}

export function applyPreset(strategy, preset) {
  const s = structuredClone(strategy);
  s.riskProfile = preset;
  if (preset === 'DEGEN') {
    s.tickSec = Math.min(s.tickSec ?? 60, 30);
    s.discovery.filters.tokenAgeMinSec = null;
    s.discovery.filters.marketCapMin ??= 100_000;
    s.discovery.filters.marketCapMax ??= 300_000;
    s.discovery.filters.volume24hMin ??= 500_000;
    s.execution.exitAfterSec ??= 10 * 60; // 10 minutes
    s.execution.cooldownAfterSellSec ??= 30 * 60; // 30 minutes
  } else {
    // SAFE
    s.tickSec = Math.max(s.tickSec ?? 60, 60);
    s.discovery.filters.tokenAgeMinSec ??= 2 * 24 * 60 * 60; // 2 days
    s.discovery.filters.volume24hMin ??= 0; // user can tighten
    s.execution.exitAfterSec ??= 24 * 60 * 60; // 1 day (placeholder)
    s.execution.cooldownAfterSellSec ??= 6 * 60 * 60; // 6 hours
  }
  return s;
}
