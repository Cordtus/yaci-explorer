import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { css } from '@/styled-system/css'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}

function generatePageRange(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: (number | 'ellipsis')[] = []
  pages.push(1)

  if (currentPage > 3) {
    pages.push('ellipsis')
  }

  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
    pages.push(i)
  }

  if (currentPage < totalPages - 2) {
    pages.push('ellipsis')
  }

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
      onPageChange(pageNum - 1)
      setJumpToPage('')
    }
  }

  const pageRange = generatePageRange(currentPage + 1, totalPages)

  return (
    <div
      className={css({
        display: 'flex',
        flexDir: { base: 'column', sm: 'row' },
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '4',
        mt: '6',
      })}
    >
      <div className={css({ fontSize: 'sm', color: 'fg.muted' })}>
        Page {currentPage + 1} of {totalPages.toLocaleString()}
      </div>

      <div className={css({ display: 'flex', alignItems: 'center', gap: '2' })}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0 || isLoading}
          className={css({ gap: '1' })}
        >
          <ChevronLeft className={css({ h: '4', w: '4' })} />
          Previous
        </Button>

        <div className={css({ display: { base: 'none', md: 'flex' }, alignItems: 'center', gap: '1' })}>
          {pageRange.map((page, idx) => {
            if (page === 'ellipsis') {
              return (
                <span key={`ellipsis-${idx}`} className={css({ px: '2', color: 'fg.muted' })}>
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
                onClick={() => onPageChange(page - 1)}
                disabled={isLoading}
                className={css({ minW: '10' })}
              >
                {page}
              </Button>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1 || isLoading}
          className={css({ gap: '1' })}
        >
          Next
          <ChevronRight className={css({ h: '4', w: '4' })} />
        </Button>
      </div>

      <form
        onSubmit={handleJumpToPage}
        className={css({ display: 'flex', alignItems: 'center', gap: '2' })}
      >
        <Input
          type="number"
          min="1"
          max={totalPages}
          placeholder="Jump to..."
          value={jumpToPage}
          onChange={(e) => setJumpToPage(e.target.value)}
          className={css({ w: '24', h: '9' })}
          disabled={isLoading}
        />
        <Button type="submit" size="sm" variant="secondary" disabled={isLoading}>
          Go
        </Button>
      </form>
    </div>
  )
}
