// Build pumpswap TransactionInstructions (no PumpPortal, no Moltium backend)
// This module does NOT send transactions yet; it only builds instructions.

import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { PROGRAM_PUMPSWAP } from './constants.mjs';
import { encodeBuy, encodeSell } from './encode.mjs';
import { SELL_ACCOUNTS, BUY_ACCOUNTS } from './layouts.mjs';
import { TRANSFER_CREATOR_FEES_TO_PUMP_ACCOUNTS } from './layouts_claim.mjs';

function pk(x) { return x instanceof PublicKey ? x : new PublicKey(String(x)); }

/**
 * Build SELL instruction.
 * @param {object} p
 * @param {string} p.inTokenRaw - u64 integer string/bigint
 * @param {string} p.minOutLamports - u64 integer string/bigint
 * @param {object} p.accounts - mapping name->pubkey string
 */
export function buildSellIx({ inTokenRaw, minOutLamports, accounts }) {
  const programId = pk(PROGRAM_PUMPSWAP);
  const data = encodeSell({ inTokenRaw, minOutLamports });

  // Ordered keys as per Solscan parsed template
  const order = SELL_ACCOUNTS.map(x => x.name);
  const keys = order.map((name) => {
    const addr = accounts?.[name];
    if (!addr) throw new Error(`Missing account: ${name}`);
    const isSigner = name === 'user';
    // Writable: pool + user ATAs + pool vaults + protocol fee token acct + coin creator vault ata
    const writableNames = new Set([
      'pool',
      'userBaseTokenAccount',
      'userQuoteTokenAccount',
      'poolBaseTokenAccount',
      'poolQuoteTokenAccount',
      'protocolFeeRecipientTokenAccount',
      'coinCreatorVaultAta',
    ]);
    return { pubkey: pk(addr), isSigner, isWritable: writableNames.has(name) };
  });

  return new TransactionInstruction({ programId, keys, data });
}

/**
 * Build BUY instruction.
 * @param {object} p
 * @param {string|bigint} p.minOutTokens - u64 raw minimum out
 * @param {string|bigint} p.maxInLamports - u64 max quote (SOL) in lamports
 * @param {number} [p.flags=1] - u8
 * @param {object} p.accounts - mapping name->pubkey string
 */
export function buildBuyIx({ minOutTokens, maxInLamports, flags = 1, accounts }) {
  const programId = pk(PROGRAM_PUMPSWAP);
  const data = encodeBuy({ minOutTokens, maxInLamports, flags });

  const order = BUY_ACCOUNTS.map(x => x.name);
  const keys = order.map((name) => {
    const addr = accounts?.[name];
    if (!addr) throw new Error(`Missing account: ${name}`);
    const isSigner = name === 'user';

    // Writable: pool + user ATAs + pool vaults + protocol fee token acct + coin creator vault ata
    // plus volume accumulators.
    const writableNames = new Set([
      'pool',
      'userBaseTokenAccount',
      'userQuoteTokenAccount',
      'poolBaseTokenAccount',
      'poolQuoteTokenAccount',
      'protocolFeeRecipientTokenAccount',
      'coinCreatorVaultAta',
      'globalVolumeAccumulator',
      'userVolumeAccumulator',
    ]);

    return { pubkey: pk(addr), isSigner, isWritable: writableNames.has(name) };
  });

  return new TransactionInstruction({ programId, keys, data });
}
