import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { Outlet } from "react-router"

import { Header } from "@/components/layout/header"
import { appConfig } from "@/config/app"
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
			<DenomProvider>
				<div
					className={css({
						minH: "100vh",
						bg: "bg.subtle",
						color: "fg.default"
					})}
				>
					<Header />
					<main
						className={css({
							maxW: "6xl",
							mx: "auto",
							px: { base: "4", md: "6" },
							py: { base: "6", md: "8" }
						})}
					>
						<Outlet />
					</main>
				</div>
			</DenomProvider>
		</QueryClientProvider>
	)
}
