import { useQuery } from "@tanstack/react-query"

const KEYBASE_IDENTITY_RE = /^[a-fA-F0-9]{16}$/

interface KeybaseLookupResponse {
	them?: Array<{
		pictures?: {
			primary?: {
				url?: string
			}
		}
	}>
}

/**
 * Fetches a validator's Keybase profile picture URL by their 16-char hex identity.
 * @param identity - 16-character hex Keybase identity from validator description
 * @returns The avatar URL string, null if unavailable, or undefined while loading
 */
export function useKeybaseAvatar(identity: string | null | undefined) {
	return useQuery<string | null>({
		queryKey: ["keybase-avatar", identity],
		queryFn: async () => {
			if (!identity) return null
			const res = await fetch(
				`https://keybase.io/_/api/1.0/user/lookup.json?key_suffix=${identity}&fields=pictures`,
			)
			if (!res.ok) return null
			const data: KeybaseLookupResponse = await res.json()
			return data.them?.[0]?.pictures?.primary?.url ?? null
		},
		enabled: !!identity && KEYBASE_IDENTITY_RE.test(identity),
		staleTime: 86_400_000,
		gcTime: 3_600_000,
		retry: 1,
	})
}
