import React from 'react';
import { BookOpen, AlertCircle, Clock } from 'lucide-react';
import { formatAbsoluteMYT, getServerNow } from '@/lib/dateTime';
import type { ReportDateRange } from '@/types/reports';

export interface ReportDataNotesBarProps {
  range: ReportDateRange;
  siteName: string;
  recordCount?: number;
  recordLabel?: string;
  onOpenDefinitions?: () => void;
  dataQualityIssuesCount?: number;
}

export const ReportDataNotesBar: React.FC<ReportDataNotesBarProps> = ({
  range,
  siteName,
  recordCount,
  recordLabel = 'records',
  onOpenDefinitions,
  dataQualityIssuesCount = 0,
}) => {
  const asOfTime = formatAbsoluteMYT(getServerNow().toISOString());

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/60 text-[11px] text-muted-foreground">
      {/* Left side details */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 font-medium text-foreground">
          <Clock className="size-3 text-primary shrink-0" />
          <span>Data as of:</span>
          <span className="font-mono text-muted-foreground">{asOfTime}</span>
        </span>

        <span className="text-border">|</span>

        <span>
          <strong className="text-foreground">Period: </strong>
          <span>{range.label}</span>
        </span>

        <span className="text-border">|</span>

        <span>
          <strong className="text-foreground">Scope: </strong>
          <span>{siteName}</span>
        </span>

        {recordCount !== undefined && (
          <>
            <span className="text-border">|</span>
            <span>
              <strong className="text-foreground">{recordCount.toLocaleString()}</strong> {recordLabel} evaluated
            </span>
          </>
        )}
      </div>

      {/* Right side links */}
      <div className="flex items-center gap-3">
        {dataQualityIssuesCount > 0 && (
          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
            <AlertCircle className="size-3 shrink-0" />
            <span>{dataQualityIssuesCount} data quality notes</span>
          </span>
        )}

        {onOpenDefinitions && (
          <button
            type="button"
            onClick={onOpenDefinitions}
            className="inline-flex items-center gap-1 text-primary hover:underline cursor-pointer font-medium"
          >
            <BookOpen className="size-3 shrink-0" />
            <span>Metric formulas & definitions</span>
          </button>
        )}
      </div>
    </div>
  );
};
