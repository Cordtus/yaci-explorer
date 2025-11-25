import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

import Root from "./root";
import HomeRoute from "./routes/home";
import BlocksRoute from "./routes/blocks";
import BlockDetailRoute from "./routes/blocks.$id";
import TransactionsRoute from "./routes/transactions";
import TransactionDetailRoute from "./routes/transactions.$hash";
import AnalyticsRoute from "./routes/analytics";
import AddressRoute from "./routes/addr.$id";

import "./styles/globals.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      { index: true, element: <HomeRoute /> },
      { path: "blocks", element: <BlocksRoute /> },
      { path: "blocks/:id", element: <BlockDetailRoute /> },
      { path: "transactions", element: <TransactionsRoute /> },
      { path: "transactions/:hash", element: <TransactionDetailRoute /> },
      { path: "analytics", element: <AnalyticsRoute /> },
      { path: "addr/:id", element: <AddressRoute /> },
    ],
  },
]);

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
