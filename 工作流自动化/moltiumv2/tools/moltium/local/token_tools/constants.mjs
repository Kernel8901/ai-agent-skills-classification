import { PublicKey } from '@solana/web3.js';

export const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
export const TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';

export const METAPLEX_METADATA_PROGRAM = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';

export const WSOL_MINT = 'So11111111111111111111111111111111111111112';

export function pk(s){ return new PublicKey(String(s)); }
