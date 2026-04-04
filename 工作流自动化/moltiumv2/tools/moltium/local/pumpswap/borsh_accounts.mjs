import { PublicKey } from '@solana/web3.js';
import { struct, u8, u64, array, publicKey } from '@coral-xyz/borsh';

// Anchor accounts start with 8-byte discriminator. We skip it.

export function parseGlobalConfig(buffer) {
  const disc = Buffer.from(buffer).subarray(0, 8);
  const layout = struct([
    publicKey('admin'),
    u64('lpFeeBasisPoints'),
    u64('protocolFeeBasisPoints'),
    u8('disableFlags'),
    array(publicKey(), 8, 'protocolFeeRecipients'),
  ]);
  const v = layout.decode(Buffer.from(buffer).subarray(8));
  return {
    discriminator: disc.toString('hex'),
    admin: v.admin,
    lpFeeBasisPoints: BigInt(v.lpFeeBasisPoints),
    protocolFeeBasisPoints: BigInt(v.protocolFeeBasisPoints),
    disableFlags: v.disableFlags,
    protocolFeeRecipients: v.protocolFeeRecipients,
  };
}

export function parsePoolStateV1(buffer) {
  // Observed 301-byte pool state where baseMint offset=43.
  const buf = Buffer.from(buffer);
  const disc = buf.subarray(0, 8);
  const poolBump = buf.readUInt8(8);
  const index = buf.readUInt16LE(9);
  const creator = new PublicKey(buf.subarray(11, 43));
  const baseMint = new PublicKey(buf.subarray(43, 75));
  const quoteMint = new PublicKey(buf.subarray(75, 107));
  const poolBaseTokenAccount = new PublicKey(buf.subarray(139, 171));
  const poolQuoteTokenAccount = new PublicKey(buf.subarray(171, 203));
  return {
    discriminator: disc.toString('hex'),
    poolBump,
    index,
    creator,
    baseMint,
    quoteMint,
    poolBaseTokenAccount,
    poolQuoteTokenAccount,
  };
}

export function selectProtocolFeeRecipient(globalConfig, poolIndex) {
  const nonZero = globalConfig.protocolFeeRecipients
    .map((p) => p.toBase58())
    .filter((x) => x !== '11111111111111111111111111111111');
  if (!nonZero.length) throw new Error('No protocolFeeRecipients in global config');
  const idx = Number(BigInt(poolIndex) % BigInt(nonZero.length));
  return nonZero[idx];
}
