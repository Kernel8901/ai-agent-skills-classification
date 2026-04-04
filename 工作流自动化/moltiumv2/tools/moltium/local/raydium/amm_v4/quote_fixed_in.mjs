import { PublicKey } from '@solana/web3.js';
import {
  Liquidity,
  Percent,
  Token,
  TokenAmount,
  TOKEN_PROGRAM_ID,
} from '@raydium-io/raydium-sdk';

function pk(x) { return new PublicKey(String(x)); }

export async function quoteSwapFixedIn({
  conn,
  poolKeys,
  inMint,
  inDecimals,
  outMint,
  outDecimals,
  amountInUi,
  slippageBps,
} = {}) {
  const tokenIn = new Token(TOKEN_PROGRAM_ID, pk(inMint), Number(inDecimals));
  const tokenOut = new Token(TOKEN_PROGRAM_ID, pk(outMint), Number(outDecimals));
  const amountIn = new TokenAmount(tokenIn, String(amountInUi), false);
  const slippage = new Percent(Number(slippageBps), 10_000);

  const poolInfo = await Liquidity.fetchInfo({ connection: conn, poolKeys });
  const { amountOut, minAmountOut, currentPrice, executionPrice, priceImpact, fee } = Liquidity.computeAmountOut({
    poolKeys,
    poolInfo,
    amountIn,
    currencyOut: tokenOut,
    slippage,
  });

  return {
    amountOut,
    minAmountOut,
    currentPrice,
    executionPrice,
    priceImpact,
    fee,
  };
}
