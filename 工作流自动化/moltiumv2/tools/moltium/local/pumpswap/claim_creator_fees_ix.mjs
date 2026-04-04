// Build PumpSwap "claim/transfer creator fees" instruction (reverse engineered)
// Based on tx example: 4VZEZobZd5K8mo4xXWoo7RDtK7TD818DWdnukdmTYz74Tkipzw8qXhBjmFW3gHMaB7voMLJTUL2s9VdqA9vvgQfi
// Program: pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA
// Instruction discriminator (8 bytes): 8b348655e4e56cf1

import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { PROGRAM_PUMPSWAP } from './constants2.mjs';

function pk(x) { return x instanceof PublicKey ? x : new PublicKey(String(x)); }

export const DISC_TRANSFER_CREATOR_FEES_TO_PUMP = Buffer.from('8b348655e4e56cf1', 'hex');

/**
 * Account order (as observed):
 *  1. wsolMint
 *  2. tokenProgram
 *  3. systemProgram
 *  4. associatedTokenProgram
 *  5. coinCreator (signer)
 *  6. coinCreatorVaultAuthority (writable)
 *  7. coinCreatorVaultAta (writable)
 *  8. pumpCreatorVault (pump.fun creator-vault PDA) (writable)
 *  9. eventAuthority
 * 10. pumpswapProgram
 */
export function buildTransferCreatorFeesToPumpIx({
  wsolMint,
  tokenProgram,
  systemProgram,
  associatedTokenProgram,
  coinCreator,
  coinCreatorVaultAuthority,
  coinCreatorVaultAta,
  pumpCreatorVault,
  eventAuthority,
  pumpswapProgram = PROGRAM_PUMPSWAP,
}) {
  const programId = pk(pumpswapProgram);
  const data = DISC_TRANSFER_CREATOR_FEES_TO_PUMP;

  const keys = [
    { pubkey: pk(wsolMint), isSigner: false, isWritable: false },
    { pubkey: pk(tokenProgram), isSigner: false, isWritable: false },
    { pubkey: pk(systemProgram), isSigner: false, isWritable: false },
    { pubkey: pk(associatedTokenProgram), isSigner: false, isWritable: false },
    { pubkey: pk(coinCreator), isSigner: true, isWritable: true },
    { pubkey: pk(coinCreatorVaultAuthority), isSigner: false, isWritable: true },
    { pubkey: pk(coinCreatorVaultAta), isSigner: false, isWritable: true },
    { pubkey: pk(pumpCreatorVault), isSigner: false, isWritable: true },
    { pubkey: pk(eventAuthority), isSigner: false, isWritable: false },
    { pubkey: pk(pumpswapProgram), isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({ programId, keys, data });
}
