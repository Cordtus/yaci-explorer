import type { ComponentType } from "react"
import type { MessageRendererProps } from "./shared"
import { BankSendMessage } from "./BankMessage"
import { DelegateMessage, UndelegateMessage, RedelegateMessage } from "./StakingMessage"
import { WithdrawRewardsMessage, WithdrawCommissionMessage } from "./DistributionMessage"
import { GovVoteMessage } from "./GovMessage"
import { IbcTransferMessage } from "./IbcMessage"
import { ExecuteContractMessage } from "./WasmMessage"
import { AuthzExecMessage } from "./AuthzMessage"

const MESSAGE_RENDERERS: Record<string, ComponentType<MessageRendererProps>> = {
	"/cosmos.bank.v1beta1.MsgSend": BankSendMessage,
	"/cosmos.staking.v1beta1.MsgDelegate": DelegateMessage,
	"/cosmos.staking.v1beta1.MsgUndelegate": UndelegateMessage,
	"/cosmos.staking.v1beta1.MsgBeginRedelegate": RedelegateMessage,
	"/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward": WithdrawRewardsMessage,
	"/cosmos.distribution.v1beta1.MsgWithdrawValidatorCommission": WithdrawCommissionMessage,
	"/cosmos.gov.v1beta1.MsgVote": GovVoteMessage,
	"/cosmos.gov.v1.MsgVote": GovVoteMessage,
	"/ibc.applications.transfer.v1.MsgTransfer": IbcTransferMessage,
	"/cosmwasm.wasm.v1.MsgExecuteContract": ExecuteContractMessage,
	"/cosmos.authz.v1beta1.MsgExec": AuthzExecMessage,
}

export function getMessageRenderer(type: string): ComponentType<MessageRendererProps> | null {
	return MESSAGE_RENDERERS[type] || null
}

export type { MessageRendererProps, MessageMetadata, MessageEvent } from "./shared"
