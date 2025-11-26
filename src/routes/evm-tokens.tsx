import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Coins } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EvmNav } from '@/components/common/evm-nav'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { formatAddress, formatNumber, formatTimestamp, formatTimeAgo } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { css } from '@/styled-system/css'

export default function EvmTokensPage() {
	const [page, setPage] = useState(0)
	const limit = 20

	const { data, isLoading, error } = useQuery({
		queryKey: ['evm-tokens', page],
		queryFn: () => api.getEvmTokens(limit, page * limit),
	})

	const hasData = data && data.length > 0

	const formatTokenType = (type: string | null) => {
		if (!type) return 'Unknown'
		switch (type.toUpperCase()) {
			case 'ERC20':
				return 'ERC-20'
			case 'ERC721':
				return 'ERC-721 (NFT)'
			case 'ERC1155':
				return 'ERC-1155'
			default:
				return type
		}
	}

	const formatSupply = (supply: string | null, decimals: number | null) => {
		if (!supply) return '-'
		const dec = decimals || 18
		const value = BigInt(supply)
		const divisor = BigInt(10 ** dec)
		const whole = value / divisor
		return formatNumber(whole.toString())
	}

	return (
		<div className={css(styles.container)}>
			<div className={css(styles.header)}>
				<div>
					<h1 className={css(styles.title)}>EVM</h1>
					<p className={css(styles.subtitle)}>Smart contracts and tokens on the EVM</p>
				</div>
			</div>

			<EvmNav />

			<Card>
				<CardHeader>
					<CardTitle>Token Registry</CardTitle>
					<CardDescription>
						{hasData ? `Showing ${data.length} tokens` : 'No tokens registered yet'}
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
							<Coins className={css(styles.emptyIcon)} />
							<p>Error loading tokens</p>
						</div>
					) : !hasData ? (
						<div className={css(styles.emptyState)}>
							<Coins className={css(styles.emptyIcon)} />
							<h3 className={css(styles.emptyTitle)}>No Tokens Yet</h3>
							<p className={css(styles.emptyText)}>
								No EVM tokens have been detected on this chain yet.
								Tokens will appear here once they are deployed and interacted with.
							</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Token</TableHead>
									<TableHead>Address</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Total Supply</TableHead>
									<TableHead>Last Updated</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.map((token) => (
									<TableRow key={token.address}>
										<TableCell>
											<div className={css(styles.tokenInfo)}>
												<Coins className={css(styles.tokenIcon)} />
												<div>
													<div className={css(styles.tokenName)}>
														{token.name || 'Unknown Token'}
													</div>
													{token.symbol && (
														<div className={css(styles.tokenSymbol)}>
															{token.symbol}
														</div>
													)}
												</div>
											</div>
										</TableCell>
										<TableCell>
											<Link
												to={`/addr/${token.address}`}
												className={css(styles.addressLink)}
											>
												<code>{formatAddress(token.address, 8)}</code>
											</Link>
										</TableCell>
										<TableCell>
											<Badge variant="secondary">
												{formatTokenType(token.token_type)}
											</Badge>
										</TableCell>
										<TableCell>
											<div className={css(styles.supplyInfo)}>
												<span>{formatSupply(token.total_supply, token.decimals)}</span>
												{token.decimals !== null && (
													<span className={css(styles.decimals)}>
														({token.decimals} decimals)
													</span>
												)}
											</div>
										</TableCell>
										<TableCell>
											<div>
												<div className={css(styles.timeAgo)}>
													{formatTimeAgo(token.updated_at)}
												</div>
												<div className={css(styles.timestamp)}>
													{formatTimestamp(token.updated_at)}
												</div>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}

					{hasData && data.length >= limit && (
						<div className={css(styles.pagination)}>
							<Button
								variant="outline"
								size="sm"
								disabled={page === 0}
								onClick={() => setPage(p => p - 1)}
							>
								Previous
							</Button>
							<span className={css(styles.pageInfo)}>Page {page + 1}</span>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage(p => p + 1)}
							>
								Next
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
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
	tokenInfo: {
		display: 'flex',
		alignItems: 'center',
		gap: '3',
	},
	tokenIcon: {
		height: '5',
		width: '5',
		color: 'fg.muted',
	},
	tokenName: {
		fontWeight: 'medium',
	},
	tokenSymbol: {
		fontSize: 'xs',
		color: 'fg.muted',
	},
	addressLink: {
		fontFamily: 'mono',
		fontSize: 'sm',
		_hover: {
			color: 'colorPalette',
		},
	},
	supplyInfo: {
		display: 'flex',
		flexDirection: 'column',
		gap: '0.5',
	},
	decimals: {
		fontSize: 'xs',
		color: 'fg.muted',
	},
	timeAgo: {
		fontSize: 'sm',
	},
	timestamp: {
		fontSize: 'xs',
		color: 'fg.muted',
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
}
