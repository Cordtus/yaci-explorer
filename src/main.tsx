import '@/index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'

import Root from './root'
import AddressPage from './routes/addr.$id'
import AnalyticsPage from './routes/analytics'
import BlocksPage from './routes/blocks'
import BlockDetailPage from './routes/blocks.$id'
import GovernancePage from './routes/governance'
import GovernanceDetailPage from './routes/governance.$id'
import HomePage from './routes/home'
import TransactionsPage from './routes/transactions'
import TransactionDetailPage from './routes/transactions.$hash'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'blocks', element: <BlocksPage /> },
      { path: 'blocks/:id', element: <BlockDetailPage /> },
      { path: 'tx', element: <TransactionsPage /> },
      { path: 'tx/:hash', element: <TransactionDetailPage /> },
      { path: 'addr/:id', element: <AddressPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'governance', element: <GovernancePage /> },
      { path: 'governance/:id', element: <GovernanceDetailPage /> },
    ],
  },
])

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
