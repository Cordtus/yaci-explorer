import React from "react"
import ReactDOM from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router"
import { loggingMiddleware } from "./lib/middleware/logging"
import { loadConfig } from "./lib/env"
import Root from "./root"
import AddressPage from "./routes/addr.$id"
import AnalyticsPage from "./routes/analytics"
import BlocksPage from "./routes/blocks"
import BlockDetailPage from "./routes/blocks.$id"
import EvmContractsPage from "./routes/evm-contracts"
import EvmTokensPage from "./routes/evm-tokens"
import GovernancePage from "./routes/governance"
import GovernanceDetailPage from "./routes/governance.$id"
import HomePage from "./routes/home"
import TransactionsPage from "./routes/transactions"
import TransactionDetailPage from "./routes/transactions.$hash"

const router = createBrowserRouter([
	{
		path: "/",
		element: <Root />,
		middleware: [loggingMiddleware],
		children: [
			{ index: true, element: <HomePage /> },
			{
				path: "blocks",
				children: [
					{ index: true, element: <BlocksPage /> },
					{ path: ":id", element: <BlockDetailPage /> }
				]
			},
			{
				path: "tx",
				children: [
					{ index: true, element: <TransactionsPage /> },
					{ path: ":hash", element: <TransactionDetailPage /> }
				]
			},
			{ path: "analytics", element: <AnalyticsPage /> },
			{ path: "addr/:id", element: <AddressPage /> },
			{
				path: "governance",
				children: [
					{ index: true, element: <GovernancePage /> },
					{ path: ":id", element: <GovernanceDetailPage /> }
				]
			},
			{
				path: "evm",
				children: [
					{ path: "contracts", element: <EvmContractsPage /> },
					{ path: "tokens", element: <EvmTokensPage /> }
				]
			}
		]
	}
])

async function bootstrap() {
	await loadConfig()

	const rootElement = document.getElementById("root")
	if (!rootElement) {
		throw new Error("Root element #root not found")
	}

	ReactDOM.createRoot(rootElement).render(
		<React.StrictMode>
			<RouterProvider router={router} />
		</React.StrictMode>
	)
}

bootstrap()
