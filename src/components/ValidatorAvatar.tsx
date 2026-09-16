import { useState } from "react"
import { css } from "@/styled-system/css"
import { useKeybaseAvatar } from "@/hooks/useKeybaseAvatar"

interface ValidatorAvatarProps {
	/** 16-char hex Keybase identity from validator description */
	identity: string | null | undefined
	/** Validator moniker for fallback initial */
	moniker: string | null | undefined
	/** Avatar diameter in pixels (default 28) */
	size?: number
}

/**
 * Displays a validator's Keybase profile picture as a circular avatar.
 * Falls back to a circle with the first letter of their moniker.
 */
export function ValidatorAvatar({ identity, moniker, size = 28 }: ValidatorAvatarProps) {
	const { data: avatarUrl } = useKeybaseAvatar(identity)
	const [imgError, setImgError] = useState(false)

	const initial = (moniker ?? "?")[0]?.toUpperCase() ?? "?"

	if (avatarUrl && !imgError) {
		return (
			<img
				src={avatarUrl}
				alt={moniker ?? "Validator"}
				loading="lazy"
				onError={() => setImgError(true)}
				className={css({
					width: `${size}px`,
					height: `${size}px`,
					borderRadius: "full",
					objectFit: "cover",
					flexShrink: 0,
				})}
			/>
		)
	}

	return (
		<div
			className={css({
				width: `${size}px`,
				height: `${size}px`,
				borderRadius: "full",
				bg: "bg.emphasized",
				color: "fg.muted",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				fontSize: `${Math.round(size * 0.45)}px`,
				fontWeight: "semibold",
				flexShrink: 0,
				lineHeight: 1,
			})}
		>
			{initial}
		</div>
	)
}
