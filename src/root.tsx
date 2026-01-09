import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { Outlet } from "react-router"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { appConfig } from "@/config/app"
import { DenomProvider } from "@/contexts/DenomContext"
import { FeatureFlagsProvider } from "@/contexts/FeatureFlagsContext"
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
				<FeatureFlagsProvider>
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
									maxW: "6xl",
									mx: "auto",
									w: "full",
									px: { base: "4", md: "6" },
									py: { base: "6", md: "8" }
								})}
							>
								<Outlet />
							</main>
							<Footer />
						</div>
					</DenomProvider>
				</FeatureFlagsProvider>
			</ThemeProvider>
		</QueryClientProvider>
	)
}
