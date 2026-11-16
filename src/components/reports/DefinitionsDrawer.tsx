import React, { useState, useMemo } from 'react';
import { BookOpen, Search, AlertTriangle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { METRIC_DEFINITIONS } from '@/lib/metricDictionary';

export interface DefinitionsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportName?: string;
  reportMetricIds?: string[];
}

export const DefinitionsDrawer: React.FC<DefinitionsDrawerProps> = ({
  open,
  onOpenChange,
  reportName,
  reportMetricIds,
}) => {
  const [search, setSearch] = useState<string>('');
  const [filterScope, setFilterScope] = useState<'report' | 'all'>(
    reportMetricIds && reportMetricIds.length > 0 ? 'report' : 'all'
  );

  const activeMetricList = useMemo(() => {
    let list = Object.values(METRIC_DEFINITIONS);
    if (filterScope === 'report' && reportMetricIds && reportMetricIds.length > 0) {
      list = list.filter((m) => reportMetricIds.includes(m.id));
    }
    const q = search.trim().toLowerCase();
    if (!q) return list;

    return list.filter(
      (m) =>
        m.label.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.formula.toLowerCase().includes(q) ||
        m.source.toLowerCase().includes(q)
    );
  }, [filterScope, reportMetricIds, search]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 bg-card text-card-foreground border-l border-border shadow-2xl flex flex-col z-50"
      >
        {/* Header */}
        <SheetHeader className="p-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary shrink-0" />
            <SheetTitle className="text-base font-semibold text-foreground">
              Metric Dictionary
            </SheetTitle>
          </div>
          <SheetDescription className="text-xs text-muted-foreground">
            Plain language definitions, exact formulas, inclusion rules, and backend data sources.
          </SheetDescription>

          {/* Scope switcher if scoped to a report */}
          {reportMetricIds && reportMetricIds.length > 0 && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
              <button
                type="button"
                onClick={() => setFilterScope('report')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                  filterScope === 'report'
                    ? 'bg-primary/15 text-primary border border-primary/30 font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {reportName ? `This report (${reportMetricIds.length})` : 'Report metrics'}
              </button>
              <button
                type="button"
                onClick={() => setFilterScope('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                  filterScope === 'all'
                    ? 'bg-primary/15 text-primary border border-primary/30 font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All catalog metrics ({Object.keys(METRIC_DEFINITIONS).length})
              </button>
            </div>
          )}

          {/* Search box */}
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search definitions by metric name, formula, or source..."
              className="w-full h-8 pl-8 pr-3 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            />
          </div>
        </SheetHeader>

        {/* Metric Cards List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {activeMetricList.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
              No metric definitions match your search query.
            </div>
          ) : (
            activeMetricList.map((metric) => (
              <div
                key={metric.id}
                className="p-3.5 rounded-xl border border-border bg-background/50 hover:bg-background transition-colors space-y-2 text-xs"
              >
                {/* Metric title & status badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                      <span>{metric.label}</span>
                    </h4>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      ID: {metric.id} · Unit: {metric.unit} · Source: {metric.source}
                    </span>
                  </div>

                  {/* Status badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider shrink-0 border ${
                      metric.status === 'computable now'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : metric.status === 'needs backend'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        : 'bg-destructive/10 text-destructive border-destructive/20'
                    }`}
                  >
                    {metric.status}
                  </span>
                </div>

                {/* Description */}
                <p className="text-foreground/90 leading-relaxed text-xs">
                  {metric.description}
                </p>

                {/* Formula box */}
                <div className="p-2 rounded-lg bg-muted/40 border border-border/60 font-mono text-[11px] text-foreground space-y-1">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    Formula
                  </div>
                  <div className="text-primary break-words font-medium">{metric.formula}</div>
                </div>

                {/* Inclusion rules & missing reason if any */}
                <div className="space-y-1 pt-1 text-[11px] text-muted-foreground border-t border-border/40">
                  <div>
                    <span className="font-semibold text-foreground">Inclusion rules: </span>
                    <span>{metric.inclusionRules}</span>
                  </div>
                  {metric.missingFieldReason && (
                    <div className="text-amber-600 dark:text-amber-400 flex items-start gap-1 pt-0.5">
                      <AlertTriangle className="size-3 shrink-0 mt-0.5" />
                      <span>{metric.missingFieldReason}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
