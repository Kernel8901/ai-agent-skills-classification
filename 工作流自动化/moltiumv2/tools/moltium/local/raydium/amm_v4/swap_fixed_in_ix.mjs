import pkg from '@raydium-io/raydium-sdk';
const { Liquidity } = pkg;
import BN from 'bn.js';

export function buildRaydiumAmmV4SwapFixedInIx({
  poolKeys,
  owner,
  tokenAccountIn,
  tokenAccountOut,
  amountInRaw,
  minAmountOutRaw,
} = {}) {
  const { innerTransaction } = Liquidity.makeSwapInstruction({
    poolKeys,
    userKeys: { tokenAccountIn, tokenAccountOut, owner },
    amountIn: new BN(amountInRaw.toString()),
    amountOut: new BN(minAmountOutRaw.toString()),
    fixedSide: 'in',
  });

  if (!innerTransaction?.instructions?.length) throw new Error('Raydium swap instruction build failed');
  return innerTransaction.instructions[0];
}
