import React from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  BookOpen,
  Calendar,
  Download,
  Printer,
  Share2,
  Camera,
  AlertTriangle,
  FlaskConical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  isSimulatedIncluded?: boolean;
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
  isSimulatedIncluded = false,
}) => {
  return (
    <div className="space-y-4">
      {/* Top breadcrumb and back button */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Link
            to="/reports?tab=library"
            className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
          >
            <ChevronLeft className="size-3.5" />
            <span>Reports & audits</span>
          </Link>
          <span>/</span>
          <span className="text-foreground font-semibold">{report.name}</span>
        </div>

        {/* Sample data pill badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <FlaskConical className="size-3" />
            <span>Sample data</span>
          </span>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Internal operational use only
          </span>
        </div>
      </div>

      {/* Main header title & actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              {report.name}
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              {report.category}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
              ID: {report.id}
            </span>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-3xl leading-relaxed">
            {report.purpose}
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenDefinitions}
            className="gap-1.5 text-xs h-8"
            title="Open metric definitions dictionary and calculation formulas"
          >
            <BookOpen className="size-3.5" />
            <span>Definitions</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onShareLink}
            className="gap-1.5 text-xs h-8"
            title="Copy shareable link with current parameters"
          >
            <Share2 className="size-3.5" />
            <span>Share</span>
          </Button>

          {report.scheduleSupported && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSchedule}
              className="gap-1.5 text-xs h-8"
              title="Configure automated scheduled delivery"
            >
              <Calendar className="size-3.5" />
              <span>Schedule</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onPrint}
            className="gap-1.5 text-xs h-8 hidden sm:inline-flex"
            title="Print or export as PDF"
          >
            <Printer className="size-3.5" />
            <span>Print / PDF</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onExportCsv}
            className="gap-1.5 text-xs h-8"
            title="Export report data tables to CSV"
          >
            <Download className="size-3.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={onGenerateSnapshot}
            className="gap-1.5 text-xs h-8 font-medium bg-primary text-primary-foreground hover:bg-primary/90"
            title="Freeze parameters and generate a persistent snapshot record"
          >
            <Camera className="size-3.5" />
            <span>Generate snapshot</span>
          </Button>
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
