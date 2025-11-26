import { useQuery } from "@tanstack/react-query"
import { Blocks, Filter, X } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pagination } from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "@/components/ui/table"
import { api } from "@/lib/api"
import {
	formatHash,
	formatNumber,
	formatTimeAgo,
	formatTimestamp
} from "@/lib/utils"
import { css } from "../../styled-system/css"

export default function BlocksPage() {
	const [page, setPage] = useState(0)
	const [showFilters, setShowFilters] = useState(false)
	const [minTxCount, setMinTxCount] = useState<string>("")
	const [fromDate, setFromDate] = useState<string>("")
	const [toDate, setToDate] = useState<string>("")
	const limit = 20

	const hasActiveFilters = minTxCount || fromDate || toDate

	const { data, isLoading, error } = useQuery({
		queryKey: ["blocks", page, minTxCount, fromDate, toDate],
		queryFn: () =>
			hasActiveFilters
				? api.getBlocksPaginated(limit, page * limit, {
						minTxCount: minTxCount ? parseInt(minTxCount) : undefined,
						fromDate: fromDate || undefined,
						toDate: toDate || undefined
					})
				: api.getBlocks(limit, page * limit)
	})

	const clearFilters = () => {
		setMinTxCount("")
		setFromDate("")
		setToDate("")
		setPage(0)
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className={styles.title}>Blocks</h1>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Recent Blocks</CardTitle>
					<CardDescription>
						Showing {data?.data.length || 0} blocks
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Height</TableHead>
								<TableHead>Block Hash</TableHead>
								<TableHead>Time</TableHead>
								<TableHead>Transactions</TableHead>
								<TableHead>Proposer</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading ? (
								Array.from({ length: 10 }).map((_, i) => (
									<TableRow key={i}>
										<TableCell colSpan={4}>
											<Skeleton className={css({ h: "12", w: "full" })} />
										</TableCell>
									</TableRow>
								))
							) : error ? (
								<TableRow>
									<TableCell colSpan={4} className={styles.mutedCentered}>
										Error loading blocks
									</TableCell>
								</TableRow>
							) : data?.data.length === 0 ? (
								<TableRow>
									<TableCell colSpan={4} className={styles.mutedCentered}>
										No blocks found
									</TableCell>
								</TableRow>
							) : (
								data?.data.map((block) => (
									<TableRow key={block.id}>
										<TableCell>
											<Link
												to={`/blocks/${block.id}`}
												className="flex items-center gap-2 font-medium hover:text-primary"
											>
												<Blocks className="h-4 w-4" />
												{formatNumber(block.id)}
											</Link>
										</TableCell>
										<TableCell>
											<code className="text-xs">
												{formatHash(
													block.data?.block_id?.hash ||
														block.data?.blockId?.hash ||
														"",
													12
												)}
											</code>
										</TableCell>
										<TableCell>
											<div>
												<div className="text-sm">
													{formatTimeAgo(block.data.block.header.time)}
												</div>
												<div className="text-xs text-muted-foreground">
													{formatTimestamp(block.data.block.header.time)}
												</div>
											</div>
										</TableCell>
										<TableCell>
											<Badge variant="secondary">
												{block.data?.txs?.length || 0} txs
											</Badge>
										</TableCell>
										<TableCell>
											<code className="text-xs">
												{formatHash(
													block.data.block.header.proposer_address,
													8
												)}
											</code>
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
	page: css({
		display: "flex",
		flexDirection: "column",
		gap: "6"
	}),
	headerRow: css({
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between"
	}),
	title: css({
		fontSize: "3xl",
		fontWeight: "bold",
		lineHeight: "short"
	}),
	subtitle: css({
		color: "fg.muted"
	}),
	mutedCentered: css({
		textAlign: "center",
		color: "fg.muted"
	}),
	blockLink: css({
		display: "inline-flex",
		alignItems: "center",
		gap: "2",
		fontWeight: "medium",
		color: "fg.default",
		letterSpacing: "-0.01em",
		_hover: { color: "colorPalette.default" }
	}),
	th: css({
		fontSize: "xs",
		fontWeight: "semibold",
		textTransform: "uppercase",
		letterSpacing: "widest",
		color: "fg.subtle"
	}),
	iconXs: css({
		h: "4",
		w: "4"
	}),
	code: css({
		fontFamily: "mono",
		fontSize: "xs"
	}),
	textSm: css({
		fontSize: "sm"
	}),
	metaText: css({
		fontSize: "xs",
		color: "fg.muted"
	})
}
