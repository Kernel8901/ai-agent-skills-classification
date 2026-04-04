// Build pump.fun bonding curve buy/sell instructions (Anchor)

import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { DISC_BUY, DISC_SELL, PROGRAM_PUMPFUN, SYSTEM_PROGRAM, TOKEN_PROGRAM } from './constants.mjs';

function pk(s){ return new PublicKey(String(s)); }

function u64le(n){
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(BigInt(n));
  return b;
}

export function encodeBuy({ amountTokensRaw, maxSolCostLamports }) {
  return Buffer.concat([DISC_BUY, u64le(amountTokensRaw), u64le(maxSolCostLamports)]);
}

export function encodeSell({ amountTokensRaw, minSolOutLamports }) {
  return Buffer.concat([DISC_SELL, u64le(amountTokensRaw), u64le(minSolOutLamports)]);
}

// Account order per IDL (buy/sell)
export function buildBuyIx({
  global,
  feeRecipient,
  mint,
  bondingCurve,
  associatedBondingCurve,
  associatedUser,
  user,
  creatorVault,
  eventAuthority,
  tokenProgram,
  // extra accounts (required; see recent tx)
  globalVolumeAccumulator,
  userVolumeAccumulator,
  feeConfig,
  feeProgram,
  amountTokensRaw,
  maxSolCostLamports,
}) {
  const programId = pk(PROGRAM_PUMPFUN);
  const data = encodeBuy({ amountTokensRaw, maxSolCostLamports });

  if (!creatorVault) throw new Error('creatorVault is required');
  if (!globalVolumeAccumulator) throw new Error('globalVolumeAccumulator is required');
  if (!userVolumeAccumulator) throw new Error('userVolumeAccumulator is required');
  if (!feeConfig) throw new Error('feeConfig is required');
  if (!feeProgram) throw new Error('feeProgram is required');

  const keys = [
    { pubkey: pk(global), isSigner: false, isWritable: false },
    { pubkey: pk(feeRecipient), isSigner: false, isWritable: true },
    { pubkey: pk(mint), isSigner: false, isWritable: false },
    { pubkey: pk(bondingCurve), isSigner: false, isWritable: true },
    { pubkey: pk(associatedBondingCurve), isSigner: false, isWritable: true },
    { pubkey: pk(associatedUser), isSigner: false, isWritable: true },
    { pubkey: pk(user), isSigner: true, isWritable: true },
    { pubkey: pk(SYSTEM_PROGRAM), isSigner: false, isWritable: false },
    { pubkey: pk(tokenProgram || TOKEN_PROGRAM), isSigner: false, isWritable: false },
    { pubkey: pk(creatorVault), isSigner: false, isWritable: true },
    { pubkey: pk(eventAuthority), isSigner: false, isWritable: false },
    { pubkey: programId, isSigner: false, isWritable: false },
    // trailing extras (order as observed in real tx)
    { pubkey: pk(globalVolumeAccumulator), isSigner: false, isWritable: true },
    { pubkey: pk(userVolumeAccumulator), isSigner: false, isWritable: true },
    { pubkey: pk(feeConfig), isSigner: false, isWritable: false },
    { pubkey: pk(feeProgram), isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({ programId, keys, data });
}

export function buildSellIx({
  global,
  feeRecipient,
  mint,
  bondingCurve,
  associatedBondingCurve,
  associatedUser,
  user,
  creatorVault,
  eventAuthority,
  tokenProgram,
  feeConfig,
  feeProgram,
  amountTokensRaw,
  minSolOutLamports,
}) {
  const programId = pk(PROGRAM_PUMPFUN);
  const data = encodeSell({ amountTokensRaw, minSolOutLamports });

  if (!creatorVault) throw new Error('creatorVault is required');
  if (!feeConfig) throw new Error('feeConfig is required');
  if (!feeProgram) throw new Error('feeProgram is required');

  const keys = [
    { pubkey: pk(global), isSigner: false, isWritable: false },
    { pubkey: pk(feeRecipient), isSigner: false, isWritable: true },
    { pubkey: pk(mint), isSigner: false, isWritable: false },
    { pubkey: pk(bondingCurve), isSigner: false, isWritable: true },
    { pubkey: pk(associatedBondingCurve), isSigner: false, isWritable: true },
    { pubkey: pk(associatedUser), isSigner: false, isWritable: true },
    { pubkey: pk(user), isSigner: true, isWritable: true },
    { pubkey: pk(SYSTEM_PROGRAM), isSigner: false, isWritable: false },
    { pubkey: pk(creatorVault), isSigner: false, isWritable: true },
    { pubkey: pk(tokenProgram || TOKEN_PROGRAM), isSigner: false, isWritable: false },
    { pubkey: pk(eventAuthority), isSigner: false, isWritable: false },
    { pubkey: programId, isSigner: false, isWritable: false },
    { pubkey: pk(feeConfig), isSigner: false, isWritable: false },
    { pubkey: pk(feeProgram), isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({ programId, keys, data });
}
