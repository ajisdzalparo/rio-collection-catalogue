'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, X, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T, index: number) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];

  searchKey?: keyof T;
  searchPlaceholder?: string;
  showSearch?: boolean;

  showRowNumbers?: boolean;
  rowNumberHeader?: string;

  filterComponents?: React.ReactNode;

  enableSorting?: boolean;
  sortBy?: keyof T | string | null;
  sortOrder?: 'asc' | 'desc' | null;
  onSortChange?: (sortKey: keyof T | string | null, sortOrder: 'asc' | 'desc' | null) => void;
  manualSorting?: boolean;

  enableSelection?: boolean;
  onSelectionChange?: (selectedItems: T[]) => void;
  bulkActions?: (selectedItems: T[], clearSelection: () => void) => React.ReactNode;

  pageSize?: number;
  pageSizeOptions?: number[];
  striped?: boolean;
  density?: 'comfortable' | 'compact';

  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search records...',
  showSearch,
  showRowNumbers = false,
  rowNumberHeader = 'No',
  filterComponents,
  enableSorting = true,
  sortBy,
  sortOrder,
  onSortChange,
  manualSorting = false,
  isLoading = false,
  pageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  enableSelection = false,
  onSelectionChange,
  striped = false,
  density = 'comfortable',
  bulkActions,
  emptyTitle = 'No data found',
  emptyDescription = 'Try adjusting your search query or filters to find what you are looking for.'
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSize, setCurrentSize] = useState(pageSize);

  const [internalSortKey, setInternalSortKey] = useState<keyof T | null>(null);
  const [internalSortDirection, setInternalSortDirection] = useState<'asc' | 'desc' | null>(null);

  const activeSortKey = sortBy !== undefined ? sortBy : internalSortKey;
  const activeSortDirection = sortOrder !== undefined ? sortOrder : internalSortDirection;

  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  const isSearchVisible = showSearch !== undefined ? showSearch : Boolean(searchKey);

  const filteredData = useMemo(() => {
    if (!searchKey || !searchQuery.trim() || !isSearchVisible) return data;
    const query = searchQuery.toLowerCase();
    return data.filter((item) => {
      const val = item[searchKey];
      return String(val ?? '')
        .toLowerCase()
        .includes(query);
    });
  }, [data, searchKey, searchQuery, isSearchVisible]);

  const sortedData = useMemo(() => {
    if (manualSorting || !activeSortKey || !activeSortDirection) return filteredData;

    const targetKey = activeSortKey as keyof T;

    return [...filteredData].sort((a, b) => {
      const aVal = a[targetKey];
      const bVal = b[targetKey];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const comp = aVal.localeCompare(bVal);
        return activeSortDirection === 'asc' ? comp : -comp;
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return activeSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return activeSortDirection === 'asc'
        ? String(aVal) > String(bVal)
          ? 1
          : -1
        : String(aVal) < String(bVal)
          ? 1
          : -1;
    });
  }, [filteredData, activeSortKey, activeSortDirection, manualSorting]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / currentSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * currentSize;
    return sortedData.slice(start, start + currentSize);
  }, [sortedData, currentPage, currentSize]);

  const handleSort = (key?: keyof T, sortable?: boolean) => {
    if (!key || !sortable) return;

    let nextKey: keyof T | null = key;
    let nextDirection: 'asc' | 'desc' | null = 'asc';

    if (activeSortKey !== key) {
      nextKey = key;
      nextDirection = 'asc';
    } else if (activeSortDirection === 'asc') {
      nextKey = key;
      nextDirection = 'desc';
    } else {
      nextKey = null;
      nextDirection = null;
    }

    if (sortBy === undefined) {
      setInternalSortKey(nextKey);
      setInternalSortDirection(nextDirection);
    }

    onSortChange?.(nextKey, nextDirection);
  };

  const selectedItems = useMemo(() => {
    return data.filter((item) => selectedIds.has(item.id));
  }, [data, selectedIds]);

  const isAllPageSelected =
    paginatedData.length > 0 && paginatedData.every((item) => selectedIds.has(item.id));

  const toggleSelectAll = () => {
    const newSelected = new Set(selectedIds);
    if (isAllPageSelected) {
      paginatedData.forEach((item) => newSelected.delete(item.id));
    } else {
      paginatedData.forEach((item) => newSelected.add(item.id));
    }
    setSelectedIds(newSelected);
    const updatedSelected = data.filter((item) => newSelected.has(item.id));
    onSelectionChange?.(updatedSelected);
  };

  const toggleSelectRow = (id: string | number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    const updatedSelected = data.filter((item) => newSelected.has(item.id));
    onSelectionChange?.(updatedSelected);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    onSelectionChange?.([]);
  };

  const cellPaddingClass = density === 'compact' ? 'py-2 px-3' : 'py-3.5 px-4';
  const headPaddingClass = density === 'compact' ? 'h-9 px-3 text-[10px]' : 'h-11 px-4 text-[11px]';

  const extraColumnsCount = (enableSelection ? 1 : 0) + (showRowNumbers ? 1 : 0);

  return (
    <div className="space-y-4">
      {(isSearchVisible || filterComponents) && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {isSearchVisible && (
              <div className="relative flex-1 min-w-55 max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 pr-8 h-9 text-xs rounded-2xl border-border/60 bg-card/60 shadow-2xs focus-visible:ring-1"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}

            {filterComponents && (
              <div className="flex items-center gap-2 flex-wrap">{filterComponents}</div>
            )}
          </div>
        </div>
      )}

      {enableSelection && selectedIds.size > 0 && bulkActions && (
        <div className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-primary/10 border border-primary/30 text-foreground animate-in fade-in-50 slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">
              {selectedIds.size}
            </span>
            <span>{selectedIds.size} row(s) selected</span>
          </div>

          <div className="flex items-center gap-2">
            {bulkActions && bulkActions(selectedItems, clearSelection)}
            <Button
              variant="ghost"
              size="xs"
              onClick={clearSelection}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            {enableSelection && (
              <TableHead className={cn('w-12 text-center', headPaddingClass)}>
                <input
                  type="checkbox"
                  checked={isAllPageSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded-md border-border/70 text-primary accent-primary cursor-pointer focus:ring-1 focus:ring-primary/40"
                  aria-label="Select all rows on current page"
                />
              </TableHead>
            )}

            {showRowNumbers && (
              <TableHead className={cn('w-14 text-center font-mono', headPaddingClass)}>
                {rowNumberHeader}
              </TableHead>
            )}

            {columns.map((col, idx) => {
              const isSortable = Boolean(
                enableSorting && col.sortable !== false && col.accessorKey
              );
              const isCurrentSorted = col.accessorKey && activeSortKey === col.accessorKey;

              return (
                <TableHead
                  key={idx}
                  className={cn(
                    col.className,
                    headPaddingClass,
                    isSortable &&
                      'cursor-pointer select-none hover:text-foreground transition-colors'
                  )}
                  onClick={() => handleSort(col.accessorKey, col.sortable)}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {isSortable && (
                      <span className="shrink-0 text-muted-foreground">
                        {isCurrentSorted ? (
                          activeSortDirection === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5 text-primary font-bold" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5 text-primary font-bold" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-40 hover:opacity-100" />
                        )}
                      </span>
                    )}
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, rIdx) => (
              <TableRow key={rIdx}>
                {enableSelection && (
                  <TableCell className={cn('w-12 text-center', cellPaddingClass)}>
                    <Skeleton className="h-4 w-4 rounded-md mx-auto" />
                  </TableCell>
                )}
                {showRowNumbers && (
                  <TableCell className={cn('w-14 text-center', cellPaddingClass)}>
                    <Skeleton className="h-4 w-4 rounded-md mx-auto" />
                  </TableCell>
                )}
                {columns.map((_, cIdx) => (
                  <TableCell key={cIdx} className={cellPaddingClass}>
                    <Skeleton className="h-5 w-full rounded-lg" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : paginatedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + extraColumnsCount} className="text-center py-14">
                <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 border border-border/50 text-muted-foreground shadow-2xs">
                    <Inbox className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-foreground">{emptyTitle}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {emptyDescription}
                    </p>
                  </div>
                  {searchQuery && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchQuery('')}
                      className="mt-2 text-xs font-semibold rounded-xl"
                    >
                      Clear Search Filter
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((row, rIdx) => {
              const isSelected = selectedIds.has(row.id);
              const globalIndex = (currentPage - 1) * currentSize + rIdx + 1;

              return (
                <TableRow
                  key={row.id}
                  data-state={isSelected ? 'selected' : undefined}
                  className={cn(
                    'transition-colors',
                    striped && rIdx % 2 === 1 && 'bg-muted/15',
                    isSelected ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-muted/30'
                  )}
                >
                  {enableSelection && (
                    <TableCell className={cn('w-12 text-center', cellPaddingClass)}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(row.id)}
                        className="h-4 w-4 rounded-md border-border/70 text-primary accent-primary cursor-pointer focus:ring-1 focus:ring-primary/40"
                        aria-label={`Select row ${row.id}`}
                      />
                    </TableCell>
                  )}

                  {showRowNumbers && (
                    <TableCell
                      className={cn(
                        'w-14 text-center font-mono text-[11px] text-muted-foreground font-semibold',
                        cellPaddingClass
                      )}
                    >
                      {globalIndex}
                    </TableCell>
                  )}

                  {columns.map((col, idx) => (
                    <TableCell key={idx} className={cn(col.className, cellPaddingClass)}>
                      {col.cell
                        ? col.cell(row, globalIndex)
                        : col.accessorKey
                          ? String(row[col.accessorKey] ?? '')
                          : null}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalEntries={sortedData.length}
        pageSize={currentSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(newSize) => {
          setCurrentSize(newSize);
          setCurrentPage(1);
        }}
        pageSizeOptions={pageSizeOptions}
        disabled={isLoading}
      />
    </div>
  );
}
