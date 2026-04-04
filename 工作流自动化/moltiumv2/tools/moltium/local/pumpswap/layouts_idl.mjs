// Account layout as per PumpSwap Anchor IDL (gist) for buy/sell.
// These cover the "core" accounts; some txs append extra remaining accounts.

export const BUY_ACCOUNTS_IDL = [
  { i: 1, name: 'pool' },
  { i: 2, name: 'user' },
  { i: 3, name: 'globalConfig' },
  { i: 4, name: 'baseMint' },
  { i: 5, name: 'quoteMint' },
  { i: 6, name: 'userBaseTokenAccount' },
  { i: 7, name: 'userQuoteTokenAccount' },
  { i: 8, name: 'poolBaseTokenAccount' },
  { i: 9, name: 'poolQuoteTokenAccount' },
  { i: 10, name: 'protocolFeeRecipient' },
  { i: 11, name: 'protocolFeeRecipientTokenAccount' },
  { i: 12, name: 'baseTokenProgram' },
  { i: 13, name: 'quoteTokenProgram' },
  { i: 14, name: 'systemProgram' },
  { i: 15, name: 'associatedTokenProgram' },
  { i: 16, name: 'eventAuthority' },
  { i: 17, name: 'program' },
];

export const SELL_ACCOUNTS_IDL = [
  { i: 1, name: 'pool' },
  { i: 2, name: 'user' },
  { i: 3, name: 'globalConfig' },
  { i: 4, name: 'baseMint' },
  { i: 5, name: 'quoteMint' },
  { i: 6, name: 'userBaseTokenAccount' },
  { i: 7, name: 'userQuoteTokenAccount' },
  { i: 8, name: 'poolBaseTokenAccount' },
  { i: 9, name: 'poolQuoteTokenAccount' },
  { i: 10, name: 'protocolFeeRecipient' },
  { i: 11, name: 'protocolFeeRecipientTokenAccount' },
  { i: 12, name: 'baseTokenProgram' },
  { i: 13, name: 'quoteTokenProgram' },
  { i: 14, name: 'systemProgram' },
  { i: 15, name: 'associatedTokenProgram' },
  { i: 16, name: 'eventAuthority' },
  { i: 17, name: 'program' },
];
