import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AddressChip } from '@/components/AddressChip'
import { ArrowUpRight, ArrowDownLeft, AlertCircle, CheckCircle } from 'lucide-react'
import { css } from '@/styled-system/css'
import type { Message } from '@/lib/api'

interface IbcTransferCardProps {
	messages: Message[]
}

interface IbcTransferInfo {
	direction: 'outgoing' | 'incoming' | 'acknowledgement' | 'timeout'
	sender?: string
	receiver?: string
	sourceChannel?: string
	sourcePort?: string
	token?: {
		denom: string
		amount: string
	}
	sequence?: string
	timeoutHeight?: string
	timeoutTimestamp?: string
	memo?: string
}

/**
 * Extracts IBC transfer information from transaction messages
 */
function extractIbcInfo(messages: Message[]): IbcTransferInfo | null {
	for (const msg of messages) {
		const msgType = msg.type || ''
		const data = msg.data || msg.metadata || {}

		if (msgType.includes('MsgTransfer')) {
			return {
				direction: 'outgoing',
				sender: data.sender as string,
				receiver: data.receiver as string,
				sourceChannel: data.sourceChannel || data.source_channel as string,
				sourcePort: data.sourcePort || data.source_port as string,
				token: data.token as { denom: string; amount: string },
				timeoutHeight: data.timeoutHeight?.revisionHeight || data.timeout_height?.revision_height as string,
				timeoutTimestamp: data.timeoutTimestamp || data.timeout_timestamp as string,
				memo: data.memo as string
			}
		}

		if (msgType.includes('MsgRecvPacket')) {
			const packet = data.packet || {}
			let packetData: { sender?: string; receiver?: string; amount?: string; denom?: string } = {}
			try {
				if (typeof packet.data === 'string') {
					const decoded = atob(packet.data)
					packetData = JSON.parse(decoded)
				} else {
					packetData = packet.data || {}
				}
			} catch {
				packetData = {}
			}

			return {
				direction: 'incoming',
				sender: packetData.sender,
				receiver: packetData.receiver,
				sourceChannel: packet.sourceChannel || packet.source_channel,
				sourcePort: packet.sourcePort || packet.source_port,
				token: packetData.amount && packetData.denom ? {
					denom: packetData.denom,
					amount: packetData.amount
				} : undefined,
				sequence: packet.sequence
			}
		}

		if (msgType.includes('MsgAcknowledgement')) {
			const packet = data.packet || {}
			return {
				direction: 'acknowledgement',
				sourceChannel: packet.sourceChannel || packet.source_channel,
				sourcePort: packet.sourcePort || packet.source_port,
				sequence: packet.sequence
			}
		}

		if (msgType.includes('MsgTimeout')) {
			const packet = data.packet || {}
			return {
				direction: 'timeout',
				sourceChannel: packet.sourceChannel || packet.source_channel,
				sourcePort: packet.sourcePort || packet.source_port,
				sequence: packet.sequence
			}
		}
	}

	return null
}

/**
 * Displays IBC transfer information for a transaction
 */
export function IbcTransferCard({ messages }: IbcTransferCardProps) {
	const ibcInfo = extractIbcInfo(messages)

	if (!ibcInfo) return null

	const getDirectionIcon = () => {
		switch (ibcInfo.direction) {
			case 'outgoing':
				return <ArrowUpRight className={styles.iconOrange} />
			case 'incoming':
				return <ArrowDownLeft className={styles.iconGreen} />
			case 'acknowledgement':
				return <CheckCircle className={styles.iconCyan} />
			case 'timeout':
				return <AlertCircle className={styles.iconRed} />
		}
	}

	const getDirectionLabel = () => {
		switch (ibcInfo.direction) {
			case 'outgoing':
				return 'Outgoing Transfer'
			case 'incoming':
				return 'Incoming Transfer'
			case 'acknowledgement':
				return 'Acknowledgement'
			case 'timeout':
				return 'Timeout'
		}
	}

	const getDirectionVariant = (): 'default' | 'success' | 'warning' | 'destructive' => {
		switch (ibcInfo.direction) {
			case 'outgoing':
				return 'warning'
			case 'incoming':
				return 'success'
			case 'acknowledgement':
				return 'default'
			case 'timeout':
				return 'destructive'
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className={styles.titleFlex}>
					{getDirectionIcon()}
					IBC Transfer
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className={styles.container}>
					<div className={styles.row}>
						<span className={styles.label}>Direction</span>
						<Badge variant={getDirectionVariant()}>
							{getDirectionLabel()}
						</Badge>
					</div>

					{ibcInfo.sourceChannel && (
						<div className={styles.row}>
							<span className={styles.label}>Channel</span>
							<span className={styles.monoValue}>{ibcInfo.sourceChannel}</span>
						</div>
					)}

					{ibcInfo.sourcePort && (
						<div className={styles.row}>
							<span className={styles.label}>Port</span>
							<span className={styles.monoValue}>{ibcInfo.sourcePort}</span>
						</div>
					)}

					{ibcInfo.sequence && (
						<div className={styles.row}>
							<span className={styles.label}>Sequence</span>
							<span className={styles.monoValue}>{ibcInfo.sequence}</span>
						</div>
					)}

					{ibcInfo.token && (
						<div className={styles.row}>
							<span className={styles.label}>Amount</span>
							<span className={styles.value}>
								{ibcInfo.token.amount}
								<span className={styles.denomText}>{ibcInfo.token.denom.length > 20
									? `${ibcInfo.token.denom.slice(0, 8)}...${ibcInfo.token.denom.slice(-6)}`
									: ibcInfo.token.denom}</span>
							</span>
						</div>
					)}

					{ibcInfo.sender && (
						<div className={styles.addressRow}>
							<span className={styles.label}>Sender</span>
							<AddressChip address={ibcInfo.sender} truncate />
						</div>
					)}

					{ibcInfo.receiver && (
						<div className={styles.addressRow}>
							<span className={styles.label}>Receiver</span>
							<AddressChip address={ibcInfo.receiver} truncate />
						</div>
					)}

					{ibcInfo.memo && (
						<div className={styles.memoRow}>
							<span className={styles.label}>Memo</span>
							<span className={styles.memoValue}>{ibcInfo.memo}</span>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	)
}

const styles = {
	titleFlex: css({ display: 'flex', alignItems: 'center', gap: '2' }),
	iconOrange: css({ h: '5', w: '5', color: 'orange.500' }),
	iconGreen: css({ h: '5', w: '5', color: 'green.500' }),
	iconCyan: css({ h: '5', w: '5', color: 'cyan.500' }),
	iconRed: css({ h: '5', w: '5', color: 'red.500' }),
	container: css({ display: 'flex', flexDir: 'column', gap: '3' }),
	row: css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }),
	addressRow: css({ display: 'flex', flexDir: 'column', gap: '1' }),
	memoRow: css({ display: 'flex', flexDir: 'column', gap: '1' }),
	label: css({ color: 'fg.muted', fontSize: 'sm' }),
	value: css({ fontWeight: 'medium', fontSize: 'sm' }),
	monoValue: css({ fontFamily: 'mono', fontSize: 'sm' }),
	denomText: css({ color: 'fg.muted', fontSize: 'xs', ml: '1' }),
	memoValue: css({ fontSize: 'sm', fontFamily: 'mono', bg: 'bg.muted', p: '2', borderRadius: 'md', wordBreak: 'break-all' })
}
