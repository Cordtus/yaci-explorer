import { ArrowRight, Coins, Users } from "lucide-react"
import { css } from "@/styled-system/css"
import {
	type MessageRendererProps,
	AmountBox,
	DetailRow,
	MessageHeader,
	getEventAttribute,
	normalizeAmounts,
	parseMultiDenomAmount,
} from "./shared"

export function BankSendMessage({ metadata, events, getDenomDisplay }: MessageRendererProps) {
	const transferAmountStr = getEventAttribute(events || [], "transfer", "amount")
	const transferAmounts = transferAmountStr ? parseMultiDenomAmount(transferAmountStr) : []
	const displayAmounts = transferAmounts.length > 0 ? transferAmounts : normalizeAmounts(metadata.amount)

	return (
		<div className={css({ display: "flex", flexDir: "column", gap: "2" })}>
			<MessageHeader icon={Coins} label="Token Transfer" color="accent.default" />
			{metadata.fromAddress && <DetailRow label="From" value={metadata.fromAddress} copyable icon={Users} />}
			<div className={css({ display: "flex", justifyContent: "center" })}>
				<ArrowRight className={css({ h: "4", w: "4", color: "fg.muted" })} />
			</div>
			{metadata.toAddress && <DetailRow label="To" value={metadata.toAddress} copyable icon={Users} />}
			<AmountBox label="Amount" amounts={displayAmounts} getDenomDisplay={getDenomDisplay} />
		</div>
	)
}
