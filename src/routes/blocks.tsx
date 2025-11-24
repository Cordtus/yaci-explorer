import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Blocks, Filter, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { formatNumber, formatTimestamp, formatHash, formatTimeAgo } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination } from '@/components/ui/pagination'

export default function BlocksPage() {
  const [page, setPage] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [minTxCount, setMinTxCount] = useState<string>('')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const limit = 20

  const hasActiveFilters = minTxCount || fromDate || toDate

  const { data, isLoading, error } = useQuery({
    queryKey: ['blocks', page, minTxCount, fromDate, toDate],
    queryFn: () =>
      hasActiveFilters
        ? api.getBlocksPaginated(limit, page * limit, {
            minTxCount: minTxCount ? parseInt(minTxCount) : undefined,
            fromDate: fromDate || undefined,
            toDate: toDate || undefined,
          })
        : api.getBlocks(limit, page * limit),
  })

  const clearFilters = () => {
    setMinTxCount('')
    setFromDate('')
    setToDate('')
    setPage(0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Blocks</h1>
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && <Badge variant="secondary" className="ml-2">Active</Badge>}
        </Button>
      </div>

      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filter Blocks</CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minTxCount">Minimum Transactions</Label>
                <Input
                  id="minTxCount"
                  type="number"
                  min="0"
                  placeholder="e.g., 1"
                  value={minTxCount}
                  onChange={(e) => {
                    setMinTxCount(e.target.value)
                    setPage(0)
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromDate">From Date</Label>
                <Input
                  id="fromDate"
                  type="datetime-local"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value)
                    setPage(0)
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toDate">To Date</Label>
                <Input
                  id="toDate"
                  type="datetime-local"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value)
                    setPage(0)
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-12 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Error loading blocks
                  </TableCell>
                </TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
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
                        {'tx_count' in block ? block.tx_count : (block.data?.txs?.length || 0)} txs
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {data && data.pagination.total > 0 && (
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(data.pagination.total / limit)}
              onPageChange={setPage}
              isLoading={isLoading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
