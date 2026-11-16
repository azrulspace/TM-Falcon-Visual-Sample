import React from 'react';
import { ArrowUp, ArrowDown, Minus, Info } from 'lucide-react';
import type { ReportKpiItem } from '@/types/reports';

export interface ReportKpiStripProps {
  items: ReportKpiItem[];
  onOpenDefinitions?: () => void;
  className?: string;
}

export const ReportKpiStrip: React.FC<ReportKpiStripProps> = ({
  items,
  onOpenDefinitions,
  className = '',
}) => {
  // 1. Separate computable vs omitted metrics
  const computableItems = items.filter(
    (kpi) => !kpi.status || kpi.status === 'computable now'
  );
  const omittedUncomputable = items.filter(
    (kpi) => kpi.status && kpi.status !== 'computable now'
  );

  // 2. Strict maximum of 5 KPI cells per Stakeholder Verdict Section 5.3
  const visibleItems = computableItems.slice(0, 5);

  return (
    <div className={`space-y-2 ${className}`} data-testid="report-kpi-strip">
      {/* 5-column responsive KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {visibleItems.map((kpi) => {
          return (
            <div
              key={kpi.id}
              className="p-3.5 rounded-xl border border-border bg-card hover:border-border/80 transition-colors flex flex-col justify-between space-y-2 shadow-xs"
            >
              {/* Header: Label */}
              <div className="flex items-start justify-between gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground line-clamp-1">
                  {kpi.label}
                </span>
              </div>

              {/* Value display */}
              <div>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                    {typeof kpi.value === 'number'
                      ? kpi.value.toLocaleString()
                      : kpi.value}
                  </span>
                  {kpi.unit && (
                    <span className="text-xs font-medium text-muted-foreground">
                      {kpi.unit}
                    </span>
                  )}
                </div>
              </div>

              {/* Comparison delta row (when comparison is enabled) */}
              {kpi.delta ? (
                <div
                  className={`pt-1.5 border-t border-border/40 flex items-center justify-between text-[11px] font-medium ${
                    kpi.delta.direction === 'up'
                      ? kpi.isInverseDelta
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                      : kpi.delta.direction === 'down'
                      ? kpi.isInverseDelta
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                      : 'text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {kpi.delta.direction === 'up' ? (
                      <ArrowUp className="size-3 shrink-0" />
                    ) : kpi.delta.direction === 'down' ? (
                      <ArrowDown className="size-3 shrink-0" />
                    ) : (
                      <Minus className="size-3 shrink-0" />
                    )}
                    <span>{kpi.delta.formattedText}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-normal">
                    vs prior
                  </span>
                </div>
              ) : kpi.subtext ? (
                <div className="text-[11px] text-muted-foreground truncate pt-1 border-t border-border/40">
                  {kpi.subtext}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Honest single line for uncomputable metrics (Section 5.3) */}
      {omittedUncomputable.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 px-1">
          <Info className="size-3.5 text-muted-foreground shrink-0" />
          <span>
            Not shown:{' '}
            {omittedUncomputable
              .map((k) => `${k.label} (needs ${k.missingReason || 'backend policy'})`)
              .join(', ')}
            .
          </span>
          {onOpenDefinitions && (
            <button
              type="button"
              onClick={onOpenDefinitions}
              className="text-primary hover:underline font-medium inline-flex items-center gap-0.5 ml-1 cursor-pointer"
            >
              <span>View definitions</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
