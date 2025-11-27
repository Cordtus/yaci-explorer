import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { FileCode2, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EvmNav } from '@/components/common/evm-nav'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { formatAddress } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { css } from '@/styled-system/css'

export default function EvmContractsPage() {
	const [page, setPage] = useState(0)
	const limit = 20

	const { data, isLoading, error } = useQuery({
		queryKey: ['evm-contracts', page],
		queryFn: () => api.getEvmContracts(limit, page * limit),
	})

	const hasData = data && data.length > 0

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
					<CardTitle>Deployed Contracts</CardTitle>
					<CardDescription>
						{hasData ? `Showing ${data.length} contracts` : 'No contracts deployed yet'}
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
							<FileCode2 className={css(styles.emptyIcon)} />
							<p>Error loading contracts</p>
						</div>
					) : !hasData ? (
						<div className={css(styles.emptyState)}>
							<FileCode2 className={css(styles.emptyIcon)} />
							<h3 className={css(styles.emptyTitle)}>No Contracts Yet</h3>
							<p className={css(styles.emptyText)}>
								No smart contracts have been deployed to this chain yet.
								Contracts will appear here once they are deployed.
							</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Address</TableHead>
									<TableHead>Name</TableHead>
									<TableHead>Creator</TableHead>
									<TableHead>Verified</TableHead>
									<TableHead>Created</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.map((contract) => (
									<TableRow key={contract.address}>
										<TableCell>
											<Link
												to={`/addr/${contract.address}`}
												className={css(styles.addressLink)}
											>
												<FileCode2 className={css(styles.contractIcon)} />
												<code>{formatAddress(contract.address, 8)}</code>
											</Link>
										</TableCell>
										<TableCell>
											{contract.name || (
												<span className={css(styles.mutedText)}>Unknown</span>
											)}
										</TableCell>
										<TableCell>
											{contract.creator ? (
												<Link
													to={`/addr/${contract.creator}`}
													className={css(styles.creatorLink)}
												>
													{formatAddress(contract.creator, 6)}
												</Link>
											) : (
												<span className={css(styles.mutedText)}>-</span>
											)}
										</TableCell>
										<TableCell>
											{contract.verified ? (
												<Badge variant="success">
													<CheckCircle className={css(styles.badgeIcon)} />
													Verified
												</Badge>
											) : (
												<Badge variant="secondary">
													<XCircle className={css(styles.badgeIcon)} />
													Unverified
												</Badge>
											)}
										</TableCell>
										<TableCell>
											<div className={css(styles.blockHeight)}>
												Block #{contract.creation_height.toLocaleString()}
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
	addressLink: {
		display: 'flex',
		alignItems: 'center',
		gap: '2',
		fontFamily: 'mono',
		fontSize: 'sm',
		_hover: {
			color: 'colorPalette',
		},
	},
	contractIcon: {
		height: '4',
		width: '4',
	},
	mutedText: {
		color: 'fg.muted',
	},
	creatorLink: {
		fontFamily: 'mono',
		fontSize: 'xs',
		_hover: {
			color: 'colorPalette',
		},
	},
	badgeIcon: {
		height: '3',
		width: '3',
		marginRight: '1',
	},
	blockHeight: {
		fontSize: 'sm',
		fontFamily: 'mono',
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
