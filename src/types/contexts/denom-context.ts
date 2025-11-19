export interface DenomContextType {
  getDenomDisplay: (denom: string) => string
  isLoading: boolean
}

export interface DenomMetadataRow {
  denom: string
  symbol: string
  ibc_hash: string | null
}
