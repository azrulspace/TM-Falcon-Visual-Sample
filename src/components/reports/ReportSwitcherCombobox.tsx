import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ChevronDown,
  Search,
  Check,
  Clock,
  Lock,
  Layers,
  Radio,
  BarChart3,
  Activity,
  ShieldAlert,
  Database,
  Calendar,
  History,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  CONSOLIDATED_REPORTS,
  getReportBySlug,
  type ConsolidatedReportMeta,
} from '@/data/reportsCatalog';

export interface ReportSwitcherComboboxProps {
  currentSlug: string;
  canViewAuditLog?: boolean;
}

const GROUP_ICONS: Record<string, React.ReactNode> = {
  Overview: <BarChart3 className="size-3.5 text-blue-500" />,
  Operations: <Activity className="size-3.5 text-emerald-500" />,
  Cases: <ShieldAlert className="size-3.5 text-amber-500" />,
  Network: <Radio className="size-3.5 text-purple-500" />,
  Planning: <Layers className="size-3.5 text-indigo-500" />,
  Review: <Database className="size-3.5 text-rose-500" />,
};

export const ReportSwitcherCombobox: React.FC<ReportSwitcherComboboxProps> = ({
  currentSlug,
  canViewAuditLog = false,
}) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeReport = useMemo(() => {
    return getReportBySlug(currentSlug) || CONSOLIDATED_REPORTS[0];
  }, [currentSlug]);

  // Read recent reports from localStorage
  const [recentSlugs, setRecentSlugs] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('falcon_recent_reports');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((s) => s !== currentSlug).slice(0, 3);
        }
      }
    } catch {
      // fallback
    }
    return [];
  });

  // Track counts for Schedules and Saved runs
  const [scheduleCount] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('falcon_scheduled_reports');
      if (stored) return JSON.parse(stored).length;
    } catch {
      // ignore
    }
    return 3;
  });

  const [savedCount] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('falcon_report_snapshots');
      if (stored) return JSON.parse(stored).length;
    } catch {
      // ignore
    }
    return 3;
  });

  // Update recent reports on mount or slug change
  useEffect(() => {
    try {
      const stored = localStorage.getItem('falcon_recent_reports');
      let recents: string[] = stored ? JSON.parse(stored) : [];
      recents = [currentSlug, ...recents.filter((s) => s !== currentSlug)].slice(0, 5);
      localStorage.setItem('falcon_recent_reports', JSON.stringify(recents));
      setRecentSlugs(recents.filter((s) => s !== currentSlug).slice(0, 3));
    } catch {
      // fallback
    }
  }, [currentSlug]);

  // Global 'R' keyboard shortcut to open combobox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          setOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered reports
  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return CONSOLIDATED_REPORTS;
    const q = searchQuery.toLowerCase().trim();
    return CONSOLIDATED_REPORTS.filter((r) => {
      return (
        r.name.toLowerCase().includes(q) ||
        r.purpose.toLowerCase().includes(q) ||
        r.group.toLowerCase().includes(q) ||
        r.audience.some((a) => a.toLowerCase().includes(q))
      );
    });
  }, [searchQuery]);

  // Grouped reports
  const groups = useMemo(() => {
    const map: Record<string, ConsolidatedReportMeta[]> = {
      Overview: [],
      Operations: [],
      Cases: [],
      Network: [],
      Planning: [],
      Review: [],
    };
    for (const r of filteredReports) {
      if (map[r.group]) {
        map[r.group].push(r);
      }
    }
    return Object.entries(map).filter(([_, items]) => items.length > 0);
  }, [filteredReports]);

  // Flat list for keyboard navigation
  const flatSelectable = useMemo(() => {
    return filteredReports.filter((r) => r.slug !== 'audit-log' || canViewAuditLog);
  }, [filteredReports, canViewAuditLog]);

  const handleSelect = (report: ConsolidatedReportMeta) => {
    if (report.slug === 'audit-log' && !canViewAuditLog) {
      return;
    }
    setOpen(false);
    navigate(`/reports/${report.slug}`);
  };

  const handleKeyDownCombobox = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % flatSelectable.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatSelectable.length) % flatSelectable.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatSelectable[selectedIndex]) {
        handleSelect(flatSelectable[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={
        <div className="group text-left cursor-pointer select-none">
          <div className="inline-flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
              <span>{activeReport.name}</span>
              <ChevronDown className="size-4 text-muted-foreground group-hover:text-primary transition-transform duration-200" />
            </h1>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">
            {activeReport.purpose}
          </p>
        </div>
      } />

      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[360px] sm:w-[420px] p-0 shadow-2xl rounded-xl border border-border/80 bg-card/95 backdrop-blur-md overflow-hidden z-50"
        onKeyDown={handleKeyDownCombobox}
      >
        {/* Top search input */}
        <div className="p-3 border-b border-border/60 bg-muted/20">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search reports or questions..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIndex(0);
              }}
              className="w-full pl-8 pr-12 py-1.5 text-xs rounded-lg bg-background border border-border/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground/60 border border-border/60 rounded px-1">
              R
            </span>
          </div>
        </div>

        {/* Scrollable list */}
        <div className="max-h-[360px] overflow-y-auto p-2 space-y-3">
          {/* Recent reports row (only when search is empty) */}
          {!searchQuery.trim() && recentSlugs.length > 0 && (
            <div className="px-2 pt-1 pb-1">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                <Clock className="size-3" />
                <span>Recent</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentSlugs.map((slug) => {
                  const r = getReportBySlug(slug);
                  if (!r) return null;
                  return (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => handleSelect(r)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-muted/60 hover:bg-muted text-foreground transition-colors cursor-pointer"
                    >
                      <span>{r.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Grouped report items */}
          {groups.map(([groupName, items]) => (
            <div key={groupName} className="space-y-0.5">
              <div className="px-2 py-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {GROUP_ICONS[groupName]}
                <span>{groupName}</span>
              </div>

              {items.map((report) => {
                const isSelected = report.slug === activeReport.slug;
                const isLocked = report.slug === 'audit-log' && !canViewAuditLog;

                return (
                  <button
                    key={report.slug}
                    type="button"
                    disabled={isLocked}
                    onClick={() => handleSelect(report)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-start justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-primary/10 text-primary font-medium'
                        : isLocked
                        ? 'opacity-50 cursor-not-allowed text-muted-foreground'
                        : 'hover:bg-muted/60 text-foreground'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold truncate">{report.name}</span>
                        {isLocked && (
                          <span title="Requires Admin or System role">
                            <Lock className="size-3 text-muted-foreground" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {report.purpose}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-1 pt-0.5">
                      {isSelected && <Check className="size-3.5 text-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}

          {groups.length === 0 && (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No reports matching &ldquo;{searchQuery}&rdquo;.
            </div>
          )}
        </div>

        {/* Popover footer: Quick links to Schedules and Saved runs */}
        <div className="px-3 py-2 border-t border-border/60 bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
          <Link
            to="/reports/schedules"
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <Calendar className="size-3.5" />
            <span>Schedules ({scheduleCount})</span>
          </Link>

          <Link
            to="/reports/saved"
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <History className="size-3.5" />
            <span>Saved runs ({savedCount})</span>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
};
