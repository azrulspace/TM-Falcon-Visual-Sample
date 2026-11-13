import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  FileText,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatAbsoluteMYT } from '@/lib/dateTime';
import { cn } from '@/lib/utils';
import type { DeviceRecord } from '@/types/devices';

export interface DeviceHealthReportsTabProps {
  device: DeviceRecord;
}

export const DeviceHealthReportsTab: React.FC<DeviceHealthReportsTabProps> = ({ device }) => {
  const [selectedReport, setSelectedReport] = useState<typeof device.healthReports[0] | null>(null);
  const reports = device.healthReports || [];

  return (
    <div className="space-y-6 select-none">
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Diagnostic & Health Reports
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              ({reports.length} reports)
            </span>
          </div>

          <span className="text-xs text-muted-foreground">
            Automated weekly telemetry and sensor calibration
          </span>
        </div>

        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Report ID</th>
                <th className="py-2.5 px-3">Title</th>
                <th className="py-2.5 px-3">Run Date (MYT)</th>
                <th className="py-2.5 px-3">Result</th>
                <th className="py-2.5 px-3">Summary</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    No diagnostic reports recorded for this device yet.
                  </td>
                </tr>
              ) : (
                reports.map((r) => {
                  const isPassed = r.result === 'Passed';
                  const isWarning = r.result === 'Warning';

                  return (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                        {r.id}
                      </td>

                      <td className="py-2.5 px-3 font-medium text-foreground">
                        {r.title}
                      </td>

                      <td className="py-2.5 px-3 font-mono text-muted-foreground">
                        {formatAbsoluteMYT(r.date)}
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border',
                            isPassed && 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                            isWarning && 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                            !isPassed && !isWarning && 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          )}
                        >
                          {isPassed ? (
                            <CheckCircle2 className="size-3" />
                          ) : (
                            <AlertTriangle className="size-3" />
                          )}
                          <span>{r.result}</span>
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-muted-foreground max-w-xs truncate">
                        {r.summary}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedReport(r)}
                          className="h-7 px-2 text-xs text-primary hover:text-primary cursor-pointer"
                        >
                          <span>View report</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Report Modal */}
      {selectedReport && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  Diagnostic Report {selectedReport.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                  Report Title
                </span>
                <span className="font-semibold text-foreground text-sm block mt-0.5">
                  {selectedReport.title}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                    Execution Date
                  </span>
                  <span className="font-mono text-muted-foreground block mt-0.5">
                    {formatAbsoluteMYT(selectedReport.date)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                    Diagnostic Status
                  </span>
                  <span className="text-emerald-500 font-bold block mt-0.5">
                    {selectedReport.result}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-border/60">
                <span className="text-[10px] uppercase text-muted-foreground font-semibold block mb-1">
                  Telemetry Findings Summary
                </span>
                <div className="p-3 rounded-lg bg-muted/30 border border-border font-mono text-xs text-foreground leading-relaxed">
                  {selectedReport.summary}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedReport(null)}
                className="h-8 px-4 text-xs cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
