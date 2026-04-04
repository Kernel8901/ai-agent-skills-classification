// Resolve pump.fun bonding curve accounts (backend-independent)

import { PublicKey } from '@solana/web3.js';
import { getConnection } from '../rpc/connection.mjs';
import { parseBondingCurveAccount, parseGlobalAccount } from './borsh_accounts.mjs';
import { findAssociatedTokenAddress, findBondingCurvePda, findCreatorVaultPda, findEventAuthorityPda, findGlobalPda } from './pda.mjs';
import { findGlobalVolumeAccumulatorPda, findUserVolumeAccumulatorPda } from './volume_pda.mjs';
import { findFeeConfigPda, FEE_PROGRAM } from './fee_config.mjs';
import { detectTokenProgramForMint } from './token_program.mjs';

function pk(s){ return new PublicKey(String(s)); }

export async function resolveBonding({ mint, userPubkey, creatorPubkey = null }) {
  const { conn, rpcUrl } = getConnection('confirmed');

  const [global] = findGlobalPda();
  const [bondingCurve] = findBondingCurvePda(mint);
  const [eventAuthority] = findEventAuthorityPda();

  const globalInfo = await conn.getAccountInfo(global, 'confirmed');
  if (!globalInfo?.data) throw new Error('Global PDA not found');
  const globalAcc = parseGlobalAccount(Buffer.from(globalInfo.data));

  const curveInfo = await conn.getAccountInfo(bondingCurve, 'confirmed');
  if (!curveInfo?.data) throw new Error('Bonding curve PDA not found');
  const curveAcc = parseBondingCurveAccount(Buffer.from(curveInfo.data));

  const tokenProgram = await detectTokenProgramForMint(conn, mint);

  // Associated token accounts (ATA derivation depends on token program id)
  const associatedBondingCurve = findAssociatedTokenAddress({ owner: bondingCurve, mint, tokenProgram });
  const associatedUser = findAssociatedTokenAddress({ owner: pk(userPubkey), mint, tokenProgram });

  // Creator pubkey: use provided value, else read from bonding curve account (offset 49..81)
  const creator = creatorPubkey ? pk(creatorPubkey) : new PublicKey(Buffer.from(curveInfo.data).subarray(49, 81));
  const creatorVault = findCreatorVaultPda(creator)[0];

  const [gva] = findGlobalVolumeAccumulatorPda();
  const [uva] = findUserVolumeAccumulatorPda(userPubkey);
  const [feeConfig] = findFeeConfigPda();

  return {
    rpcUrl,
    global: global.toBase58(),
    bondingCurve: bondingCurve.toBase58(),
    eventAuthority: eventAuthority.toBase58(),
    feeRecipient: globalAcc.feeRecipient.toBase58(),
    feeBasisPoints: globalAcc.feeBasisPoints.toString(),
    tokenProgram,

    // volume accumulators (deterministic)
    globalVolumeAccumulator: gva.toBase58(),
    userVolumeAccumulator: uva.toBase58(),

    // fee program/config accounts (deterministic)
    feeProgram: FEE_PROGRAM,
    feeConfig: feeConfig.toBase58(),

    associatedBondingCurve: associatedBondingCurve.toBase58(),
    associatedUser: associatedUser.toBase58(),
    creatorVault: creatorVault ? creatorVault.toBase58() : null,
    globalAcc,
    curveAcc,
  };
}
