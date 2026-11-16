import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ExternalLink,
  Lock,
  Download,
} from 'lucide-react';
import type { DeviceRecord } from '@/types/devices';
import type { PoleRecord } from '@/types/assets';
import type { FalconCase } from '@/types/cases';
import type { ReportDateRange, AuditLogEntry } from '@/types/reports';
import { computeAuditLogEntries } from '@/data/reportsSelectors';
import { ReportSection } from '../ReportSection';
import { formatAbsoluteMYT } from '@/lib/dateTime';
import { Button } from '@/components/ui/button';

export interface AuditLogReportProps {
  devices: DeviceRecord[];
  poles: PoleRecord[];
  cases: FalconCase[];
  range: ReportDateRange;
  canViewAuditLog?: boolean;
}

export const AuditLogReport: React.FC<AuditLogReportProps> = ({
  devices,
  poles,
  cases,
  range,
  canViewAuditLog = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>('All');

  const allEntries: AuditLogEntry[] = useMemo(() => {
    return computeAuditLogEntries(devices, poles, cases, range);
  }, [devices, poles, cases, range]);

  const filteredEntries = useMemo(() => {
    return allEntries.filter((e) => {
      if (selectedEntity !== 'All' && e.targetType !== selectedEntity) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchActor = e.actor.toLowerCase().includes(term);
        const matchAction = e.action.toLowerCase().includes(term);
        const matchTarget = e.targetId.toLowerCase().includes(term);
        const matchDetails = e.details.toLowerCase().includes(term);
        return matchActor || matchAction || matchTarget || matchDetails;
      }
      return true;
    });
  }, [allEntries, selectedEntity, searchTerm]);

  // Breakdown by target type
  const targetCounts = useMemo(() => {
    const counts: Record<string, number> = { Device: 0, Pole: 0, Case: 0 };
    for (const e of allEntries) {
      if (e.targetType in counts) counts[e.targetType]++;
    }
    return counts;
  }, [allEntries]);

  // Specific configuration mutation events
  const configMutations = useMemo(() => {
    return allEntries.filter(
      (e) =>
        e.action.toLowerCase().includes('config') ||
        e.action.toLowerCase().includes('setting') ||
        e.action.toLowerCase().includes('threshold') ||
        e.action.toLowerCase().includes('audio') ||
        e.details.toLowerCase().includes('parameter')
    );
  }, [allEntries]);

  // Specific lifecycle / state transitions
  const lifecycleMutations = useMemo(() => {
    return allEntries.filter(
      (e) =>
        e.action.toLowerCase().includes('status') ||
        e.action.toLowerCase().includes('lifecycle') ||
        e.action.toLowerCase().includes('state') ||
        e.action.toLowerCase().includes('mount') ||
        e.action.toLowerCase().includes('registered')
    );
  }, [allEntries]);

  // Operator actors summary
  const actorBreakdown = useMemo(() => {
    const map: Record<string, { role: string; count: number; lastActive: string }> = {};
    for (const e of allEntries) {
      if (!map[e.actor]) {
        map[e.actor] = { role: e.role, count: 0, lastActive: e.timestamp };
      }
      map[e.actor].count++;
      if (new Date(e.timestamp) > new Date(map[e.actor].lastActive)) {
        map[e.actor].lastActive = e.timestamp;
      }
    }
    return Object.entries(map).map(([name, data]) => ({
      name,
      ...data,
    }));
  }, [allEntries]);

  // Export forensic CSV handler
  const handleExportForensicCsv = () => {
    const rows = [
      ['Timestamp (MYT)', 'Actor', 'Role', 'Action', 'Target Type', 'Target ID', 'Details', 'From Value', 'To Value'],
      ...filteredEntries.map((e) => [
        formatAbsoluteMYT(e.timestamp),
        e.actor,
        e.role,
        e.action,
        e.targetType,
        e.targetId,
        `"${e.details.replace(/"/g, '""')}"`,
        e.fromValue || '',
        e.toValue || '',
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((r) => r.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `falcon_forensic_audit_${range.preset}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If unauthorized
  if (!canViewAuditLog) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4 rounded-xl border border-border bg-card">
        <div className="size-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
          <Lock className="size-6" />
        </div>
        <h3 className="text-base font-bold text-foreground">Audit Log Access Restricted</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Forensic immutable audit records, operator action logs, and configuration state diffs are
          restricted to users with <strong className="text-foreground">System Administrator</strong> or{' '}
          <strong className="text-foreground">Compliance Reviewer</strong> privileges.
        </p>
        <div className="pt-2">
          <Link to="/reports">
            <Button variant="outline" size="sm" className="text-xs">
              Return to Operational Reports
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* SECTION 1: Forensic Activity Trail */}
      <ReportSection
        id="section-forensic-trail"
        title="Forensic Activity Trail (Immutable Log)"
        description="Comprehensive audit of all administrative commands, status changes, configuration pushes, and case actions."
        topLimitNotice="Showing up to 30 most recent forensic events."
      >
        <div className="space-y-4">
          {/* Controls: Search, Entity Filter, Export Button */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {['All', 'Device', 'Pole', 'Case'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedEntity(type)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    selectedEntity === type
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {type} {type !== 'All' && `(${targetCounts[type] || 0})`}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter actor, action, target..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 text-xs rounded border border-border/60 bg-background focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportForensicCsv}
                className="gap-1.5 text-xs h-7 px-2.5"
              >
                <Download className="size-3" />
                <span>Export CSV</span>
              </Button>
            </div>
          </div>

          {/* Table */}
          {filteredEntries.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground rounded-lg border border-border/60 bg-muted/10">
              No audit log entries matching your current search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground">
                    <th className="py-2.5 px-3 font-semibold">Timestamp (MYT)</th>
                    <th className="py-2.5 px-3 font-semibold">Actor</th>
                    <th className="py-2.5 px-3 font-semibold">Role</th>
                    <th className="py-2.5 px-3 font-semibold">Action</th>
                    <th className="py-2.5 px-3 font-semibold">Target Entity</th>
                    <th className="py-2.5 px-3 font-semibold">Audit Details &amp; State Diff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredEntries.slice(0, 30).map((entry) => (
                    <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-3 text-muted-foreground font-mono whitespace-nowrap">
                        {formatAbsoluteMYT(entry.timestamp)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-foreground whitespace-nowrap">
                        {entry.actor}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                          {entry.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-primary">
                        {entry.action}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-foreground whitespace-nowrap">
                        {entry.targetType === 'Device' ? (
                          <Link
                            to={`/assets/inventory/devices/${entry.targetId}`}
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <span>{entry.targetId}</span>
                            <ExternalLink className="size-2.5 opacity-60" />
                          </Link>
                        ) : entry.targetType === 'Pole' ? (
                          <Link
                            to={`/assets/poles/${entry.targetId}`}
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <span>{entry.targetId}</span>
                            <ExternalLink className="size-2.5 opacity-60" />
                          </Link>
                        ) : entry.targetType === 'Case' ? (
                          <Link
                            to={`/cases/${entry.targetId}`}
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <span>{entry.targetId}</span>
                            <ExternalLink className="size-2.5 opacity-60" />
                          </Link>
                        ) : (
                          entry.targetId
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground max-w-sm truncate" title={entry.details}>
                        {entry.details}
                        {entry.fromValue && entry.toValue && (
                          <span className="ml-1 text-[10px] text-primary font-mono font-medium">
                            ({entry.fromValue} → {entry.toValue})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </ReportSection>

      {/* SECTION 2: Configuration & Parameter Mutations */}
      <ReportSection
        id="section-config-mutations"
        title="Configuration &amp; Threshold Mutations"
        description="Edge parameter adjustments, alarm thresholds, sound volume levels, and firmware rollouts."
      >
        {configMutations.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground rounded-lg border border-border/60 bg-muted/10">
            No parameter or configuration changes recorded in this period.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground">
                  <th className="py-2.5 px-3 font-semibold">Timestamp (MYT)</th>
                  <th className="py-2.5 px-3 font-semibold">Author</th>
                  <th className="py-2.5 px-3 font-semibold">Target Device</th>
                  <th className="py-2.5 px-3 font-semibold">Parameter Changed</th>
                  <th className="py-2.5 px-3 font-semibold">Old Value → New Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {configMutations.slice(0, 10).map((c) => (
                  <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-3 text-muted-foreground font-mono">
                      {formatAbsoluteMYT(c.timestamp)}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-foreground">{c.actor}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-primary">{c.targetId}</td>
                    <td className="py-2.5 px-3 font-medium text-foreground">{c.action}</td>
                    <td className="py-2.5 px-3 font-mono text-xs">
                      {c.fromValue || c.toValue ? (
                        <span className="text-primary font-semibold">
                          {c.fromValue || 'Default'} → {c.toValue || 'Updated'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{c.details}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ReportSection>

      {/* SECTION 3: Asset Lifecycle & Status Mutations */}
      <ReportSection
        id="section-lifecycle-mutations"
        title="Asset Lifecycle &amp; Status Mutations"
        description="Recorded lifecycle transitions, pole status mutations, and device mounting state changes."
      >
        {lifecycleMutations.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground rounded-lg border border-border/60 bg-muted/10">
            No asset lifecycle transitions recorded in this period.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground">
                  <th className="py-2.5 px-3 font-semibold">Timestamp (MYT)</th>
                  <th className="py-2.5 px-3 font-semibold">Operator</th>
                  <th className="py-2.5 px-3 font-semibold">Entity Type</th>
                  <th className="py-2.5 px-3 font-semibold">Target</th>
                  <th className="py-2.5 px-3 font-semibold">Lifecycle Event</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {lifecycleMutations.slice(0, 10).map((l) => (
                  <tr key={l.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-3 text-muted-foreground font-mono">
                      {formatAbsoluteMYT(l.timestamp)}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-foreground">{l.actor}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                        {l.targetType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-primary">{l.targetId}</td>
                    <td className="py-2.5 px-3 text-foreground">{l.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ReportSection>

      {/* SECTION 4: Operator Accountability & Session Activity */}
      <ReportSection
        id="section-operator-activity"
        title="Operator Accountability &amp; Activity Breakdown"
        description="Summary of operational interventions attributed to verified operator and supervisor accounts."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {actorBreakdown.map((actor) => (
            <div
              key={actor.name}
              className="p-3.5 rounded-xl border border-border/60 bg-muted/10 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">{actor.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-muted text-muted-foreground">
                  {actor.role}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-muted-foreground pt-1">
                <span>Actions logged:</span>
                <span className="font-mono font-bold text-foreground">{actor.count}</span>
              </div>
              <div className="flex items-baseline justify-between text-[11px] text-muted-foreground">
                <span>Last active:</span>
                <span className="font-mono">{formatAbsoluteMYT(actor.lastActive).split(', ')[1] || 'Today'}</span>
              </div>
            </div>
          ))}
        </div>
      </ReportSection>
    </div>
  );
};
