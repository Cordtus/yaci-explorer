import React from "react"
import ReactDOM from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router"
import { loggingMiddleware } from "./lib/middleware/logging"
import Root from "./root"
import AddressRoute from "./routes/addr.$id"
import AnalyticsRoute from "./routes/analytics"
import BlocksRoute from "./routes/blocks"
import BlockDetailRoute from "./routes/blocks.$id"
import HomeRoute from "./routes/home"
import TransactionsRoute from "./routes/transactions"
import TransactionDetailRoute from "./routes/transactions.$hash"

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
			{ path: "analytics", element: <AnalyticsRoute /> },
			{ path: "addr/:id", element: <AddressRoute /> }
		]
	}
])

const rootElement = document.getElementById("root")

if (!rootElement) {
	throw new Error("Root element #root not found")
}

ReactDOM.createRoot(rootElement).render(
	<React.StrictMode>
		<RouterProvider router={router} />
	</React.StrictMode>
)
