// Get token balances (Tokenkeg + Token-2022)
// Usage:
//   node tools/moltium/local/wallets/wallet_balance_tokens.mjs [pubkey] [--include-zero]
// If pubkey omitted, uses default wallet.

import bs58 from 'bs58';
import fs from 'node:fs';
import path from 'node:path';
import { Keypair, PublicKey } from '@solana/web3.js';
import { getConnection } from '../rpc/connection.mjs';

const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';

function loadDefaultPubkey(){
  const p = path.resolve(process.cwd(), '.secrets', 'moltium-wallet.json');
  const obj = JSON.parse(fs.readFileSync(p,'utf8'));
  const kp = Keypair.fromSecretKey(bs58.decode(obj.secretKeyBase58));
  return kp.publicKey;
}

function normalizeParsed(ta){
  const info = ta.account.data.parsed.info;
  const amount = info.tokenAmount?.amount || '0';
  const decimals = info.tokenAmount?.decimals ?? null;
  return {
    mint: info.mint,
    owner: info.owner,
    tokenAccount: ta.pubkey.toBase58(),
    amount,
    decimals,
  };
}

async function main(){
  const argv = process.argv.slice(2);
  const includeZero = argv.includes('--include-zero');
  const filtered = argv.filter(a => a !== '--include-zero');
  const [maybe] = filtered;

  const owner = maybe ? new PublicKey(maybe) : loadDefaultPubkey();
  const { conn, rpcUrl } = getConnection('confirmed');

  const [t1, t2] = await Promise.all([
    conn.getParsedTokenAccountsByOwner(owner, { programId: new PublicKey(TOKEN_PROGRAM) }, 'confirmed'),
    conn.getParsedTokenAccountsByOwner(owner, { programId: new PublicKey(TOKEN_2022_PROGRAM) }, 'confirmed'),
  ]);

  const a1 = t1.value.map(normalizeParsed).map(x => ({ ...x, program: 'token' }));
  const a2 = t2.value.map(normalizeParsed).map(x => ({ ...x, program: 'token-2022' }));

  const all = a1.concat(a2);
  const tokens = includeZero ? all : all.filter(x => BigInt(x.amount) > 0n);

  console.log(JSON.stringify({
    ok:true,
    owner: owner.toBase58(),
    rpcUrl,
    counts: { token: a1.length, 'token-2022': a2.length },
    tokens,
  }, null, 2));
}

main().catch(e=>{ console.error(String(e?.message||e)); process.exit(1); });
