import React from 'react';
import { History, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatAbsoluteMYT, parseDate } from '@/lib/dateTime';
import type { CaseActivityEntry } from '@/types/cases';

export interface CaseRecentActivityCardProps {
  activities: CaseActivityEntry[];
  onOpenAllActivity: () => void;
}

export const CaseRecentActivityCard: React.FC<CaseRecentActivityCardProps> = ({
  activities = [],
  onOpenAllActivity,
}) => {
  // Take latest 5 entries (newest first)
  const recentEntries = [...activities].reverse().slice(0, 5);

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <History className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenAllActivity}
          className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1 font-medium"
        >
          <span>All activity</span>
          <ArrowRight className="size-3.5" />
        </Button>
      </div>

      <div className="p-4">
        {recentEntries.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No activity recorded yet.
          </div>
        ) : (
          <div className="space-y-3">
            {recentEntries.map((act) => {
              const d = parseDate(act.timestamp);
              const formattedTime = d ? formatAbsoluteMYT(d) : act.timestamp;

              return (
                <div key={act.id} className="flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-foreground font-medium truncate">{act.text}</p>
                    <p className="text-[11px] text-muted-foreground">
                      by <span className="font-semibold text-foreground/80">{act.actor}</span>
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap tabular-nums">
                    {formattedTime}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
