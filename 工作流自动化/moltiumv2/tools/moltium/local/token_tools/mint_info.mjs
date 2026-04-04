// On-chain mint info (decimals/supply/authorities)
// Usage: node tools/moltium/local/token_tools/mint_info.mjs <mint>

import { getConnection } from '../rpc/connection.mjs';
import { pk, TOKEN_PROGRAM, TOKEN_2022_PROGRAM } from './constants.mjs';

function readU32LE(buf, off){ return buf.readUInt32LE(off); }

async function main(){
  const [mint] = process.argv.slice(2);
  if(!mint){
    console.error('usage: mint_info.mjs <mint>');
    process.exit(2);
  }

  const { conn, rpcUrl } = getConnection('confirmed');
  const info = await conn.getAccountInfo(pk(mint), 'confirmed');
  if(!info?.data) throw new Error('mint not found');

  const owner = info.owner.toBase58();
  const tokenProgram = owner === TOKEN_PROGRAM ? 'token' : (owner === TOKEN_2022_PROGRAM ? 'token-2022' : owner);

  // parse base fields
  const buf = Buffer.from(info.data);
  const mintAuthorityOption = buf.readUInt32LE(0);
  const mintAuthority = mintAuthorityOption ? buf.subarray(4, 36) : null;
  const supply = buf.readBigUInt64LE(36);
  const decimals = buf.readUInt8(44);
  const isInitialized = buf.readUInt8(45) === 1;
  const freezeAuthorityOption = buf.readUInt32LE(46);
  const freezeAuthority = freezeAuthorityOption ? buf.subarray(50, 82) : null;

  const { PublicKey } = await import('@solana/web3.js');

  console.log(JSON.stringify({
    ok: true,
    mint,
    rpcUrl,
    ownerProgram: owner,
    tokenProgram,
    supply: supply.toString(),
    decimals,
    isInitialized,
    mintAuthority: mintAuthority ? new PublicKey(mintAuthority).toBase58() : null,
    freezeAuthority: freezeAuthority ? new PublicKey(freezeAuthority).toBase58() : null,
    dataLen: buf.length,
  }, null, 2));
}

main().catch(e=>{ console.error(String(e?.message||e)); process.exit(1); });
