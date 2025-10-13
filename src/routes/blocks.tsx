import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Blocks } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { YaciAPIClient } from '@/lib/api/client'
import { formatNumber, formatTimestamp, formatHash, formatTimeAgo } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

const api = new YaciAPIClient()

export default function BlocksPage() {
  const [page, setPage] = useState(0)
  const limit = 20

  const { data, isLoading, error } = useQuery({
    queryKey: ['blocks', page],
    queryFn: () => api.getBlocks(limit, page * limit),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Blocks</h1>
          <p className="text-muted-foreground">
            Browse the latest blocks on the blockchain
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Blocks</CardTitle>
          <CardDescription>
            Showing {data?.data.length || 0} blocks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Height</TableHead>
                <TableHead>Block Hash</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead>Proposer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-12 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Error loading blocks
                  </TableCell>
                </TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No blocks found
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((block) => (
                  <TableRow key={block.id}>
                    <TableCell>
                      <Link
                        to={`/blocks/${block.id}`}
                        className="flex items-center gap-2 font-medium hover:text-primary"
                      >
                        <Blocks className="h-4 w-4" />
                        {formatNumber(block.id)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs">
                        {formatHash(block.data?.block_id?.hash || block.data?.blockId?.hash || '', 12)}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{formatTimeAgo(block.data.block.header.time)}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatTimestamp(block.data.block.header.time)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {block.data?.txs?.length || 0} txs
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs">
                        {formatHash(block.data.block.header.proposer_address, 8)}
                      </code>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {data && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Page {page + 1}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={!data.pagination.has_prev}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={!data.pagination.has_next}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
