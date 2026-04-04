// Show transaction details (RPC-only)
// Usage: node tools/moltium/local/wallets/wallet_tx_show.mjs <signature>

import { PublicKey } from '@solana/web3.js';
import { getConnection } from '../rpc/connection.mjs';

async function resolveAlts(conn, message) {
  const lookups = message.addressTableLookups || [];
  const alts = [];
  for (const l of lookups) {
    const r = await conn.getAddressLookupTable(l.accountKey, 'confirmed');
    const alt = r?.value;
    if (alt) alts.push(alt);
  }
  return alts;
}

async function main(){
  const [sig] = process.argv.slice(2);
  if (!sig) {
    console.error('usage: wallet_tx_show.mjs <signature>');
    process.exit(2);
  }
  const { conn, rpcUrl } = getConnection('confirmed');
  const tx = await conn.getTransaction(sig, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });
  if (!tx) throw new Error('tx not found');

  const msg = tx.transaction.message;
  const alts = await resolveAlts(conn, msg);
  const keys = msg.getAccountKeys ? msg.getAccountKeys({ addressLookupTableAccounts: alts }) : null;
  const allKeys = keys
    ? keys.staticAccountKeys.concat((keys.accountKeysFromLookups?.writable || []), (keys.accountKeysFromLookups?.readonly || []))
    : (msg.accountKeys || []).map(k => (k.pubkey ? k.pubkey : k));

  const compiled = msg.compiledInstructions || [];
  const instructions = compiled.map(ix => ({
    programId: allKeys[ix.programIdIndex]?.toBase58?.() || String(ix.programIdIndex),
    accounts: ix.accountKeyIndexes.map(i => allKeys[i]?.toBase58?.() || String(i)),
    dataBase64: ix.data,
  }));

  console.log(JSON.stringify({
    ok: true,
    signature: sig,
    rpcUrl,
    slot: tx.slot,
    blockTime: tx.blockTime,
    err: tx.meta?.err || null,
    fee: tx.meta?.fee || null,
    logMessages: tx.meta?.logMessages || [],
    preTokenBalances: tx.meta?.preTokenBalances || [],
    postTokenBalances: tx.meta?.postTokenBalances || [],
    instructions,
  }, null, 2));
}

main().catch(e=>{ console.error(String(e?.message||e)); process.exit(1); });
