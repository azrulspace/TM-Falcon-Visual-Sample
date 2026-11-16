import React from 'react';
import { ArrowUp, ArrowDown, Minus, AlertTriangle } from 'lucide-react';
import type { ReportKpiItem } from '@/types/reports';

export interface ReportKpiStripProps {
  items: ReportKpiItem[];
  className?: string;
}

export const ReportKpiStrip: React.FC<ReportKpiStripProps> = ({ items, className = '' }) => {
  return (
    <div
      className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 ${className}`}
      data-testid="report-kpi-strip"
    >
      {items.map((kpi) => {
        const isNotAvailable = kpi.status && kpi.status !== 'computable now';

        return (
          <div
            key={kpi.id}
            className="p-3.5 rounded-xl border border-border bg-card/80 hover:bg-card transition-colors flex flex-col justify-between space-y-2"
          >
            {/* Header: Label and optional info icon */}
            <div className="flex items-start justify-between gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground line-clamp-1">
                {kpi.label}
              </span>
              {isNotAvailable && (
                <span
                  title={kpi.missingReason || 'Backend pipeline in progress'}
                  className="text-amber-500 shrink-0"
                >
                  <AlertTriangle className="size-3" />
                </span>
              )}
            </div>

            {/* Value display */}
            <div>
              {isNotAvailable ? (
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold text-muted-foreground italic">
                    Not available yet
                  </div>
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono line-clamp-1">
                    {kpi.missingReason || 'Needs backend'}
                  </div>
                </div>
              ) : (
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                    {typeof kpi.value === 'number'
                      ? kpi.value.toLocaleString()
                      : kpi.value}
                  </span>
                  {kpi.unit && (
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {kpi.unit}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Comparison delta row (when comparison is enabled) */}
            {kpi.delta && !isNotAvailable && (
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
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  vs prior
                </span>
              </div>
            )}

            {/* If no delta, show subtitle or helper note */}
            {!kpi.delta && kpi.subtext && !isNotAvailable && (
              <div className="text-[10px] text-muted-foreground truncate pt-0.5">
                {kpi.subtext}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
