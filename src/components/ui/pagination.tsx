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
import { type PaginationProps } from '@/types/components/ui/pagination'

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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
      <div className="text-sm text-muted-foreground">
        Page {currentPage + 1} of {totalPages.toLocaleString()}
      </div>

      <div className="flex items-center gap-2">
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0 || isLoading}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        {/* Page numbers */}
        <div className="hidden md:flex items-center gap-1">
          {pageRange.map((page, idx) => {
            if (page === 'ellipsis') {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
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
                className="min-w-[2.5rem]"
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
          className="gap-1"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Jump to page */}
      <form onSubmit={handleJumpToPage} className="flex items-center gap-2">
        <Input
          type="number"
          min="1"
          max={totalPages}
          placeholder="Jump to..."
          value={jumpToPage}
          onChange={(e) => setJumpToPage(e.target.value)}
          className="w-24 h-9"
          disabled={isLoading}
        />
        <Button type="submit" size="sm" variant="secondary" disabled={isLoading}>
          Go
        </Button>
      </form>
    </div>
  )
}
