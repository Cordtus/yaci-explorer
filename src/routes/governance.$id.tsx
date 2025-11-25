import { useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Vote, Clock, User, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api } from '@/lib/api'
import { formatTimestamp, formatAddress } from '@/lib/utils'
import { useEffect, useState } from 'react'

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'success' | 'outline' {
	if (status.includes('PASSED') || status.includes('VOTING_PERIOD')) {
		return 'success'
	}
	if (status.includes('REJECTED') || status.includes('FAILED')) {
		return 'destructive'
	}
	if (status.includes('DEPOSIT_PERIOD')) {
		return 'secondary'
	}
	return 'outline'
}

function formatStatusLabel(status: string): string {
	return status.replace('PROPOSAL_STATUS_', '').replace(/_/g, ' ')
}

export default function GovernanceProposalDetailPage() {
	const [mounted, setMounted] = useState(false)
	const params = useParams()
	const proposalId = parseInt(params.id!)

	useEffect(() => {
		setMounted(true)
	}, [])

	const { data: proposal, isLoading: proposalLoading, error } = useQuery({
		queryKey: ['proposal', proposalId],
		queryFn: async () => {
			const result = await api.getProposalDetail(proposalId)
			return result
		},
		enabled: mounted && !isNaN(proposalId),
	})

	const { data: snapshots, isLoading: snapshotsLoading } = useQuery({
		queryKey: ['proposalSnapshots', proposalId],
		queryFn: async () => {
			const result = await api.getProposalSnapshots(proposalId)
			return result
		},
		enabled: mounted && !isNaN(proposalId),
	})

	if (mounted && error) {
		return (
			<div className="space-y-4">
				<Link to="/governance" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
					<ArrowLeft className="h-4 w-4" />
					Back to Governance
				</Link>
				<Card>
					<CardContent className="pt-6">
						<div className="text-center py-12">
							<Vote className="h-12 w-12 text-red-500 mx-auto mb-4" />
							<h2 className="text-2xl font-bold text-red-600 mb-2">Proposal Not Found</h2>
							<p className="text-muted-foreground mb-4">
								The requested governance proposal could not be found.
							</p>
							<p className="text-sm text-red-500">{String(error)}</p>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	if (!mounted || proposalLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-64 w-full" />
				<Skeleton className="h-96 w-full" />
			</div>
		)
	}

	if (!proposal) {
		return null
	}

	const yesCount = parseFloat(proposal.tally.yes || '0')
	const noCount = parseFloat(proposal.tally.no || '0')
	const abstainCount = parseFloat(proposal.tally.abstain || '0')
	const noWithVetoCount = parseFloat(proposal.tally.no_with_veto || '0')
	const totalVotes = yesCount + noCount + abstainCount + noWithVetoCount

	const yesPercent = totalVotes > 0 ? (yesCount / totalVotes) * 100 : 0
	const noPercent = totalVotes > 0 ? (noCount / totalVotes) * 100 : 0
	const abstainPercent = totalVotes > 0 ? (abstainCount / totalVotes) * 100 : 0
	const noWithVetoPercent = totalVotes > 0 ? (noWithVetoCount / totalVotes) * 100 : 0

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<Link to="/governance" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
					<ArrowLeft className="h-4 w-4" />
					Back to Governance
				</Link>
				<div className="flex items-center gap-3 mb-2">
					<h1 className="text-3xl font-bold">Proposal #{proposalId}</h1>
					<Badge variant={getStatusBadgeVariant(proposal.status)}>
						{formatStatusLabel(proposal.status)}
					</Badge>
				</div>
				{proposal.title && (
					<h2 className="text-xl text-muted-foreground">{proposal.title}</h2>
				)}
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Main Content */}
				<div className="lg:col-span-2 space-y-6">
					{/* Summary */}
					{proposal.summary && (
						<Card>
							<CardHeader>
								<CardTitle>Summary</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm whitespace-pre-wrap">{proposal.summary}</p>
							</CardContent>
						</Card>
					)}

					{/* Vote Tally */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Vote className="h-5 w-5" />
								Vote Tally
							</CardTitle>
							<CardDescription>
								{totalVotes > 0 ? `${totalVotes.toLocaleString()} total votes` : 'No votes yet'}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{/* Yes */}
								<div>
									<div className="flex justify-between mb-2">
										<span className="text-sm font-medium">Yes</span>
										<span className="text-sm text-muted-foreground">
											{yesPercent.toFixed(2)}% ({yesCount.toLocaleString()})
										</span>
									</div>
									<div className="w-full h-4 bg-muted rounded-full overflow-hidden">
										<div
											className="h-full bg-green-500 transition-all duration-300"
											style={{ width: `${yesPercent}%` }}
										/>
									</div>
								</div>

								{/* No */}
								<div>
									<div className="flex justify-between mb-2">
										<span className="text-sm font-medium">No</span>
										<span className="text-sm text-muted-foreground">
											{noPercent.toFixed(2)}% ({noCount.toLocaleString()})
										</span>
									</div>
									<div className="w-full h-4 bg-muted rounded-full overflow-hidden">
										<div
											className="h-full bg-red-500 transition-all duration-300"
											style={{ width: `${noPercent}%` }}
										/>
									</div>
								</div>

								{/* Abstain */}
								<div>
									<div className="flex justify-between mb-2">
										<span className="text-sm font-medium">Abstain</span>
										<span className="text-sm text-muted-foreground">
											{abstainPercent.toFixed(2)}% ({abstainCount.toLocaleString()})
										</span>
									</div>
									<div className="w-full h-4 bg-muted rounded-full overflow-hidden">
										<div
											className="h-full bg-gray-400 transition-all duration-300"
											style={{ width: `${abstainPercent}%` }}
										/>
									</div>
								</div>

								{/* No with Veto */}
								<div>
									<div className="flex justify-between mb-2">
										<span className="text-sm font-medium">No with Veto</span>
										<span className="text-sm text-muted-foreground">
											{noWithVetoPercent.toFixed(2)}% ({noWithVetoCount.toLocaleString()})
										</span>
									</div>
									<div className="w-full h-4 bg-muted rounded-full overflow-hidden">
										<div
											className="h-full bg-orange-500 transition-all duration-300"
											style={{ width: `${noWithVetoPercent}%` }}
										/>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Historical Snapshots */}
					{snapshots && snapshots.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle>Historical Snapshots</CardTitle>
								<CardDescription>
									Vote tally captured at different points in time
								</CardDescription>
							</CardHeader>
							<CardContent>
								{snapshotsLoading ? (
									<div className="space-y-2">
										{Array.from({ length: 3 }).map((_, i) => (
											<Skeleton key={i} className="h-12 w-full" />
										))}
									</div>
								) : (
									<div className="overflow-x-auto">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Timestamp</TableHead>
													<TableHead>Status</TableHead>
													<TableHead className="text-right">Yes</TableHead>
													<TableHead className="text-right">No</TableHead>
													<TableHead className="text-right">Abstain</TableHead>
													<TableHead className="text-right">No w/ Veto</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{snapshots.map((snapshot, idx) => {
													const yes = parseFloat(snapshot.yes_count)
													const no = parseFloat(snapshot.no_count)
													const abstain = parseFloat(snapshot.abstain_count)
													const veto = parseFloat(snapshot.no_with_veto_count)

													return (
														<TableRow key={idx}>
															<TableCell className="font-mono text-xs">
																{formatTimestamp(snapshot.snapshot_time)}
															</TableCell>
															<TableCell>
																<Badge variant="outline" className="text-xs">
																	{formatStatusLabel(snapshot.status)}
																</Badge>
															</TableCell>
															<TableCell className="text-right text-sm">
																{yes.toLocaleString()}
															</TableCell>
															<TableCell className="text-right text-sm">
																{no.toLocaleString()}
															</TableCell>
															<TableCell className="text-right text-sm">
																{abstain.toLocaleString()}
															</TableCell>
															<TableCell className="text-right text-sm">
																{veto.toLocaleString()}
															</TableCell>
														</TableRow>
													)
												})}
											</TableBody>
										</Table>
									</div>
								)}
							</CardContent>
						</Card>
					)}
				</div>

				{/* Sidebar */}
				<div className="space-y-6">
					{/* Timeline */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Clock className="h-5 w-5" />
								Timeline
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div>
									<label className="text-sm font-medium text-muted-foreground">Submit Time</label>
									<p className="text-sm">{formatTimestamp(proposal.submit_time)}</p>
								</div>

								<Separator />

								{proposal.deposit_end_time && (
									<>
										<div>
											<label className="text-sm font-medium text-muted-foreground">Deposit End Time</label>
											<p className="text-sm">{formatTimestamp(proposal.deposit_end_time)}</p>
										</div>
										<Separator />
									</>
								)}

								{proposal.voting_start_time && (
									<>
										<div>
											<label className="text-sm font-medium text-muted-foreground">Voting Start Time</label>
											<p className="text-sm">{formatTimestamp(proposal.voting_start_time)}</p>
										</div>
										<Separator />
									</>
								)}

								{proposal.voting_end_time && (
									<div>
										<label className="text-sm font-medium text-muted-foreground">Voting End Time</label>
										<p className="text-sm">{formatTimestamp(proposal.voting_end_time)}</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Proposer */}
					{proposal.proposer && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<User className="h-5 w-5" />
									Proposer
								</CardTitle>
							</CardHeader>
							<CardContent>
								<Link
									to={`/addr/${proposal.proposer}`}
									className="font-mono text-sm text-primary hover:text-primary/80 break-all"
								>
									{formatAddress(proposal.proposer, 12)}
								</Link>
							</CardContent>
						</Card>
					)}

					{/* Metadata */}
					<Card>
						<CardHeader>
							<CardTitle>Details</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<div className="flex justify-between">
									<span className="text-muted-foreground">Proposal ID</span>
									<span className="font-medium">#{proposalId}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Status</span>
									<Badge variant={getStatusBadgeVariant(proposal.status)} className="text-xs">
										{formatStatusLabel(proposal.status)}
									</Badge>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Last Updated</span>
									<span className="text-sm">{formatTimestamp(proposal.last_updated)}</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
