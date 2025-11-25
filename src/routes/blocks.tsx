import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Blocks } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { YaciAPIClient } from '@/lib/api/client'
import { formatNumber, formatTimestamp, formatHash, formatTimeAgo } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination } from '@/components/ui/pagination'
import { css } from '../../styled-system/css'

const api = new YaciAPIClient()

export default function BlocksPage() {
  const [page, setPage] = useState(0)
  const limit = 20

  const { data, isLoading, error } = useQuery({
    queryKey: ['blocks', page],
    queryFn: () => api.getBlocks(limit, page * limit),
  })

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Blocks</h1>
          <p className={styles.subtitle}>
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
                <TableHead className={styles.th}>Height</TableHead>
                <TableHead className={styles.th}>Block Hash</TableHead>
                <TableHead className={styles.th}>Time</TableHead>
                <TableHead className={styles.th}>Transactions</TableHead>
                <TableHead className={styles.th}>Proposer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className={css({ h: '12', w: 'full' })} />
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className={styles.mutedCentered}>
                    Error loading blocks
                  </TableCell>
                </TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className={styles.mutedCentered}>
                    No blocks found
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((block) => (
                  <TableRow key={block.id}>
                    <TableCell>
                      <Link
                        to={`/blocks/${block.id}`}
                        className={styles.blockLink}
                      >
                        <Blocks className={styles.iconXs} />
                        {formatNumber(block.id)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <code className={styles.code}>
                        {formatHash(block.data?.block_id?.hash || block.data?.blockId?.hash || '', 12)}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className={styles.textSm}>{formatTimeAgo(block.data.block.header.time)}</div>
                        <div className={styles.metaText}>
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
  page: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '6',
  }),
  headerRow: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }),
  title: css({
    fontSize: '3xl',
    fontWeight: 'bold',
    lineHeight: 'short',
  }),
  subtitle: css({
    color: 'fg.muted',
  }),
  mutedCentered: css({
    textAlign: 'center',
    color: 'fg.muted',
  }),
  blockLink: css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2',
    fontWeight: 'medium',
    color: 'fg.default',
    letterSpacing: '-0.01em',
    _hover: { color: 'colorPalette.default' },
  }),
  th: css({
    fontSize: 'xs',
    fontWeight: 'semibold',
    textTransform: 'uppercase',
    letterSpacing: 'widest',
    color: 'fg.subtle',
  }),
  iconXs: css({
    h: '4',
    w: '4',
  }),
  code: css({
    fontFamily: 'mono',
    fontSize: 'xs',
  }),
  textSm: css({
    fontSize: 'sm',
  }),
  metaText: css({
    fontSize: 'xs',
    color: 'fg.muted',
  }),
}
