import { PublicKey, SystemProgram, TransactionInstruction, ComputeBudgetProgram, TransactionMessage, VersionedTransaction, Keypair } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, createAssociatedTokenAccountIdempotentInstruction } from '@solana/spl-token';
import { fileURLToPath } from 'node:url';
import { getConnectionAuto } from '../../rpc/connection.mjs';
import { loadOrCreateKeypair } from '../keypair.mjs';
import { loadWalletKeypair } from '../../wallet.mjs';
import { pumpfunUploadIpfs } from './ipfs_upload.mjs';

// Pump.fun program + related constants (observed mainnet)
export const PUMPFUN_PROGRAM_ID = new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P');
export const METAPLEX_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const ATA_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
export const RENT_SYSVAR_ID = new PublicKey('SysvarRent111111111111111111111111111111111');

export const GLOBAL_STATE = new PublicKey('4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf');
export const EVENT_AUTHORITY = new PublicKey('Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1');

export const FEE_PROGRAM_ID = new PublicKey('pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ');

// NOTE: Fee config PDA derivation has proven fragile across observations.
// Use the observed mainnet address directly (matches real pump.fun Buy/Sell txs).
export const FEE_CONFIG = new PublicKey('8Wf5TiAheLUqBrKXeYg2JtAFFMWtKdG2BSFgqUcPVwTt');

// Discriminators (first 8 bytes) observed from real mainnet tx
const DISC_CREATE_HEX = '181ec828051c0777';
const DISC_EXTEND_ACCOUNT_HEX = 'ea66c2cb96483ee5';
const DISC_BUY_HEX = '66063d1201daebea';

function u32LE(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n >>> 0);
  return b;
}

function encodeAnchorString(s) {
  const buf = Buffer.from(String(s), 'utf8');
  return Buffer.concat([u32LE(buf.length), buf]);
}

function metadataPda(mint) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('metadata', 'utf8'), METAPLEX_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    METAPLEX_METADATA_PROGRAM_ID
  )[0];
}

function mintAuthorityPda() {
  return PublicKey.findProgramAddressSync([Buffer.from('mint-authority', 'utf8')], PUMPFUN_PROGRAM_ID)[0];
}

function bondingCurvePda(mint) {
  return PublicKey.findProgramAddressSync([Buffer.from('bonding-curve', 'utf8'), mint.toBuffer()], PUMPFUN_PROGRAM_ID)[0];
}

function creatorVaultPda(creator) {
  return PublicKey.findProgramAddressSync([Buffer.from('creator-vault', 'utf8'), creator.toBuffer()], PUMPFUN_PROGRAM_ID)[0];
}

function globalVolumeAccumulatorPda() {
  return PublicKey.findProgramAddressSync([Buffer.from('global_volume_accumulator', 'utf8')], PUMPFUN_PROGRAM_ID)[0];
}

function userVolumeAccumulatorPda(user) {
  return PublicKey.findProgramAddressSync([Buffer.from('user_volume_accumulator', 'utf8'), user.toBuffer()], PUMPFUN_PROGRAM_ID)[0];
}

function feeConfigPda() {
  return FEE_CONFIG;
}

function parseBondingCurveAccount(data) {
  // Observed layout (mainnet):
  // disc8
  // vt u64
  // vs u64
  // rt u64
  // rs u64
  // total u64
  // complete u8
  // creator pubkey (32)
  const buf = Buffer.from(data);
  let o = 8;
  const vt = buf.readBigUInt64LE(o); o += 8;
  const vs = buf.readBigUInt64LE(o); o += 8;
  const rt = buf.readBigUInt64LE(o); o += 8;
  const rs = buf.readBigUInt64LE(o); o += 8;
  const total = buf.readBigUInt64LE(o); o += 8;
  o += 1; // complete flag
  const creator = new PublicKey(buf.subarray(o, o + 32));
  return { virtualTokenReserves: vt, virtualSolReserves: vs, realTokenReserves: rt, realSolReserves: rs, tokenTotalSupply: total, creator };
}

async function readFeeRecipientFromGlobalState(conn, commitment) {
  const info = await conn.getAccountInfo(GLOBAL_STATE, commitment);
  if (!info?.data) throw new Error('GLOBAL_STATE account not found');
  const buf = Buffer.from(info.data);
  // Observed feeRecipient pubkey occurs at offset 322 in GLOBAL_STATE (mainnet)
  if (buf.length < 322 + 32) throw new Error(`GLOBAL_STATE too short: ${buf.length}`);
  return new PublicKey(buf.subarray(322, 322 + 32));
}

function buildCreateIx({ mint, user, name, symbol, uri }) {
  const mintAuth = mintAuthorityPda();
  const bondingCurve = bondingCurvePda(mint);
  const assocBondingCurve = getAssociatedTokenAddressSync(mint, bondingCurve, true, TOKEN_PROGRAM_ID, ATA_PROGRAM_ID);
  const metadata = metadataPda(mint);

  const data = Buffer.concat([
    Buffer.from(DISC_CREATE_HEX, 'hex'),
    encodeAnchorString(name),
    encodeAnchorString(symbol),
    encodeAnchorString(uri),
    user.toBuffer(),
  ]);

  const keys = [
    { pubkey: mint, isSigner: true, isWritable: true },
    { pubkey: mintAuth, isSigner: false, isWritable: false },
    { pubkey: bondingCurve, isSigner: false, isWritable: true },
    { pubkey: assocBondingCurve, isSigner: false, isWritable: true },
    { pubkey: GLOBAL_STATE, isSigner: false, isWritable: false },
    { pubkey: METAPLEX_METADATA_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: metadata, isSigner: false, isWritable: true },
    { pubkey: user, isSigner: true, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: ATA_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: RENT_SYSVAR_ID, isSigner: false, isWritable: false },
    { pubkey: EVENT_AUTHORITY, isSigner: false, isWritable: false },
    { pubkey: PUMPFUN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  return {
    ix: new TransactionInstruction({ programId: PUMPFUN_PROGRAM_ID, keys, data }),
    bondingCurve,
    assocBondingCurve,
    metadata,
  };
}

function buildExtendAccountIx({ bondingCurve, user }) {
  const data = Buffer.from(DISC_EXTEND_ACCOUNT_HEX, 'hex');
  const keys = [
    { pubkey: bondingCurve, isSigner: false, isWritable: true },
    { pubkey: user, isSigner: true, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: EVENT_AUTHORITY, isSigner: false, isWritable: false },
    { pubkey: PUMPFUN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];
  return new TransactionInstruction({ programId: PUMPFUN_PROGRAM_ID, keys, data });
}

export async function deployPumpfunToken(params) {
  const {
    name,
    symbol,
    uri,
    description = '',
    logoPath,
    commitment = 'confirmed',
    computeUnitLimit,
    computeUnitPriceMicroLamports,
    payerKeypairPath,
    mintKeypairPath,

    // Optional initial buy
    initialBuySol,
    slippageBps = 100,
    trackVolume = true,
    buyComputeUnitLimit,
    buyComputeUnitPriceMicroLamports,
  } = params || {};

  if (!name || !symbol) throw new Error('deployPumpfunToken: {name, symbol} required');

  const { conn, rpcUrl, selected } = await getConnectionAuto({ commitment });

  // Default payer: local default wallet (.secrets/moltium-wallet.json)
  const payer = payerKeypairPath ? loadOrCreateKeypair(payerKeypairPath) : loadWalletKeypair();
  const mint = mintKeypairPath ? loadOrCreateKeypair(mintKeypairPath) : Keypair.generate();

  // If uri is not provided, auto-upload metadata+logo via pump.fun.
  let finalUri = uri;
  let ipfsUpload = null;
  if (!finalUri) {
    if (!logoPath) throw new Error('deployPumpfunToken: uri missing; provide {logoPath} to auto-upload via pump.fun');
    ipfsUpload = await pumpfunUploadIpfs({ name, symbol, description, imagePath: logoPath });
    finalUri = ipfsUpload.metadataUri;
  }

  const bal = await conn.getBalance(payer.publicKey, commitment);
  if (bal === 0) {
    throw new Error(`Payer has 0 lamports. Fund this address first: ${payer.publicKey.toBase58()}`);
  }

  // --- DEPLOY TX
  const deployIxs = [];
  if (computeUnitLimit) deployIxs.push(ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnitLimit }));
  if (computeUnitPriceMicroLamports) deployIxs.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: computeUnitPriceMicroLamports }));

  const { ix: createIx, bondingCurve, assocBondingCurve, metadata } = buildCreateIx({
    mint: mint.publicKey,
    user: payer.publicKey,
    name,
    symbol,
    uri: finalUri,
  });
  deployIxs.push(createIx);
  deployIxs.push(buildExtendAccountIx({ bondingCurve, user: payer.publicKey }));

  const deployBh = await conn.getLatestBlockhash(commitment);
  const deployMsg = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: deployBh.blockhash,
    instructions: deployIxs,
  }).compileToV0Message();

  const deployTx = new VersionedTransaction(deployMsg);
  deployTx.sign([payer, mint]);

  const deploySig = await conn.sendTransaction(deployTx, { skipPreflight: false, preflightCommitment: commitment, maxRetries: 3 });
  await conn.confirmTransaction({ signature: deploySig, blockhash: deployBh.blockhash, lastValidBlockHeight: deployBh.lastValidBlockHeight }, commitment);

  if (!initialBuySol || Number(initialBuySol) <= 0) {
    return {
      signature: deploySig,
      rpcUrl,
      rpcSelected: selected,
      payer: payer.publicKey.toBase58(),
      mint: mint.publicKey.toBase58(),
      bondingCurve: bondingCurve.toBase58(),
      associatedBondingCurve: assocBondingCurve.toBase58(),
      metadata: metadata.toBase58(),
      metadataUri: finalUri,
      ipfsUpload,
    };
  }

  // --- BUY TX
  const bcInfo = await conn.getAccountInfo(bondingCurve, commitment);
  if (!bcInfo?.data) throw new Error('bonding curve not found after deploy');
  const bc = parseBondingCurveAccount(bcInfo.data);

  const feeRecipient = await readFeeRecipientFromGlobalState(conn, commitment);
  const creatorVault = creatorVaultPda(bc.creator);
  const gva = globalVolumeAccumulatorPda();
  const uva = userVolumeAccumulatorPda(payer.publicKey);
  const feeCfg = feeConfigPda();

  const solLamports = BigInt(Math.floor(Number(initialBuySol) * 1e9));
  const tokenOut = (solLamports * bc.virtualTokenReserves) / bc.virtualSolReserves;
  const maxSolCost = (solLamports * BigInt(10_000 + Number(slippageBps))) / 10_000n;

  const userAta = getAssociatedTokenAddressSync(mint.publicKey, payer.publicKey, false, TOKEN_PROGRAM_ID, ATA_PROGRAM_ID);

  const buyIxs = [];
  if (buyComputeUnitLimit) buyIxs.push(ComputeBudgetProgram.setComputeUnitLimit({ units: buyComputeUnitLimit }));
  if (buyComputeUnitPriceMicroLamports) buyIxs.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: buyComputeUnitPriceMicroLamports }));

  buyIxs.push(createAssociatedTokenAccountIdempotentInstruction(
    payer.publicKey,
    userAta,
    payer.publicKey,
    mint.publicKey,
    TOKEN_PROGRAM_ID,
    ATA_PROGRAM_ID
  ));

  const buyData = Buffer.concat([
    Buffer.from(DISC_BUY_HEX, 'hex'),
    (() => { const b = Buffer.alloc(8); b.writeBigUInt64LE(tokenOut); return b; })(),
    (() => { const b = Buffer.alloc(8); b.writeBigUInt64LE(maxSolCost); return b; })(),
    Buffer.from([trackVolume ? 1 : 0]),
  ]);

  const buyKeys = [
    { pubkey: GLOBAL_STATE, isSigner: false, isWritable: false },
    { pubkey: feeRecipient, isSigner: false, isWritable: true },
    { pubkey: mint.publicKey, isSigner: false, isWritable: true },
    { pubkey: bondingCurve, isSigner: false, isWritable: true },
    { pubkey: assocBondingCurve, isSigner: false, isWritable: true },
    { pubkey: userAta, isSigner: false, isWritable: true },
    { pubkey: payer.publicKey, isSigner: true, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: creatorVault, isSigner: false, isWritable: true },
    { pubkey: EVENT_AUTHORITY, isSigner: false, isWritable: false },
    { pubkey: PUMPFUN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: gva, isSigner: false, isWritable: false },
    { pubkey: uva, isSigner: false, isWritable: true },
    { pubkey: feeCfg, isSigner: false, isWritable: false },
    { pubkey: FEE_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  buyIxs.push(new TransactionInstruction({ programId: PUMPFUN_PROGRAM_ID, keys: buyKeys, data: buyData }));

  const buyBh = await conn.getLatestBlockhash(commitment);
  const buyMsg = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: buyBh.blockhash,
    instructions: buyIxs,
  }).compileToV0Message();

  const buyTx = new VersionedTransaction(buyMsg);
  buyTx.sign([payer]);

  const buySig = await conn.sendTransaction(buyTx, { skipPreflight: false, preflightCommitment: commitment, maxRetries: 3 });
  await conn.confirmTransaction({ signature: buySig, blockhash: buyBh.blockhash, lastValidBlockHeight: buyBh.lastValidBlockHeight }, commitment);

  return {
    signature: deploySig,
    buySignature: buySig,
    rpcUrl,
    rpcSelected: selected,
    payer: payer.publicKey.toBase58(),
    mint: mint.publicKey.toBase58(),
    bondingCurve: bondingCurve.toBase58(),
    associatedBondingCurve: assocBondingCurve.toBase58(),
    metadata: metadata.toBase58(),
    metadataUri: finalUri,
    ipfsUpload,
    initialBuy: {
      sol: Number(initialBuySol),
      slippageBps,
      tokenOutRaw: tokenOut.toString(),
      maxSolCostLamports: maxSolCost.toString(),
      feeRecipient: feeRecipient.toBase58(),
      creator: bc.creator.toBase58(),
      creatorVault: creatorVault.toBase58(),
      globalVolumeAccumulator: gva.toBase58(),
      userVolumeAccumulator: uva.toBase58(),
      feeConfig: feeCfg.toBase58(),
    }
  };
}
