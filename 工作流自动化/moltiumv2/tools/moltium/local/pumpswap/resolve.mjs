// PumpSwap account resolution (RPC-only, backendless)
//
// Deterministic resolution strategy:
// - Pool discovery via getProgramAccounts memcmp (baseMint/quoteMint) + parse pool state
// - PDAs from PumpSwap program: global_config, __event_authority, volume accumulators
// - Parse GlobalConfig on-chain to pick protocol fee recipient
// - Read coin creator pubkey from pump.fun bonding curve account (baseMint)
// - Derive coin creator vault authority PDA + its WSOL ATA
// - Fee config/program are fixed (pfee program + known fee config address)

import { PublicKey } from '@solana/web3.js';
import { getConnection } from '../rpc/connection.mjs';
import {
  PROGRAM_PUMPSWAP,
  WSOL_MINT,
  SYSTEM_PROGRAM,
  ASSOC_TOKEN_PROGRAM,
  FEE_PROGRAM,
  FEE_CONFIG,
} from './constants2.mjs';

export { WSOL_MINT };
import {
  findEventAuthorityPda,
  findGlobalConfigPda,
  findGlobalVolumeAccumulatorPda,
  findUserVolumeAccumulatorPda,
  findAssociatedTokenAddress,
} from './pda.mjs';
import { parseGlobalConfig, selectProtocolFeeRecipient } from './borsh_accounts.mjs';
import { detectTokenProgramForMint } from './token_program.mjs';

const PUMPFUN_PROGRAM = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';

function pk(s){ return new PublicKey(String(s)); }

async function getAccountData(conn, pubkey) {
  const info = await conn.getAccountInfo(pk(pubkey), 'confirmed');
  if (!info?.data) return null;
  return Buffer.from(info.data);
}

export function parsePoolState(buf){
  // Observed pool state data len = 301.
  // Offsets confirmed across multiple pools.
  const baseMint = new PublicKey(buf.subarray(43, 43 + 32)).toBase58();
  const quoteMint = new PublicKey(buf.subarray(75, 75 + 32)).toBase58();
  const poolBaseTokenAccount = new PublicKey(buf.subarray(139, 139 + 32)).toBase58();
  const poolQuoteTokenAccount = new PublicKey(buf.subarray(171, 171 + 32)).toBase58();
  // index: u16 LE at offset 9
  const index = buf.readUInt16LE(9);
  return { baseMint, quoteMint, poolBaseTokenAccount, poolQuoteTokenAccount, index };
}

export async function findPoolForMints({ baseMint, quoteMint = WSOL_MINT }) {
  const { conn, rpcUrl } = getConnection('confirmed');
  const programId = pk(PROGRAM_PUMPSWAP);
  const filters = [
    { memcmp: { offset: 43, bytes: pk(baseMint).toBase58() } },
    { memcmp: { offset: 75, bytes: pk(quoteMint).toBase58() } },
  ];
  const accts = await conn.getProgramAccounts(programId, { commitment:'confirmed', filters });
  if (!accts.length) return { rpcUrl, pool: null };
  return { rpcUrl, pool: accts[0].pubkey.toBase58() };
}

export async function resolvePoolFull({ baseMint, quoteMint = WSOL_MINT, user = null }) {
  const { conn, rpcUrl } = getConnection('confirmed');

  const f = await findPoolForMints({ baseMint, quoteMint });
  if (!f.pool) return { rpcUrl, ok:false, error:'pool not found' };

  const poolBuf = await getAccountData(conn, f.pool);
  if (!poolBuf) return { rpcUrl, ok:false, error:'pool not found (accountInfo null)', pool: f.pool };
  const poolState = parsePoolState(poolBuf);

  // PDAs
  const [globalConfigPda] = findGlobalConfigPda();
  const [eventAuthorityPda] = findEventAuthorityPda();
  const [globalVolPda] = findGlobalVolumeAccumulatorPda();
  const [userVolPda] = user ? findUserVolumeAccumulatorPda(user) : [null];

  // Global config parsing
  const gcBuf = await getAccountData(conn, globalConfigPda);
  if (!gcBuf) throw new Error('global_config PDA not found');
  const globalConfigAcc = parseGlobalConfig(gcBuf);

  const protocolFeeRecipient = selectProtocolFeeRecipient(globalConfigAcc, poolState.index);

  // Token programs
  const baseTokenProgram = await detectTokenProgramForMint(conn, baseMint);
  const quoteTokenProgram = await detectTokenProgramForMint(conn, quoteMint);

  // Protocol fee recipient token account (ATA for quote mint)
  const protocolFeeRecipientTokenAccount = findAssociatedTokenAddress({
    owner: protocolFeeRecipient,
    mint: quoteMint,
    tokenProgram: quoteTokenProgram,
    associatedTokenProgram: ASSOC_TOKEN_PROGRAM,
  }).toBase58();

  // Coin creator: from pump.fun bonding curve account
  const [bondingCurve] = PublicKey.findProgramAddressSync(
    [Buffer.from('bonding-curve'), pk(baseMint).toBuffer()],
    pk(PUMPFUN_PROGRAM)
  );
  const bcBuf = await getAccountData(conn, bondingCurve);
  if (!bcBuf) throw new Error('bonding curve account not found (needed to resolve creator vault)');
  const coinCreator = new PublicKey(bcBuf.subarray(49, 81)).toBase58();

  // creator vault authority PDA + its WSOL ATA
  const [coinCreatorVaultAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from('creator_vault'), pk(coinCreator).toBuffer()],
    pk(PROGRAM_PUMPSWAP)
  );
  const coinCreatorVaultAta = findAssociatedTokenAddress({
    owner: coinCreatorVaultAuthority.toBase58(),
    mint: quoteMint,
    tokenProgram: quoteTokenProgram,
    associatedTokenProgram: ASSOC_TOKEN_PROGRAM,
  }).toBase58();

  const extras = {
    pool: f.pool,
    baseMint,
    quoteMint,

    globalConfig: globalConfigPda.toBase58(),
    eventAuthority: eventAuthorityPda.toBase58(),

    feeProgram: FEE_PROGRAM,
    feeConfig: FEE_CONFIG,

    protocolFeeRecipient,
    protocolFeeRecipientTokenAccount,

    globalVolumeAccumulator: globalVolPda.toBase58(),
    userVolumeAccumulator: userVolPda ? userVolPda.toBase58() : null,

    baseTokenProgram,
    quoteTokenProgram,

    systemProgram: SYSTEM_PROGRAM,
    associatedTokenProgram: ASSOC_TOKEN_PROGRAM,

    bondingCurve: bondingCurve.toBase58(),
    coinCreator,
    coinCreatorVaultAuthority: coinCreatorVaultAuthority.toBase58(),
    coinCreatorVaultAta,

    // convenience
    poolBaseTokenAccount: poolState.poolBaseTokenAccount,
    poolQuoteTokenAccount: poolState.poolQuoteTokenAccount,
  };

  return {
    rpcUrl,
    ok: true,
    pool: f.pool,
    poolState,
    extras,
    globalConfigAcc,
    userVolumeAccumulator: extras.userVolumeAccumulator,
  };
}
