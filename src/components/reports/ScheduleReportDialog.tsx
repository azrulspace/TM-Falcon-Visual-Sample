import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Mail,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ReportTemplateMeta, ReportParameters, ScheduledReportConfig } from '@/types/reports';
import { useToast } from '@/contexts/ToastContext';

export interface ScheduleReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: ReportTemplateMeta;
  parameters: ReportParameters;
  onScheduleCreated?: (config: ScheduledReportConfig) => void;
}

export const ScheduleReportDialog: React.FC<ScheduleReportDialogProps> = ({
  open,
  onOpenChange,
  report,
  parameters,
  onScheduleCreated,
}) => {
  const { addToast } = useToast();
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>(
    report.scheduledFrequency || 'daily'
  );
  const [timeMyt, setTimeMyt] = useState<string>('07:00');
  const [dayOfWeek, setDayOfWeek] = useState<string>('1'); // 1 = Monday
  const [format, setFormat] = useState<'PDF' | 'CSV'>('PDF');
  const [recipientsInput, setRecipientsInput] = useState<string>(
    'operations-lead@falcon.telecom.my, supervisor.duty@falcon.telecom.my'
  );

  const handleSave = () => {
    const recipients = recipientsInput
      .split(/[,;\n]/)
      .map((e) => e.trim())
      .filter((e) => Boolean(e));

    if (recipients.length === 0) {
      addToast('error', 'Please provide at least one recipient email address.');
      return;
    }

    const newSchedule: ScheduledReportConfig = {
      id: `SCH-${Date.now().toString().slice(-4)}`,
      templateId: report.id,
      reportName: report.name,
      parametersSummary: `${parameters.periodPreset || report.defaultPeriod} · ${parameters.site || 'All sites'}`,
      frequency,
      timeMyt: `${timeMyt} MYT`,
      dayOfWeek: frequency === 'weekly' ? parseInt(dayOfWeek, 10) : undefined,
      nextRunMyt:
        frequency === 'daily'
          ? `Tomorrow, ${timeMyt} MYT`
          : frequency === 'weekly'
          ? `Next Monday, ${timeMyt} MYT`
          : `1st of next month, ${timeMyt} MYT`,
      recipients,
      format,
      owner: 'Current Operator',
      isActive: true,
      lastRunStatus: 'Pending',
      lastRunAt: null,
    };

    // Save to localStorage
    try {
      const stored = localStorage.getItem('falcon_scheduled_reports');
      const list: ScheduledReportConfig[] = stored ? JSON.parse(stored) : [];
      list.unshift(newSchedule);
      localStorage.setItem('falcon_scheduled_reports', JSON.stringify(list));
    } catch {
      // Ignore fallback
    }

    if (onScheduleCreated) {
      onScheduleCreated(newSchedule);
    }

    addToast(
      'success',
      `Automated ${frequency} delivery scheduled for ${report.name} (${recipients.length} recipients).`,
      'Report scheduled'
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-6 space-y-4">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Calendar className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Schedule Automated Delivery
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {report.name} ({report.id})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 text-xs">
          {/* Frequency */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="size-3.5 text-muted-foreground" />
                <span>Frequency</span>
              </label>
              <Select
                value={frequency}
                onValueChange={(val) => setFrequency(val as 'daily' | 'weekly' | 'monthly')}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily" className="text-xs">
                    Daily (Every 24h)
                  </SelectItem>
                  <SelectItem value="weekly" className="text-xs">
                    Weekly (Mondays)
                  </SelectItem>
                  <SelectItem value="monthly" className="text-xs">
                    Monthly (1st of month)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time of Day */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="size-3.5 text-muted-foreground" />
                <span>Time (MYT)</span>
              </label>
              <Select value={timeMyt} onValueChange={setTimeMyt}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="06:00" className="text-xs">06:00 MYT (Shift prep)</SelectItem>
                  <SelectItem value="07:00" className="text-xs">07:00 MYT (Morning handover)</SelectItem>
                  <SelectItem value="08:00" className="text-xs">08:00 MYT (Executive review)</SelectItem>
                  <SelectItem value="15:00" className="text-xs">15:00 MYT (Afternoon shift)</SelectItem>
                  <SelectItem value="23:00" className="text-xs">23:00 MYT (Night shift)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* If weekly: day of week selector */}
          {frequency === 'weekly' && (
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Day of Week</label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1" className="text-xs">Monday (Start of operational week)</SelectItem>
                  <SelectItem value="2" className="text-xs">Tuesday</SelectItem>
                  <SelectItem value="3" className="text-xs">Wednesday</SelectItem>
                  <SelectItem value="4" className="text-xs">Thursday</SelectItem>
                  <SelectItem value="5" className="text-xs">Friday (Weekly closing)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Format */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <FileText className="size-3.5 text-muted-foreground" />
              <span>Export Format</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat('PDF')}
                className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors ${
                  format === 'PDF'
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border bg-background text-foreground hover:bg-muted/40'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold">PDF Document</div>
                  <div className="text-[10px] text-muted-foreground">Print-ready A4 layout with charts</div>
                </div>
                {format === 'PDF' && <CheckCircle2 className="size-4 shrink-0 text-primary" />}
              </button>

              <button
                type="button"
                onClick={() => setFormat('CSV')}
                className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors ${
                  format === 'CSV'
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border bg-background text-foreground hover:bg-muted/40'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold">CSV Data Package</div>
                  <div className="text-[10px] text-muted-foreground">Tabular rows for spreadsheets</div>
                </div>
                {format === 'CSV' && <CheckCircle2 className="size-4 shrink-0 text-primary" />}
              </button>
            </div>
          </div>

          {/* Recipients */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <Mail className="size-3.5 text-muted-foreground" />
              <span>Recipients (comma separated)</span>
            </label>
            <textarea
              rows={2}
              value={recipientsInput}
              onChange={(e) => setRecipientsInput(e.target.value)}
              placeholder="e.g. supervisor@falcon.telecom.my, ops@falcon.telecom.my"
              className="w-full p-2.5 rounded-lg border border-input bg-background text-xs font-mono text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Next runs preview box */}
          <div className="p-3 rounded-lg bg-muted/40 border border-border/60 space-y-1">
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
              <Clock className="size-3" />
              <span>Upcoming Delivery Window</span>
            </div>
            <div className="text-[11px] text-foreground font-mono">
              Next trigger:{' '}
              {frequency === 'daily'
                ? `Tomorrow at ${timeMyt} MYT`
                : frequency === 'weekly'
                ? `Next Monday at ${timeMyt} MYT`
                : `1st of next month at ${timeMyt} MYT`}
            </div>
            <div className="text-[10px] text-muted-foreground">
              All times evaluated in Asia/Kuala_Lumpur (+08:00).
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-end gap-2 pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            className="text-xs h-8 bg-primary text-primary-foreground font-semibold"
          >
            Create schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
