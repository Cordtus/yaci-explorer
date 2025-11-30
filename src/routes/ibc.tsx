import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle, XCircle, AlertCircle, Link2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { api, IbcConnection, IbcDenomTrace } from '@/lib/api'
import { css } from '@/styled-system/css'
import { IBCIcon } from '@/components/icons/icons'

export default function IbcPage() {
	const [connectionsPage, setConnectionsPage] = useState(0)
	const [denomsPage, setDenomsPage] = useState(0)
	const limit = 20

	const connectionsQuery = useQuery({
		queryKey: ['ibc-connections', connectionsPage],
		queryFn: () => api.getIbcConnections(limit, connectionsPage * limit),
	})

	const denomsQuery = useQuery({
		queryKey: ['ibc-denom-traces', denomsPage],
		queryFn: () => api.getIbcDenomTraces(limit, denomsPage * limit),
	})

	const chainsQuery = useQuery({
		queryKey: ['ibc-chains'],
		queryFn: () => api.getIbcChains(),
	})

	return (
		<div className={css(styles.container)}>
			<div className={css(styles.header)}>
				<div>
					<h1 className={css(styles.title)}>IBC</h1>
					<p className={css(styles.subtitle)}>
						Inter-Blockchain Communication channels and denom traces
					</p>
				</div>
			</div>

			{/* Chain summary cards */}
			{chainsQuery.data && chainsQuery.data.length > 0 && (
				<div className={css(styles.chainGrid)}>
					{chainsQuery.data.map((chain) => (
						<Card key={chain.chain_id}>
							<CardHeader className={css(styles.chainCardHeader)}>
								<CardTitle className={css(styles.chainId)}>{chain.chain_id}</CardTitle>
							</CardHeader>
							<CardContent className={css(styles.chainStats)}>
								<div className={css(styles.statItem)}>
									<span className={css(styles.statValue)}>{chain.channel_count}</span>
									<span className={css(styles.statLabel)}>Channels</span>
								</div>
								<div className={css(styles.statItem)}>
									<span className={css(styles.statValue)}>{chain.open_channels}</span>
									<span className={css(styles.statLabel)}>Open</span>
								</div>
								<div className={css(styles.statItem)}>
									<span className={css(styles.statValue)}>{chain.active_channels}</span>
									<span className={css(styles.statLabel)}>Active</span>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			<Tabs defaultValue="connections">
				<TabsList>
					<TabsTrigger value="connections">Connections</TabsTrigger>
					<TabsTrigger value="denoms">Denom Traces</TabsTrigger>
				</TabsList>

				<TabsContent value="connections">
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
			</Tabs>
		</div>
	)
}

function ConnectionsTab({
	data,
	isLoading,
	error,
	page,
	setPage,
	limit,
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
		counterparty_channel_id: conn.counterparty_channel_id,
	}

	return (
		<TableRow>
			<TableCell>
				<div className={css(styles.channelInfo)}>
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
	limit,
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
									<TableHead>IBC Denom</TableHead>
									<TableHead>Base Denom</TableHead>
									<TableHead>Source Chain</TableHead>
									<TableHead>Path</TableHead>
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
	const ibcHash = denom.ibc_denom.replace('ibc/', '')
	const truncatedHash = ibcHash.length > 16 ? `${ibcHash.slice(0, 8)}...${ibcHash.slice(-8)}` : ibcHash

	return (
		<TableRow>
			<TableCell>
				<code className={css(styles.denomHash)} title={denom.ibc_denom}>
					ibc/{truncatedHash}
				</code>
			</TableCell>
			<TableCell>
				<div className={css(styles.baseDenomInfo)}>
					<span className={css(styles.baseDenom)}>
						{denom.symbol || denom.base_denom}
					</span>
					{denom.decimals > 0 && (
						<span className={css(styles.decimals)}>{denom.decimals} decimals</span>
					)}
				</div>
			</TableCell>
			<TableCell>
				{denom.source_chain_id ? (
					<span className={css(styles.chainIdBadge)}>{denom.source_chain_id}</span>
				) : (
					<span className={css(styles.mutedText)}>Unknown</span>
				)}
			</TableCell>
			<TableCell>
				<code className={css(styles.pathCode)}>{denom.path}</code>
			</TableCell>
		</TableRow>
	)
}

const styles = {
	container: {
		display: 'flex',
		flexDirection: 'column',
		gap: '6',
	},
	header: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	title: {
		fontSize: '3xl',
		fontWeight: 'bold',
	},
	subtitle: {
		color: 'fg.muted',
		marginTop: '1',
	},
	chainGrid: {
		display: 'grid',
		gap: '4',
		gridTemplateColumns: {
			base: '1fr',
			sm: 'repeat(2, 1fr)',
			lg: 'repeat(4, 1fr)',
		},
	},
	chainCardHeader: {
		pb: '2',
	},
	chainId: {
		fontSize: 'sm',
		fontFamily: 'mono',
		truncate: true,
	},
	chainStats: {
		display: 'flex',
		justifyContent: 'space-between',
	},
	statItem: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
	},
	statValue: {
		fontSize: 'xl',
		fontWeight: 'bold',
	},
	statLabel: {
		fontSize: 'xs',
		color: 'fg.muted',
	},
	loadingContainer: {
		display: 'flex',
		flexDirection: 'column',
		gap: '3',
	},
	skeleton: {
		height: '12',
		width: 'full',
	},
	emptyState: {
		textAlign: 'center',
		py: '12',
		color: 'fg.muted',
	},
	emptyIcon: {
		height: '12',
		width: '12',
		margin: '0 auto',
		marginBottom: '4',
		opacity: '0.5',
	},
	emptyTitle: {
		fontSize: 'lg',
		fontWeight: 'semibold',
		color: 'fg.default',
		marginBottom: '2',
	},
	emptyText: {
		maxWidth: 'md',
		margin: '0 auto',
	},
	channelInfo: {
		display: 'flex',
		flexDirection: 'column',
		gap: '1',
	},
	channelId: {
		fontFamily: 'mono',
		fontSize: 'sm',
		fontWeight: 'medium',
	},
	portId: {
		fontSize: 'xs',
		color: 'fg.muted',
	},
	counterpartyInfo: {
		display: 'flex',
		flexDirection: 'column',
		gap: '1',
	},
	chainIdBadge: {
		fontSize: 'sm',
		fontWeight: 'medium',
		color: 'accent.default',
	},
	counterpartyChannel: {
		fontSize: 'xs',
		color: 'fg.muted',
		fontFamily: 'mono',
	},
	mutedText: {
		color: 'fg.muted',
	},
	badgeIcon: {
		height: '3',
		width: '3',
		marginRight: '1',
	},
	routeIcon: {
		height: '4',
		width: '4',
		marginRight: '1',
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
		wordBreak: 'break-all',
	},
	pagination: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: '4',
		marginTop: '4',
	},
	pageInfo: {
		fontSize: 'sm',
		color: 'fg.muted',
	},
	denomHash: {
		fontFamily: 'mono',
		fontSize: 'xs',
		color: 'fg.muted',
	},
	baseDenomInfo: {
		display: 'flex',
		flexDirection: 'column',
		gap: '1',
	},
	baseDenom: {
		fontWeight: 'medium',
	},
	decimals: {
		fontSize: 'xs',
		color: 'fg.muted',
	},
	pathCode: {
		fontSize: 'xs',
		fontFamily: 'mono',
		color: 'fg.muted',
	},
}
