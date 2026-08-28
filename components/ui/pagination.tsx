'use client';

import * as React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalEntries?: number;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  disabled?: boolean;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalEntries,
  pageSize = 10,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  disabled = false,
  className
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const startEntry = totalEntries === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endEntry =
    totalEntries !== undefined ? Math.min(currentPage * pageSize, totalEntries) : undefined;

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-4 py-2 px-1 text-xs text-muted-foreground font-medium',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {totalEntries !== undefined && (
          <div className="flex items-center gap-1.5 ml-2">
            Showing <strong className="text-foreground font-bold">{startEntry}</strong> to{' '}
            {onPageSizeChange ? (
              <div className="flex items-center gap-1.5">
                <Select
                  value={String(pageSize)}
                  onValueChange={(val) => onPageSizeChange(Number(val))}
                >
                  <SelectTrigger className="h-7 text-[11px] font-semibold px-2 py-0 rounded-lg bg-card border-border/60">
                    <SelectValue placeholder={String(pageSize)} />
                  </SelectTrigger>
                  <SelectContent align="start" className="min-w-16">
                    {pageSizeOptions.map((opt) => (
                      <SelectItem key={opt} value={String(opt)} className="text-[11px]">
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <strong className="text-foreground font-bold">{endEntry}</strong>
            )}
            of <strong className="text-foreground font-bold">{totalEntries}</strong> entries
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-xs"
          disabled={currentPage <= 1 || disabled}
          onClick={() => onPageChange(1)}
          className="rounded-lg h-8 w-8 text-muted-foreground hover:text-foreground"
          title="First Page"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
          <span className="sr-only">First Page</span>
        </Button>

        <Button
          variant="outline"
          size="icon-xs"
          disabled={currentPage <= 1 || disabled}
          onClick={() => onPageChange(currentPage - 1)}
          className="rounded-lg h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Previous Page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="sr-only">Previous Page</span>
        </Button>

        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((page, idx) => {
            if (page === 'ellipsis') {
              return (
                <div
                  key={`ellipsis-${idx}`}
                  className="flex h-8 w-8 items-center justify-center text-muted-foreground"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </div>
              );
            }

            const isCurrent = page === currentPage;

            return (
              <button
                key={page}
                type="button"
                disabled={disabled}
                onClick={() => onPageChange(page)}
                className={cn(
                  'flex h-8 min-w-8 items-center justify-center rounded-xl px-2.5 text-xs font-bold transition-all cursor-pointer select-none',
                  isCurrent
                    ? 'bg-foreground text-background shadow-xs'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                )}
              >
                {page}
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="icon-xs"
          disabled={currentPage >= totalPages || disabled}
          onClick={() => onPageChange(currentPage + 1)}
          className="rounded-lg h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Next Page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="sr-only">Next Page</span>
        </Button>

        <Button
          variant="outline"
          size="icon-xs"
          disabled={currentPage >= totalPages || disabled}
          onClick={() => onPageChange(totalPages)}
          className="rounded-lg h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Last Page"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
          <span className="sr-only">Last Page</span>
        </Button>
      </div>
    </div>
  );
}
