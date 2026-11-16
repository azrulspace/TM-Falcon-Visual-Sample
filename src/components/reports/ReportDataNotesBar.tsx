import React from 'react';
import { BookOpen, Clock } from 'lucide-react';
import { formatAbsoluteMYT, getServerNow } from '@/lib/dateTime';
import { DataNotesPopover, type ActionableDataNote } from './DataNotesPopover';
import type { ReportDateRange } from '@/types/reports';

export interface ReportDataNotesBarProps {
  range: ReportDateRange;
  siteName: string;
  eventCount: number;
  caseCount: number;
  deviceCount: number;
  dataNotes?: ActionableDataNote[];
  onOpenDefinitions?: () => void;
}

export const ReportDataNotesBar: React.FC<ReportDataNotesBarProps> = ({
  range,
  siteName,
  eventCount,
  caseCount,
  deviceCount,
  dataNotes = [],
  onOpenDefinitions,
}) => {
  const asOfTime = formatAbsoluteMYT(getServerNow().toISOString());

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-card border border-border/60 text-xs text-muted-foreground shadow-xs">
      {/* Plain summary sentence conforming to Stakeholder Verdict Section 7 */}
      <div className="flex items-center gap-2 flex-wrap">
        <Clock className="size-3.5 text-muted-foreground shrink-0" />
        <span className="leading-relaxed">
          <strong className="text-foreground font-semibold">{range.label}</strong>,{' '}
          <span className="font-medium text-foreground">{siteName}</span>.{' '}
          Based on <strong className="text-foreground font-semibold">{eventCount}</strong> events,{' '}
          <strong className="text-foreground font-semibold">{caseCount}</strong> cases and{' '}
          <strong className="text-foreground font-semibold">{deviceCount}</strong> devices.{' '}
          Data as of <span className="font-mono text-muted-foreground">{asOfTime}</span>.
        </span>
      </div>

      {/* Right side: Actionable data notes popover & definitions link */}
      <div className="flex items-center gap-2.5 shrink-0">
        {dataNotes.length > 0 && <DataNotesPopover notes={dataNotes} />}

        {onOpenDefinitions && (
          <button
            type="button"
            onClick={onOpenDefinitions}
            className="inline-flex items-center gap-1 text-primary hover:underline cursor-pointer font-medium text-xs"
            title="View metric formulas and calculation definitions"
          >
            <BookOpen className="size-3" />
            <span>Definitions</span>
          </button>
        )}
      </div>
    </div>
  );
};
