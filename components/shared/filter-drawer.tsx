'use client';

import React, { useState } from 'react';
import { Filter, RotateCcw, Check, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';

export interface FilterState {
  search: string;
  status: string[];
  role: string;
  sortBy: string;
}

const statusOptions = [
  { value: 'active', label: 'Active Status', colorDot: 'bg-emerald-500' },
  { value: 'pending', label: 'Pending Approval', colorDot: 'bg-amber-500' },
  { value: 'suspended', label: 'Suspended', colorDot: 'bg-rose-500' },
  { value: 'archived', label: 'Archived', colorDot: 'bg-slate-400' }
];

const roleOptions = [
  { value: 'all', label: 'All Roles' },
  { value: 'admin', label: 'Administrator' },
  { value: 'editor', label: 'Content Editor' },
  { value: 'user', label: 'Standard User' }
];

export interface FilterDrawerProps {
  initialFilters?: FilterState;
  onApplyFilters?: (filters: FilterState) => void;
}

export function FilterDrawer({
  initialFilters = {
    search: '',
    status: ['active'],
    role: 'all',
    sortBy: 'newest'
  },
  onApplyFilters
}: FilterDrawerProps) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const activeCount =
    (filters.search ? 1 : 0) +
    filters.status.length +
    (filters.role !== 'all' ? 1 : 0) +
    (filters.sortBy !== 'newest' ? 1 : 0);

  const handleReset = () => {
    const resetState: FilterState = {
      search: '',
      status: [],
      role: 'all',
      sortBy: 'newest'
    };
    setFilters(resetState);
    onApplyFilters?.(resetState);
  };

  const handleApply = () => {
    onApplyFilters?.(filters);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" className="gap-2 rounded-2xl relative">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <span>Filter Data</span>
            {activeCount > 0 && (
              <Badge
                variant="default"
                className="ml-1 text-[9px] px-1.5 py-0 h-4 min-w-4 rounded-full"
              >
                {activeCount}
              </Badge>
            )}
          </Button>
        }
      />
      <SheetContent side="right">
        <SheetHeader className="pr-8">
          <div className="flex items-center justify-between gap-3">
            <SheetTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <span>Filter Data & Refine</span>
            </SheetTitle>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-foreground cursor-pointer transition-colors shrink-0"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset All</span>
              </button>
            )}
          </div>
          <SheetDescription>
            Saring data tabel atau daftar berdasarkan kriteria pencarian, status, dan role.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-0.5 py-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Keyword Search</label>
            <Input
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search by name, email, or ID..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Status Multi-Select</label>
            <MultiSelect
              options={statusOptions}
              value={filters.status}
              onChange={(status) => setFilters({ ...filters, status })}
              placeholder="Select statuses..."
              searchPlaceholder="Search status..."
              maxCount={1}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">User Role</label>
            <Select
              value={filters.role}
              onValueChange={(role) => role && setFilters({ ...filters, role })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role..." />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Sort By</label>
            <Select
              value={filters.sortBy}
              onValueChange={(sortBy) => sortBy && setFilters({ ...filters, sortBy })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select sort order..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={handleReset} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </Button>
          <Button onClick={handleApply} className="gap-1.5">
            <Check className="h-4 w-4" />
            <span>Apply Filters</span>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
