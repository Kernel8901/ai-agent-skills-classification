import { PublicKey } from '@solana/web3.js';
import { PROGRAM_PUMPSWAP, WSOL_MINT } from './constants2.mjs';

function pk(s){ return new PublicKey(String(s)); }

export function findGlobalConfigPda() {
  return PublicKey.findProgramAddressSync([Buffer.from('global_config')], pk(PROGRAM_PUMPSWAP));
}

export function findEventAuthorityPda() {
  return PublicKey.findProgramAddressSync([Buffer.from('__event_authority')], pk(PROGRAM_PUMPSWAP));
}

export function findGlobalVolumeAccumulatorPda() {
  return PublicKey.findProgramAddressSync([Buffer.from('global_volume_accumulator')], pk(PROGRAM_PUMPSWAP));
}

export function findUserVolumeAccumulatorPda(user) {
  return PublicKey.findProgramAddressSync([Buffer.from('user_volume_accumulator'), pk(user).toBuffer()], pk(PROGRAM_PUMPSWAP));
}

export function findAssociatedTokenAddress({ owner, mint = WSOL_MINT, tokenProgram, associatedTokenProgram }) {
  // ATA derivation: [owner, tokenProgram, mint] with ATA program id
  const [ata] = PublicKey.findProgramAddressSync(
    [pk(owner).toBuffer(), pk(tokenProgram).toBuffer(), pk(mint).toBuffer()],
    pk(associatedTokenProgram)
  );
  return ata;
}
