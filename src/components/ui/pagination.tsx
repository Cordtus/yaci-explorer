/**
 * Pagination component with page range display and jump-to-page functionality
 * @param currentPage - Current page number (0-indexed)
 * @param totalPages - Total number of pages
 * @param onPageChange - Callback when page changes
 * @param isLoading - Whether data is currently loading
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { css } from '@/styled-system/css'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}

/**
 * Generates array of page numbers to display with ellipsis
 * Shows: [1] ... [current-1] [current] [current+1] ... [last]
 */
function generatePageRange(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: (number | 'ellipsis')[] = []

  // Always show first page
  pages.push(1)

  if (currentPage > 3) {
    pages.push('ellipsis')
  }

  // Show pages around current page
  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
    pages.push(i)
  }

  if (currentPage < totalPages - 2) {
    pages.push('ellipsis')
  }

  // Always show last page
  if (totalPages > 1) {
    pages.push(totalPages)
  }

  return pages
}

export function Pagination({ currentPage, totalPages, onPageChange, isLoading }: PaginationProps) {
  const [jumpToPage, setJumpToPage] = useState('')

  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault()
    const pageNum = parseInt(jumpToPage)
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum - 1) // Convert to 0-indexed
      setJumpToPage('')
    }
  }

  const pageRange = generatePageRange(currentPage + 1, totalPages) // Convert to 1-indexed for display

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageInfo}>
        Page {currentPage + 1} of {totalPages.toLocaleString()}
      </div>

      <div className={styles.controls}>
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0 || isLoading}
          className={styles.iconButton}
        >
          <ChevronLeft className={styles.icon} />
          Previous
        </Button>

        {/* Page numbers */}
        <div className={styles.pageRange}>
          {pageRange.map((page, idx) => {
            if (page === 'ellipsis') {
              return (
                <span key={`ellipsis-${idx}`} className={styles.ellipsis}>
                  ...
                </span>
              )
            }

            const isCurrentPage = page === currentPage + 1

            return (
              <Button
                key={page}
                variant={isCurrentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(page - 1)} // Convert to 0-indexed
                disabled={isLoading}
                className={styles.pageButton(isCurrentPage)}
              >
                {page}
              </Button>
            )
          })}
        </div>

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1 || isLoading}
          className={styles.iconButton}
        >
          Next
          <ChevronRight className={styles.icon} />
        </Button>
      </div>

      {/* Jump to page */}
      <form onSubmit={handleJumpToPage} className={styles.jumpForm}>
        <Input
          type="number"
          min="1"
          max={totalPages}
          placeholder="Jump to..."
          value={jumpToPage}
          onChange={(e) => setJumpToPage(e.target.value)}
          className={styles.jumpInput}
          disabled={isLoading}
        />
        <Button type="submit" size="sm" variant="secondary" disabled={isLoading}>
          Go
        </Button>
      </form>
    </div>
  )
}

const styles = {
  wrapper: css({
    display: 'flex',
    flexDirection: { base: 'column', sm: 'row' },
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '4',
    mt: '6',
  }),
  pageInfo: css({
    fontSize: 'sm',
    color: 'fg.muted',
  }),
  controls: css({
    display: 'flex',
    alignItems: 'center',
    gap: '2',
  }),
  iconButton: css({
    gap: '1.5',
  }),
  icon: css({
    h: '4',
    w: '4',
  }),
  pageRange: css({
    display: { base: 'none', md: 'flex' },
    alignItems: 'center',
    gap: '1',
  }),
  ellipsis: css({
    px: '2',
    color: 'fg.muted',
  }),
  pageButton: (isCurrent: boolean) =>
    css({
      minW: '10',
      fontWeight: isCurrent ? 'semibold' : 'medium',
    }),
  jumpForm: css({
    display: 'flex',
    alignItems: 'center',
    gap: '2',
  }),
  jumpInput: css({
    w: '24',
    h: '9',
  }),
}
