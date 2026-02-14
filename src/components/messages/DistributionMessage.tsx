import { Coins, Users } from "lucide-react"
import { css } from "@/styled-system/css"
import {
	type MessageRendererProps,
	AmountBox,
	DetailRow,
	MessageHeader,
	getEventAttribute,
	parseMultiDenomAmount,
} from "./shared"

export function WithdrawRewardsMessage({ metadata, events, getDenomDisplay }: MessageRendererProps) {
	const rewardAmountStr = getEventAttribute(events || [], "withdraw_rewards", "amount")
	const rewardAmounts = rewardAmountStr ? parseMultiDenomAmount(rewardAmountStr) : []

	return (
		<div className={css({ display: "flex", flexDir: "column", gap: "2" })}>
			<MessageHeader icon={Coins} label="Claim Staking Rewards" color="purple.600" />
			{metadata.delegatorAddress && <DetailRow label="Delegator" value={metadata.delegatorAddress} copyable icon={Users} />}
			{metadata.validatorAddress && <DetailRow label="Validator" value={metadata.validatorAddress} copyable />}
			<AmountBox label="Rewards Claimed" amounts={rewardAmounts} getDenomDisplay={getDenomDisplay} color="purple.600" />
		</div>
	)
}

export function WithdrawCommissionMessage({ metadata, events, getDenomDisplay }: MessageRendererProps) {
	const commissionAmountStr = getEventAttribute(events || [], "withdraw_commission", "amount")
	const commissionAmounts = commissionAmountStr ? parseMultiDenomAmount(commissionAmountStr) : []

	return (
		<div className={css({ display: "flex", flexDir: "column", gap: "2" })}>
			<MessageHeader icon={Coins} label="Claim Validator Commission" color="purple.600" />
			{metadata.validatorAddress && <DetailRow label="Validator" value={metadata.validatorAddress} copyable />}
			<AmountBox label="Commission Claimed" amounts={commissionAmounts} getDenomDisplay={getDenomDisplay} color="purple.600" />
		</div>
	)
}
