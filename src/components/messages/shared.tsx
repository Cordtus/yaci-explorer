import { Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatNumber } from "@/lib/utils"
import { css } from "@/styled-system/css"

export type CoinAmount = { denom: string; amount: string }

export interface MessageMetadata {
	amount?: CoinAmount | CoinAmount[]
	toAddress?: string
	fromAddress?: string
	delegatorAddress?: string
	validatorAddress?: string
	validatorSrcAddress?: string
	validatorDstAddress?: string
	withdrawAddress?: string
	proposalId?: string
	voter?: string
	option?: string
	token?: { denom: string; amount: string }
	receiver?: string
	sender?: string
	sourceChannel?: string
	sourcePort?: string
	destinationChannel?: string
	destinationPort?: string
	contract?: string
	msg?: string
	grantee?: string
	granter?: string
	msgs?: Array<any>
}

export interface MessageEvent {
	event_type: string
	attributes: Array<{ key: string; value: string }>
}

export interface MessageRendererProps {
	metadata: MessageMetadata
	events?: MessageEvent[]
	getDenomDisplay: (d: string) => string
}

export function formatDenom(amount: string, denom: string, getDenomDisplay: (d: string) => string): string {
	const num = parseInt(amount)
	if (isNaN(num)) return `${amount} ${denom}`

	if (denom.startsWith("u") || denom.startsWith("ibc/")) {
		const formatted = (num / 1_000_000).toFixed(6).replace(/\.?0+$/, "")
		return `${formatted} ${getDenomDisplay(denom)}`
	}
	if (denom.startsWith("a")) {
		const formatted = (num / 1e18).toFixed(6).replace(/\.?0+$/, "")
		return `${formatted} ${getDenomDisplay(denom)}`
	}

	return `${formatNumber(num)} ${getDenomDisplay(denom)}`
}

export function parseMultiDenomAmount(amountStr: string): CoinAmount[] {
	if (!amountStr) return []
	const amounts: CoinAmount[] = []
	for (const part of amountStr.split(",")) {
		const match = part.trim().match(/^(\d+)(.+)$/)
		if (match) amounts.push({ amount: match[1], denom: match[2] })
	}
	return amounts
}

export function normalizeAmounts(amount?: CoinAmount | CoinAmount[]): CoinAmount[] {
	if (!amount) return []
	return Array.isArray(amount) ? amount : [amount]
}

export function getEventAttribute(events: MessageEvent[], eventType: string, key: string): string | null {
	const event = events?.find((e) => e.event_type === eventType)
	if (!event) return null
	return event.attributes.find((a) => a.key === key)?.value || null
}

export function DetailRow({ label, value, copyable, icon: Icon }: {
	label: string
	value: string
	copyable?: boolean
	icon?: React.ComponentType<{ className?: string }>
}) {
	return (
		<div className={rowStyle}>
			<div className={css({ display: "flex", alignItems: "center", gap: "2", minW: "0" })}>
				{Icon && <Icon className={css({ h: "4", w: "4", color: "fg.muted", flexShrink: "0" })} />}
				<div className={css({ minW: "0" })}>
					<label className={labelStyle}>{label}</label>
					<p className={css({ fontSize: "sm", fontFamily: "mono", wordBreak: "break-all", mt: "1" })}>{value}</p>
				</div>
			</div>
			{copyable && (
				<Button
					variant="ghost"
					size="icon"
					className={css({ h: "6", w: "6", flexShrink: "0" })}
					onClick={() => navigator.clipboard.writeText(value)}
				>
					<Copy className={css({ h: "3", w: "3" })} />
				</Button>
			)}
		</div>
	)
}

export function AmountBox({ label, amounts, getDenomDisplay, color = "accent.default" }: {
	label: string
	amounts: CoinAmount[]
	getDenomDisplay: (d: string) => string
	color?: string
}) {
	if (amounts.length === 0) return null
	return (
		<div className={css({ p: "3", rounded: "lg", bg: "bg.muted", borderWidth: "1px", borderColor: "border.default" })}>
			<label className={css({ fontSize: "xs", fontWeight: "medium", textTransform: "uppercase", letterSpacing: "wider", display: "block", mb: "2", color: "fg.muted" })}>
				{label}
			</label>
			{amounts.map((amt, idx) => (
				<div key={idx} className={css({ fontSize: "lg", fontWeight: "bold", color })}>
					{formatDenom(amt.amount, amt.denom, getDenomDisplay)}
				</div>
			))}
		</div>
	)
}

export function MessageHeader({ icon: Icon, label, color = "fg.default" }: {
	icon: React.ComponentType<{ className?: string }>
	label: string
	color?: string
}) {
	return (
		<div className={css({ display: "flex", alignItems: "center", gap: "2", mb: "3" })}>
			<Icon className={css({ h: "4", w: "4", color })} />
			<span className={css({ fontSize: "sm", fontWeight: "semibold", color })}>{label}</span>
		</div>
	)
}

export const rowStyle = css({
	display: "flex",
	alignItems: "start",
	justifyContent: "space-between",
	gap: "4",
	p: "3",
	bg: "bg.muted",
	rounded: "lg",
})

const labelStyle = css({
	fontSize: "xs",
	fontWeight: "medium",
	color: "fg.muted",
	textTransform: "uppercase",
	letterSpacing: "wider",
	display: "block",
})
