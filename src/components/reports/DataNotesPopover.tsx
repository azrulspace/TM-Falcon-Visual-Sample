import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

export interface ActionableDataNote {
  id: string;
  count: number;
  label: string;
  description: string;
  severity: 'high' | 'medium' | 'info';
  actionLabel: string;
  actionHref: string;
}

export interface DataNotesPopoverProps {
  notes: ActionableDataNote[];
  className?: string;
}

export const DataNotesPopover: React.FC<DataNotesPopoverProps> = ({ notes, className = '' }) => {
  // If no actionable notes, omit entirely
  if (!notes || notes.length === 0) {
    return null;
  }

  // Cap at at most 5 actionable items ordered by impact
  const topNotes = notes.slice(0, 5);

  return (
    <Popover>
      <PopoverTrigger render={
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 px-2 text-xs gap-1.5 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 rounded-md cursor-pointer ${className}`}
          title="View actionable data quality and integrity notices for this report"
        >
          <AlertTriangle className="size-3 text-amber-500" />
          <span>Data notes ({topNotes.length})</span>
        </Button>
      } />

      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-80 sm:w-96 p-0 shadow-xl rounded-xl border border-border/80 bg-card z-50 overflow-hidden"
      >
        <div className="p-3 border-b border-border/60 bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="size-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-foreground">
              Actionable data notes ({topNotes.length})
            </span>
          </div>
          <Link
            to="/reports/data-quality"
            className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1"
          >
            <span>Full audit</span>
            <ExternalLink className="size-2.5" />
          </Link>
        </div>

        <div className="p-2 divide-y divide-border/40 max-h-[320px] overflow-y-auto">
          {topNotes.map((note) => (
            <div key={note.id} className="p-2 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-foreground leading-tight">
                  {note.label}
                </span>
                <span className="shrink-0 px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-muted text-muted-foreground border border-border/40">
                  {note.count}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {note.description}
              </p>
              <div className="pt-1">
                <Link
                  to={note.actionHref}
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
                >
                  <span>{note.actionLabel}</span>
                  <ExternalLink className="size-2.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="p-2 border-t border-border/60 bg-muted/20 text-[10px] text-muted-foreground">
          Showing top {topNotes.length} highest impact items. Numbers exclude synthetic test scenarios.
        </div>
      </PopoverContent>
    </Popover>
  );
};
