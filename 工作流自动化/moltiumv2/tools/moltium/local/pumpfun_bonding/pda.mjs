import { PublicKey } from '@solana/web3.js';
import {
  PROGRAM_PUMPFUN,
  SEED_GLOBAL,
  SEED_BONDING_CURVE,
  SEED_CREATOR_VAULT,
  SEED_EVENT_AUTHORITY,
  TOKEN_PROGRAM,
  ASSOC_TOKEN_PROGRAM,
} from './constants.mjs';

function pk(s){ return new PublicKey(String(s)); }

export function findGlobalPda() {
  return PublicKey.findProgramAddressSync([SEED_GLOBAL], pk(PROGRAM_PUMPFUN));
}

export function findBondingCurvePda(mint) {
  return PublicKey.findProgramAddressSync([SEED_BONDING_CURVE, pk(mint).toBuffer()], pk(PROGRAM_PUMPFUN));
}

export function findCreatorVaultPda(creatorPubkey) {
  return PublicKey.findProgramAddressSync([SEED_CREATOR_VAULT, pk(creatorPubkey).toBuffer()], pk(PROGRAM_PUMPFUN));
}

export function findEventAuthorityPda() {
  return PublicKey.findProgramAddressSync([SEED_EVENT_AUTHORITY], pk(PROGRAM_PUMPFUN));
}

export function findAssociatedTokenAddress({ owner, mint, tokenProgram = TOKEN_PROGRAM }) {
  // ATA seeds: [owner, tokenProgram, mint] with ATA program id
  const [ata] = PublicKey.findProgramAddressSync(
    [pk(owner).toBuffer(), pk(tokenProgram).toBuffer(), pk(mint).toBuffer()],
    pk(ASSOC_TOKEN_PROGRAM)
  );
  return ata;
}
