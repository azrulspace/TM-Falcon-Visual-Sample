import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { AlertTriangle, Info, Clock, ShieldCheck, Database, FileText } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

export interface HowRankingWorksSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ruleVersion?: string;
  computedAt?: string;
  windowDays?: number;
}

export const HowRankingWorksSheet: React.FC<HowRankingWorksSheetProps> = ({
  open,
  onOpenChange,
  ruleVersion = 'v1',
  computedAt = 'Oct 27, 2026, 10:30 PM MYT',
  windowDays = 30,
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[480px] p-0 flex flex-col bg-card text-card-foreground border-l border-border z-50 overflow-y-auto"
      >
        <SheetHeader className="p-6 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Info className="size-4.5" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold text-foreground">
                How ranking works
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                Rule specification and evaluation criteria for cable segments.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-6 text-xs text-muted-foreground">
          {/* Sample Data Honest Notice (Section 4 & 5.9) */}
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-xs">
              <AlertTriangle className="size-4 shrink-0 text-amber-500" />
              <span>Sample Data & Rule Specification</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              This ranking was computed using mock telemetry and rule specification {ruleVersion}. Real operational deployments will reflect live rule engine outputs and historical incidents.
            </p>
          </div>

          {/* Core Disclaimer Callout (Section 5.9 mandatory copy) */}
          <div className="p-3.5 rounded-xl border border-border bg-muted/40 text-foreground flex items-start gap-2.5">
            <ShieldCheck className="size-4 shrink-0 text-primary mt-0.5" />
            <p className="text-xs font-medium leading-normal">
              The ranking supports inspection planning. It does not prove damage.
            </p>
          </div>

          {/* Rule Meta Facts */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Rule Parameters
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-lg border border-border/80 bg-background flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground uppercase font-medium">Rule Version</span>
                <span className="font-semibold text-foreground font-mono">Rule {ruleVersion}</span>
              </div>
              <div className="p-3 rounded-lg border border-border/80 bg-background flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground uppercase font-medium">Evaluation Window</span>
                <span className="font-semibold text-foreground">{windowDays} days</span>
              </div>
              <div className="p-3 rounded-lg border border-border/80 bg-background flex flex-col gap-1 col-span-2">
                <span className="text-[10px] text-muted-foreground uppercase font-medium">Computed At</span>
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Clock className="size-3.5 text-muted-foreground" />
                  <span>{computedAt}</span>
                </div>
              </div>
              <div className="p-3 rounded-lg border border-border/80 bg-background flex flex-col gap-1 col-span-2">
                <span className="text-[10px] text-muted-foreground uppercase font-medium">Telemetry Source</span>
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Database className="size-3.5 text-muted-foreground" />
                  <span>Falcon Sensor Network & AI Event Detections</span>
                </div>
              </div>
            </div>
          </div>

          {/* Priority Bands Definition */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Priority Bands
            </h4>
            <div className="space-y-2">
              <div className="p-3 rounded-lg border border-border bg-background space-y-1">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-red-500" />
                  <span className="font-semibold text-foreground">High Priority</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  3 or more high-severity incidents, recurring monkey encroachments, or critical sensor anomalies within the 30-day window.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-border bg-background space-y-1">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-amber-500" />
                  <span className="font-semibold text-foreground">Medium Priority</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  2 incidents or sustained anomalous telemetry requiring scheduled review and preventive monitoring.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-border bg-background space-y-1">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-blue-500" />
                  <span className="font-semibold text-foreground">Low Priority</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  0 to 1 incidents; routine scheduled maintenance check or baseline verification due.
                </p>
              </div>
            </div>
          </div>

          {/* Confidence Levels Definition */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Confidence Levels
            </h4>
            <div className="space-y-2">
              <div className="p-3 rounded-lg border border-border bg-background space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">High Confidence</span>
                  <div className="flex gap-0.5">
                    <div className="w-2.5 h-1.5 rounded-full bg-primary" />
                    <div className="w-2.5 h-1.5 rounded-full bg-primary" />
                    <div className="w-2.5 h-1.5 rounded-full bg-primary" />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Multiple active IoT sensors with 99%+ uptime and corroborating video telemetry confirming the span state.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-border bg-background space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Medium Confidence</span>
                  <div className="flex gap-0.5">
                    <div className="w-2.5 h-1.5 rounded-full bg-primary" />
                    <div className="w-2.5 h-1.5 rounded-full bg-primary" />
                    <div className="w-2.5 h-1.5 rounded-full bg-muted-foreground/30" />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Partial telemetry coverage or single sensor observation without dual validation.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-border bg-background space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Low Confidence</span>
                  <div className="flex gap-0.5">
                    <div className="w-2.5 h-1.5 rounded-full bg-primary" />
                    <div className="w-2.5 h-1.5 rounded-full bg-muted-foreground/30" />
                    <div className="w-2.5 h-1.5 rounded-full bg-muted-foreground/30" />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Sparse telemetry or stale sensor heartbeat; on-site visual survey recommended to gather data.
                </p>
              </div>
            </div>
          </div>

          {/* Rule Documentation Link */}
          <div className="pt-2 border-t border-border">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      disabled
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground opacity-60 cursor-not-allowed"
                    >
                      <FileText className="size-3.5" />
                      <span>View full rule documentation (v1 spec)</span>
                    </button>
                  }
                />
                <TooltipContent className="text-xs">
                  Not available yet • Enterprise documentation offline
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
