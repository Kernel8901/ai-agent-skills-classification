import { PublicKey } from '@solana/web3.js';
import { PROGRAM_PUMPFUN } from './constants.mjs';

function pk(s){ return new PublicKey(String(s)); }

export function findGlobalVolumeAccumulatorPda() {
  return PublicKey.findProgramAddressSync([Buffer.from('global_volume_accumulator')], pk(PROGRAM_PUMPFUN));
}

export function findUserVolumeAccumulatorPda(user) {
  return PublicKey.findProgramAddressSync([Buffer.from('user_volume_accumulator'), pk(user).toBuffer()], pk(PROGRAM_PUMPFUN));
}
