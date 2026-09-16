/**
 * 4byte.directory signature lookup utility
 * https://www.4byte.directory/
 */

const FOURBYTE_API = 'https://www.4byte.directory/api/v1/signatures'

const signatureCache = new Map<string, string | null>()

/**
 * Lookup a function signature from 4byte.directory
 * @param selector - The 4-byte function selector (e.g., "0xa9059cbb")
 * @returns The function signature (e.g., "transfer(address,uint256)") or null
 */
export async function lookupFunctionSignature(selector: string): Promise<string | null> {
	const normalizedSelector = selector.toLowerCase().startsWith('0x')
		? selector.toLowerCase()
		: `0x${selector.toLowerCase()}`

	if (signatureCache.has(normalizedSelector)) {
		return signatureCache.get(normalizedSelector) || null
	}

	try {
		const response = await fetch(`${FOURBYTE_API}/?hex_signature=${normalizedSelector}`)
		if (!response.ok) {
			signatureCache.set(normalizedSelector, null)
			return null
		}

		const data = await response.json()
		if (!data.results || data.results.length === 0) {
			signatureCache.set(normalizedSelector, null)
			return null
		}

		const signature = data.results[0].text_signature
		signatureCache.set(normalizedSelector, signature)
		return signature
	} catch {
		signatureCache.set(normalizedSelector, null)
		return null
	}
}

/**
 * Extract function selector from calldata
 * @param data - The transaction input data (hex string)
 * @returns The 4-byte selector or null if data is too short
 */
export function extractSelector(data: string | null | undefined): string | null {
	if (!data || data.length < 10) return null
	return data.slice(0, 10).toLowerCase()
}

/**
 * Extract function name from signature
 * @param signature - Full signature like "transfer(address,uint256)"
 * @returns Just the function name like "transfer"
 */
export function extractFunctionName(signature: string): string {
	const parenIndex = signature.indexOf('(')
	return parenIndex > 0 ? signature.slice(0, parenIndex) : signature
}

/**
 * Decode function parameters from signature and data (basic types only).
 * For full decoding use ethers.js or viem.
 */
export function decodeBasicParams(
	signature: string,
	data: string,
): Array<{ name: string; type: string; value: string }> {
	const params: Array<{ name: string; type: string; value: string }> = []

	const match = signature.match(/\(([^)]*)\)/)
	if (!match) return params

	const types = match[1].split(',').map(t => t.trim()).filter(Boolean)
	const calldata = data.slice(10)

	let offset = 0
	for (let i = 0; i < types.length; i++) {
		const type = types[i]
		const chunk = calldata.slice(offset, offset + 64)

		if (type === 'address') {
			params.push({ name: `param${i}`, type, value: `0x${chunk.slice(24)}` })
		} else if (type.startsWith('uint') || type.startsWith('int')) {
			const value = BigInt(`0x${chunk}`)
			params.push({ name: `param${i}`, type, value: value.toString() })
		} else if (type === 'bool') {
			params.push({ name: `param${i}`, type, value: chunk.endsWith('1') ? 'true' : 'false' })
		} else {
			params.push({ name: `param${i}`, type, value: `0x${chunk}` })
		}

		offset += 64
	}

	return params
}

/** Common function signatures to avoid network calls */
export const COMMON_SIGNATURES: Record<string, string> = {
	'0xa9059cbb': 'transfer(address,uint256)',
	'0x23b872dd': 'transferFrom(address,address,uint256)',
	'0x095ea7b3': 'approve(address,uint256)',
	'0x70a08231': 'balanceOf(address)',
	'0x18160ddd': 'totalSupply()',
	'0x313ce567': 'decimals()',
	'0x06fdde03': 'name()',
	'0x95d89b41': 'symbol()',
	'0xdd62ed3e': 'allowance(address,address)',
	'0x40c10f19': 'mint(address,uint256)',
	'0x42966c68': 'burn(uint256)',
	'0x79cc6790': 'burnFrom(address,uint256)',
	'0xa22cb465': 'setApprovalForAll(address,bool)',
	'0xe985e9c5': 'isApprovedForAll(address,address)',
	'0x6352211e': 'ownerOf(uint256)',
	'0xb88d4fde': 'safeTransferFrom(address,address,uint256,bytes)',
	'0x42842e0e': 'safeTransferFrom(address,address,uint256)',
}

/**
 * Get function signature: checks common signatures first, then falls back to 4byte lookup
 * @param selector - The 4-byte selector (with or without 0x prefix)
 */
export async function getFunctionSignature(selector: string): Promise<string | null> {
	const normalized = selector.toLowerCase()

	if (COMMON_SIGNATURES[normalized]) {
		return COMMON_SIGNATURES[normalized]
	}

	return lookupFunctionSignature(normalized)
}
