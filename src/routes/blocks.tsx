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
import { css } from '@/styled-system/css'

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
    <div className={css(styles.container)}>
      <div className={css(styles.header)}>
        <div>
          <h1 className={css(styles.title)}>Blocks</h1>
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className={css(styles.filterIcon)} />
          Filters
          {hasActiveFilters && <Badge variant="secondary" className={css(styles.activeBadge)}>Active</Badge>}
        </Button>
      </div>

      {showFilters && (
        <Card>
          <CardHeader>
            <div className={css(styles.filterCardHeader)}>
              <CardTitle>Filter Blocks</CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className={css(styles.clearIcon)} />
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className={css(styles.filterGrid)}>
              <div className={css(styles.filterField)}>
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
              <div className={css(styles.filterField)}>
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
              <div className={css(styles.filterField)}>
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
                      <Skeleton className={css(styles.skeleton)} />
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={4} className={css(styles.emptyState)}>
                    Error loading blocks
                  </TableCell>
                </TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className={css(styles.emptyState)}>
                    No blocks found
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((block) => (
                  <TableRow key={block.id}>
                    <TableCell>
                      <Link
                        to={`/blocks/${block.id}`}
                        className={css(styles.blockLink)}
                      >
                        <Blocks className={css(styles.blockIcon)} />
                        {formatNumber(block.id)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <code className={css(styles.hashCode)}>
                        {formatHash(block.data?.block_id?.hash || block.data?.blockId?.hash || '', 12)}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className={css(styles.timeAgo)}>{formatTimeAgo(block.data.block.header.time)}</div>
                        <div className={css(styles.timestamp)}>
                          {formatTimestamp(block.data.block.header.time)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {String('tx_count' in block ? block.tx_count : (block.data?.txs?.length || 0))} txs
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

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: '3xl',
    fontWeight: 'bold',
  },
  filterIcon: {
    height: '4',
    width: '4',
    marginRight: '2',
  },
  activeBadge: {
    marginLeft: '2',
  },
  filterCardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearIcon: {
    height: '4',
    width: '4',
    marginRight: '1',
  },
  filterGrid: {
    display: 'grid',
    gridTemplateColumns: { base: '1', md: '3' },
    gap: '4',
  },
  filterField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2',
  },
  skeleton: {
    height: '12',
    width: 'full',
  },
  emptyState: {
    textAlign: 'center',
    color: 'fg.muted',
  },
  blockLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '2',
    fontWeight: 'medium',
    _hover: {
      color: 'colorPalette',
    },
  },
  blockIcon: {
    height: '4',
    width: '4',
  },
  hashCode: {
    fontSize: 'xs',
  },
  timeAgo: {
    fontSize: 'sm',
  },
  timestamp: {
    fontSize: 'xs',
    color: 'fg.muted',
  },
}
