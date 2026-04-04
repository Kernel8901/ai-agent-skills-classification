// Read Metaplex token metadata account (on-chain only; does NOT fetch URI)
// Usage: node tools/moltium/local/token_tools/metadata_read.mjs <mint>

import { getConnection } from '../rpc/connection.mjs';
import { pk, METAPLEX_METADATA_PROGRAM } from './constants.mjs';
import { PublicKey } from '@solana/web3.js';

function findMetadataPda(mint) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), pk(METAPLEX_METADATA_PROGRAM).toBuffer(), pk(mint).toBuffer()],
    pk(METAPLEX_METADATA_PROGRAM)
  );
}

function readU32LE(buf, o){ return buf.readUInt32LE(o); }
function readU16LE(buf, o){ return buf.readUInt16LE(o); }

function readBorshString(buf, offset) {
  const len = readU32LE(buf, offset);
  const start = offset + 4;
  const end = start + len;
  const raw = buf.subarray(start, end);
  return { value: raw.toString('utf8'), next: end };
}

function readPubkey(buf, offset) {
  return { value: new PublicKey(buf.subarray(offset, offset + 32)).toBase58(), next: offset + 32 };
}

function readOptionPubkey(buf, offset) {
  const tag = buf.readUInt8(offset);
  if (tag === 0) return { value: null, next: offset + 1 };
  const { value, next } = readPubkey(buf, offset + 1);
  return { value, next };
}

// Minimal parser for Metaplex Metadata account (DataV2-ish, enough for name/symbol/uri + authorities)
// This is not a full implementation; it focuses on the most useful fields.
function parseMetadata(buf) {
  let o = 0;
  // key (u8)
  const key = buf.readUInt8(o); o += 1;
  const updateAuthority = readPubkey(buf, o); o = updateAuthority.next;
  const mint = readPubkey(buf, o); o = mint.next;

  // data: name, symbol, uri, sellerFeeBasisPoints
  const name = readBorshString(buf, o); o = name.next;
  const symbol = readBorshString(buf, o); o = symbol.next;
  const uri = readBorshString(buf, o); o = uri.next;
  const sellerFeeBasisPoints = readU16LE(buf, o); o += 2;

  // creators (Option<Vec<Creator>>) - skip parse in detail, but detect present
  const hasCreators = buf.readUInt8(o); o += 1;
  let creators = null;
  if (hasCreators === 1) {
    const n = readU32LE(buf, o); o += 4;
    creators = [];
    for (let i = 0; i < n; i++) {
      const addr = readPubkey(buf, o); o = addr.next;
      const verified = buf.readUInt8(o) === 1; o += 1;
      const share = buf.readUInt8(o); o += 1;
      creators.push({ address: addr.value, verified, share });
    }
  }

  const primarySaleHappened = buf.readUInt8(o) === 1; o += 1;
  const isMutable = buf.readUInt8(o) === 1; o += 1;

  const editionNonce = buf.readUInt8(o); o += 1; // actually option<u8> in some versions; ok as best-effort

  return {
    key,
    updateAuthority: updateAuthority.value,
    mint: mint.value,
    data: {
      name: name.value.replace(/\0+$/g, ''),
      symbol: symbol.value.replace(/\0+$/g, ''),
      uri: uri.value.replace(/\0+$/g, ''),
      sellerFeeBasisPoints,
      creators,
    },
    primarySaleHappened,
    isMutable,
    editionNonce,
  };
}

async function main(){
  const [mint] = process.argv.slice(2);
  if(!mint){
    console.error('usage: metadata_read.mjs <mint>');
    process.exit(2);
  }

  const { conn, rpcUrl } = getConnection('confirmed');
  const [pda] = findMetadataPda(mint);
  const info = await conn.getAccountInfo(pda, 'confirmed');
  if(!info?.data) {
    console.log(JSON.stringify({ ok:false, mint, metadataPda: pda.toBase58(), rpcUrl, error: 'metadata not found' }, null, 2));
    return;
  }

  const buf = Buffer.from(info.data);
  const parsed = parseMetadata(buf);

  console.log(JSON.stringify({ ok:true, mint, metadataPda: pda.toBase58(), rpcUrl, ownerProgram: info.owner.toBase58(), lamports: info.lamports, dataLen: buf.length, parsed }, null, 2));
}

main().catch(e=>{ console.error(String(e?.message||e)); process.exit(1); });
