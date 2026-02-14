import React from "react"
import ReactDOM from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router"
import { loadConfig } from "@/lib/env"
import { loggingMiddleware } from "./lib/middleware/logging"
import Root from "./root"
import { AddressPage } from "./routes/addr.$id"
import { AnalyticsPage } from "./routes/analytics"
import BlocksRoute from "./routes/blocks"
import BlockDetailRoute from "./routes/blocks.$id"
import { GovernancePage } from "./routes/governance"
import GovernanceProposalDetailPage from "./routes/governance.$id"
import HomeRoute from "./routes/home"
import TransactionsRoute from "./routes/transactions"
import TransactionDetailRoute from "./routes/transactions.$hash"
import ValidatorsPage from "./routes/validators"
import ValidatorDetailPage from "./routes/validators.$address"
import EvmContractsPage from "./routes/evm-contracts"
import EvmTokensPage from "./routes/evm-tokens"
import IbcPage from "./routes/ibc"

const router = createBrowserRouter([
	{
		path: "/",
		element: <Root />,
		middleware: [loggingMiddleware],
		children: [
			{ index: true, element: <HomeRoute /> },
			{
				path: "blocks",
				children: [
					{ index: true, element: <BlocksRoute /> },
					{ path: ":id", element: <BlockDetailRoute /> }
				]
			},
			{
				path: "tx",
				children: [
					{ index: true, element: <TransactionsRoute /> },
					{ path: ":hash", element: <TransactionDetailRoute /> }
				]
			},
			{ path: "analytics", element: <AnalyticsPage /> },
			{ path: "addr/:id", element: <AddressPage /> },
			{
				path: "validators",
				children: [
					{ index: true, element: <ValidatorsPage /> },
					{ path: ":address", element: <ValidatorDetailPage /> }
				]
			},
			{
				path: "governance",
				children: [
					{ index: true, element: <GovernancePage /> },
					{ path: ":id", element: <GovernanceProposalDetailPage /> }
				]
			},
			{
				path: "evm",
				children: [
					{ path: "contracts", element: <EvmContractsPage /> },
					{ path: "tokens", element: <EvmTokensPage /> }
				]
			},
			{ path: "ibc", element: <IbcPage /> }
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
