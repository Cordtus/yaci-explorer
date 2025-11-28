import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

import { Header } from '@/components/layout/header'
import { DenomProvider } from '@/contexts/DenomContext'
import { ConfigProvider, type AppConfig } from '@/contexts/ConfigContext'
import { BrandingApplicator } from '@/components/BrandingApplicator'
import { getServerConfig } from '@/config/env.server'
import stylesheet from "./styles/globals.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

export async function loader(_args: LoaderFunctionArgs) {
  const config = getServerConfig()
  return { config }
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function HydrateFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export default function Root() {
  const { config } = useLoaderData<typeof loader>()

  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: config.queries.staleTimeMs,
        gcTime: config.queries.gcTimeMs,
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider config={config as AppConfig}>
        <BrandingApplicator />
        <DenomProvider>
          <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-6">
              <Outlet />
            </main>
          </div>
          <ReactQueryDevtools initialIsOpen={false} />
        </DenomProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
