/**
 * Wallet Providers
 * 
 * Pluggable wallet backend architecture for Amped DeFi plugin.
 * 
 * @example
 * ```typescript
 * import { AmpedWalletProvider } from './wallet/providers';
 * 
 * // Create with local private key (evm-wallet-skill compatible)
 * const provider = await AmpedWalletProvider.fromPrivateKey({
 *   privateKey: '0x...',
 *   chainId: 'lightlink',
 * });
 * 
 * // Or create with Bankr backend
 * const bankrProvider = await AmpedWalletProvider.fromBankr({
 *   bankrApiUrl: 'https://api.bankr.xyz',
 *   bankrApiKey: 'your-api-key',
 *   userAddress: '0x...',
 *   chainId: 'base',
 * });
 * ```
 */

// Main provider
export { AmpedWalletProvider } from './AmpedWalletProvider';

// Backends
export { LocalKeyBackend, createLocalKeyBackend } from './LocalKeyBackend';
export { BankrBackend, createBankrBackend } from './BankrBackend';

// Chain configuration
export {
  CHAIN_IDS,
  SDK_CHAIN_ID_MAP,
  DEFAULT_RPC_URLS,
  hyper,
  resolveChainId,
  getViemChain,
  getDefaultRpcUrl,
  isChainSupported,
  getSupportedChainIds,
  getChainName,
} from './chainConfig';

// Types
export type {
  WalletBackendType,
  WalletBackendBaseConfig,
  LocalKeyBackendConfig,
  BankrBackendConfig,
  PrivyBackendConfig,
  SmartWalletBackendConfig,
  WalletBackendConfig,
  TransactionRequest,
  TransactionReceipt,
  IWalletBackend,
  WalletBackendFactory,
  AmpedWalletProviderConfig,
  IAmpedWalletProvider,
} from './types';
