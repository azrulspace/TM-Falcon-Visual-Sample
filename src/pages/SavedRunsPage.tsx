import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  History,
  ExternalLink,
  Link2,
  Search,
  Trash2,
  Info,
  Database,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/ToastContext';
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
import { getReportBySlug, CONSOLIDATED_REPORTS } from '@/data/reportsCatalog';
import type { ReportSnapshot } from '@/types/reports';

const INITIAL_SNAPSHOTS: ReportSnapshot[] = [
  {
    id: 'REP-20261116-0001',
    templateId: 'operations',
    templateName: 'Operations',
    parameters: {
      reportId: 'operations',
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
    templateId: 'operations',
    templateName: 'Operations',
    parameters: {
      reportId: 'operations',
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
    templateId: 'executive-summary',
    templateName: 'Executive summary',
    parameters: {
      reportId: 'executive-summary',
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

export default function SavedRunsPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [snapshots, setSnapshots] = useState<ReportSnapshot[]>(() => {
    try {
      const stored = localStorage.getItem('falcon_report_snapshots');
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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReportFilter, setSelectedReportFilter] = useState('ALL');
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('ALL');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const persistSnapshots = (list: ReportSnapshot[]) => {
    setSnapshots(list);
    try {
      localStorage.setItem('falcon_report_snapshots', JSON.stringify(list));
    } catch {
      // fallback
    }
  };

  const filteredSnapshots = useMemo(() => {
    return snapshots.filter((snap) => {
      if (selectedReportFilter !== 'ALL') {
        const resolved = getReportBySlug(snap.templateId);
        if (resolved?.slug !== selectedReportFilter && snap.templateId !== selectedReportFilter) {
          return false;
        }
      }
      if (selectedSiteFilter !== 'ALL') {
        const snapSite = snap.parameters.site || 'All sites';
        if (snapSite !== selectedSiteFilter) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = snap.id.toLowerCase().includes(q);
        const matchName = snap.templateName.toLowerCase().includes(q);
        const matchUser = snap.generatedBy.toLowerCase().includes(q);
        if (!matchId && !matchName && !matchUser) return false;
      }
      return true;
    });
  }, [snapshots, selectedReportFilter, selectedSiteFilter, searchQuery]);

  const handleOpenSnapshot = (snapshot: ReportSnapshot) => {
    const report = getReportBySlug(snapshot.templateId) || { slug: snapshot.templateId };
    navigate(`/reports/${report.slug}?snapshot=${snapshot.id}`);
  };

  const handleCopyLink = (snapshot: ReportSnapshot) => {
    const report = getReportBySlug(snapshot.templateId) || { slug: snapshot.templateId };
    const url = `${window.location.origin}/reports/${report.slug}?snapshot=${snapshot.id}`;
    navigator.clipboard.writeText(url).then(
      () => addToast('success', 'Reproducible snapshot link copied to clipboard.', 'Link copied'),
      () => addToast('error', 'Failed to copy link to clipboard.', 'Error')
    );
  };

  const handleDelete = (id: string) => {
    const updated = snapshots.filter((s) => s.id !== id);
    persistSnapshots(updated);
    setDeleteConfirmId(null);
    addToast('info', 'Saved run record deleted.', 'Snapshot removed');
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
              Saved runs
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Historical parameter snapshots and reproduced operational views.
            </p>
          </div>
        </div>
      </div>

      {/* Honest Prototype Banner — Section 4.4 */}
      <div className="rounded-lg border border-border/60 bg-muted/40 p-3.5 flex items-start gap-3">
        <Info className="size-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          <p className="font-semibold text-foreground">
            Snapshot Storage: Local Parameter Integrity
          </p>
          <p className="mt-0.5">
            The server does not store the finished report. A saved run stores the settings and the time
            the data was read. Opening it again reads the data again, so numbers can differ.
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/60">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search snapshot ID, report name, or generated by..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-background border border-border/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedReportFilter} onValueChange={setSelectedReportFilter}>
            <SelectTrigger className="h-8 text-xs w-[160px]">
              <SelectValue placeholder="All reports" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All reports</SelectItem>
              {CONSOLIDATED_REPORTS.map((r) => (
                <SelectItem key={r.slug} value={r.slug}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSiteFilter} onValueChange={setSelectedSiteFilter}>
            <SelectTrigger className="h-8 text-xs w-[160px]">
              <SelectValue placeholder="All sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All sites</SelectItem>
              <SelectItem value="Teluk Panglima Garang">Teluk Panglima Garang</SelectItem>
              <SelectItem value="All sites">All sites (Network wide)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Snapshots Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              Saved snapshots ({filteredSnapshots.length})
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            Retention: Local browser state
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-medium text-left">
                <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Snapshot ID</th>
                <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Report & period</th>
                <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Site</th>
                <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Saved by</th>
                <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Saved at (MYT)</th>
                <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Records used</th>
                <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredSnapshots.map((snap) => (
                <tr key={snap.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-foreground">
                    {snap.id}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-foreground">{snap.templateName}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {snap.parameters.dateRange?.label || 'Custom range'}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {snap.parameters.site || 'All sites'}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    <div className="inline-flex items-center gap-1.5">
                      <User className="size-3 text-muted-foreground/80" />
                      <span>{snap.generatedBy}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                    {snap.generatedAt}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-muted font-mono text-foreground">
                      <Database className="size-3 text-muted-foreground" />
                      {snap.recordCount}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenSnapshot(snap)}
                        className="h-7 px-2 text-xs gap-1 hover:text-primary"
                        title="Open and reproduce snapshot"
                      >
                        <ExternalLink className="size-3" />
                        <span>Open</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyLink(snap)}
                        className="h-7 px-2 text-xs hover:text-primary"
                        title="Copy direct link"
                      >
                        <Link2 className="size-3" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmId(snap.id)}
                        className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                        title="Delete snapshot"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSnapshots.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    No snapshots match your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={Boolean(deleteConfirmId)} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete saved run?</DialogTitle>
            <DialogDescription className="text-xs">
              This snapshot parameters record will be removed from your browser storage.
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
    </div>
  );
}
