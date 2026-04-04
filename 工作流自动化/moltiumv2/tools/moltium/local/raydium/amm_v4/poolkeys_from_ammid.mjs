import { PublicKey } from '@solana/web3.js';
import {
  Liquidity,
  Market,
  LIQUIDITY_STATE_LAYOUT_V4,
  MARKET_STATE_LAYOUT_V3,
} from '@raydium-io/raydium-sdk';

function pk(x) {
  return new PublicKey(String(x));
}

export async function fetchRaydiumAmmV4PoolKeysByAmmId(conn, ammId) {
  const id = pk(ammId);
  const acc = await conn.getAccountInfo(id, 'confirmed');
  if (!acc?.data) throw new Error(`Raydium AMM account not found: ${id.toBase58()}`);

  const programId = acc.owner; // Raydium AMM v4 program for this pool
  const st = LIQUIDITY_STATE_LAYOUT_V4.decode(acc.data);

  const marketId = pk(st.marketId);
  const marketProgramId = pk(st.marketProgramId);

  const mAcc = await conn.getAccountInfo(marketId, 'confirmed');
  if (!mAcc?.data) throw new Error(`OpenBook/Serum market not found: ${marketId.toBase58()}`);
  const ms = MARKET_STATE_LAYOUT_V3.decode(mAcc.data);

  const { publicKey: authority, nonce } = Liquidity.getAssociatedAuthority({ programId });
  const { publicKey: marketAuthority } = Market.getAssociatedAuthority({ programId: marketProgramId, marketId });

  // Assemble the canonical poolKeys structure expected by SDK builders.
  return {
    version: 4,
    programId,

    id,
    authority,
    nonce,

    baseMint: pk(st.baseMint),
    quoteMint: pk(st.quoteMint),
    lpMint: pk(st.lpMint),

    baseDecimals: Number(st.baseDecimal),
    quoteDecimals: Number(st.quoteDecimal),
    lpDecimals: Number(st.baseDecimal),

    openOrders: pk(st.openOrders),
    targetOrders: pk(st.targetOrders),
    baseVault: pk(st.baseVault),
    quoteVault: pk(st.quoteVault),
    withdrawQueue: pk(st.withdrawQueue),
    lpVault: pk(st.lpVault),

    marketVersion: 3,
    marketProgramId,
    marketId,
    marketAuthority,
    marketBaseVault: pk(ms.baseVault),
    marketQuoteVault: pk(ms.quoteVault),
    marketBids: pk(ms.bids),
    marketAsks: pk(ms.asks),
    marketEventQueue: pk(ms.eventQueue),

    lookupTableAccount: PublicKey.default,
  };
}
