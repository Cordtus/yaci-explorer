import { type ChainFeatures } from '@/types/config/chains'

export interface ChainInfo {
  chainId: string
  chainName: string
  baseDenom: string
  displayDenom: string
  decimals: number
  features: ChainFeatures
}
