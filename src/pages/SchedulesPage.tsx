import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Clock,
  Play,
  Pause,
  Trash2,
  Plus,
  Info,
  Mail,
  FileText,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/contexts/ToastContext';
import { useAppContext } from '@/contexts/AppContext';
import { getRoleFromAccountLabel, getReportPermissions } from '@/lib/permissions';
import { CONSOLIDATED_REPORTS } from '@/data/reportsCatalog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ScheduledReportConfig } from '@/types/reports';

const INITIAL_SCHEDULES: ScheduledReportConfig[] = [
  {
    id: 'SCH-001',
    templateId: 'operations',
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
    templateId: 'operations',
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
    templateId: 'executive-summary',
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

export default function SchedulesPage() {
  const navigate = useNavigate();
  const { accountLabel } = useAppContext();
  const { addToast } = useToast();
  const userRole = useMemo(() => getRoleFromAccountLabel(accountLabel), [accountLabel]);
  const permissions = useMemo(() => getReportPermissions(userRole), [userRole]);

  const [schedules, setSchedules] = useState<ScheduledReportConfig[]>(() => {
    try {
      const stored = localStorage.getItem('falcon_scheduled_reports');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const combined = [...parsed];
          for (const init of INITIAL_SCHEDULES) {
            if (!combined.some((s) => s.id === init.id)) {
              combined.push(init);
            }
          }
          return combined;
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_SCHEDULES;
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form state for creating a new schedule
  const [selectedReportSlug, setSelectedReportSlug] = useState('operations');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [timeMyt, setTimeMyt] = useState('07:00');
  const [recipientsInput, setRecipientsInput] = useState('operators@falcon.example');
  const [format, setFormat] = useState<'PDF' | 'CSV'>('PDF');

  const persistSchedules = (list: ScheduledReportConfig[]) => {
    setSchedules(list);
    try {
      localStorage.setItem('falcon_scheduled_reports', JSON.stringify(list));
    } catch {
      // ignore
    }
  };

  const togglePauseResume = (id: string) => {
    const updated = schedules.map((s) => {
      if (s.id !== id) return s;
      const newActive = !s.isActive;
      return {
        ...s,
        isActive: newActive,
        lastRunStatus: (newActive ? 'Pending' : 'Paused') as ScheduledReportConfig['lastRunStatus'],
      };
    });
    persistSchedules(updated);
    addToast('info', 'Schedule state updated.', 'Schedule updated');
  };

  const handleDelete = (id: string) => {
    const updated = schedules.filter((s) => s.id !== id);
    persistSchedules(updated);
    setDeleteConfirmId(null);
    addToast('info', 'Schedule removed.', 'Schedule deleted');
  };

  const handleRunNow = (schedule: ScheduledReportConfig) => {
    addToast(
      'success',
      `Executing ${schedule.reportName}. Fresh snapshot generated.`,
      'Report executed'
    );
    navigate(`/reports/${schedule.templateId}?scheduled=true`);
  };

  const handleCreateSchedule = () => {
    const report = CONSOLIDATED_REPORTS.find((r) => r.slug === selectedReportSlug);
    if (!report) return;

    const recipients = recipientsInput
      .split(/[,;\n]/)
      .map((r) => r.trim())
      .filter(Boolean);

    if (recipients.length === 0) {
      addToast('error', 'Please enter at least one recipient email address.', 'Missing recipients');
      return;
    }

    const newId = `SCH-${String(schedules.length + 1).padStart(3, '0')}`;
    const newSchedule: ScheduledReportConfig = {
      id: newId,
      templateId: report.slug,
      reportName: report.name,
      parametersSummary: `${report.name}, Default period, All sites`,
      frequency,
      timeMyt: `${timeMyt} MYT`,
      nextRunMyt: `Tomorrow, ${timeMyt}:00 MYT`,
      recipients,
      format,
      owner: accountLabel || 'Current user',
      isActive: true,
      lastRunStatus: 'Pending',
    };

    persistSchedules([newSchedule, ...schedules]);
    setIsCreateOpen(false);
    addToast('success', `Schedule created for ${report.name}.`, 'Schedule created');
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 space-y-6">
      {/* Top Navigation & Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link
            to="/reports"
            className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
          >
            <ChevronLeft className="size-3.5" />
            <span>Back to report</span>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Schedules
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Automated recurring report dispatch and export settings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="gap-1.5 text-xs h-8"
              disabled={!permissions.canScheduleReports}
              title={permissions.scheduleDisabledReason}
            >
              <Plus className="size-3.5" />
              <span>Schedule report</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Honest Prototype Banner — Section 4.3 (No duplicate button) */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-3">
        <Info className="size-4 text-amber-500 mt-0.5 shrink-0" />
        <div className="text-xs text-amber-200/90 leading-relaxed">
          <p className="font-semibold text-amber-400">
            Scheduler Status: Client Prototype Demonstration
          </p>
          <p className="mt-0.5 text-muted-foreground">
            Automated cron dispatch and email delivery endpoints are not available on the server yet.
            Scheduled jobs configured here persist locally. Use &ldquo;Run now&rdquo; to execute on-demand.
          </p>
        </div>
      </div>

      {/* Schedules Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              Configured schedules ({schedules.length})
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            Timezone: Asia/Kuala_Lumpur (MYT)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-medium text-left">
                <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Report</th>
                <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Owner</th>
                <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Settings</th>
                <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Frequency</th>
                <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Next run (MYT)</th>
                <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Recipients</th>
                <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Format</th>
                <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Status</th>
                <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-foreground">{schedule.reportName}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{schedule.id}</div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    <div className="inline-flex items-center gap-1.5">
                      <User className="size-3 text-muted-foreground/80" />
                      <span>{schedule.owner}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground max-w-xs truncate" title={schedule.parametersSummary}>
                    {schedule.parametersSummary}
                  </td>
                  <td className="py-3 px-4 text-foreground capitalize font-medium">
                    {schedule.frequency} ({schedule.timeMyt})
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                    {schedule.nextRunMyt}
                  </td>
                  <td className="py-3 px-4">
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-muted text-foreground border border-border/40 cursor-default">
                          <Mail className="size-3 text-muted-foreground" />
                          <span>{schedule.recipients.length} recipients</span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <div className="space-y-1">
                          {schedule.recipients.map((r) => (
                            <div key={r}>{r}</div>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
                      <FileText className="size-3" />
                      {schedule.format}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {schedule.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                        Paused
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRunNow(schedule)}
                        className="h-7 px-2 text-xs gap-1 hover:text-primary"
                        title="Run this schedule on demand now"
                      >
                        <Play className="size-3" />
                        <span>Run now</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePauseResume(schedule.id)}
                        className="h-7 px-2 text-xs"
                        title={schedule.isActive ? 'Pause recurring execution' : 'Resume execution'}
                      >
                        {schedule.isActive ? (
                          <Pause className="size-3 text-amber-500" />
                        ) : (
                          <Play className="size-3 text-emerald-500" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmId(schedule.id)}
                        className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                        title="Delete schedule"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={Boolean(deleteConfirmId)} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete schedule?</DialogTitle>
            <DialogDescription className="text-xs">
              This scheduled report will be removed from your browser storage. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Schedule Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule a report</DialogTitle>
            <DialogDescription className="text-xs">
              Configure recurring parameters, delivery schedule, and recipient list.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Report</label>
              <Select value={selectedReportSlug} onValueChange={setSelectedReportSlug}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONSOLIDATED_REPORTS.map((r) => (
                    <SelectItem key={r.slug} value={r.slug}>
                      {r.name} ({r.group})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Frequency</label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as any)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Dispatch time (MYT)</label>
                <input
                  type="time"
                  value={timeMyt}
                  onChange={(e) => setTimeMyt(e.target.value)}
                  className="h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Export format</label>
              <Select value={format} onValueChange={(v) => setFormat(v as any)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF">PDF (Printable layout)</SelectItem>
                  <SelectItem value="CSV">CSV (Raw metric & record data)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Recipients (comma or newline separated)</label>
              <textarea
                value={recipientsInput}
                onChange={(e) => setRecipientsInput(e.target.value)}
                rows={3}
                placeholder="operator@falcon.telecom.my, supervisor@falcon.telecom.my"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateSchedule}>
              Save schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
