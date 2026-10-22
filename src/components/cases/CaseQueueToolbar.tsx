import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { CaseStatusCounts, CaseFilterState } from '@/data/caseSelectors';

export type CaseTabKey = 'all' | 'open' | 'in_progress' | 'in_review' | 'closed';

export interface CaseQueueToolbarProps {
  filters: CaseFilterState;
  setFilters: React.Dispatch<React.SetStateAction<CaseFilterState>>;
  statusCounts: CaseStatusCounts;
  totalFilteredCount: number;
}

export const CaseQueueToolbar: React.FC<CaseQueueToolbarProps> = ({
  filters,
  setFilters,
  statusCounts,
  totalFilteredCount,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  // Keep local search in sync with incoming filter changes (e.g. from URL or clear all)
  useEffect(() => {
    setLocalSearch(filters.search || '');
  }, [filters.search]);

  // Debounced search 250ms (Section 6.5)
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((filters.search || '') !== localSearch) {
        setFilters((prev) => ({
          ...prev,
          search: localSearch.trim() || undefined,
        }));
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [localSearch, filters.search, setFilters]);

  // Keyboard shortcut: slash '/' focuses search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement !== searchInputRef.current &&
        !(document.activeElement instanceof HTMLInputElement) &&
        !(document.activeElement instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTabChange = useCallback(
    (tabKey: CaseTabKey) => {
      setFilters((prev) => {
        // Clear conflicting single status array when changing quick tab
        return {
          ...prev,
          tab: tabKey,
          status: undefined,
        };
      });
    },
    [setFilters]
  );

  const clearSearch = useCallback(() => {
    setLocalSearch('');
    setFilters((prev) => ({ ...prev, search: undefined }));
    searchInputRef.current?.focus();
  }, [setFilters]);

  const tabs: { key: CaseTabKey; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: statusCounts.all },
    { key: 'open', label: 'Open', count: statusCounts.open },
    { key: 'in_progress', label: 'In progress', count: statusCounts.in_progress },
    { key: 'in_review', label: 'In review', count: statusCounts.in_review },
    { key: 'closed', label: 'Closed', count: statusCounts.closed },
  ];

  const currentTab = (filters.tab as CaseTabKey) || 'all';

  return (
    <div className="flex flex-col gap-3 mb-4 select-none">
      {/* Top row: Status Tabs on left, Search on right */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Status Tabs (Section 6.4) */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg border border-border bg-muted/40 overflow-x-auto no-scrollbar shrink-0">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
                  isActive
                    ? 'bg-card text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-mono',
                    isActive ? 'bg-primary/15 text-primary font-bold' : 'text-muted-foreground bg-muted'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right side: Search Input (Section 6.5) */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64 lg:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search by ID, event, asset, device, owner..."
              className="w-full h-8 pl-8 pr-7 text-xs bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs transition-colors"
            />
            {localSearch ? (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center"
                title="Clear search"
              >
                <X className="size-3" />
              </button>
            ) : (
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1 text-[10px] font-mono rounded bg-muted text-muted-foreground border border-border pointer-events-none">
                /
              </kbd>
            )}
          </div>
        </div>
      </div>

      {/* Helper Line & Result Count (Section 6.2) */}
      <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2 px-0.5">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground tabular-nums">
            {totalFilteredCount} {totalFilteredCount === 1 ? 'case' : 'cases'}
          </span>
          <span className="text-border">•</span>
          <span className="text-muted-foreground">
            Cases are created from an event with the Create case action.
          </span>
          <Link
            to="/events"
            className="inline-flex items-center gap-0.5 text-primary hover:underline font-medium"
          >
            <span>Go to Event inbox</span>
            <ArrowUpRight className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};
