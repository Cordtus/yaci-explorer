import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Vote } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination } from '@/components/ui/pagination'
import { api, type GovernanceProposal } from '@/lib/api'
import { formatTimeAgo, formatAddress } from '@/lib/utils'
import { css } from '@/styled-system/css'

const STATUSES = [
	'PROPOSAL_STATUS_DEPOSIT_PERIOD',
	'PROPOSAL_STATUS_VOTING_PERIOD',
	'PROPOSAL_STATUS_PASSED',
	'PROPOSAL_STATUS_REJECTED',
	'PROPOSAL_STATUS_FAILED',
]

function formatProposalStatus(status: string): string {
	return status.replace('PROPOSAL_STATUS_', '').replace(/_/g, ' ')
}

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' {
	if (status.includes('DEPOSIT_PERIOD')) return 'warning'
	if (status.includes('VOTING_PERIOD')) return 'default'
	if (status.includes('PASSED')) return 'success'
	if (status.includes('REJECTED') || status.includes('FAILED')) return 'destructive'
	return 'default'
}

export default function GovernancePage() {
	const [page, setPage] = useState(0)
	const [statusFilter, setStatusFilter] = useState<string>('all')

	const limit = 20

	const { data, isLoading, error } = useQuery({
		queryKey: ['governance-proposals', page, statusFilter],
		queryFn: () => api.getGovernanceProposals(limit, page * limit, statusFilter === 'all' ? undefined : statusFilter),
	})

	return (
		<div className={css(styles.container)}>
			<div className={css(styles.header)}>
				<div>
					<h1 className={css(styles.title)}>Governance Proposals</h1>
				</div>
				<Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(0) }}>
					<SelectTrigger className={css(styles.selectTrigger)}>
						<SelectValue placeholder="Filter by status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Statuses</SelectItem>
						{STATUSES.map((status) => (
							<SelectItem key={status} value={status}>
								{formatProposalStatus(status)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Proposals</CardTitle>
					<CardDescription>
						{data ? `Showing ${data.data.length} of ${data.pagination.total.toLocaleString()} proposals` : 'Loading...'}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>ID</TableHead>
								<TableHead>Title</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Proposer</TableHead>
								<TableHead>Submit Time</TableHead>
								<TableHead>Voting Period</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading ? (
								Array.from({ length: 10 }).map((_, i) => (
									<TableRow key={i}>
										<TableCell colSpan={6}>
											<Skeleton className={css(styles.skeletonRow)} />
										</TableCell>
									</TableRow>
								))
							) : error ? (
								<TableRow>
									<TableCell colSpan={6} className={css(styles.emptyCell)}>
										Error loading proposals
									</TableCell>
								</TableRow>
							) : data?.data.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6} className={css(styles.emptyCellWithPadding)}>
										No proposals found
									</TableCell>
								</TableRow>
							) : (
								data?.data.map((proposal: GovernanceProposal) => (
									<TableRow key={proposal.proposal_id}>
										<TableCell>
											<Link
												to={`/governance/${proposal.proposal_id}`}
												className={css(styles.proposalLink)}
											>
												<Vote className={css(styles.voteIcon)} />
												<span>#{proposal.proposal_id}</span>
											</Link>
										</TableCell>
										<TableCell>
											<div className={css(styles.titleCell)}>
												{proposal.title || 'Untitled Proposal'}
											</div>
										</TableCell>
										<TableCell>
											<Badge variant={getStatusBadgeVariant(proposal.status)}>
												{formatProposalStatus(proposal.status)}
											</Badge>
										</TableCell>
										<TableCell>
											{proposal.proposer ? (
												<code className={css(styles.proposerCode)}>{formatAddress(proposal.proposer)}</code>
											) : (
												<span className={css(styles.mutedText)}>-</span>
											)}
										</TableCell>
										<TableCell>
											<div className={css(styles.timeText)}>
												{formatTimeAgo(proposal.submit_time)}
											</div>
										</TableCell>
										<TableCell>
											<div className={css(styles.timeText)}>
												{proposal.voting_start_time && proposal.voting_end_time ? (
													<>
														{formatTimeAgo(proposal.voting_start_time)} - {formatTimeAgo(proposal.voting_end_time)}
													</>
												) : (
													<span className={css(styles.mutedText)}>N/A</span>
												)}
											</div>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>

					{data && data.pagination.total > 0 && (
						<Pagination
							currentPage={page}
							totalPages={Math.ceil(data.pagination.total / limit)}
							onPageChange={setPage}
							isLoading={isLoading}
						/>
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
		gap: '1.5rem'
	},
	header: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	title: {
		fontSize: '1.875rem',
		fontWeight: 'bold'
	},
	selectTrigger: {
		width: '250px'
	},
	skeletonRow: {
		height: '3rem',
		width: '100%'
	},
	emptyCell: {
		textAlign: 'center',
		color: 'fg.muted'
	},
	emptyCellWithPadding: {
		textAlign: 'center',
		color: 'fg.muted',
		paddingTop: '2rem',
		paddingBottom: '2rem'
	},
	proposalLink: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
		fontWeight: 'medium',
		_hover: {
			color: 'colorPalette.fg'
		}
	},
	voteIcon: {
		height: '1rem',
		width: '1rem'
	},
	titleCell: {
		maxWidth: '20rem',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap'
	},
	proposerCode: {
		fontSize: '0.75rem'
	},
	mutedText: {
		fontSize: '0.875rem',
		color: 'fg.muted'
	},
	timeText: {
		fontSize: '0.875rem'
	}
}
