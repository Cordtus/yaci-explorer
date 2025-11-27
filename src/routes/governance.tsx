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
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Governance Proposals</h1>
				</div>
				<Select value={statusFilter || 'all'} onValueChange={(value) => { setStatusFilter(value === 'all' ? '' : value); setPage(0) }}>
					<SelectTrigger className="w-[250px]">
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
											<Skeleton className="h-12 w-full" />
										</TableCell>
									</TableRow>
								))
							) : error ? (
								<TableRow>
									<TableCell colSpan={6} className="text-center text-muted-foreground">
										Error loading proposals
									</TableCell>
								</TableRow>
							) : data?.data.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6} className="text-center text-muted-foreground py-8">
										No proposals found
									</TableCell>
								</TableRow>
							) : (
								data?.data.map((proposal: GovernanceProposal) => (
									<TableRow key={proposal.proposal_id}>
										<TableCell>
											<Link
												to={`/governance/${proposal.proposal_id}`}
												className="flex items-center gap-2 font-medium hover:text-primary"
											>
												<Vote className="h-4 w-4" />
												<span>#{proposal.proposal_id}</span>
											</Link>
										</TableCell>
										<TableCell>
											<div className="max-w-md truncate">
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
												<code className="text-xs">{formatAddress(proposal.proposer)}</code>
											) : (
												<span className="text-sm text-muted-foreground">-</span>
											)}
										</TableCell>
										<TableCell>
											<div className="text-sm">
												{formatTimeAgo(proposal.submit_time)}
											</div>
										</TableCell>
										<TableCell>
											<div className="text-sm">
												{proposal.voting_start_time && proposal.voting_end_time ? (
													<>
														{formatTimeAgo(proposal.voting_start_time)} - {formatTimeAgo(proposal.voting_end_time)}
													</>
												) : (
													<span className="text-muted-foreground">N/A</span>
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
