import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import {
	CheckCircle,
	XCircle,
	AlertCircle,
	Link2,
	ArrowUpRight,
	ArrowDownLeft,
	Activity,
	Globe,
	Coins,
	Clock,
	Copy,
	Check
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import {
	api,
	type IbcConnection,
	type IbcDenomTrace,
	type IbcStats,
	type IbcTransfer,
	type IbcChannelActivity
} from '@/lib/api'
import { formatTimeAgo, formatAddress, formatNumber } from '@/lib/utils'
import { css } from '@/styled-system/css'
import { IBCIcon } from '@/components/icons/icons'

export default function IbcPage() {
	const [transfersPage, setTransfersPage] = useState(0)
	const [transferDirection, setTransferDirection] = useState<string>('all')
	const [connectionsPage, setConnectionsPage] = useState(0)
	const [denomsPage, setDenomsPage] = useState(0)
	const limit = 20

	const statsQuery = useQuery({
		queryKey: ['ibc-stats'],
		queryFn: () => api.getIbcStats(),
		refetchInterval: 30000
	})

	const transfersQuery = useQuery({
		queryKey: ['ibc-transfers', transfersPage, transferDirection],
		queryFn: () =>
			api.getIbcTransfers(
				limit,
				transfersPage * limit,
				transferDirection === 'all' ? undefined : (transferDirection as 'outgoing' | 'incoming')
			)
	})

	const connectionsQuery = useQuery({
		queryKey: ['ibc-connections', connectionsPage],
		queryFn: () => api.getIbcConnections(limit, connectionsPage * limit)
	})

	const denomsQuery = useQuery({
		queryKey: ['ibc-denom-traces', denomsPage],
		queryFn: () => api.getIbcDenomTraces(limit, denomsPage * limit)
	})

	const channelActivityQuery = useQuery({
		queryKey: ['ibc-channel-activity'],
		queryFn: () => api.getIbcChannelActivity()
	})

	const stats = statsQuery.data

	return (
		<div className={css(styles.container)}>
			<div className={css(styles.header)}>
				<div>
					<h1 className={css(styles.title)}>IBC</h1>
					<p className={css(styles.subtitle)}>
						Inter-Blockchain Communication transfers, channels, and denom traces
					</p>
				</div>
			</div>

			{/* Stats Cards */}
			<div className={css(styles.statsGrid)}>
				<Card>
					<CardHeader className={css(styles.statCardHeader)}>
						<CardTitle className={css(styles.statCardTitle)}>Outgoing Transfers</CardTitle>
						<ArrowUpRight className={css(styles.statIcon)} />
					</CardHeader>
					<CardContent>
						<div className={css(styles.statValue)}>
							{statsQuery.isLoading ? (
								<Skeleton className={css(styles.statSkeleton)} />
							) : (
								formatNumber(stats?.outgoing_transfers || 0)
							)}
						</div>
						<p className={css(styles.statHelper)}>Total sent via IBC</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className={css(styles.statCardHeader)}>
						<CardTitle className={css(styles.statCardTitle)}>Incoming Transfers</CardTitle>
						<ArrowDownLeft className={css(styles.statIcon)} />
					</CardHeader>
					<CardContent>
						<div className={css(styles.statValue)}>
							{statsQuery.isLoading ? (
								<Skeleton className={css(styles.statSkeleton)} />
							) : (
								formatNumber(stats?.incoming_transfers || 0)
							)}
						</div>
						<p className={css(styles.statHelper)}>Total received via IBC</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className={css(styles.statCardHeader)}>
						<CardTitle className={css(styles.statCardTitle)}>Active Channels</CardTitle>
						<Activity className={css(styles.statIcon)} />
					</CardHeader>
					<CardContent>
						<div className={css(styles.statValue)}>
							{statsQuery.isLoading ? (
								<Skeleton className={css(styles.statSkeleton)} />
							) : (
								<>
									{stats?.active_channels || 0}
									<span className={css(styles.statSecondary)}>/ {stats?.total_channels || 0}</span>
								</>
							)}
						</div>
						<p className={css(styles.statHelper)}>Active / Total channels</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className={css(styles.statCardHeader)}>
						<CardTitle className={css(styles.statCardTitle)}>Connected Chains</CardTitle>
						<Globe className={css(styles.statIcon)} />
					</CardHeader>
					<CardContent>
						<div className={css(styles.statValue)}>
							{statsQuery.isLoading ? (
								<Skeleton className={css(styles.statSkeleton)} />
							) : (
								stats?.connected_chains || 0
							)}
						</div>
						<p className={css(styles.statHelper)}>Unique counterparties</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className={css(styles.statCardHeader)}>
						<CardTitle className={css(styles.statCardTitle)}>IBC Denoms</CardTitle>
						<Coins className={css(styles.statIcon)} />
					</CardHeader>
					<CardContent>
						<div className={css(styles.statValue)}>
							{statsQuery.isLoading ? (
								<Skeleton className={css(styles.statSkeleton)} />
							) : (
								stats?.total_denoms || 0
							)}
						</div>
						<p className={css(styles.statHelper)}>Traced denominations</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className={css(styles.statCardHeader)}>
						<CardTitle className={css(styles.statCardTitle)}>Timed Out</CardTitle>
						<Clock className={css(styles.statIcon)} />
					</CardHeader>
					<CardContent>
						<div className={css(styles.statValue)}>
							{statsQuery.isLoading ? (
								<Skeleton className={css(styles.statSkeleton)} />
							) : (
								stats?.timed_out_transfers || 0
							)}
						</div>
						<p className={css(styles.statHelper)}>Failed transfers</p>
					</CardContent>
				</Card>
			</div>

			{/* Main Content Tabs */}
			<Tabs defaultValue="transfers">
				<TabsList>
					<TabsTrigger value="transfers">Transfers</TabsTrigger>
					<TabsTrigger value="channels">Channels</TabsTrigger>
					<TabsTrigger value="denoms">Denom Traces</TabsTrigger>
					<TabsTrigger value="activity">Channel Activity</TabsTrigger>
				</TabsList>

				<TabsContent value="transfers">
					<TransfersTab
						data={transfersQuery.data}
						isLoading={transfersQuery.isLoading}
						error={transfersQuery.error}
						page={transfersPage}
						setPage={setTransfersPage}
						limit={limit}
						direction={transferDirection}
						setDirection={(d) => {
							setTransferDirection(d)
							setTransfersPage(0)
						}}
					/>
				</TabsContent>

				<TabsContent value="channels">
					<ConnectionsTab
						data={connectionsQuery.data}
						isLoading={connectionsQuery.isLoading}
						error={connectionsQuery.error}
						page={connectionsPage}
						setPage={setConnectionsPage}
						limit={limit}
					/>
				</TabsContent>

				<TabsContent value="denoms">
					<DenomsTab
						data={denomsQuery.data}
						isLoading={denomsQuery.isLoading}
						error={denomsQuery.error}
						page={denomsPage}
						setPage={setDenomsPage}
						limit={limit}
					/>
				</TabsContent>

				<TabsContent value="activity">
					<ChannelActivityTab
						data={channelActivityQuery.data}
						isLoading={channelActivityQuery.isLoading}
						error={channelActivityQuery.error}
					/>
				</TabsContent>
			</Tabs>
		</div>
	)
}

function TransfersTab({
	data,
	isLoading,
	error,
	page,
	setPage,
	limit,
	direction,
	setDirection
}: {
	data: { data: IbcTransfer[]; pagination: { total: number } } | undefined
	isLoading: boolean
	error: Error | null
	page: number
	setPage: (p: number | ((p: number) => number)) => void
	limit: number
	direction: string
	setDirection: (d: string) => void
}) {
	const transfers = data?.data || []
	const hasData = transfers.length > 0

	return (
		<Card>
			<CardHeader className={css(styles.cardHeaderWithFilter)}>
				<div>
					<CardTitle>Recent IBC Transfers</CardTitle>
					<CardDescription>
						{data ? `${data.pagination.total.toLocaleString()} total transfers` : 'Loading...'}
					</CardDescription>
				</div>
				<Select value={direction} onValueChange={setDirection}>
					<SelectTrigger className={css(styles.filterSelect)}>
						<SelectValue placeholder="Filter direction" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Directions</SelectItem>
						<SelectItem value="outgoing">Outgoing</SelectItem>
						<SelectItem value="incoming">Incoming</SelectItem>
					</SelectContent>
				</Select>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className={css(styles.loadingContainer)}>
						{Array.from({ length: 5 }).map((_, i) => (
							<Skeleton key={i} className={css(styles.skeleton)} />
						))}
					</div>
				) : error ? (
					<div className={css(styles.emptyState)}>
						<IBCIcon className={css(styles.emptyIcon)} />
						<p>Error loading transfers</p>
					</div>
				) : !hasData ? (
					<div className={css(styles.emptyState)}>
						<IBCIcon className={css(styles.emptyIcon)} />
						<h3 className={css(styles.emptyTitle)}>No IBC Transfers</h3>
						<p className={css(styles.emptyText)}>
							No IBC transfers have been recorded yet.
						</p>
					</div>
				) : (
					<>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Direction</TableHead>
									<TableHead>Tx Hash</TableHead>
									<TableHead>From / To</TableHead>
									<TableHead>Amount</TableHead>
									<TableHead>Channel</TableHead>
									<TableHead>Time</TableHead>
									<TableHead>Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{transfers.map((transfer) => (
									<TransferRow key={`${transfer.tx_hash}-${transfer.direction}`} transfer={transfer} />
								))}
							</TableBody>
						</Table>

						{data && data.pagination.total > limit && (
							<div className={css(styles.pagination)}>
								<Button
									variant="outline"
									size="sm"
									disabled={page === 0}
									onClick={() => setPage((p) => p - 1)}
								>
									Previous
								</Button>
								<span className={css(styles.pageInfo)}>
									Page {page + 1} of {Math.ceil(data.pagination.total / limit)}
								</span>
								<Button
									variant="outline"
									size="sm"
									disabled={(page + 1) * limit >= data.pagination.total}
									onClick={() => setPage((p) => p + 1)}
								>
									Next
								</Button>
							</div>
						)}
					</>
				)}
			</CardContent>
		</Card>
	)
}

function TransferRow({ transfer }: { transfer: IbcTransfer }) {
	const isOutgoing = transfer.direction === 'outgoing'

	const formatAmount = () => {
		if (!transfer.token_amount) return '-'
		const amount = BigInt(transfer.token_amount)
		const decimals = transfer.resolved_denom?.decimals || 6
		const symbol = transfer.resolved_denom?.symbol || transfer.token_denom?.split('/').pop() || 'tokens'
		const formatted = Number(amount) / Math.pow(10, decimals)
		return `${formatted.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${symbol}`
	}

	return (
		<TableRow>
			<TableCell>
				<Badge variant={isOutgoing ? 'default' : 'secondary'}>
					{isOutgoing ? (
						<ArrowUpRight className={css(styles.directionIcon)} />
					) : (
						<ArrowDownLeft className={css(styles.directionIcon)} />
					)}
					{isOutgoing ? 'Out' : 'In'}
				</Badge>
			</TableCell>
			<TableCell>
				<Link to={`/transactions/${transfer.tx_hash}`} className={css(styles.txLink)}>
					{formatAddress(transfer.tx_hash, 8)}
				</Link>
			</TableCell>
			<TableCell>
				<div className={css(styles.addressColumn)}>
					<div className={css(styles.addressRow)}>
						<span className={css(styles.addressLabel)}>From:</span>
						<Link to={`/addr/${transfer.sender}`} className={css(styles.addressLink)}>
							{formatAddress(transfer.sender, 8)}
						</Link>
					</div>
					{transfer.receiver && (
						<div className={css(styles.addressRow)}>
							<span className={css(styles.addressLabel)}>To:</span>
							<span className={css(styles.receiverAddress)}>
								{formatAddress(transfer.receiver, 8)}
							</span>
						</div>
					)}
				</div>
			</TableCell>
			<TableCell>
				<span className={css(styles.amount)}>{formatAmount()}</span>
			</TableCell>
			<TableCell>
				{transfer.source_channel ? (
					<div className={css(styles.channelInfo)}>
						<code className={css(styles.channelCode)}>{transfer.source_channel}</code>
						{transfer.counterparty_chain && (
							<span className={css(styles.counterpartyChain)}>{transfer.counterparty_chain}</span>
						)}
					</div>
				) : (
					<span className={css(styles.mutedText)}>-</span>
				)}
			</TableCell>
			<TableCell>
				<span className={css(styles.timeAgo)}>{formatTimeAgo(transfer.timestamp)}</span>
			</TableCell>
			<TableCell>
				{transfer.success ? (
					<Badge variant="success">
						<CheckCircle className={css(styles.statusIcon)} />
						Success
					</Badge>
				) : (
					<Badge variant="destructive">
						<XCircle className={css(styles.statusIcon)} />
						Failed
					</Badge>
				)}
			</TableCell>
		</TableRow>
	)
}

function ConnectionsTab({
	data,
	isLoading,
	error,
	page,
	setPage,
	limit
}: {
	data: { data: IbcConnection[]; pagination: { total: number } } | undefined
	isLoading: boolean
	error: Error | null
	page: number
	setPage: (p: number | ((p: number) => number)) => void
	limit: number
}) {
	const connections = data?.data || []
	const hasData = connections.length > 0

	return (
		<Card>
			<CardHeader>
				<CardTitle>IBC Channels</CardTitle>
				<CardDescription>
					{data ? `${data.pagination.total} total channels` : 'Loading...'}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className={css(styles.loadingContainer)}>
						{Array.from({ length: 5 }).map((_, i) => (
							<Skeleton key={i} className={css(styles.skeleton)} />
						))}
					</div>
				) : error ? (
					<div className={css(styles.emptyState)}>
						<IBCIcon className={css(styles.emptyIcon)} />
						<p>Error loading connections</p>
					</div>
				) : !hasData ? (
					<div className={css(styles.emptyState)}>
						<IBCIcon className={css(styles.emptyIcon)} />
						<h3 className={css(styles.emptyTitle)}>No IBC Channels</h3>
						<p className={css(styles.emptyText)}>
							No IBC channels have been established on this chain yet.
						</p>
					</div>
				) : (
					<>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Channel</TableHead>
									<TableHead>Counterparty Chain</TableHead>
									<TableHead>State</TableHead>
									<TableHead>Client Status</TableHead>
									<TableHead>Route Info</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{connections.map((conn) => (
									<ConnectionRow key={`${conn.channel_id}-${conn.port_id}`} conn={conn} />
								))}
							</TableBody>
						</Table>

						{data && data.pagination.total > limit && (
							<div className={css(styles.pagination)}>
								<Button
									variant="outline"
									size="sm"
									disabled={page === 0}
									onClick={() => setPage((p) => p - 1)}
								>
									Previous
								</Button>
								<span className={css(styles.pageInfo)}>
									Page {page + 1} of {Math.ceil(data.pagination.total / limit)}
								</span>
								<Button
									variant="outline"
									size="sm"
									disabled={(page + 1) * limit >= data.pagination.total}
									onClick={() => setPage((p) => p + 1)}
								>
									Next
								</Button>
							</div>
						)}
					</>
				)}
			</CardContent>
		</Card>
	)
}

function ConnectionRow({ conn }: { conn: IbcConnection }) {
	const [isOpen, setIsOpen] = useState(false)

	const routeInfo = {
		client_id: conn.client_id,
		connection_id: conn.connection_id,
		counterparty_client_id: conn.counterparty_client_id,
		counterparty_connection_id: conn.counterparty_connection_id,
		channel_id: conn.channel_id,
		counterparty_channel_id: conn.counterparty_channel_id
	}

	return (
		<TableRow>
			<TableCell>
				<div className={css(styles.channelCell)}>
					<code className={css(styles.channelId)}>{conn.channel_id}</code>
					<span className={css(styles.portId)}>{conn.port_id}</span>
				</div>
			</TableCell>
			<TableCell>
				{conn.counterparty_chain_id ? (
					<div className={css(styles.counterpartyInfo)}>
						<span className={css(styles.chainIdBadge)}>{conn.counterparty_chain_id}</span>
						{conn.counterparty_channel_id && (
							<code className={css(styles.counterpartyChannel)}>
								{conn.counterparty_channel_id}
							</code>
						)}
					</div>
				) : (
					<span className={css(styles.mutedText)}>Unknown</span>
				)}
			</TableCell>
			<TableCell>
				<StateBadge state={conn.state} />
			</TableCell>
			<TableCell>
				<ClientStatusBadge status={conn.client_status} isActive={conn.is_active} />
			</TableCell>
			<TableCell>
				<Collapsible open={isOpen} onOpenChange={setIsOpen}>
					<CollapsibleTrigger asChild>
						<Button variant="ghost" size="sm">
							<Link2 className={css(styles.routeIcon)} />
							{isOpen ? 'Hide' : 'Show'} Route
						</Button>
					</CollapsibleTrigger>
					<CollapsibleContent>
						<pre className={css(styles.routeJson)}>
							{JSON.stringify(routeInfo, null, 2)}
						</pre>
					</CollapsibleContent>
				</Collapsible>
			</TableCell>
		</TableRow>
	)
}

function StateBadge({ state }: { state: string | null }) {
	if (!state) return <Badge variant="secondary">Unknown</Badge>

	const isOpen = state.toLowerCase().includes('open')
	return (
		<Badge variant={isOpen ? 'success' : 'secondary'}>
			{isOpen ? (
				<CheckCircle className={css(styles.badgeIcon)} />
			) : (
				<XCircle className={css(styles.badgeIcon)} />
			)}
			{state.replace('STATE_', '')}
		</Badge>
	)
}

function ClientStatusBadge({ status, isActive }: { status: string | null; isActive: boolean }) {
	if (!status) return <span className={css(styles.mutedText)}>-</span>

	const isExpired = status.toLowerCase().includes('expired')
	const isFrozen = status.toLowerCase().includes('frozen')

	if (isActive) {
		return (
			<Badge variant="success">
				<CheckCircle className={css(styles.badgeIcon)} />
				Active
			</Badge>
		)
	}

	if (isExpired) {
		return (
			<Badge variant="warning">
				<AlertCircle className={css(styles.badgeIcon)} />
				Expired
			</Badge>
		)
	}

	if (isFrozen) {
		return (
			<Badge variant="destructive">
				<XCircle className={css(styles.badgeIcon)} />
				Frozen
			</Badge>
		)
	}

	return <Badge variant="secondary">{status}</Badge>
}

function DenomsTab({
	data,
	isLoading,
	error,
	page,
	setPage,
	limit
}: {
	data: { data: IbcDenomTrace[]; pagination: { total: number } } | undefined
	isLoading: boolean
	error: Error | null
	page: number
	setPage: (p: number | ((p: number) => number)) => void
	limit: number
}) {
	const denoms = data?.data || []
	const hasData = denoms.length > 0

	return (
		<Card>
			<CardHeader>
				<CardTitle>IBC Denom Traces</CardTitle>
				<CardDescription>
					{data ? `${data.pagination.total} total denoms` : 'Loading...'}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className={css(styles.loadingContainer)}>
						{Array.from({ length: 5 }).map((_, i) => (
							<Skeleton key={i} className={css(styles.skeleton)} />
						))}
					</div>
				) : error ? (
					<div className={css(styles.emptyState)}>
						<IBCIcon className={css(styles.emptyIcon)} />
						<p>Error loading denom traces</p>
					</div>
				) : !hasData ? (
					<div className={css(styles.emptyState)}>
						<IBCIcon className={css(styles.emptyIcon)} />
						<h3 className={css(styles.emptyTitle)}>No IBC Denoms</h3>
						<p className={css(styles.emptyText)}>
							No IBC denominations have been traced on this chain yet.
						</p>
					</div>
				) : (
					<>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Symbol</TableHead>
									<TableHead>IBC Denom</TableHead>
									<TableHead>Base Denom</TableHead>
									<TableHead>Source</TableHead>
									<TableHead>Decimals</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{denoms.map((denom) => (
									<DenomRow key={denom.ibc_denom} denom={denom} />
								))}
							</TableBody>
						</Table>

						{data && data.pagination.total > limit && (
							<div className={css(styles.pagination)}>
								<Button
									variant="outline"
									size="sm"
									disabled={page === 0}
									onClick={() => setPage((p) => p - 1)}
								>
									Previous
								</Button>
								<span className={css(styles.pageInfo)}>
									Page {page + 1} of {Math.ceil(data.pagination.total / limit)}
								</span>
								<Button
									variant="outline"
									size="sm"
									disabled={(page + 1) * limit >= data.pagination.total}
									onClick={() => setPage((p) => p + 1)}
								>
									Next
								</Button>
							</div>
						)}
					</>
				)}
			</CardContent>
		</Card>
	)
}

function DenomRow({ denom }: { denom: IbcDenomTrace }) {
	const [copied, setCopied] = useState(false)
	const ibcHash = denom.ibc_denom.replace('ibc/', '')
	const truncatedHash = ibcHash.length > 16 ? `${ibcHash.slice(0, 8)}...${ibcHash.slice(-8)}` : ibcHash

	const copyToClipboard = () => {
		navigator.clipboard.writeText(denom.ibc_denom)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	return (
		<TableRow>
			<TableCell>
				<span className={css(styles.symbolBadge)}>
					{denom.symbol || denom.base_denom.toUpperCase()}
				</span>
			</TableCell>
			<TableCell>
				<div className={css(styles.denomHashCell)}>
					<code className={css(styles.denomHash)} title={denom.ibc_denom}>
						ibc/{truncatedHash}
					</code>
					<Button
						variant="ghost"
						size="sm"
						onClick={copyToClipboard}
						className={css(styles.copyButton)}
					>
						{copied ? (
							<Check className={css(styles.copyIcon)} />
						) : (
							<Copy className={css(styles.copyIcon)} />
						)}
					</Button>
				</div>
			</TableCell>
			<TableCell>
				<code className={css(styles.baseDenom)}>{denom.base_denom}</code>
			</TableCell>
			<TableCell>
				<div className={css(styles.sourceInfo)}>
					{denom.source_chain_id ? (
						<span className={css(styles.chainIdBadge)}>{denom.source_chain_id}</span>
					) : denom.source_channel ? (
						<code className={css(styles.channelCode)}>{denom.source_channel}</code>
					) : (
						<span className={css(styles.mutedText)}>Unknown</span>
					)}
				</div>
			</TableCell>
			<TableCell>
				<span className={css(styles.decimals)}>{denom.decimals}</span>
			</TableCell>
		</TableRow>
	)
}

function ChannelActivityTab({
	data,
	isLoading,
	error
}: {
	data: IbcChannelActivity[] | undefined
	isLoading: boolean
	error: Error | null
}) {
	const activities = data || []
	const hasData = activities.length > 0

	return (
		<Card>
			<CardHeader>
				<CardTitle>Channel Transfer Activity</CardTitle>
				<CardDescription>Transfer volume by IBC channel</CardDescription>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className={css(styles.loadingContainer)}>
						{Array.from({ length: 5 }).map((_, i) => (
							<Skeleton key={i} className={css(styles.skeleton)} />
						))}
					</div>
				) : error ? (
					<div className={css(styles.emptyState)}>
						<IBCIcon className={css(styles.emptyIcon)} />
						<p>Error loading channel activity</p>
					</div>
				) : !hasData ? (
					<div className={css(styles.emptyState)}>
						<IBCIcon className={css(styles.emptyIcon)} />
						<h3 className={css(styles.emptyTitle)}>No Activity Data</h3>
						<p className={css(styles.emptyText)}>
							No transfer activity has been recorded yet.
						</p>
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Channel</TableHead>
								<TableHead>Counterparty Chain</TableHead>
								<TableHead>Total Transfers</TableHead>
								<TableHead>Success Rate</TableHead>
								<TableHead>Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{activities.map((activity) => (
								<TableRow key={activity.channel_id}>
									<TableCell>
										<code className={css(styles.channelCode)}>{activity.channel_id}</code>
									</TableCell>
									<TableCell>
										{activity.counterparty_chain_id ? (
											<span className={css(styles.chainIdBadge)}>
												{activity.counterparty_chain_id}
											</span>
										) : (
											<span className={css(styles.mutedText)}>Unknown</span>
										)}
									</TableCell>
									<TableCell>
										<span className={css(styles.transferCount)}>
											{activity.transfer_count.toLocaleString()}
										</span>
									</TableCell>
									<TableCell>
										<span className={css(styles.successRate)}>
											{activity.transfer_count > 0
												? `${((activity.successful_transfers / activity.transfer_count) * 100).toFixed(1)}%`
												: '-'}
										</span>
									</TableCell>
									<TableCell>
										<ClientStatusBadge
											status={activity.client_status}
											isActive={activity.client_status === 'Active'}
										/>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</CardContent>
		</Card>
	)
}

const styles = {
	container: {
		display: 'flex',
		flexDirection: 'column',
		gap: '6'
	},
	header: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	title: {
		fontSize: '3xl',
		fontWeight: 'bold'
	},
	subtitle: {
		color: 'fg.muted',
		marginTop: '1'
	},
	statsGrid: {
		display: 'grid',
		gap: '4',
		gridTemplateColumns: {
			base: 'repeat(2, 1fr)',
			md: 'repeat(3, 1fr)',
			lg: 'repeat(6, 1fr)'
		}
	},
	statCardHeader: {
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		pb: '2'
	},
	statCardTitle: {
		fontSize: 'xs',
		fontWeight: 'medium',
		color: 'fg.muted'
	},
	statIcon: {
		height: '4',
		width: '4',
		color: 'fg.muted'
	},
	statValue: {
		fontSize: 'xl',
		fontWeight: 'bold'
	},
	statSecondary: {
		fontSize: 'sm',
		fontWeight: 'normal',
		color: 'fg.muted',
		marginLeft: '1'
	},
	statHelper: {
		fontSize: 'xs',
		color: 'fg.muted',
		marginTop: '1'
	},
	statSkeleton: {
		height: '6',
		width: '16'
	},
	cardHeaderWithFilter: {
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-between'
	},
	filterSelect: {
		width: '40'
	},
	loadingContainer: {
		display: 'flex',
		flexDirection: 'column',
		gap: '3'
	},
	skeleton: {
		height: '12',
		width: 'full'
	},
	emptyState: {
		textAlign: 'center',
		py: '12',
		color: 'fg.muted'
	},
	emptyIcon: {
		height: '12',
		width: '12',
		margin: '0 auto',
		marginBottom: '4',
		opacity: '0.5'
	},
	emptyTitle: {
		fontSize: 'lg',
		fontWeight: 'semibold',
		color: 'fg.default',
		marginBottom: '2'
	},
	emptyText: {
		maxWidth: 'md',
		margin: '0 auto'
	},
	pagination: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: '4',
		marginTop: '4'
	},
	pageInfo: {
		fontSize: 'sm',
		color: 'fg.muted'
	},
	directionIcon: {
		height: '3',
		width: '3',
		marginRight: '1'
	},
	txLink: {
		fontFamily: 'mono',
		fontSize: 'sm',
		color: 'accent.default',
		_hover: { textDecoration: 'underline' }
	},
	addressColumn: {
		display: 'flex',
		flexDirection: 'column',
		gap: '1'
	},
	addressRow: {
		display: 'flex',
		alignItems: 'center',
		gap: '2'
	},
	addressLabel: {
		fontSize: 'xs',
		color: 'fg.muted',
		minWidth: '8'
	},
	addressLink: {
		fontFamily: 'mono',
		fontSize: 'xs',
		color: 'accent.default',
		_hover: { textDecoration: 'underline' }
	},
	receiverAddress: {
		fontFamily: 'mono',
		fontSize: 'xs',
		color: 'fg.muted'
	},
	amount: {
		fontWeight: 'medium'
	},
	channelInfo: {
		display: 'flex',
		flexDirection: 'column',
		gap: '1'
	},
	channelCode: {
		fontFamily: 'mono',
		fontSize: 'xs',
		color: 'accent.default'
	},
	counterpartyChain: {
		fontSize: 'xs',
		color: 'fg.muted'
	},
	timeAgo: {
		fontSize: 'sm',
		color: 'fg.muted'
	},
	statusIcon: {
		height: '3',
		width: '3',
		marginRight: '1'
	},
	channelCell: {
		display: 'flex',
		flexDirection: 'column',
		gap: '1'
	},
	channelId: {
		fontFamily: 'mono',
		fontSize: 'sm',
		fontWeight: 'medium'
	},
	portId: {
		fontSize: 'xs',
		color: 'fg.muted'
	},
	counterpartyInfo: {
		display: 'flex',
		flexDirection: 'column',
		gap: '1'
	},
	chainIdBadge: {
		fontSize: 'sm',
		fontWeight: 'medium',
		color: 'accent.default'
	},
	counterpartyChannel: {
		fontSize: 'xs',
		color: 'fg.muted',
		fontFamily: 'mono'
	},
	mutedText: {
		color: 'fg.muted'
	},
	badgeIcon: {
		height: '3',
		width: '3',
		marginRight: '1'
	},
	routeIcon: {
		height: '4',
		width: '4',
		marginRight: '1'
	},
	routeJson: {
		fontSize: 'xs',
		fontFamily: 'mono',
		bg: 'bg.muted',
		p: '3',
		rounded: 'md',
		mt: '2',
		overflowX: 'auto',
		whiteSpace: 'pre-wrap',
		wordBreak: 'break-all'
	},
	symbolBadge: {
		fontWeight: 'bold',
		color: 'accent.default'
	},
	denomHashCell: {
		display: 'flex',
		alignItems: 'center',
		gap: '1'
	},
	denomHash: {
		fontFamily: 'mono',
		fontSize: 'xs',
		color: 'fg.muted'
	},
	copyButton: {
		padding: '1',
		height: 'auto'
	},
	copyIcon: {
		height: '3',
		width: '3'
	},
	baseDenom: {
		fontFamily: 'mono',
		fontSize: 'sm'
	},
	sourceInfo: {
		display: 'flex',
		flexDirection: 'column',
		gap: '1'
	},
	decimals: {
		fontFamily: 'mono',
		color: 'fg.muted'
	},
	transferCount: {
		fontWeight: 'medium'
	},
	successRate: {
		color: 'success.default',
		fontWeight: 'medium'
	}
}
