/**
 * Address conversion utilities for EVM <-> Cosmos address formats.
 * Both formats derive from the same secp256k1 public key.
 */

import { bech32 } from 'bech32'

const DEFAULT_PREFIX = 'cosmos'

/**
 * Convert an EVM hex address to Cosmos bech32 format
 * @param evmAddress - The hex address (e.g. "0x1234...")
 * @param prefix - The bech32 prefix (e.g. "cosmos", "manifest", "rai")
 * @returns The bech32-encoded address
 */
export function evmToCosmosAddress(evmAddress: string, prefix = DEFAULT_PREFIX): string {
	if (!isEvmAddress(evmAddress)) {
		throw new Error(`Invalid EVM address: ${evmAddress}`)
	}

	const addressBytes = hexToBytes(evmAddress.slice(2))
	const words = bech32.toWords(addressBytes)
	return bech32.encode(prefix, words)
}

/**
 * Convert a Cosmos bech32 address to EVM hex format
 * @param cosmosAddress - The bech32 address
 * @returns The hex address prefixed with 0x
 */
export function cosmosToEvmAddress(cosmosAddress: string): string {
	if (!isCosmosAddress(cosmosAddress)) {
		throw new Error(`Invalid Cosmos address: ${cosmosAddress}`)
	}

	const decoded = bech32.decode(cosmosAddress)
	const addressBytes = bech32.fromWords(decoded.words)
	return `0x${bytesToHex(new Uint8Array(addressBytes))}`
}

/**
 * Check if an address is a valid EVM hex address
 */
export function isEvmAddress(address: string): boolean {
	if (!address) return false
	return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Check if an address is a valid Cosmos bech32 address
 * @param address - The address to check
 * @param expectedPrefix - Optionally require a specific bech32 prefix
 */
export function isCosmosAddress(address: string, expectedPrefix?: string): boolean {
	if (!address) return false
	try {
		const decoded = bech32.decode(address)
		if (expectedPrefix && decoded.prefix !== expectedPrefix) {
			return false
		}
		const bytes = bech32.fromWords(decoded.words)
		return bytes.length === 20
	} catch {
		return false
	}
}

/**
 * Convert a Cosmos wallet address to its validator operator address.
 * Both share the same underlying bytes, only the bech32 prefix differs.
 */
export function cosmosToValidatorAddress(cosmosAddress: string): string {
	const decoded = bech32.decode(cosmosAddress)
	return bech32.encode(`${decoded.prefix}valoper`, decoded.words)
}

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
 * Detect address type and return normalized info
 * @param address - Any address string (EVM hex or Cosmos bech32)
 * @param prefix - Bech32 prefix for EVM->Cosmos conversion
 */
export function parseAddress(address: string, prefix = DEFAULT_PREFIX): {
	type: 'evm' | 'cosmos' | 'unknown'
	evmAddress: string | null
	cosmosAddress: string | null
	isValidator: boolean
} {
	if (isEvmAddress(address)) {
		return {
			type: 'evm',
			evmAddress: address.toLowerCase(),
			cosmosAddress: evmToCosmosAddress(address, prefix),
			isValidator: false,
		}
	}

	if (isCosmosAddress(address)) {
		const decoded = bech32.decode(address)
		const isValidator = decoded.prefix.includes('valoper')

		return {
			type: 'cosmos',
			evmAddress: cosmosToEvmAddress(address),
			cosmosAddress: address,
			isValidator,
		}
	}

	return {
		type: 'unknown',
		evmAddress: null,
		cosmosAddress: null,
		isValidator: false,
	}
}

/**
 * Truncate an address for display (works with both EVM and Cosmos formats)
 */
export function truncateAddress(address: string, startChars = 6, endChars = 4): string {
	if (!address) return ''
	if (address.length <= startChars + endChars + 3) return address
	return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
}

/** Convert a hex string to a Uint8Array */
export function hexToBytes(hex: string): Uint8Array {
	const bytes = new Uint8Array(hex.length / 2)
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16)
	}
	return bytes
}

function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map(b => b.toString(16).padStart(2, '0'))
		.join('')
}
