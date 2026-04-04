## raydium integration TODO

1) Confirm which Raydium programs we want:
   - AMM v4 (classic)
   - CLMM
   - CPMM

2) Pool resolution
   - Input: baseMint + quoteMint (WSOL)
   - Output: pool keys (amm id, authority, openOrders, vaults, serum market etc.)

3) Quote
   - constant product math + fees
   - or decode on-chain amm state and compute exact quote

4) Swaps
   - local_buy.mjs / local_sell_all.mjs style executors
   - priority fee (--cu-price) support

5) Autostrategy integration
   - venue: 'raydium'
   - PnL simulation using quote
   - discovery: dexscreener pools where dexId == 'raydium'
