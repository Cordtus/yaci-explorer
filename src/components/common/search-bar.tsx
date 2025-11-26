import { Loader2, Search } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { api } from "@/lib/api"
import { css, cx } from "@/styled-system/css"

/**
 * Universal search bar component for searching blocks, transactions, and addresses
 * Supports keyboard shortcut (Cmd/Ctrl+K) to focus the search input
 * Automatically detects query type and navigates to appropriate detail page
 *
 * @example
 * <SearchBar />
 */
export function SearchBar() {
	const [query, setQuery] = useState("")
	const [isSearching, setIsSearching] = useState(false)
	const [isOpen, setIsOpen] = useState(false)
	const navigate = useNavigate()
	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault()
				inputRef.current?.focus()
				setIsOpen(true)
			}
		}

		document.addEventListener("keydown", handleKeyDown)
		return () => document.removeEventListener("keydown", handleKeyDown)
	}, [])

	/**
	 * Handles search execution when user submits a query
	 * Determines query type (block, transaction, or address) and navigates to appropriate page
	 */
	const handleSearch = async () => {
		if (!query.trim()) return

		setIsSearching(true)
		try {
			const results = await api.search(query)

			if (results.length === 0) {
				console.log("No results found")
				return
			}

			const result = results[0]

			switch (result.type) {
				case "block":
					navigate(`/blocks/${result.value.id}`)
					break
				case "transaction":
					navigate(`/transactions/${result.value.id}`)
					break
				case "evm_transaction":
					// EVM hash search - navigate to tx with EVM view enabled
					navigate(`/transactions/${result.value.tx_id}?evm=true`)
					break
				case "address":
					navigate(`/addr/${result.value.address}`)
					break
				default:
					console.error("Unknown result type")
			}

			setQuery("")
			setIsOpen(false)
		} catch (error) {
			console.error("Search failed:", error)
		} finally {
			setIsSearching(false)
		}
	}

	return (
		<div className={css({ position: "relative" })}>
			<div className={css({ position: "relative" })}>
				<input
					ref={inputRef}
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							handleSearch()
						}
					}}
					onFocus={() => setIsOpen(true)}
					onBlur={() => setTimeout(() => setIsOpen(false), 200)}
					placeholder="Search by block, tx, address..."
					className={cx(
						css({
							h: "9",
							w: { base: "200px", lg: "300px" },
							rounded: "md",
							borderWidth: "1px",
							borderColor: "border.default",
							bg: "bg.default",
							px: "3",
							py: "1",
							fontSize: "sm",
							boxShadow: "sm",
							transitionProperty: "colors",
							transitionDuration: "normal",
							pr: "20",
							_placeholder: { color: "fg.muted" },
							_focusVisible: {
								outline: "none",
								ringWidth: "1px",
								ringColor: "colorPalette.default"
							},
							_disabled: { cursor: "not-allowed", opacity: 0.5 }
						})
					)}
				/>
				<div
					className={css({
						position: "absolute",
						right: "0",
						top: "0",
						display: "flex",
						h: "9",
						alignItems: "center",
						pr: "3"
					})}
				>
					{isSearching ? (
						<Loader2
							className={css({
								h: "4",
								w: "4",
								color: "fg.muted",
								animation: "spin 1s linear infinite"
							})}
						/>
					) : (
						<>
							<Search
								className={css({ h: "4", w: "4", color: "fg.muted", mr: "2" })}
							/>
							<kbd
								className={css({
									pointerEvents: "none",
									display: "inline-flex",
									h: "5",
									alignItems: "center",
									gap: "1",
									rounded: "md",
									borderWidth: "1px",
									bg: "bg.muted",
									px: "1.5",
									fontFamily: "mono",
									fontSize: "10px",
									fontWeight: "medium",
									color: "fg.muted"
								})}
							>
								<span className={css({ fontSize: "xs" })}>⌘</span>K
							</kbd>
						</>
					)}
				</div>
			</div>

			{isOpen && query && (
				<div
					className={css({
						position: "absolute",
						top: "10",
						w: "full",
						rounded: "md",
						borderWidth: "1px",
						bg: "bg.default",
						p: "2",
						boxShadow: "md"
					})}
				>
					<div className={css({ fontSize: "xs", color: "fg.muted" })}>
						Press Enter to search
					</div>
				</div>
			)}
		</div>
	)
}
						</>
					)}
				</div>
			</div>

			{isOpen && query && (
				<div
					className={css({
						position: "absolute",
						top: "10",
						w: "full",
						rounded: "md",
						borderWidth: "1px",
						bg: "bg.default",
						p: "2",
						boxShadow: "md"
					})}
				>
					<div className={css({ fontSize: "xs", color: "fg.muted" })}>
						Press Enter to search
					</div>
				</div>
			)}
		</div>
	)
}
