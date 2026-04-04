// Account-order template for PumpSwap claim-creator-fees instruction
// Derived from on-chain tx: 4VZEZobZd5K8mo4xXWoo7RDtK7TD818DWdnukdmTYz74Tkipzw8qXhBjmFW3gHMaB7voMLJTUL2s9VdqA9vvgQfi

export const TRANSFER_CREATOR_FEES_TO_PUMP_ACCOUNTS = [
  { i: 1, name: 'wsolMint' },
  { i: 2, name: 'tokenProgram' },
  { i: 3, name: 'systemProgram' },
  { i: 4, name: 'associatedTokenProgram' },
  { i: 5, name: 'coinCreator' },
  { i: 6, name: 'coinCreatorVaultAuthority' },
  { i: 7, name: 'coinCreatorVaultAta' },
  { i: 8, name: 'pumpfunCreatorVault' },
  { i: 9, name: 'eventAuthority' },
  { i: 10, name: 'pumpswapProgram' },
];
