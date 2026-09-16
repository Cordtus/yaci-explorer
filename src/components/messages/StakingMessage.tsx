import { ArrowRight, Lock, Users } from "lucide-react"
import { css } from "@/styled-system/css"
import {
	type MessageRendererProps,
	AmountBox,
	DetailRow,
	MessageHeader,
	normalizeAmounts,
} from "./shared"

export function DelegateMessage({ metadata, getDenomDisplay }: MessageRendererProps) {
	const amount = normalizeAmounts(metadata.amount)
	return (
		<div className={css({ display: "flex", flexDir: "column", gap: "2" })}>
			<MessageHeader icon={Lock} label="Delegate Tokens" color="green.600" />
			{metadata.delegatorAddress && <DetailRow label="Delegator" value={metadata.delegatorAddress} copyable icon={Users} />}
			<div className={css({ display: "flex", justifyContent: "center" })}>
				<ArrowRight className={css({ h: "4", w: "4", color: "fg.muted" })} />
			</div>
			{metadata.validatorAddress && <DetailRow label="Validator" value={metadata.validatorAddress} copyable />}
			<AmountBox label="Staked Amount" amounts={amount} getDenomDisplay={getDenomDisplay} color="green.600" />
		</div>
	)
}

export function UndelegateMessage({ metadata, getDenomDisplay }: MessageRendererProps) {
	const amount = normalizeAmounts(metadata.amount)
	return (
		<div className={css({ display: "flex", flexDir: "column", gap: "2" })}>
			<MessageHeader icon={Lock} label="Undelegate Tokens" color="orange.600" />
			{metadata.delegatorAddress && <DetailRow label="Delegator" value={metadata.delegatorAddress} copyable icon={Users} />}
			{metadata.validatorAddress && <DetailRow label="Validator" value={metadata.validatorAddress} copyable />}
			<AmountBox label="Unstaked Amount" amounts={amount} getDenomDisplay={getDenomDisplay} color="orange.600" />
		</div>
	)
}

export function RedelegateMessage({ metadata, getDenomDisplay }: MessageRendererProps) {
	const amount = normalizeAmounts(metadata.amount)
	return (
		<div className={css({ display: "flex", flexDir: "column", gap: "2" })}>
			<MessageHeader icon={Lock} label="Redelegate Tokens" color="blue.600" />
			{metadata.delegatorAddress && <DetailRow label="Delegator" value={metadata.delegatorAddress} copyable icon={Users} />}
			{metadata.validatorSrcAddress && <DetailRow label="From Validator" value={metadata.validatorSrcAddress} copyable />}
			<div className={css({ display: "flex", justifyContent: "center" })}>
				<ArrowRight className={css({ h: "4", w: "4", color: "fg.muted" })} />
			</div>
			{metadata.validatorDstAddress && <DetailRow label="To Validator" value={metadata.validatorDstAddress} copyable />}
			<AmountBox label="Redelegated Amount" amounts={amount} getDenomDisplay={getDenomDisplay} color="blue.600" />
		</div>
	)
}
