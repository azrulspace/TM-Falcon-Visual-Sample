import React, { useState, useMemo } from 'react';
import { History, RotateCw, ExternalLink, Download, Link2, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/contexts/ToastContext';
import type { ReportSnapshot } from '@/types/reports';
import type { ReportPermissions } from '@/lib/permissions';

export interface HistoryTabProps {
  permissions: ReportPermissions;
  onOpenSnapshot: (snapshot: ReportSnapshot) => void;
  onRerunSnapshot: (snapshot: ReportSnapshot) => void;
}

// Initial demonstration snapshots conforming to Section 4.4
const INITIAL_SNAPSHOTS: ReportSnapshot[] = [
  {
    id: 'REP-20261116-0001',
    templateId: 'R1',
    templateName: 'Daily operations',
    parameters: {
      reportId: 'R1',
      dateRange: {
        preset: 'today',
        startIso: '2026-11-16T00:00:00+08:00',
        endIso: '2026-11-16T23:59:59+08:00',
        label: 'Today (16 Nov 2026)',
      },
      site: 'Teluk Panglima Garang',
      compareWithPrevious: false,
      includeSimulated: false,
    },
    generatedAt: '16 Nov 2026, 08:30:12 MYT',
    generatedBy: 'Ahmad Syukri (TM)',
    dataFreshnessAt: '16 Nov 2026, 08:30:00 MYT',
    dictionaryVersion: 'v1.0.0',
    recordCount: 42,
    format: 'Parameters only',
    sizeBytes: 24500,
    status: 'Completed',
  },
  {
    id: 'REP-20261115-0004',
    templateId: 'R2',
    templateName: 'Weekly operations',
    parameters: {
      reportId: 'R2',
      dateRange: {
        preset: 'last_week',
        startIso: '2026-11-09T00:00:00+08:00',
        endIso: '2026-11-16T00:00:00+08:00',
        label: 'Mon 9 Nov to Sun 15 Nov 2026',
      },
      site: 'Teluk Panglima Garang',
      compareWithPrevious: true,
      includeSimulated: false,
    },
    generatedAt: '15 Nov 2026, 18:00:00 MYT',
    generatedBy: 'Noraini Binti Yusof',
    dataFreshnessAt: '15 Nov 2026, 17:58:00 MYT',
    dictionaryVersion: 'v1.0.0',
    recordCount: 118,
    format: 'Parameters only',
    sizeBytes: 84200,
    status: 'Completed',
  },
  {
    id: 'REP-20261031-0012',
    templateId: 'R10',
    templateName: 'Executive summary',
    parameters: {
      reportId: 'R10',
      dateRange: {
        preset: 'last_month',
        startIso: '2026-10-01T00:00:00+08:00',
        endIso: '2026-11-01T00:00:00+08:00',
        label: '01 Oct 2026 to 31 Oct 2026',
      },
      site: 'All sites',
      compareWithPrevious: true,
      includeSimulated: false,
    },
    generatedAt: '01 Nov 2026, 09:15:00 MYT',
    generatedBy: 'Admin (sample)',
    dataFreshnessAt: '31 Oct 2026, 23:59:59 MYT',
    dictionaryVersion: 'v1.0.0',
    recordCount: 258,
    format: 'Parameters only',
    sizeBytes: 142000,
    status: 'Completed',
  },
];

export const HistoryTab: React.FC<HistoryTabProps> = ({
  permissions,
  onOpenSnapshot,
  onRerunSnapshot,
}) => {
  const { addToast } = useToast();
  const [snapshots, setSnapshots] = useState<ReportSnapshot[]>(() => {
    try {
      const stored = localStorage.getItem('falcon_reports_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const combined = [...parsed];
          for (const init of INITIAL_SNAPSHOTS) {
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
    return INITIAL_SNAPSHOTS;
  });
  const [search, setSearch] = useState<string>('');
  const [siteFilter, setSiteFilter] = useState<string>('all');
  const [templateFilter, setTemplateFilter] = useState<string>('all');

  const filteredSnapshots = useMemo(() => {
    return snapshots.filter((snap) => {
      const q = search.trim().toLowerCase();
      if (q) {
        const matchesId = snap.id.toLowerCase().includes(q);
        const matchesName = snap.templateName.toLowerCase().includes(q);
        const matchesAuthor = snap.generatedBy.toLowerCase().includes(q);
        if (!matchesId && !matchesName && !matchesAuthor) return false;
      }
      if (siteFilter !== 'all' && snap.parameters.site !== siteFilter) {
        return false;
      }
      if (templateFilter !== 'all' && snap.templateId !== templateFilter) {
        return false;
      }
      return true;
    });
  }, [snapshots, search, siteFilter, templateFilter]);

  const copySnapshotLink = (snapshot: ReportSnapshot) => {
    const url = `${window.location.origin}/reports/${snapshot.templateId}?snapshot=${snapshot.id}`;
    navigator.clipboard.writeText(url);
    addToast(
      'info',
      `Direct link for snapshot ${snapshot.id} copied to clipboard.`,
      'Link copied'
    );
  };

  const handleDeleteSnapshot = (id: string) => {
    setSnapshots((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem('falcon_reports_history', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    addToast('info', `Snapshot ${id} removed from local history.`, 'Snapshot deleted');
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Retention / Backend Notice */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card text-xs text-muted-foreground">
        <History className="size-4 text-primary shrink-0 mt-0.5" />
        <div className="flex-1">
          <span className="font-semibold text-foreground">
            Snapshot Storage: Local Parameter Integrity
          </span>
          <p className="mt-0.5 leading-relaxed">
            The server does not archive static PDF/CSV binaries. Snapshots store exact frozen parameters,
            data freshness timestamps, and metric dictionary version. Re-running reproduces the exact view.
            Retention: 90 days.
          </p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search snapshot ID, report name, or generated by..."
            className="w-full h-8 pl-8 pr-4 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Report:</span>
          <select
            value={templateFilter}
            onChange={(e) => setTemplateFilter(e.target.value)}
            className="h-8 px-2.5 bg-background border border-border rounded-lg text-xs text-foreground outline-none focus:border-primary cursor-pointer"
          >
            <option value="all">All reports</option>
            <option value="R1">Daily operations</option>
            <option value="R2">Weekly operations</option>
            <option value="R10">Executive summary</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Site:</span>
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="h-8 px-2.5 bg-background border border-border rounded-lg text-xs text-foreground outline-none focus:border-primary cursor-pointer"
          >
            <option value="all">All sites</option>
            <option value="Teluk Panglima Garang">Teluk Panglima Garang</option>
          </select>
        </div>
      </div>

      {/* Snapshots Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="size-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Generated snapshots ({filteredSnapshots.length})
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
                <th className="py-2.5 px-4">Report ID</th>
                <th className="py-2.5 px-4">Name & Period</th>
                <th className="py-2.5 px-4">Site</th>
                <th className="py-2.5 px-4">Generated by</th>
                <th className="py-2.5 px-4">Generated at (MYT)</th>
                <th className="py-2.5 px-4">Records</th>
                <th className="py-2.5 px-4">Format / Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSnapshots.map((snap) => (
                <tr key={snap.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-primary">
                    {snap.id}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-foreground">{snap.templateName}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {snap.parameters.dateRange?.label || snap.parameters.periodPreset || 'Current period'}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {snap.parameters.site}
                  </td>
                  <td className="py-3 px-4 font-mono text-foreground">
                    {snap.generatedBy}
                  </td>
                  <td className="py-3 px-4 font-mono text-muted-foreground whitespace-nowrap">
                    {snap.generatedAt}
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-foreground">
                    {snap.recordCount}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-muted text-muted-foreground border border-border">
                      {snap.format}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Open */}
                      <Tooltip>
                        <TooltipTrigger render={
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenSnapshot(snap)}
                            className="h-7 px-2 text-[11px] text-foreground hover:bg-muted cursor-pointer"
                          >
                            <ExternalLink className="size-3 mr-1" />
                            Open
                          </Button>
                        } />
                        <TooltipContent side="top" className="text-xs">
                          Open snapshot in report viewer
                        </TooltipContent>
                      </Tooltip>

                      {/* Re-run */}
                      <Tooltip>
                        <TooltipTrigger render={
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRerunSnapshot(snap)}
                            className="h-7 px-2 text-[11px] text-primary hover:bg-primary/10 cursor-pointer"
                          >
                            <RotateCw className="size-3 mr-1" />
                            Re-run
                          </Button>
                        } />
                        <TooltipContent side="top" className="text-xs">
                          Re-open report with exact same frozen parameters
                        </TooltipContent>
                      </Tooltip>

                      {/* Download (disabled for parameters-only with tooltip) */}
                      <Tooltip>
                        <TooltipTrigger render={
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={snap.format === 'Parameters only' || !permissions.canExportReports}
                            className="h-7 px-2 text-[11px] text-muted-foreground disabled:opacity-40 cursor-pointer"
                          >
                            <Download className="size-3 mr-1" />
                            Download
                          </Button>
                        } />
                        <TooltipContent side="top" className="text-xs">
                          {snap.format === 'Parameters only'
                            ? 'Server binary not stored. Re-run report to export fresh PDF/CSV.'
                            : permissions.exportDisabledReason || 'Download archived snapshot binary'}
                        </TooltipContent>
                      </Tooltip>

                      {/* Copy Link */}
                      <Tooltip>
                        <TooltipTrigger render={
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copySnapshotLink(snap)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                            aria-label="Copy snapshot link"
                          >
                            <Link2 className="size-3.5" />
                          </Button>
                        } />
                        <TooltipContent side="top" className="text-xs">
                          Copy snapshot link
                        </TooltipContent>
                      </Tooltip>

                      {/* Delete Snapshot */}
                      <Tooltip>
                        <TooltipTrigger render={
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSnapshot(snap.id)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                            aria-label="Delete snapshot"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        } />
                        <TooltipContent side="top" className="text-xs">
                          Delete snapshot
                        </TooltipContent>
                      </Tooltip>
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
