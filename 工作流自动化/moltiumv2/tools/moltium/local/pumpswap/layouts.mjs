// Account-order templates for pumpswap instructions (from Solscan parsed txs)
// NOTE: These are specific to the pumpswap program `pAMMBay6...`.
// We will generalize pool discovery separately; these templates define the *required key order*.

export const SELL_ACCOUNTS = [
  { i: 1,  name: 'pool' },
  { i: 2,  name: 'user' },
  { i: 3,  name: 'globalConfig' },
  { i: 4,  name: 'baseMint' },
  { i: 5,  name: 'quoteMint' },
  { i: 6,  name: 'userBaseTokenAccount' },
  { i: 7,  name: 'userQuoteTokenAccount' },
  { i: 8,  name: 'poolBaseTokenAccount' },
  { i: 9,  name: 'poolQuoteTokenAccount' },
  { i: 10, name: 'protocolFeeRecipient' },
  { i: 11, name: 'protocolFeeRecipientTokenAccount' },
  { i: 12, name: 'baseTokenProgram' },
  { i: 13, name: 'quoteTokenProgram' },
  { i: 14, name: 'systemProgram' },
  { i: 15, name: 'associatedTokenProgram' },
  { i: 16, name: 'eventAuthority' },
  { i: 17, name: 'pumpswapProgram' },
  { i: 18, name: 'coinCreatorVaultAta' },
  { i: 19, name: 'coinCreatorVaultAuthority' },
  { i: 20, name: 'feeConfig' },
  { i: 21, name: 'feeProgram' },
];

// Layouts for pumpswap ix accounts.
// Note: Some transactions include extra "remaining accounts". We support multiple layouts.

export const BUY_ACCOUNTS = [
  { i: 1,  name: 'pool' },
  { i: 2,  name: 'user' },
  { i: 3,  name: 'globalConfig' },
  { i: 4,  name: 'baseMint' },
  { i: 5,  name: 'quoteMint' },
  { i: 6,  name: 'userBaseTokenAccount' },
  { i: 7,  name: 'userQuoteTokenAccount' },
  { i: 8,  name: 'poolBaseTokenAccount' },
  { i: 9,  name: 'poolQuoteTokenAccount' },
  { i: 10, name: 'protocolFeeRecipient' },
  { i: 11, name: 'protocolFeeRecipientTokenAccount' },
  { i: 12, name: 'baseTokenProgram' },
  { i: 13, name: 'quoteTokenProgram' },
  { i: 14, name: 'systemProgram' },
  { i: 15, name: 'associatedTokenProgram' },
  { i: 16, name: 'eventAuthority' },
  { i: 17, name: 'pumpswapProgram' },
  { i: 18, name: 'coinCreatorVaultAta' },
  { i: 19, name: 'coinCreatorVaultAuthority' },
  { i: 20, name: 'globalVolumeAccumulator' },
  { i: 21, name: 'userVolumeAccumulator' },
  { i: 22, name: 'feeConfig' },
  { i: 23, name: 'feeProgram' },
];
