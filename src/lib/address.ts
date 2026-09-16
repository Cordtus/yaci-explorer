import { bech32 } from 'bech32'

/**
 * Convert a validator operator address to its Cosmos wallet address.
 * Both share the same underlying bytes, only the bech32 prefix differs.
 */
export function validatorToCosmosAddress(valoperAddress: string): string {
	const decoded = bech32.decode(valoperAddress)
	const walletPrefix = decoded.prefix.replace('valoper', '')
	return bech32.encode(walletPrefix, decoded.words)
}

/**
 * Truncate an address for display (works with both EVM and Cosmos formats)
 */
export function truncateAddress(address: string, startChars = 6, endChars = 4): string {
	if (!address) return ''
	if (address.length <= startChars + endChars + 3) return address
	return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
}
