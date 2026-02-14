import { Code, Users } from "lucide-react"
import { css } from "@/styled-system/css"
import {
	type MessageRendererProps,
	AmountBox,
	DetailRow,
	MessageHeader,
	getEventAttribute,
	parseMultiDenomAmount,
} from "./shared"

export function ExecuteContractMessage({ metadata, events, getDenomDisplay }: MessageRendererProps) {
	let decodedMsg = null
	if (metadata.msg) {
		try {
			decodedMsg = JSON.parse(atob(metadata.msg))
		} catch { /* ignore decode errors */ }
	}

	const transferAmountStr = getEventAttribute(events || [], "transfer", "amount")
	const transferAmounts = transferAmountStr ? parseMultiDenomAmount(transferAmountStr) : []
	const wasmEvents = events?.filter((e) => e.event_type === "wasm") || []

	return (
		<div className={css({ display: "flex", flexDir: "column", gap: "2" })}>
			<MessageHeader icon={Code} label="Execute Smart Contract" color="teal.600" />
			{metadata.contract && <DetailRow label="Contract" value={metadata.contract} copyable />}
			{metadata.sender && <DetailRow label="Sender" value={metadata.sender} copyable icon={Users} />}
			<AmountBox label="Funds Sent" amounts={transferAmounts} getDenomDisplay={getDenomDisplay} color="teal.600" />
			{decodedMsg && (
				<div className={css({ p: "3", rounded: "lg", bg: "bg.muted" })}>
					<label className={css({ fontSize: "xs", fontWeight: "medium", color: "fg.muted", textTransform: "uppercase", letterSpacing: "wider", display: "block", mb: "2" })}>
						Contract Message
					</label>
					<pre className={css({ fontSize: "xs", fontFamily: "mono", overflow: "auto", maxH: "32", mt: "1" })}>
						{JSON.stringify(decodedMsg, null, 2)}
					</pre>
				</div>
			)}
			{wasmEvents.length > 0 && (
				<div className={css({ p: "3", rounded: "lg", bg: "bg.muted" })}>
					<label className={css({ fontSize: "xs", fontWeight: "medium", color: "fg.muted", textTransform: "uppercase", letterSpacing: "wider", display: "block", mb: "2" })}>
						Contract Events
					</label>
					{wasmEvents.map((event, idx) => (
						<div key={idx} className={css({ fontSize: "xs", fontFamily: "mono", mb: "2" })}>
							{event.attributes.map((attr, attrIdx) => (
								<div key={attrIdx} className={css({ display: "flex", gap: "2" })}>
									<span className={css({ color: "fg.muted" })}>{attr.key}:</span>
									<span>{attr.value}</span>
								</div>
							))}
						</div>
					))}
				</div>
			)}
		</div>
	)
}
