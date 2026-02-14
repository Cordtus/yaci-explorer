import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState } from "react"
import { Outlet } from "react-router"

import { ErrorBoundary } from "@/components/common/ErrorBoundary"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { appConfig } from "@/config/app"
import { ChainProvider } from "@/contexts/ChainContext"
import { DenomProvider } from "@/contexts/DenomContext"
import { css } from "@/styled-system/css"

export default function Root() {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: appConfig.queries.staleTimeMs,
						gcTime: appConfig.queries.gcTimeMs,
						refetchOnWindowFocus: false
					}
				}
			})
	)

	return (
		<QueryClientProvider client={queryClient}>
			<ChainProvider>
				<DenomProvider>
					<div
						className={css({
							minH: "100vh",
							display: "flex",
							flexDir: "column",
							bg: "bg.subtle",
							color: "fg.default"
						})}
					>
						<Header />
						<main
							className={css({
								maxW: "7xl",
								mx: "auto",
								px: { base: "4", md: "6" },
								py: { base: "6", md: "8" },
								flex: "1",
								w: "full",
							})}
						>
							<ErrorBoundary>
								<Outlet />
							</ErrorBoundary>
						</main>
						<Footer />
					</div>
					<ReactQueryDevtools initialIsOpen={false} />
				</DenomProvider>
			</ChainProvider>
		</QueryClientProvider>
	)
}
