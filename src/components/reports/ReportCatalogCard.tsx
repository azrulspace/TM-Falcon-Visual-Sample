import React from 'react';
import { ArrowRight, Clock, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReportTemplateMeta } from '@/types/reports';

export interface ReportCatalogCardProps {
  template: ReportTemplateMeta;
  lastGeneratedTime?: string | null;
  isScheduled?: boolean;
  onOpen: (template: ReportTemplateMeta) => void;
}

export const ReportCatalogCard: React.FC<ReportCatalogCardProps> = ({
  template,
  lastGeneratedTime,
  isScheduled = false,
  onOpen,
}) => {
  return (
    <div
      onClick={() => onOpen(template)}
      className={cn(
        'group flex flex-col justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/30 hover:border-primary/50 transition-all cursor-pointer shadow-xs'
      )}
    >
      <div>
        {/* Top Badges & Indicators */}
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {template.audience.map((aud) => (
              <span
                key={aud}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border"
              >
                {aud}
              </span>
            ))}
          </div>

          {/* Schedule Indicator */}
          {template.scheduleSupported && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded',
                isScheduled
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'text-muted-foreground'
              )}
              title={isScheduled ? 'Active automated schedule' : 'Supports recurring schedules'}
            >
              <Clock className="size-2.5" />
              <span>{isScheduled ? 'Scheduled' : 'Schedulable'}</span>
            </span>
          )}
        </div>

        {/* Title & Purpose */}
        <div className="flex items-start justify-between gap-2 mt-1">
          <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
            <FileText className="size-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
            <span>{template.name}</span>
          </h4>
          <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
        </div>

        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
          {template.purpose}
        </p>
      </div>

      {/* Footer metadata */}
      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
        <span className="truncate">
          {lastGeneratedTime ? `Last run: ${lastGeneratedTime}` : 'Not run recently'}
        </span>
        <span className="text-primary text-xs font-sans group-hover:underline font-medium shrink-0">
          View report &rarr;
        </span>
      </div>
    </div>
  );
};
