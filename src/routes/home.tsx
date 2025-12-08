import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { appConfig } from '@/config/app'
import { formatTimeAgo, formatHash, getTransactionStatus } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardMetrics } from '@/components/common/DashboardMetrics'
import { css } from '@/styled-system/css'
import { grid, hstack, vstack, listItem } from '@/styled-system/patterns'

export default function DashboardPage() {
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	const { data: blocks, isLoading: blocksLoading, error: blocksError } = useQuery({
		queryKey: ['latestBlocks'],
		queryFn: async () => {
			const result = await api.getBlocks(appConfig.dashboard.itemCount, 0)
			return result
		},
		refetchInterval: appConfig.dashboard.refetchIntervalMs,
		staleTime: appConfig.dashboard.refetchIntervalMs / 2,
		enabled: mounted,
	})

	const { data: transactions, isLoading: txLoading, error: txError } = useQuery({
		queryKey: ['latestTransactions'],
		queryFn: async () => {
			const result = await api.getTransactions(appConfig.dashboard.itemCount, 0)
			return result
		},
		refetchInterval: appConfig.dashboard.refetchIntervalMs,
		staleTime: appConfig.dashboard.refetchIntervalMs / 2,
		enabled: mounted,
	})

	if (mounted && (blocksError || txError)) {
		return (
			<div className={vstack({ gap: '4' })}>
				<h2 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'red.600' })}>Error Loading Data</h2>
				{blocksError && <p className={css({ color: 'red.500' })}>Blocks error: {String(blocksError)}</p>}
				{txError && <p className={css({ color: 'red.500' })}>Transactions error: {String(txError)}</p>}
				<p className={css({ fontSize: 'sm', color: 'fg.muted' })}>API URL: {api.getBaseUrl()}</p>
			</div>
		)
	}

	return (
		<div className={vstack({ gap: '8' })}>
			<DashboardMetrics />

			<div className={grid({ columns: { base: 1, lg: 2 }, gap: '8' })}>
				<Card>
					<CardHeader className={hstack({ justify: 'space-between' })}>
						<CardTitle>Recent Blocks</CardTitle>
						<Link to="/blocks" className={hstack({ gap: '1', fontSize: 'sm', color: 'fg.default', _hover: { color: 'accent.default' } })}>
							View all <ArrowRight className={css({ w: 'icon.sm', h: 'icon.sm' })} />
						</Link>
					</CardHeader>
					<CardContent>
						<div className={vstack({ gap: '4' })}>
							{blocksLoading ? (
								Array.from({ length: 5 }).map((_, i) => (
									<Skeleton key={i} className={css({ h: '16', w: 'full' })} />
								))
							) : (
								blocks?.data.map((block) => (
									<div key={block.id} className={listItem()}>
										<div className={hstack({ gap: '4' })}>
											<div>
												<Link to={`/blocks/${block.id}`} className={css({ fontWeight: 'medium', _hover: { color: 'accent.default' } })}>
													Block #{block.id}
												</Link>
												<div className={css({ fontSize: 'sm', color: 'fg.muted' })}>
													{block.data?.block?.header?.time ? formatTimeAgo(block.data.block.header.time) : '-'}
												</div>
											</div>
										</div>
										<div className={css({ textAlign: 'right' })}>
											<div className={css({ fontSize: 'sm', color: 'fg.accent', fontWeight: 'medium' })}>
												{block.data?.txs?.length || 0} txs
											</div>
											<div className={css({ fontSize: 'xs', color: 'fg.muted', fontFamily: 'mono' })}>
												{formatHash(block.data?.block_id?.hash || block.data?.blockId?.hash || '', 6)}
											</div>
										</div>
									</div>
								))
							)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className={hstack({ justify: 'space-between' })}>
						<CardTitle>Recent Transactions</CardTitle>
						<Link to="/tx" className={hstack({ gap: '1', fontSize: 'sm', color: 'fg.default', _hover: { color: 'accent.default' } })}>
							View all <ArrowRight className={css({ w: 'icon.sm', h: 'icon.sm' })} />
						</Link>
					</CardHeader>
					<CardContent>
						<div className={vstack({ gap: '4' })}>
							{txLoading ? (
								Array.from({ length: 5 }).map((_, i) => (
									<Skeleton key={i} className={css({ h: '16', w: 'full' })} />
								))
							) : (
								transactions?.data.map((tx) => {
									const status = getTransactionStatus(tx.error)
									return (
										<div key={tx.id} className={listItem()}>
											<div className={hstack({ gap: '4' })}>
												<div>
													<Link to={`/tx/${tx.id}`} className={css({ fontWeight: 'medium', _hover: { color: 'accent.default' } })}>
														{formatHash(tx.id, 8)}
													</Link>
													<div className={css({ fontSize: 'sm', color: 'fg.muted' })}>
														{tx.timestamp ? formatTimeAgo(tx.timestamp) : 'Unavailable'}
													</div>
												</div>
											</div>
											<div className={css({ textAlign: 'right' })}>
												<Badge variant={tx.error ? 'destructive' : 'success'} className={css({ mb: '1' })}>
													{status.label}
												</Badge>
												<div className={css({ fontSize: 'xs', color: 'fg.muted', fontFamily: 'mono' })}>
													{tx.height ? `Block #${tx.height}` : 'Block unknown'}
												</div>
											</div>
										</div>
									)
								})
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
