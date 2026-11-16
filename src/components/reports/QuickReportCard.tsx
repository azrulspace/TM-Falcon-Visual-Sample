import React from 'react';
import { ArrowRight, Calendar, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReportTemplateMeta } from '@/types/reports';

export interface QuickReportCardProps {
  template: ReportTemplateMeta;
  periodLabel: string;
  badgeLabel?: string;
  onOpen: (template: ReportTemplateMeta) => void;
}

export const QuickReportCard: React.FC<QuickReportCardProps> = ({
  template,
  periodLabel,
  badgeLabel = 'One-click run',
  onOpen,
}) => {
  return (
    <div
      onClick={() => onOpen(template)}
      className={cn(
        'group relative flex flex-col justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/30 hover:border-primary/50 transition-all cursor-pointer shadow-xs hover:shadow-md'
      )}
    >
      <div>
        {/* Header line with badge and scope */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
            <Calendar className="size-3 text-muted-foreground/80" />
            <span>{periodLabel}</span>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="size-2.5" />
            <span>{badgeLabel}</span>
          </span>
        </div>

        {/* Title & Purpose */}
        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
          <span>{template.name}</span>
          <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
          {template.purpose}
        </p>
      </div>

      {/* Footer metadata */}
      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground font-medium">
        <span className="truncate">Audience: {template.audience.join(', ')}</span>
        <span className="text-primary group-hover:underline text-xs shrink-0">Open report &rarr;</span>
      </div>
    </div>
  );
};
