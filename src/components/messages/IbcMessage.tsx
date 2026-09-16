import { ArrowRight, Users } from "lucide-react"
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

export function IbcTransferMessage({ metadata, events, getDenomDisplay }: MessageRendererProps) {
	const transferAmountStr = getEventAttribute(events || [], "transfer", "amount")
	const transferAmounts = transferAmountStr ? parseMultiDenomAmount(transferAmountStr) : []
	const displayAmounts = transferAmounts.length > 0
		? transferAmounts
		: (metadata.token ? [metadata.token] : normalizeAmounts(metadata.amount))

	return (
		<div className={css({ display: "flex", flexDir: "column", gap: "2" })}>
			<MessageHeader icon={ArrowRight} label="IBC Transfer" color="cyan.600" />
			{metadata.sender && <DetailRow label="Sender" value={metadata.sender} copyable icon={Users} />}
			<div className={css({ display: "flex", justifyContent: "center" })}>
				<ArrowRight className={css({ h: "4", w: "4", color: "fg.muted" })} />
			</div>
			{metadata.receiver && <DetailRow label="Receiver" value={metadata.receiver} copyable icon={Users} />}
			{metadata.sourceChannel && (
				<DetailRow label="Channel" value={`${metadata.sourcePort}/${metadata.sourceChannel}`} />
			)}
			<AmountBox label="Amount" amounts={displayAmounts} getDenomDisplay={getDenomDisplay} color="cyan.600" />
		</div>
	)
}
