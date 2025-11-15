/**
 * Chain-specific configuration and feature detection
 * Add your chain here to enable chain-specific features and optimizations
 */

export interface ChainFeatures {
  /** Chain has EVM module (MsgEthereumTx support) */
  evm: boolean
  /** Chain has IBC support */
  ibc: boolean
  /** Chain has CosmWasm support */
  wasm: boolean
  /** Chain has custom modules */
  customModules?: string[]
}

export interface ChainConfig {
  /** Human-readable chain name */
  name: string
  /** Chain features */
  features: ChainFeatures
  /** Native base denomination (e.g., 'umfx', 'ujuno') */
  nativeDenom: string
  /** Display symbol (e.g., 'MFX', 'JUNO') */
  nativeSymbol: string
  /** Number of decimal places */
  decimals: number
  /** Optional: RPC endpoint for additional queries */
  rpcEndpoint?: string
  /** Optional: REST API endpoint */
  restEndpoint?: string
  /** Optional: Block explorer URL pattern */
  explorerUrl?: string
}

/**
 * Known chain configurations
 * Chain ID as key
 */
export const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  'manifest-1': {
    name: 'Manifest Network',
    features: {
      evm: true,
      ibc: true,
      wasm: false,
    },
    nativeDenom: 'umfx',
    nativeSymbol: 'MFX',
    decimals: 6,
    rpcEndpoint: 'https://rpc.manifest.nodestake.top',
    restEndpoint: 'https://api.manifest.nodestake.top',
  },
  'juno-1': {
    name: 'Juno Network',
    features: {
      evm: false,
      ibc: true,
      wasm: true,
    },
    nativeDenom: 'ujuno',
    nativeSymbol: 'JUNO',
    decimals: 6,
    rpcEndpoint: 'https://rpc.juno.strange.love',
    restEndpoint: 'https://api.juno.strange.love',
  },
  'osmosis-1': {
    name: 'Osmosis',
    features: {
      evm: false,
      ibc: true,
      wasm: true,
      customModules: ['poolmanager', 'gamm', 'concentrated-liquidity'],
    },
    nativeDenom: 'uosmo',
    nativeSymbol: 'OSMO',
    decimals: 6,
    rpcEndpoint: 'https://rpc.osmosis.zone',
    restEndpoint: 'https://lcd.osmosis.zone',
  },
  'cosmoshub-4': {
    name: 'Cosmos Hub',
    features: {
      evm: false,
      ibc: true,
      wasm: false,
    },
    nativeDenom: 'uatom',
    nativeSymbol: 'ATOM',
    decimals: 6,
    rpcEndpoint: 'https://rpc.cosmos.network',
    restEndpoint: 'https://api.cosmos.network',
  },
  'stargaze-1': {
    name: 'Stargaze',
    features: {
      evm: false,
      ibc: true,
      wasm: true,
      customModules: ['nft'],
    },
    nativeDenom: 'ustars',
    nativeSymbol: 'STARS',
    decimals: 6,
    rpcEndpoint: 'https://rpc.stargaze-apis.com',
    restEndpoint: 'https://rest.stargaze-apis.com',
  },
  'evmos_9001-2': {
    name: 'Evmos',
    features: {
      evm: true,
      ibc: true,
      wasm: false,
      customModules: ['erc20', 'claims'],
    },
    nativeDenom: 'aevmos',
    nativeSymbol: 'EVMOS',
    decimals: 18,
    rpcEndpoint: 'https://evmos-rpc.polkachu.com',
    restEndpoint: 'https://evmos-api.polkachu.com',
  },
  'neutron-1': {
    name: 'Neutron',
    features: {
      evm: false,
      ibc: true,
      wasm: true,
      customModules: ['interchainqueries', 'interchaintxs'],
    },
    nativeDenom: 'untrn',
    nativeSymbol: 'NTRN',
    decimals: 6,
    rpcEndpoint: 'https://rpc.neutron.strange.love',
    restEndpoint: 'https://api.neutron.strange.love',
  },
<<<<<<< Updated upstream
=======
  'republic_9001-1': {
    name: 'Republic Devnet',
    features: {
      evm: true,
      ibc: true,
      wasm: false,
    },
    nativeDenom: 'atest',
    nativeSymbol: 'TEST',
    decimals: 18,
  },
>>>>>>> Stashed changes
}

/**
 * Get chain configuration by chain ID
 * Returns default config if chain ID not found
 */
export function getChainConfig(chainId: string): ChainConfig {
  const config = CHAIN_CONFIGS[chainId]
  if (config) {
    return config
  }

  // Return default config for unknown chains
  console.warn(`Chain ID ${chainId} not found in CHAIN_CONFIGS, using defaults`)
  return {
    name: `Chain ${chainId}`,
    features: {
      evm: false,
      ibc: true,
      wasm: false,
    },
    nativeDenom: 'unknown',
    nativeSymbol: 'UNKNOWN',
    decimals: 6,
  }
}

/**
 * Check if chain has specific feature
 */
export function hasChainFeature(
  chainId: string,
  feature: keyof ChainFeatures
): boolean {
  const config = getChainConfig(chainId)
  return config.features[feature] || false
}

/**
 * Get all configured chain IDs
 */
export function getAllChainIds(): string[] {
  return Object.keys(CHAIN_CONFIGS)
}

/**
 * Detect if message type is chain-specific
 */
export function isChainSpecificMessage(messageType: string): {
  isCustom: boolean
  moduleName?: string
  chainRecommendation?: string
} {
  // EVM messages
  if (messageType.includes('MsgEthereumTx') || messageType.includes('evm')) {
    return {
      isCustom: true,
      moduleName: 'evm',
      chainRecommendation: 'This message type requires EVM module support',
    }
  }

  // CosmWasm messages
  if (messageType.includes('cosmwasm') || messageType.includes('wasm')) {
    return {
      isCustom: true,
      moduleName: 'wasm',
      chainRecommendation: 'This message type requires CosmWasm support',
    }
  }

  // Osmosis-specific
  if (messageType.includes('osmosis')) {
    return {
      isCustom: true,
      moduleName: 'osmosis-custom',
      chainRecommendation: 'Osmosis-specific module',
    }
  }

  // Standard Cosmos SDK message
  return { isCustom: false }
}
