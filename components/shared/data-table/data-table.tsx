'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
import { TruncatedText } from '@/components/ui/truncated-text';

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
  /** Additional keys searched together with searchKey (case-insensitive, partial match). */
  extraSearchKeys?: Array<keyof T>;
  searchPlaceholder?: string;
  showSearch?: boolean;
  /** URL query param key to sync search with. Defaults to 'q'. Set to false or null to disable URL sync. */
  searchParamKey?: string | false | null;
  /** Debounce delay in milliseconds before updating search query and URL. Defaults to 300ms. */
  debounceMs?: number;

  showRowNumbers?: boolean;
  rowNumberHeader?: string;

  filterComponents?: React.ReactNode;

  enableSorting?: boolean;
  sortBy?: keyof T | string | null;
  sortOrder?: 'asc' | 'desc' | null;
  onSortChange?: (sortKey: keyof T | string | null, sortOrder: 'asc' | 'desc' | null) => void;
  manualSorting?: boolean;

  enableSelection?: boolean;
  /** Determines whether a row can be selected for bulk actions. */
  isRowSelectable?: (item: T) => boolean;
  onSelectionChange?: (selectedItems: T[]) => void;
  bulkActions?: (selectedItems: T[], clearSelection: () => void) => React.ReactNode;

  pageSize?: number;
  pageSizeOptions?: number[];
  striped?: boolean;
  density?: 'comfortable' | 'compact';

  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  getRowId?: (item: T, index: number) => string | number;
  /** Custom adaptive card renderer for mobile viewports (md:hidden). */
  renderCard?: (
    item: T,
    index: number,
    helpers: {
      isSelected: boolean;
      onToggleSelect: () => void;
      globalIndex: number;
    }
  ) => React.ReactNode;
}

export function DataTable<T extends object>({
  columns,
  data,
  getRowId,
  searchKey,
  extraSearchKeys,
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
  isRowSelectable = () => true,
  onSelectionChange,
  striped = false,
  density = 'comfortable',
  bulkActions,
  emptyTitle = 'No data found',
  emptyDescription = 'Try adjusting your search query or filters to find what you are looking for.',
  searchParamKey = 'q',
  debounceMs = 300,
  renderCard
}: DataTableProps<T>) {
  const getInitialSearchParam = () => {
    if (searchParamKey === false || searchParamKey === null || typeof window === 'undefined') {
      return '';
    }
    try {
      const key = typeof searchParamKey === 'string' ? searchParamKey : 'q';
      const params = new URLSearchParams(window.location.search);
      return params.get(key) || '';
    } catch {
      return '';
    }
  };

  const [inputValue, setInputValue] = useState(getInitialSearchParam);
  const [searchQuery, setSearchQuery] = useState(getInitialSearchParam);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSize, setCurrentSize] = useState(pageSize);

  // Sync on browser back/forward history navigation
  useEffect(() => {
    if (searchParamKey === false || searchParamKey === null || typeof window === 'undefined')
      return;
    const key = typeof searchParamKey === 'string' ? searchParamKey : 'q';
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const currentQuery = params.get(key) || '';
      setInputValue(currentQuery);
      setSearchQuery(currentQuery);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [searchParamKey]);

  // Debounced update of searchQuery and URL query param
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(inputValue);
      setCurrentPage(1);

      if (searchParamKey !== false && searchParamKey !== null && typeof window !== 'undefined') {
        const key = typeof searchParamKey === 'string' ? searchParamKey : 'q';
        const url = new URL(window.location.href);
        const currentParam = url.searchParams.get(key) || '';
        const trimmed = inputValue.trim();

        if (trimmed) {
          if (currentParam !== trimmed) {
            url.searchParams.set(key, trimmed);
            window.history.replaceState(null, '', url.pathname + url.search);
          }
        } else if (currentParam) {
          url.searchParams.delete(key);
          window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
        }
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [inputValue, debounceMs, searchParamKey]);

  const [internalSortKey, setInternalSortKey] = useState<keyof T | null>(null);
  const [internalSortDirection, setInternalSortDirection] = useState<'asc' | 'desc' | null>(null);

  const activeSortKey = sortBy !== undefined ? sortBy : internalSortKey;
  const activeSortDirection = sortOrder !== undefined ? sortOrder : internalSortDirection;

  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  const isSearchVisible = showSearch !== undefined ? showSearch : Boolean(searchKey);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim() || !isSearchVisible) return data;
    const query = searchQuery.toLowerCase();
    const keys = [searchKey, ...(extraSearchKeys ?? [])].filter(Boolean) as Array<keyof T>;
    if (keys.length === 0) return data;
    return data.filter((item) => {
      const record = item as Record<string, unknown>;
      return keys.some((key) => {
        const val = record[key as string];
        return String(val ?? '')
          .toLowerCase()
          .includes(query);
      });
    });
  }, [data, searchKey, extraSearchKeys, searchQuery, isSearchVisible]);

  const dataSignature = data
    .map((item) => {
      const record = item as Record<string, unknown>;
      if (record && record.id !== undefined && record.id !== null) return String(record.id);
      if (record && record.name !== undefined && record.name !== null) return String(record.name);
      if (record && record.key !== undefined && record.key !== null) return String(record.key);
      return '';
    })
    .join('|');
  const [lastDataSignature, setLastDataSignature] = useState(dataSignature);
  if (dataSignature !== lastDataSignature) {
    setLastDataSignature(dataSignature);
    setCurrentPage(1);
  }

  const sortedData = useMemo(() => {
    if (manualSorting || !activeSortKey || !activeSortDirection) return filteredData;

    const targetKey = activeSortKey as string;

    return [...filteredData].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[targetKey];
      const bVal = (b as Record<string, unknown>)[targetKey];

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
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedData = useMemo(() => {
    const start = (safeCurrentPage - 1) * currentSize;
    return sortedData.slice(start, start + currentSize);
  }, [sortedData, safeCurrentPage, currentSize]);

  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }

  const handleSort = (key?: keyof T, sortable?: boolean) => {
    if (!key || !sortable) return;

    let nextDirection: 'asc' | 'desc' | null = 'asc';

    if (activeSortKey === key) {
      if (activeSortDirection === 'asc') nextDirection = 'desc';
      else if (activeSortDirection === 'desc') nextDirection = null;
      else nextDirection = 'asc';
    }

    const nextKey = nextDirection ? key : null;

    if (sortBy === undefined) {
      setInternalSortKey(nextKey);
      setInternalSortDirection(nextDirection);
    }

    onSortChange?.(nextKey, nextDirection);
  };

  const getItemKey = React.useCallback(
    (item: T, idx: number): string | number => {
      if (getRowId) return getRowId(item, idx);
      const record = item as Record<string, unknown>;
      if (record && record.id !== undefined && record.id !== null)
        return record.id as string | number;
      if (record && record.name !== undefined && record.name !== null)
        return record.name as string | number;
      if (record && record.key !== undefined && record.key !== null)
        return record.key as string | number;
      return `row-${idx}`;
    },
    [getRowId]
  );

  const selectedItems = useMemo(() => {
    return data.filter(
      (item, idx) => isRowSelectable(item) && selectedIds.has(getItemKey(item, idx))
    );
  }, [data, selectedIds, getItemKey, isRowSelectable]);

  const selectablePaginatedData = useMemo(
    () => paginatedData.filter((item) => isRowSelectable(item)),
    [paginatedData, isRowSelectable]
  );

  const isAllPageSelected =
    selectablePaginatedData.length > 0 &&
    selectablePaginatedData.every((item) => {
      const itemIndex = paginatedData.indexOf(item);
      return selectedIds.has(getItemKey(item, itemIndex));
    });

  const toggleSelectAll = () => {
    const newSelected = new Set(selectedIds);
    if (isAllPageSelected) {
      selectablePaginatedData.forEach((item) => {
        const itemIndex = paginatedData.indexOf(item);
        newSelected.delete(getItemKey(item, itemIndex));
      });
    } else {
      selectablePaginatedData.forEach((item) => {
        const itemIndex = paginatedData.indexOf(item);
        newSelected.add(getItemKey(item, itemIndex));
      });
    }
    setSelectedIds(newSelected);
    const updatedSelected = data.filter(
      (item, idx) => isRowSelectable(item) && newSelected.has(getItemKey(item, idx))
    );
    onSelectionChange?.(updatedSelected);
  };

  const toggleSelectRow = (id: string | number) => {
    const item = data.find((candidate, idx) => getItemKey(candidate, idx) === id);
    if (!item || !isRowSelectable(item)) return;

    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    const updatedSelected = data.filter(
      (item, idx) => isRowSelectable(item) && newSelected.has(getItemKey(item, idx))
    );
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
    <div className="w-full space-y-4">
      {(isSearchVisible || filterComponents) && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 flex-1">
            {isSearchVisible && (
              <div className="relative w-full sm:w-auto sm:flex-1 sm:max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="pl-9 pr-8 h-10 sm:h-9 text-xs rounded-lg border-border/60 bg-card/60 shadow-2xs focus-visible:ring-1 w-full"
                />
                {inputValue && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputValue('');
                      setSearchQuery('');
                      setCurrentPage(1);
                      if (
                        searchParamKey !== false &&
                        searchParamKey !== null &&
                        typeof window !== 'undefined'
                      ) {
                        const key = typeof searchParamKey === 'string' ? searchParamKey : 'q';
                        const url = new URL(window.location.href);
                        if (url.searchParams.has(key)) {
                          url.searchParams.delete(key);
                          window.history.replaceState(
                            null,
                            '',
                            url.pathname + (url.search ? url.search : '')
                          );
                        }
                      }
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full cursor-pointer"
                    aria-label="Hapus pencarian"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}

            {filterComponents && (
              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                {filterComponents}
              </div>
            )}
          </div>
        </div>
      )}

      {enableSelection && selectedIds.size > 0 && bulkActions && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-3.5 py-2 rounded-full bg-zinc-950 text-zinc-100 border border-zinc-800 shadow-2xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-5 duration-350 ease-out">
          <div className="flex items-center gap-2 pl-1.5">
            <span className="flex h-5 min-w-5 px-1 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-zinc-300 font-mono text-[10px] border border-zinc-700/50 font-bold">
              {selectedIds.size}
            </span>
            <span className="text-zinc-400 text-xs font-medium whitespace-nowrap">terpilih</span>
          </div>

          <div className="w-px h-4 bg-zinc-850 shrink-0 mx-0.5" />

          <div className="flex items-center gap-1.5 pr-0.5">
            {bulkActions && bulkActions(selectedItems, clearSelection)}
            <Button
              variant="ghost"
              size="xs"
              onClick={clearSelection}
              className="text-xs font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 h-8 px-3 rounded-full transition-colors cursor-pointer"
            >
              Batal
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Adaptive Cards View (Screen < md) */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg border border-border/70 bg-card/80 shadow-2xs space-y-3"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-md shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/30">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-full rounded" />
              </div>
            </div>
          ))
        ) : paginatedData.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-border/70 bg-card/80 shadow-2xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted/60 border border-border/50 text-muted-foreground shadow-2xs mx-auto mb-3">
              <Inbox className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-foreground">{emptyTitle}</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{emptyDescription}</p>
            {searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="mt-3 text-xs font-semibold rounded-md cursor-pointer"
              >
                Reset Pencarian
              </Button>
            )}
          </div>
        ) : (
          paginatedData.map((row, rIdx) => {
            const rowKey = getItemKey(row, rIdx);
            const isSelected = selectedIds.has(rowKey);
            const globalIndex = (safeCurrentPage - 1) * currentSize + rIdx + 1;

            if (renderCard) {
              return (
                <div key={rowKey}>
                  {renderCard(row, rIdx, {
                    isSelected,
                    onToggleSelect: () => toggleSelectRow(rowKey),
                    globalIndex
                  })}
                </div>
              );
            }

            // Default Smart Adaptive Card
            const actionCol = columns.find((col) => {
              const h = typeof col.header === 'string' ? col.header.toLowerCase().trim() : '';
              return ['aksi', 'action', 'actions', 'aksi review', 'action / aksi'].includes(h);
            });
            const dataCols = columns.filter((col) => col !== actionCol);

            const visualCol = dataCols.find((col) => {
              const h = typeof col.header === 'string' ? col.header.toLowerCase().trim() : '';
              return h.includes('foto') || h.includes('gambar') || h.includes('image');
            });
            const otherCols = dataCols.filter((col) => col !== visualCol);

            return (
              <div
                key={rowKey}
                className={cn(
                  'p-3.5 rounded-lg border border-border/70 bg-card/90 shadow-2xs backdrop-blur-md flex flex-col gap-3 transition-all',
                  isSelected && 'ring-2 ring-primary/40 bg-primary/5'
                )}
              >
                {/* Top Section: Checkbox, Row Number, Visual & Actions */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {enableSelection && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(rowKey)}
                        disabled={!isRowSelectable(row)}
                        className="h-4 w-4 rounded-md border-border/70 text-primary accent-primary cursor-pointer shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Select item ${globalIndex}`}
                      />
                    )}
                    {showRowNumbers && (
                      <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground shrink-0">
                        #{globalIndex}
                      </span>
                    )}
                    {visualCol && (
                      <div className="shrink-0">
                        {visualCol.cell
                          ? visualCol.cell(row, globalIndex)
                          : visualCol.accessorKey
                            ? String(
                                (row as Record<string, unknown>)[visualCol.accessorKey as string] ??
                                  ''
                              )
                            : null}
                      </div>
                    )}
                    {otherCols.length > 0 && (
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground/80 block">
                          {otherCols[0].header}
                        </span>
                        <div className="font-bold text-xs text-foreground min-w-0">
                          {otherCols[0].cell
                            ? otherCols[0].cell(row, globalIndex)
                            : otherCols[0].accessorKey
                              ? (() => {
                                  const val = String(
                                    (row as Record<string, unknown>)[
                                      otherCols[0].accessorKey as string
                                    ] ?? ''
                                  );
                                  return <TruncatedText text={val} maxWidth="max-w-full" />;
                                })()
                              : null}
                        </div>
                      </div>
                    )}
                  </div>

                  {actionCol && (
                    <div className="shrink-0">
                      {actionCol.cell
                        ? actionCol.cell(row, globalIndex)
                        : actionCol.accessorKey
                          ? String(
                              (row as Record<string, unknown>)[actionCol.accessorKey as string] ??
                                ''
                            )
                          : null}
                    </div>
                  )}
                </div>

                {/* Remaining Columns */}
                {otherCols.slice(1).length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-border/30 text-xs">
                    {otherCols.slice(1).map((col, cIdx) => (
                      <div
                        key={cIdx}
                        className="flex items-start justify-between gap-2 py-0.5 border-b border-border/10 last:border-0"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 shrink-0 mt-0.5">
                          {col.header}:
                        </span>
                        <div className="text-right font-medium text-foreground min-w-0 flex-1 flex justify-end">
                          {col.cell
                            ? col.cell(row, globalIndex)
                            : col.accessorKey
                              ? (() => {
                                  const val = String(
                                    (row as Record<string, unknown>)[col.accessorKey as string] ??
                                      ''
                                  );
                                  return <TruncatedText text={val} maxWidth="max-w-full" />;
                                })()
                              : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View (Screen >= md) */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {enableSelection && (
                <TableHead className={cn('w-12 text-center', headPaddingClass)}>
                  <input
                    type="checkbox"
                    checked={isAllPageSelected}
                    onChange={toggleSelectAll}
                    disabled={selectablePaginatedData.length === 0}
                    className="h-4 w-4 rounded-md border-border/70 text-primary accent-primary cursor-pointer focus:ring-1 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
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
                const isActionColumn =
                  typeof col.header === 'string' &&
                  ['aksi', 'action', 'actions', 'aksi review'].includes(
                    col.header.toLowerCase().trim()
                  );
                const isSortable = Boolean(
                  enableSorting && col.sortable !== false && col.accessorKey && !isActionColumn
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
                <TableCell
                  colSpan={columns.length + extraColumnsCount}
                  className="text-center py-14"
                >
                  <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted/60 border border-border/50 text-muted-foreground shadow-2xs">
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
                        className="mt-2 text-xs font-semibold rounded-md"
                      >
                        Clear Search Filter
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, rIdx) => {
                const rowKey = getItemKey(row, rIdx);
                const isSelected = selectedIds.has(rowKey);
                const globalIndex = (safeCurrentPage - 1) * currentSize + rIdx + 1;

                return (
                  <TableRow
                    key={rowKey}
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
                          onChange={() => toggleSelectRow(rowKey)}
                          disabled={!isRowSelectable(row)}
                          className="h-4 w-4 rounded-md border-border/70 text-primary accent-primary cursor-pointer focus:ring-1 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Select row ${rowKey}`}
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
                            ? (() => {
                                const val = String(
                                  (row as Record<string, unknown>)[col.accessorKey as string] ?? ''
                                );
                                return <TruncatedText text={val} maxWidth="max-w-[240px]" />;
                              })()
                            : null}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        currentPage={safeCurrentPage}
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
