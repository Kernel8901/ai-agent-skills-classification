import { PublicKey } from '@solana/web3.js';

export const FEE_PROGRAM = 'pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ';

// Observed constant used in fee_config PDA derivation for pump.fun bonding.
// Source: community SDKs + on-chain verification.
export const FEE_SEED_CONST_BONDING = Uint8Array.from([
  1, 86, 224, 246, 147, 102, 90, 207, 68, 219,
  21, 104, 191, 23, 91, 170, 81, 137, 203, 151,
  245, 210, 255, 59, 101, 93, 43, 182, 253, 109, 24, 176,
]);

function pk(s){ return new PublicKey(String(s)); }

export function findFeeConfigPda() {
  return PublicKey.findProgramAddressSync([
    Buffer.from('fee_config'),
    Buffer.from(FEE_SEED_CONST_BONDING),
  ], pk(FEE_PROGRAM));
}
