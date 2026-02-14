import { type ReactNode, useState } from "react"
import {
	type ColumnDef,
	type SortingState,
	type VisibilityState,
	type OnChangeFn,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	getPaginationRowModel,
	useReactTable,
} from "@tanstack/react-table"
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from "lucide-react"
import { css } from "@/styled-system/css"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 200]

interface DataTableProps<T> {
	/** TanStack Table column definitions */
	columns: ColumnDef<T, any>[]
	/** Row data array (all data for client-side, or current page for server-side) */
	data: T[]
	/** Controlled sorting state */
	sorting?: SortingState
	/** Sorting state change handler */
	onSortingChange?: OnChangeFn<SortingState>
	/** Rows per page */
	pageSize?: number
	/** Page size change handler */
	onPageSizeChange?: (size: number) => void
	/** Available page size options */
	pageSizeOptions?: number[]
	/** Show skeleton rows while loading */
	isLoading?: boolean
	/** Custom empty state content */
	emptyState?: ReactNode
	/** Max height for scrollable body (default: "calc(100vh - 320px)") */
	maxHeight?: string
	/** Stable row key accessor */
	getRowId?: (row: T) => string
	/** Column visibility map (e.g. { _activeRank: false } to hide sort-only columns) */
	columnVisibility?: VisibilityState
	/**
	 * Server-side pagination: total number of rows across all pages.
	 * When set, DataTable uses external pagination instead of client-side.
	 */
	totalRows?: number
	/** Server-side pagination: current 0-based page index */
	currentPage?: number
	/** Server-side pagination: page change callback (0-based index) */
	onPageChange?: (page: number) => void
	/** Hide the pagination footer entirely */
	hidePagination?: boolean
}

/**
 * Reusable data table wrapping TanStack Table with existing UI components.
 *
 * Two pagination modes:
 * - **Client-side** (default): pass all data, DataTable paginates internally
 * - **Server-side**: pass `totalRows`, `currentPage`, `onPageChange` and
 *   provide only the current page's data in `data`
 */
export function DataTable<T>({
	columns,
	data,
	sorting,
	onSortingChange,
	pageSize = 50,
	onPageSizeChange,
	pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
	isLoading = false,
	emptyState,
	maxHeight = "calc(100vh - 320px)",
	getRowId,
	columnVisibility,
	totalRows: externalTotalRows,
	currentPage: externalCurrentPage,
	onPageChange,
	hidePagination = false,
}: DataTableProps<T>) {
	const isServerSide = externalTotalRows !== undefined
	const [pageIndex, setPageIndex] = useState(0)

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			pagination: isServerSide
				? { pageIndex: 0, pageSize: data.length || pageSize }
				: { pageIndex, pageSize },
			columnVisibility,
		},
		onSortingChange,
		onPaginationChange: (updater) => {
			if (!isServerSide && typeof updater === "function") {
				const next = updater({ pageIndex, pageSize })
				setPageIndex(next.pageIndex)
			}
		},
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		...(isServerSide ? {} : { getPaginationRowModel: getPaginationRowModel() }),
		getRowId: getRowId as ((row: T, index: number, parent?: { id: string }) => string) | undefined,
	})

	const visibleColumns = table.getVisibleFlatColumns()

	const totalRows = isServerSide ? externalTotalRows : data.length
	const pageCount = Math.ceil(totalRows / pageSize)
	const currentPage = isServerSide ? (externalCurrentPage ?? 0) : table.getState().pagination.pageIndex
	const canPrevious = isServerSide ? currentPage > 0 : table.getCanPreviousPage()
	const canNext = isServerSide ? currentPage < pageCount - 1 : table.getCanNextPage()

	const handlePrevious = () => {
		if (isServerSide) {
			onPageChange?.(currentPage - 1)
		} else {
			table.previousPage()
		}
	}

	const handleNext = () => {
		if (isServerSide) {
			onPageChange?.(currentPage + 1)
		} else {
			table.nextPage()
		}
	}

	return (
		<div className={css({ display: "flex", flexDirection: "column" })}>
			<div
				className={css({
					overflow: "auto",
					maxHeight,
					position: "relative",
				})}
			>
				<Table>
					<TableHeader
						className={css({
							position: "sticky",
							top: 0,
							zIndex: 10,
							bg: "bg.default",
						})}
					>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									const canSort = header.column.getCanSort()
									const sorted = header.column.getIsSorted()
									return (
										<TableHead
											key={header.id}
											onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
											className={css({
												whiteSpace: "nowrap",
												...(canSort
													? {
															cursor: "pointer",
															userSelect: "none",
															_hover: { color: "accent.default" },
														}
													: {}),
											})}
											style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
										>
											<span
												className={css({
													display: "inline-flex",
													alignItems: "center",
													gap: "1",
												})}
											>
												{header.isPlaceholder
													? null
													: flexRender(header.column.columnDef.header, header.getContext())}
												{sorted === "asc" && (
													<ArrowUp className={css({ h: "3.5", w: "3.5" })} />
												)}
												{sorted === "desc" && (
													<ArrowDown className={css({ h: "3.5", w: "3.5" })} />
												)}
											</span>
										</TableHead>
									)
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{isLoading ? (
							Array.from({ length: Math.min(pageSize, 10) }).map((_, i) => (
								<TableRow key={`skeleton-${i}`}>
									{visibleColumns.map((col) => (
										<TableCell key={col.id}>
											<Skeleton className={css({ h: "5", w: "full" })} />
										</TableCell>
									))}
								</TableRow>
							))
						) : table.getRowModel().rows.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={visibleColumns.length}
									className={css({ textAlign: "center", py: "12", color: "fg.muted" })}
								>
									{emptyState ?? "No results."}
								</TableCell>
							</TableRow>
						) : (
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{!hidePagination && (
				<div
					className={css({
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: "4",
						pt: "4",
						flexWrap: "wrap",
					})}
				>
					<div className={css({ display: "flex", alignItems: "center", gap: "2" })}>
						<span className={css({ fontSize: "sm", color: "fg.muted", whiteSpace: "nowrap" })}>
							Rows per page
						</span>
						<select
							value={pageSize}
							onChange={(e) => {
								const newSize = Number(e.target.value)
								onPageSizeChange?.(newSize)
								if (!isServerSide) {
									setPageIndex(0)
								} else {
									onPageChange?.(0)
								}
							}}
							className={css({
								h: "9",
								w: "18",
								fontSize: "sm",
								bg: "bg.default",
								color: "fg.default",
								borderWidth: "1px",
								borderColor: "border.default",
								rounded: "md",
								px: "2",
								cursor: "pointer",
								_focus: { outline: "none", ringWidth: "2", ringColor: "accent.default" },
							})}
						>
							{pageSizeOptions.map((size) => (
								<option key={size} value={size}>
									{size}
								</option>
							))}
						</select>
						<span className={css({ fontSize: "sm", color: "fg.muted" })}>
							{totalRows.toLocaleString()} total
						</span>
					</div>

					{pageCount > 1 && (
						<div className={css({ display: "flex", alignItems: "center", gap: "2" })}>
							<Button
								variant="outline"
								size="sm"
								disabled={!canPrevious || isLoading}
								onClick={handlePrevious}
								className={css({ gap: "1" })}
							>
								<ChevronLeft className={css({ h: "4", w: "4" })} />
								Previous
							</Button>
							<span className={css({ fontSize: "sm", color: "fg.muted", whiteSpace: "nowrap" })}>
								Page {currentPage + 1} of {pageCount.toLocaleString()}
							</span>
							<Button
								variant="outline"
								size="sm"
								disabled={!canNext || isLoading}
								onClick={handleNext}
								className={css({ gap: "1" })}
							>
								Next
								<ChevronRight className={css({ h: "4", w: "4" })} />
							</Button>
						</div>
					)}
				</div>
			)}
		</div>
	)
}
