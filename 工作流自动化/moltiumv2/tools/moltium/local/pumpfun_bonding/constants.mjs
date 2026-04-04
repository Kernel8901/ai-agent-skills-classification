// pump.fun bonding curve (Anchor) constants

export const PROGRAM_PUMPFUN = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';

// PDAs (seeds)
export const SEED_GLOBAL = Buffer.from('global', 'utf8');
export const SEED_BONDING_CURVE = Buffer.from('bonding-curve', 'utf8');
export const SEED_CREATOR_VAULT = Buffer.from('creator-vault', 'utf8');
export const SEED_EVENT_AUTHORITY = Buffer.from('__event_authority', 'utf8');

// Instruction discriminators from IDL
export const DISC_BUY  = Buffer.from([102, 6, 61, 18, 1, 218, 235, 234]);
export const DISC_SELL = Buffer.from([51, 230, 133, 164, 1, 127, 131, 173]);

// Common program IDs
export const SYSTEM_PROGRAM = '11111111111111111111111111111111';
// Legacy SPL Token program (Tokenkeg...). Some pump.fun tokens are Token-2022.
export const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
export const TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
export const ASSOC_TOKEN_PROGRAM = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';

export const WSOL_MINT = 'So11111111111111111111111111111111111111112';
