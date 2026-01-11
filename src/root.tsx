import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { Outlet } from "react-router"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { appConfig } from "@/config/app"
import { ChainProvider } from "@/contexts/ChainContext"
import { DenomProvider } from "@/contexts/DenomContext"
import { ThemeProvider } from "@/contexts/ThemeContext"
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
			<ThemeProvider>
				<ChainProvider>
					<DenomProvider>
					<div
						className={css({
							minH: "100vh",
							display: "flex",
							flexDirection: "column",
							bg: "bg.subtle",
							color: "fg.default"
						})}
					>
						<Header />
						<main
							className={css({
								flex: "1",
								w: "full",
								maxW: "7xl",
								mx: "auto",
								px: { base: "4", md: "6" },
								py: { base: "4", md: "6" }
							})}
						>
							<Outlet />
						</main>
						<Footer />
					</div>
					</DenomProvider>
				</ChainProvider>
			</ThemeProvider>
		</QueryClientProvider>
	)
}
