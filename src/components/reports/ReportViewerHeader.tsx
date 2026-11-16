import React from 'react';
import {
  Download,
  Share2,
  MoreHorizontal,
  Calendar,
  Camera,
  BookOpen,
  Printer,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  FlaskConical,
  BookmarkCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ReportSwitcherCombobox } from './ReportSwitcherCombobox';
import type { ReportTemplateMeta, ReportParameters } from '@/types/reports';

export interface ReportViewerHeaderProps {
  report: ReportTemplateMeta;
  parameters: ReportParameters;
  onOpenDefinitions: () => void;
  onOpenSchedule: () => void;
  onGenerateSnapshot: () => void;
  onExportCsv: () => void;
  onPrint: () => void;
  onShareLink: () => void;
  onSaveSettings?: () => void;
  isSimulatedIncluded?: boolean;
  canViewAuditLog?: boolean;
}

export const ReportViewerHeader: React.FC<ReportViewerHeaderProps> = ({
  report,
  parameters: _parameters,
  onOpenDefinitions,
  onOpenSchedule,
  onGenerateSnapshot,
  onExportCsv,
  onPrint,
  onShareLink,
  onSaveSettings,
  isSimulatedIncluded = false,
  canViewAuditLog = false,
}) => {
  return (
    <div className="space-y-3">
      {/* Top row: Headline combobox switcher + badges & actions */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-2 border-b border-border/60">
        {/* Headline Combobox (replaces static H1 and category/id chips) */}
        <div className="flex-1">
          <ReportSwitcherCombobox
            currentSlug={report.slug}
            canViewAuditLog={canViewAuditLog}
          />
        </div>

        {/* Badges & Actions */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Sample data indicator badge */}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 mr-1">
            <FlaskConical className="size-3" />
            <span>Sample data</span>
          </span>

          {/* Action Hierarchy: 1. Primary Export Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button
                variant="default"
                size="sm"
                className="gap-1.5 text-xs h-8 font-medium bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Download className="size-3.5" />
                <span>Export</span>
              </Button>
            } />
            <DropdownMenuContent align="end" className="w-52 text-xs">
              <DropdownMenuItem onClick={onPrint} className="gap-2 cursor-pointer">
                <FileText className="size-3.5 text-muted-foreground" />
                <span>Export as PDF (Printable)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportCsv} className="gap-2 cursor-pointer">
                <FileSpreadsheet className="size-3.5 text-muted-foreground" />
                <span>Export as CSV (Data table)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Action Hierarchy: 2. Secondary Share Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onShareLink}
            className="gap-1.5 text-xs h-8"
            title="Copy reproducible view link with parameters"
          >
            <Share2 className="size-3.5" />
            <span>Share</span>
          </Button>

          {/* Action Hierarchy: 3. Overflow Menu (...) */}
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                title="More actions"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            } />
            <DropdownMenuContent align="end" className="w-56 text-xs">
              <DropdownMenuItem
                onClick={onOpenSchedule}
                disabled={!report.scheduleSupported}
                className="gap-2 cursor-pointer"
              >
                <Calendar className="size-3.5 text-muted-foreground" />
                <span>Schedule this report</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={onGenerateSnapshot}
                className="gap-2 cursor-pointer"
              >
                <Camera className="size-3.5 text-muted-foreground" />
                <span>Save this view (Snapshot)</span>
              </DropdownMenuItem>

              {onSaveSettings && (
                <DropdownMenuItem
                  onClick={onSaveSettings}
                  className="gap-2 cursor-pointer"
                >
                  <BookmarkCheck className="size-3.5 text-muted-foreground" />
                  <span>Save as default settings</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={onOpenDefinitions}
                className="gap-2 cursor-pointer"
              >
                <BookOpen className="size-3.5 text-muted-foreground" />
                <span>Metric definitions</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={onPrint}
                className="gap-2 cursor-pointer"
              >
                <Printer className="size-3.5 text-muted-foreground" />
                <span>Print layout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Warning banner when simulated events are included */}
      {isSimulatedIncluded && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle className="size-4 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold">Simulated events included: </span>
            <span>
              Synthetic test scenarios and training drills are active in this report view.
              Operational response metrics and incident volumes reflect simulated data.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
