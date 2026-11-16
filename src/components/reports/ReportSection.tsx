import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Download,
  Table as TableIcon,
  BarChart2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ReportSectionProps {
  id?: string;
  title: string;
  description?: string;
  onExportCsv?: () => void;
  hasTableView?: boolean;
  tableViewActive?: boolean;
  onToggleTableView?: (active: boolean) => void;
  status?: 'computable now' | 'needs backend' | 'not available';
  missingReason?: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  tableContent?: React.ReactNode;
  className?: string;
}

export const ReportSection: React.FC<ReportSectionProps> = ({
  id,
  title,
  description,
  onExportCsv,
  hasTableView = false,
  tableViewActive: controlledTableView,
  onToggleTableView,
  status = 'computable now',
  missingReason,
  defaultExpanded = true,
  children,
  tableContent,
  className = '',
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [localTableView, setLocalTableView] = useState(false);

  const isTableView = controlledTableView !== undefined ? controlledTableView : localTableView;
  const setTableView = (active: boolean) => {
    if (onToggleTableView) {
      onToggleTableView(active);
    } else {
      setLocalTableView(active);
    }
  };

  const isUnavailable = status !== 'computable now';

  return (
    <section
      id={id}
      className={`rounded-xl border border-border bg-card shadow-xs transition-shadow ${className}`}
    >
      {/* Section Header */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm md:text-base text-foreground tracking-tight">
              {title}
            </h3>
            {isUnavailable && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                title={missingReason || 'Backend pipeline in progress'}
              >
                <AlertTriangle className="size-2.5" />
                <span>{status === 'needs backend' ? 'Needs backend' : 'Not available yet'}</span>
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Section Actions */}
        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
          {hasTableView && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTableView(!isTableView)}
              className="h-7.5 px-2.5 text-xs gap-1.5"
              title={isTableView ? 'Switch to graphical visualizer' : 'Switch to detailed data table'}
            >
              {isTableView ? (
                <>
                  <BarChart2 className="size-3.5 text-primary" />
                  <span>View as chart</span>
                </>
              ) : (
                <>
                  <TableIcon className="size-3.5 text-primary" />
                  <span>View as table</span>
                </>
              )}
            </Button>
          )}

          {onExportCsv && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportCsv}
              className="h-7.5 px-2 text-xs gap-1"
              title="Download section data as CSV"
            >
              <Download className="size-3 text-muted-foreground" />
              <span className="hidden md:inline">Download CSV</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-7.5 w-7.5 p-0 text-muted-foreground hover:text-foreground"
            title={expanded ? 'Collapse section' : 'Expand section'}
          >
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Section Body */}
      {expanded && (
        <div className="p-4">
          {isUnavailable && missingReason ? (
            <div className="p-6 rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold text-xs">
                <AlertTriangle className="size-4" />
                <span>Feature pending backend endpoint integration</span>
              </div>
              <p className="text-xs text-muted-foreground max-w-lg mx-auto">
                {missingReason}
              </p>
            </div>
          ) : isTableView && tableContent ? (
            <div className="animate-in fade-in duration-150">{tableContent}</div>
          ) : (
            <div className="animate-in fade-in duration-150">{children}</div>
          )}
        </div>
      )}
    </section>
  );
};
