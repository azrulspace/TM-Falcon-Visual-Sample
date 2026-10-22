import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search,
  X,
  ArrowUpRight,
  Filter,
  ChevronDown,
  Check,
  Bookmark,
  Star,
  Trash2,
  Edit2,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { CaseStatusCounts, CaseFilterState } from '@/data/caseSelectors';
import type { CaseStatus } from '@/types/cases';
import { useCases, type CaseSavedView } from '@/contexts/CasesContext';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';

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
  const { savedViews, saveView, renameSavedView, deleteSavedView, setDefaultView } = useCases();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Local search state with 250ms debouncing (Section 6.5)
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  // Saved Views dialog state
  const [saveViewName, setSaveViewName] = useState('');
  const [saveViewOpen, setSaveViewOpen] = useState(false);
  const [editingViewId, setEditingViewId] = useState<string | null>(null);
  const [editingViewName, setEditingViewName] = useState('');
  const [mobileFilterSheetOpen, setMobileFilterSheetOpen] = useState(false);

  // Custom date range inputs
  const [customStart, setCustomStart] = useState(filters.customTimeStart || '');
  const [customEnd, setCustomEnd] = useState(filters.customTimeEnd || '');

  useEffect(() => {
    setLocalSearch(filters.search || '');
  }, [filters.search]);

  // Debounced search (Section 6.5)
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((filters.search || '') !== localSearch.trim()) {
        setFilters((prev) => ({
          ...prev,
          search: localSearch.trim() || undefined,
        }));
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [localSearch, filters.search, setFilters]);

  // Keyboard shortcut '/' focuses search
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

  const updateFilter = useCallback(
    (key: keyof CaseFilterState, val: any) => {
      setFilters((prev) => ({ ...prev, [key]: val }));
    },
    [setFilters]
  );

  const removeFilter = useCallback(
    (key: keyof CaseFilterState) => {
      setFilters((prev) => {
        const next = { ...prev };
        delete next[key];
        if (key === 'timeRange') {
          delete next.customTimeStart;
          delete next.customTimeEnd;
        }
        return next;
      });
    },
    [setFilters]
  );

  const clearAllFilters = useCallback(() => {
    setFilters({
      tab: 'all',
      search: undefined,
      status: undefined,
      openOnly: false,
      assignee: undefined,
      timeRange: undefined,
      customTimeStart: undefined,
      customTimeEnd: undefined,
      priority: undefined,
      type: undefined,
      asset: undefined,
      device: undefined,
      sourceEventId: undefined,
    });
    setLocalSearch('');
  }, [setFilters]);

  const handleTabChange = useCallback(
    (tabKey: CaseTabKey) => {
      setFilters((prev) => ({
        ...prev,
        tab: tabKey,
        // If tab changed to a specific status, clear multi-status array to avoid conflict
        status: undefined,
        // If tab is 'closed', uncheck openOnly
        openOnly: tabKey === 'closed' ? false : prev.openOnly,
      }));
    },
    [setFilters]
  );

  // Multi-select Status toggle (Open, In progress, In review, Closed)
  const handleToggleStatus = (s: CaseStatus) => {
    const current = Array.isArray(filters.status)
      ? filters.status
      : filters.status
      ? (filters.status as string).split(',').map((x) => x.trim() as CaseStatus)
      : [];
    let updated: CaseStatus[];
    if (current.includes(s)) {
      updated = current.filter((x) => x !== s);
    } else {
      updated = [...current, s];
    }

    setFilters((prev) => ({
      ...prev,
      tab: 'all',
      status: updated.length > 0 ? updated : undefined,
      openOnly: updated.includes('Closed') ? false : prev.openOnly,
    }));
  };

  // Multi-select Assignee toggle (Unassigned, Field Team, etc.)
  const handleToggleAssignee = (a: string) => {
    const current = Array.isArray(filters.assignee)
      ? filters.assignee
      : filters.assignee
      ? (filters.assignee as string).split(',').map((x) => x.trim())
      : [];
    let updated: string[];
    if (current.includes(a)) {
      updated = current.filter((x) => x !== a);
    } else {
      updated = [...current, a];
    }
    updateFilter('assignee', updated.length > 0 ? updated : undefined);
  };

  // Multi-select Priority toggle (Critical, High, Medium, Low)
  const handleTogglePriority = (p: string) => {
    const current = Array.isArray(filters.priority)
      ? filters.priority
      : filters.priority
      ? (filters.priority as string).split(',').map((x) => x.trim())
      : [];
    let updated: string[];
    if (current.includes(p)) {
      updated = current.filter((x) => x !== p);
    } else {
      updated = [...current, p];
    }
    updateFilter('priority', updated.length > 0 ? updated : undefined);
  };

  // Multi-select Type toggle
  const handleToggleType = (t: string) => {
    const current = Array.isArray(filters.type)
      ? filters.type
      : filters.type
      ? (filters.type as string).split(',').map((x) => x.trim())
      : [];
    let updated: string[];
    if (current.includes(t)) {
      updated = current.filter((x) => x !== t);
    } else {
      updated = [...current, t];
    }
    updateFilter('type', updated.length > 0 ? updated : undefined);
  };

  // Open only switch toggle (excludes closed)
  const handleToggleOpenOnly = (checked: boolean) => {
    setFilters((prev) => {
      // If openOnly turned on, ensure tab is not 'closed'
      return {
        ...prev,
        openOnly: checked,
        tab: checked && prev.tab === 'closed' ? 'all' : prev.tab,
      };
    });
  };

  // Apply a saved view
  const handleApplySavedView = (sv: CaseSavedView) => {
    setFilters({
      tab: sv.filters.tab || 'all',
      search: sv.filters.search,
      status: sv.filters.status as any,
      openOnly: sv.filters.openOnly,
      assignee: sv.filters.assignee,
      timeRange: sv.filters.timeRange,
      priority: sv.filters.priority,
      type: sv.filters.type,
    });
    setLocalSearch(sv.filters.search || '');
  };

  const tabs: { key: CaseTabKey; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: statusCounts.all },
    { key: 'open', label: 'Open', count: statusCounts.open },
    { key: 'in_progress', label: 'In progress', count: statusCounts.in_progress },
    { key: 'in_review', label: 'In review', count: statusCounts.in_review },
    { key: 'closed', label: 'Closed', count: statusCounts.closed },
  ];

  const currentTab = (filters.tab as CaseTabKey) || 'all';

  // Construct active pills list for active chip strip
  const activePills = useMemo(() => {
    const pills: { key: keyof CaseFilterState; label: string; value: string }[] = [];

    if (filters.openOnly) {
      pills.push({ key: 'openOnly', label: 'Filter', value: 'Open only' });
    }
    if (filters.status && filters.status.length > 0) {
      const s = Array.isArray(filters.status) ? filters.status.join(', ') : filters.status;
      pills.push({ key: 'status', label: 'Status', value: s });
    }
    if (filters.assignee && filters.assignee.length > 0) {
      const a = Array.isArray(filters.assignee) ? filters.assignee.join(', ') : filters.assignee;
      pills.push({ key: 'assignee', label: 'Assignee', value: a });
    }
    if (filters.timeRange) {
      const timeLabels: Record<string, string> = {
        today: 'Today',
        '24h': 'Last 24h',
        '7d': 'Last 7d',
        '30d': 'Last 30d',
        custom: 'Custom range',
      };
      pills.push({ key: 'timeRange', label: 'Time', value: timeLabels[filters.timeRange] || filters.timeRange });
    }
    if (filters.priority && filters.priority.length > 0) {
      const p = Array.isArray(filters.priority) ? filters.priority.join(', ') : filters.priority;
      pills.push({ key: 'priority', label: 'Priority', value: p });
    }
    if (filters.type && filters.type.length > 0) {
      const t = Array.isArray(filters.type) ? filters.type.join(', ') : filters.type;
      pills.push({ key: 'type', label: 'Type', value: t });
    }
    if (filters.asset) {
      pills.push({ key: 'asset', label: 'Asset', value: filters.asset });
    }
    if (filters.device) {
      pills.push({ key: 'device', label: 'Device', value: filters.device });
    }
    if (filters.sourceEventId) {
      pills.push({ key: 'sourceEventId', label: 'Source Event', value: filters.sourceEventId });
    }
    if (filters.search) {
      pills.push({ key: 'search', label: 'Search', value: `"${filters.search}"` });
    }

    return pills;
  }, [filters]);

  const statusOptions: CaseStatus[] = ['Open', 'In progress', 'In review', 'Closed'];
  const assigneeOptions = ['Unassigned', 'Field Team', 'Ahmad Syukri', 'Farhan Malik', 'Zulhilmi'];
  const priorityOptions = ['Critical', 'High', 'Medium', 'Low'];
  const typeOptions = [
    'Monkey near cable',
    'High temperature alert',
    'Vibration anomaly',
    'Person near pole',
    'Optical splice loss',
    'Tension fault',
  ];

  return (
    <div className="flex flex-col gap-3 mb-4 select-none">
      {/* Upper row: Status Tabs on left, Views & Search on right */}
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

        {/* Right side: Views Dropdown and Search Input */}
        <div className="flex items-center gap-2">
          {/* Views Dropdown (Section 6.5) */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs gap-1.5 border-border hover:bg-muted font-medium"
                >
                  <Bookmark className="size-3.5 text-muted-foreground" />
                  <span>Views</span>
                  <ChevronDown className="size-3 opacity-60" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56 bg-popover border border-border shadow-xl z-50 text-xs">
              <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground">
                Saved Views
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <div className="flex flex-col gap-0.5 p-1">
                {savedViews.map((sv) => (
                  <div
                    key={sv.id}
                    className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted text-xs cursor-pointer group"
                  >
                    {editingViewId === sv.id ? (
                      <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingViewName}
                          onChange={(e) => setEditingViewName(e.target.value)}
                          className="h-6 px-1.5 text-xs border border-border rounded bg-card flex-1"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          className="h-6 px-2 text-[10px]"
                          onClick={() => {
                            renameSavedView(sv.id, editingViewName);
                            setEditingViewId(null);
                          }}
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div
                          className="flex items-center gap-1.5 truncate flex-1"
                          onClick={() => handleApplySavedView(sv)}
                        >
                          <Bookmark className={cn('size-3 shrink-0', sv.isDefault ? 'text-amber-500 fill-amber-500' : 'text-primary')} />
                          <span className="truncate">{sv.name}</span>
                          {sv.isDefault && (
                            <span className="text-[9px] px-1 rounded bg-amber-500/10 text-amber-500 font-semibold">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDefaultView(sv.id);
                            }}
                            className="p-1 hover:text-amber-500 text-muted-foreground"
                            title="Set as default"
                          >
                            <Star className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingViewId(sv.id);
                              setEditingViewName(sv.name);
                            }}
                            className="p-1 hover:text-primary text-muted-foreground"
                            title="Rename view"
                          >
                            <Edit2 className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSavedView(sv.id);
                            }}
                            className="p-1 hover:text-destructive text-muted-foreground"
                            title="Delete view"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <DropdownMenuSeparator />

              {/* Save current view */}
              <div className="p-1">
                <Popover open={saveViewOpen} onOpenChange={setSaveViewOpen}>
                  <PopoverTrigger
                    render={
                      <Button variant="ghost" size="sm" className="w-full h-7 text-xs justify-start gap-1.5 text-primary">
                        <Plus className="size-3" />
                        <span>Save current view</span>
                      </Button>
                    }
                  />
                  <PopoverContent align="end" className="w-64 p-3 bg-popover border border-border shadow-xl z-50 text-xs">
                    <div className="font-semibold text-foreground mb-2">Save current view</div>
                    <input
                      type="text"
                      placeholder="e.g. Unassigned High Priority"
                      value={saveViewName}
                      onChange={(e) => setSaveViewName(e.target.value)}
                      className="w-full h-8 px-2 text-xs border border-border rounded mb-3 bg-card"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setSaveViewOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={!saveViewName.trim()}
                        onClick={() => {
                          saveView(saveViewName.trim(), {
                            tab: filters.tab,
                            search: filters.search,
                            status: filters.status ? (Array.isArray(filters.status) ? filters.status : (filters.status as string).split(',')) : undefined,
                            openOnly: filters.openOnly,
                            assignee: filters.assignee ? (Array.isArray(filters.assignee) ? filters.assignee : (filters.assignee as string).split(',')) : undefined,
                            timeRange: filters.timeRange,
                            priority: filters.priority ? (Array.isArray(filters.priority) ? filters.priority : (filters.priority as string).split(',')) : undefined,
                            type: filters.type ? (Array.isArray(filters.type) ? filters.type : (filters.type as string).split(',')) : undefined,
                          });
                          setSaveViewName('');
                          setSaveViewOpen(false);
                        }}
                      >
                        Save
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Search Input (Section 6.5) */}
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
                onClick={() => {
                  setLocalSearch('');
                  setFilters((prev) => ({ ...prev, search: undefined }));
                  searchInputRef.current?.focus();
                }}
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

      {/* Middle row: Desktop Filter Chips Strip (Section 6.5) */}
      <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-muted-foreground flex items-center gap-1 shrink-0 font-medium mr-1">
          <Filter className="size-3" />
          <span>Filter:</span>
        </span>

        {/* 1. Open only Switch Toggle (Section 6.5) */}
        <label className="h-7 px-2.5 rounded-full border border-border bg-card flex items-center gap-2 cursor-pointer hover:bg-muted/40 transition-colors shrink-0">
          <Switch
            checked={!!filters.openOnly}
            onCheckedChange={handleToggleOpenOnly}
            className="scale-75 origin-left"
          />
          <span className={cn('text-xs font-medium', filters.openOnly ? 'text-primary font-semibold' : 'text-muted-foreground')}>
            Open only
          </span>
        </label>

        {/* 2. Status Popover (Multiple Select) */}
        <Popover>
          <PopoverTrigger
            render={
              <button
                type="button"
                className={cn(
                  'h-7 px-2.5 rounded-full border text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer',
                  filters.status && filters.status.length > 0
                    ? 'bg-primary/10 border-primary text-primary font-semibold'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground'
                )}
              >
                <span>
                  Status
                  {filters.status && filters.status.length > 0
                    ? `: ${Array.isArray(filters.status) ? filters.status.join(', ') : filters.status}`
                    : ''}
                </span>
                <ChevronDown className="size-3 opacity-60" />
              </button>
            }
          />
          <PopoverContent className="w-52 p-2 bg-popover border border-border shadow-lg z-50 text-xs">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border font-semibold">
              <span>Filter Status</span>
              {filters.status && (
                <button
                  type="button"
                  onClick={() => updateFilter('status', undefined)}
                  className="text-[10px] text-primary hover:underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {statusOptions.map((s) => {
                const currentArr = Array.isArray(filters.status)
                  ? filters.status
                  : filters.status
                  ? (filters.status as string).split(',').map((x) => x.trim())
                  : [];
                const isChecked = currentArr.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleToggleStatus(s)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-left transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox checked={isChecked} className="size-3.5 pointer-events-none" />
                      <span>{s}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {/* 3. Assignee Popover (Multiple Select) */}
        <Popover>
          <PopoverTrigger
            render={
              <button
                type="button"
                className={cn(
                  'h-7 px-2.5 rounded-full border text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer',
                  filters.assignee && filters.assignee.length > 0
                    ? 'bg-primary/10 border-primary text-primary font-semibold'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground'
                )}
              >
                <span>
                  Assignee
                  {filters.assignee && filters.assignee.length > 0
                    ? `: ${Array.isArray(filters.assignee) ? filters.assignee.join(', ') : filters.assignee}`
                    : ''}
                </span>
                <ChevronDown className="size-3 opacity-60" />
              </button>
            }
          />
          <PopoverContent className="w-56 p-2 bg-popover border border-border shadow-lg z-50 text-xs">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border font-semibold">
              <span>Filter Assignee</span>
              {filters.assignee && (
                <button
                  type="button"
                  onClick={() => updateFilter('assignee', undefined)}
                  className="text-[10px] text-primary hover:underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {assigneeOptions.map((a) => {
                const currentArr = Array.isArray(filters.assignee)
                  ? filters.assignee
                  : filters.assignee
                  ? (filters.assignee as string).split(',').map((x) => x.trim())
                  : [];
                const isChecked = currentArr.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => handleToggleAssignee(a)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-left transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox checked={isChecked} className="size-3.5 pointer-events-none" />
                      <span>{a}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {/* 4. Created Time Popover (Today, 24h, 7d, 30d, Custom range) */}
        <Popover>
          <PopoverTrigger
            render={
              <button
                type="button"
                className={cn(
                  'h-7 px-2.5 rounded-full border text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer',
                  filters.timeRange
                    ? 'bg-primary/10 border-primary text-primary font-semibold'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground'
                )}
              >
                <span>
                  Created
                  {filters.timeRange
                    ? `: ${
                        filters.timeRange === 'today'
                          ? 'Today'
                          : filters.timeRange === '24h'
                          ? 'Last 24h'
                          : filters.timeRange === '7d'
                          ? 'Last 7d'
                          : filters.timeRange === '30d'
                          ? 'Last 30d'
                          : 'Custom'
                      }`
                    : ''}
                </span>
                <ChevronDown className="size-3 opacity-60" />
              </button>
            }
          />
          <PopoverContent className="w-64 p-2 bg-popover border border-border shadow-lg z-50 text-xs">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border font-semibold">
              <span>Filter Created Date (MYT)</span>
              {filters.timeRange && (
                <button
                  type="button"
                  onClick={() => {
                    updateFilter('timeRange', undefined);
                    updateFilter('customTimeStart', undefined);
                    updateFilter('customTimeEnd', undefined);
                  }}
                  className="text-[10px] text-primary hover:underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {[
                { id: undefined, label: 'All time' },
                { id: 'today', label: 'Today (from 00:00 MYT)' },
                { id: '24h', label: 'Last 24 hours' },
                { id: '7d', label: 'Last 7 days' },
                { id: '30d', label: 'Last 30 days' },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => {
                    updateFilter('timeRange', opt.id);
                    updateFilter('customTimeStart', undefined);
                    updateFilter('customTimeEnd', undefined);
                  }}
                  className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted text-left cursor-pointer"
                >
                  <span>{opt.label}</span>
                  {filters.timeRange === opt.id && <Check className="size-3.5 text-primary" />}
                </button>
              ))}

              <div className="pt-2 mt-1 border-t border-border/60">
                <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Custom Range (MYT)
                </span>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="h-7 px-1 text-[11px] border border-border rounded bg-card"
                  />
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="h-7 px-1 text-[11px] border border-border rounded bg-card"
                  />
                </div>
                <Button
                  size="sm"
                  className="w-full h-6 text-[10px]"
                  disabled={!customStart && !customEnd}
                  onClick={() => {
                    updateFilter('timeRange', 'custom');
                    updateFilter('customTimeStart', customStart ? `${customStart}T00:00:00+08:00` : undefined);
                    updateFilter('customTimeEnd', customEnd ? `${customEnd}T23:59:59+08:00` : undefined);
                  }}
                >
                  Apply Custom Range
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* 5. Priority Popover (Multiple Select, from source event) */}
        <Popover>
          <PopoverTrigger
            render={
              <button
                type="button"
                className={cn(
                  'h-7 px-2.5 rounded-full border text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer',
                  filters.priority && filters.priority.length > 0
                    ? 'bg-primary/10 border-primary text-primary font-semibold'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground'
                )}
              >
                <span>
                  Priority
                  {filters.priority && filters.priority.length > 0
                    ? `: ${Array.isArray(filters.priority) ? filters.priority.join(', ') : filters.priority}`
                    : ''}
                </span>
                <ChevronDown className="size-3 opacity-60" />
              </button>
            }
          />
          <PopoverContent className="w-48 p-2 bg-popover border border-border shadow-lg z-50 text-xs">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border font-semibold">
              <span>Filter Priority</span>
              {filters.priority && (
                <button
                  type="button"
                  onClick={() => updateFilter('priority', undefined)}
                  className="text-[10px] text-primary hover:underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {priorityOptions.map((p) => {
                const currentArr = Array.isArray(filters.priority)
                  ? filters.priority
                  : filters.priority
                  ? (filters.priority as string).split(',').map((x) => x.trim())
                  : [];
                const isChecked = currentArr.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleTogglePriority(p)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-left transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox checked={isChecked} className="size-3.5 pointer-events-none" />
                      <span>{p}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {/* 6. Type Popover (Multiple Select, from source event) */}
        <Popover>
          <PopoverTrigger
            render={
              <button
                type="button"
                className={cn(
                  'h-7 px-2.5 rounded-full border text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer',
                  filters.type && filters.type.length > 0
                    ? 'bg-primary/10 border-primary text-primary font-semibold'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground'
                )}
              >
                <span>
                  Type
                  {filters.type && filters.type.length > 0
                    ? `: ${Array.isArray(filters.type) ? filters.type.join(', ') : filters.type}`
                    : ''}
                </span>
                <ChevronDown className="size-3 opacity-60" />
              </button>
            }
          />
          <PopoverContent className="w-56 p-2 bg-popover border border-border shadow-lg z-50 text-xs">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border font-semibold">
              <span>Filter Event Type</span>
              {filters.type && (
                <button
                  type="button"
                  onClick={() => updateFilter('type', undefined)}
                  className="text-[10px] text-primary hover:underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {typeOptions.map((t) => {
                const currentArr = Array.isArray(filters.type)
                  ? filters.type
                  : filters.type
                  ? (filters.type as string).split(',').map((x) => x.trim())
                  : [];
                const isChecked = currentArr.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleToggleType(t)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-left transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox checked={isChecked} className="size-3.5 pointer-events-none" />
                      <span className="truncate">{t}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Removable Chips Strip & Clear All (Section 6.5) */}
      {activePills.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          {activePills.map((pill) => (
            <span
              key={pill.key}
              className="h-6 pl-2.5 pr-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-[11px] font-medium flex items-center gap-1 shrink-0"
            >
              <span>
                {pill.label}: <strong>{pill.value}</strong>
              </span>
              <button
                type="button"
                onClick={() => removeFilter(pill.key)}
                className="size-3.5 rounded-full hover:bg-primary/20 flex items-center justify-center cursor-pointer"
                title={`Remove ${pill.label} filter`}
              >
                <X className="size-2.5" />
              </button>
            </span>
          ))}

          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 ml-1 cursor-pointer font-medium"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Mobile Filter Button (< 768px) (Section 10) */}
      <div className="flex md:hidden items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileFilterSheetOpen(true)}
          className={cn(
            'h-7 px-2.5 rounded-full text-xs font-medium flex items-center gap-1.5 shrink-0 cursor-pointer',
            activePills.length > 0
              ? 'border-primary text-primary bg-primary/10'
              : 'border-border text-muted-foreground hover:text-foreground'
          )}
        >
          <Filter className="size-3" />
          <span>Filters{activePills.length > 0 ? ` (${activePills.length})` : ''}</span>
          <ChevronDown className="size-3 opacity-60" />
        </Button>
      </div>

      {/* Mobile Bottom Filter Sheet (< 768px) */}
      <Sheet open={mobileFilterSheetOpen} onOpenChange={setMobileFilterSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl p-0">
          <SheetHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
            <div>
              <SheetTitle className="text-base font-semibold">Filter Cases</SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Showing {totalFilteredCount} matching cases
              </SheetDescription>
            </div>
            {activePills.length > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs text-primary underline font-medium"
              >
                Clear all
              </button>
            )}
          </SheetHeader>

          <div className="p-4 space-y-4 text-xs">
            {/* Open only Toggle */}
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="font-semibold text-foreground">Open only (exclude closed)</span>
              <Switch
                checked={!!filters.openOnly}
                onCheckedChange={handleToggleOpenOnly}
              />
            </div>

            {/* Status list */}
            <div>
              <span className="font-semibold text-foreground block mb-2">Status</span>
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map((s) => {
                  const currentArr = Array.isArray(filters.status)
                    ? filters.status
                    : filters.status
                    ? (filters.status as string).split(',').map((x) => x.trim())
                    : [];
                  const isChecked = currentArr.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleToggleStatus(s)}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-lg border text-left',
                        isChecked ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border'
                      )}
                    >
                      <Checkbox checked={isChecked} className="size-3.5 pointer-events-none" />
                      <span>{s}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Assignee list */}
            <div>
              <span className="font-semibold text-foreground block mb-2">Assignee</span>
              <div className="grid grid-cols-2 gap-2">
                {assigneeOptions.map((a) => {
                  const currentArr = Array.isArray(filters.assignee)
                    ? filters.assignee
                    : filters.assignee
                    ? (filters.assignee as string).split(',').map((x) => x.trim())
                    : [];
                  const isChecked = currentArr.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => handleToggleAssignee(a)}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-lg border text-left',
                        isChecked ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border'
                      )}
                    >
                      <Checkbox checked={isChecked} className="size-3.5 pointer-events-none" />
                      <span>{a}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <SheetFooter className="p-4 border-t border-border">
            <Button
              className="w-full"
              onClick={() => setMobileFilterSheetOpen(false)}
            >
              Done ({totalFilteredCount} cases)
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

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
