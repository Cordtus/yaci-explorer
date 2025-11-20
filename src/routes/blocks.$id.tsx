import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, Copy, CheckCircle, Activity, Blocks as BlocksIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { YaciAPIClient } from '@yaci/database-client'
import { formatNumber, formatTimeAgo, formatHash, getTransactionStatus } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

const api = new YaciAPIClient(import.meta.env.VITE_POSTGREST_URL)

export default function BlockDetailPage() {
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  const params = useParams()
  const blockHeight = parseInt(params.id!)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: block, isLoading: blockLoading, error: blockError } = useQuery({
    queryKey: ['block', blockHeight],
    queryFn: async () => {
      const result = await api.getBlock(blockHeight)
      return result
    },
    enabled: mounted && !isNaN(blockHeight),
  })

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['blockTransactions', blockHeight],
    queryFn: async () => {
      const result = await api.getTransactions(100, 0, { block_height: blockHeight })
      return result
    },
    enabled: mounted && !isNaN(blockHeight),
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (mounted && blockError) {
    return (
      <div className="space-y-4">
        <Link to="/blocks" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Blocks
        </Link>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BlocksIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-600 mb-2">Block Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The requested block could not be found.
              </p>
              <p className="text-sm text-red-500">{String(blockError)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!mounted || blockLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!block) {
    return null
  }

  const blockHash = block.data?.block_id?.hash || block.data?.blockId?.hash || ''
  const chainId = block.data?.block?.header?.chain_id || 'N/A'
  const proposerAddress = block.data?.block?.header?.proposer_address || 'N/A'
  const timestamp = block.data?.block?.header?.time || null
  const txCount = block.data?.txs?.length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/blocks" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Blocks
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">Block #{formatNumber(block.id)}</h1>
          <Badge variant="outline">
            <BlocksIcon className="h-3 w-3 mr-1" />
            {txCount} {txCount === 1 ? 'transaction' : 'transactions'}
          </Badge>
        </div>
        {timestamp && (
          <p className="text-sm text-muted-foreground">
            {formatTimeAgo(timestamp)} • {new Date(timestamp).toLocaleString()}
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Block Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Block Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Block Hash</label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm font-mono break-all">{blockHash || 'N/A'}</p>
                    {blockHash && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => copyToClipboard(blockHash)}
                      >
                        {copied ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Height</label>
                    <p className="text-lg font-bold">{formatNumber(block.id)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Chain ID</label>
                    <p className="text-sm">{chainId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Transactions</label>
                    <p className="text-lg font-bold">{txCount}</p>
                  </div>
                  {timestamp && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
                      <p className="text-sm">{formatTimeAgo(timestamp)}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Proposer Address</label>
                  <p className="text-sm font-mono break-all mt-1">{proposerAddress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Transactions ({txCount})</CardTitle>
            </CardHeader>
            <CardContent>
              {txLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : transactions && transactions.data.length > 0 ? (
                <div className="space-y-3">
                  {transactions.data.map((tx) => {
                    const status = getTransactionStatus(tx.error)
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between py-3 border-b last:border-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Activity className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <Link
                              to={`/transactions/${tx.id}`}
                              className="font-medium hover:text-primary font-mono text-sm"
                            >
                              {formatHash(tx.id, 12)}
                            </Link>
                            <div className="text-xs text-muted-foreground">
                              {formatTimeAgo(tx.timestamp)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={tx.error ? 'destructive' : 'success'}
                            className="mb-1"
                          >
                            {status.label}
                          </Badge>
                          {tx.fee?.amount && tx.fee.amount.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {formatNumber(tx.fee.amount[0].amount)} {tx.fee.amount[0].denom}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No transactions in this block
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Height</span>
                  <span className="font-medium">{formatNumber(block.id)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transactions</span>
                  <span className="font-medium">{txCount}</span>
                </div>
                {timestamp && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Age</span>
                    <span className="font-medium">{formatTimeAgo(timestamp)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <Card>
            <CardHeader>
              <CardTitle>Navigation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link to={`/blocks/${block.id - 1}`}>
                  <Button variant="outline" className="w-full justify-start" disabled={block.id <= 1}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous Block
                  </Button>
                </Link>
                <Link to={`/blocks/${block.id + 1}`}>
                  <Button variant="outline" className="w-full justify-start">
                    Next Block
                    <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
