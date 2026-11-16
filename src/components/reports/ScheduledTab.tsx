import React, { useState } from 'react';
import { Clock, Play, Pause, Trash2, Plus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ScheduledReportConfig } from '@/types/reports';
import type { ReportPermissions } from '@/lib/permissions';

export interface ScheduledTabProps {
  permissions: ReportPermissions;
  onNewSchedule: () => void;
  onRunNow?: (schedule: ScheduledReportConfig) => void;
}

// Initial demonstration scheduled configurations (compliant with Section 4.3)
const INITIAL_SCHEDULES: ScheduledReportConfig[] = [
  {
    id: 'SCH-001',
    templateId: 'R1',
    reportName: 'Daily operations shift handover',
    parametersSummary: 'Today so far, Teluk Panglima Garang, Excl. simulation',
    frequency: 'daily',
    timeMyt: '07:00 MYT',
    nextRunMyt: '17 Nov 2026, 07:00:00 MYT',
    recipients: ['operators@falcon.example', 'shift-leads@falcon.example'],
    format: 'PDF',
    owner: 'Ahmad Syukri (TM)',
    isActive: true,
    lastRunStatus: 'Success',
    lastRunAt: '16 Nov 2026, 07:00:00 MYT',
  },
  {
    id: 'SCH-002',
    templateId: 'R2',
    reportName: 'Weekly operations & SLA review',
    parametersSummary: 'Last full week, Teluk Panglima Garang, Compare on',
    frequency: 'weekly',
    timeMyt: '08:30 MYT',
    dayOfWeek: 1, // Monday
    nextRunMyt: '23 Nov 2026, 08:30:00 MYT',
    recipients: ['supervisors@falcon.example', 'management@falcon.example'],
    format: 'PDF',
    owner: 'Noraini Binti Yusof',
    isActive: true,
    lastRunStatus: 'Success',
    lastRunAt: '16 Nov 2026, 08:30:00 MYT',
  },
  {
    id: 'SCH-003',
    templateId: 'R10',
    reportName: 'Monthly executive summary & governance',
    parametersSummary: 'Last full month, All sites, Compare on',
    frequency: 'monthly',
    timeMyt: '09:00 MYT',
    dayOfMonth: 1,
    nextRunMyt: '01 Dec 2026, 09:00:00 MYT',
    recipients: ['executive-review@tm.example'],
    format: 'PDF',
    owner: 'CTO Office',
    isActive: false,
    lastRunStatus: 'Paused',
    lastRunAt: '01 Nov 2026, 09:00:00 MYT',
  },
];

export const ScheduledTab: React.FC<ScheduledTabProps> = ({
  permissions,
  onNewSchedule,
  onRunNow,
}) => {
  const [schedules, setSchedules] = useState<ScheduledReportConfig[]>(INITIAL_SCHEDULES);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const togglePauseResume = (id: string) => {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const newActive = !s.isActive;
        return {
          ...s,
          isActive: newActive,
          lastRunStatus: newActive ? 'Pending' : 'Paused',
        };
      })
    );
  };

  const handleDelete = (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Backend Gap / State Banner */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-foreground">
        <Info className="size-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <span className="font-semibold text-amber-600 dark:text-amber-400">
            Scheduler Status: Client Prototype Demonstration
          </span>
          <p className="text-muted-foreground mt-0.5 leading-relaxed">
            Automatic cron dispatch and email delivery endpoints are not available on the server yet.
            Scheduled jobs configured here persist locally. Use &ldquo;Run now&rdquo; to execute on-demand.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={!permissions.canScheduleReports}
          onClick={onNewSchedule}
          className="h-7 text-xs border-amber-500/40 text-amber-600 dark:text-amber-300 hover:bg-amber-500/15 cursor-pointer shrink-0"
        >
          <Plus className="size-3 mr-1" />
          Schedule report
        </Button>
      </div>

      {/* Schedules Table Card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Configured schedules ({schedules.length})
            </h3>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            Timezone: Asia/Kuala_Lumpur (MYT)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Report</th>
                <th className="py-2.5 px-4">Parameters summary</th>
                <th className="py-2.5 px-4">Frequency</th>
                <th className="py-2.5 px-4">Next run (MYT)</th>
                <th className="py-2.5 px-4">Recipients</th>
                <th className="py-2.5 px-4">Format</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-foreground">{schedule.reportName}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      Owner: {schedule.owner}
                    </div>
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate text-muted-foreground">
                    {schedule.parametersSummary}
                  </td>
                  <td className="py-3 px-4 capitalize font-medium text-foreground">
                    {schedule.frequency} ({schedule.timeMyt})
                  </td>
                  <td className="py-3 px-4 font-mono text-muted-foreground whitespace-nowrap">
                    {schedule.nextRunMyt}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-0.5">
                      {schedule.recipients.map((rec) => (
                        <span key={rec} className="text-[11px] font-mono text-muted-foreground truncate max-w-[200px]">
                          {rec}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-medium">
                    <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                      {schedule.format}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        schedule.isActive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {schedule.isActive ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Run Now */}
                      <Tooltip>
                        <TooltipTrigger render={
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRunNow?.(schedule)}
                            className="h-7 px-2 text-[11px] text-primary hover:bg-primary/10 cursor-pointer"
                          >
                            <Play className="size-3 mr-1" />
                            Run now
                          </Button>
                        } />
                        <TooltipContent side="top" className="text-xs">
                          Execute this report snapshot immediately
                        </TooltipContent>
                      </Tooltip>

                      {/* Pause / Resume */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePauseResume(schedule.id)}
                        className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {schedule.isActive ? (
                          <>
                            <Pause className="size-3 mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="size-3 mr-1" />
                            Resume
                          </>
                        )}
                      </Button>

                      {/* Delete with confirmation */}
                      {deleteConfirmId === schedule.id ? (
                        <div className="inline-flex items-center gap-1 bg-destructive/10 p-0.5 rounded border border-destructive/20">
                          <button
                            type="button"
                            onClick={() => handleDelete(schedule.id)}
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-destructive text-white cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-1.5 py-0.5 rounded text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmId(schedule.id)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                          aria-label="Delete schedule"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
