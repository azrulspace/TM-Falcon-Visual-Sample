import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  User,
  Shield,
  Search,
  ExternalLink,
} from 'lucide-react';
import type { DeviceRecord } from '@/types/devices';
import type { PoleRecord } from '@/types/assets';
import type { FalconCase } from '@/types/cases';
import type { ReportDateRange, AuditLogEntry } from '@/types/reports';
import { computeAuditLogEntries } from '@/data/reportsSelectors';
import { ReportSection } from '../ReportSection';
import { formatAbsoluteMYT } from '@/lib/dateTime';

interface AuditLogReportProps {
  devices: DeviceRecord[];
  poles: PoleRecord[];
  cases: FalconCase[];
  range: ReportDateRange;
}

export const AuditLogReport: React.FC<AuditLogReportProps> = ({
  devices,
  poles,
  cases,
  range,
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

  // Unique actors
  const uniqueActors = useMemo(() => {
    return Array.from(new Set(allEntries.map((e) => e.actor))).length;
  }, [allEntries]);

  return (
    <div className="space-y-6">
      {/* 1. Governance & Compliance Overview */}
      <ReportSection
        id="audit-log-overview"
        title="Compliance & Governance Audit Trail"
        description="Forensic record of all configuration changes, asset modifications, case investigations, and operational interventions."
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 text-xs font-medium text-primary mb-1">
                <FileText className="size-3.5" />
                <span>Recorded Actions</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{allEntries.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Audit events in period</div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-500 mb-1">
                <User className="size-3.5" />
                <span>Active Operators</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{uniqueActors}</div>
              <div className="text-xs text-muted-foreground mt-1">Distinct verified actors</div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 text-xs font-medium text-blue-500 mb-1">
                <Shield className="size-3.5" />
                <span>Device Events</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{targetCounts.Device}</div>
              <div className="text-xs text-muted-foreground mt-1">Config &amp; telemetry changes</div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 text-xs font-medium text-purple-500 mb-1">
                <Shield className="size-3.5" />
                <span>Asset &amp; Case Events</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {targetCounts.Pole + targetCounts.Case}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Lifecycle &amp; case workflows</div>
            </div>
          </div>
        </div>
      </ReportSection>

      {/* 2. Detailed Forensic Log Table */}
      <ReportSection
        id="forensic-log-table"
        title="Forensic Activity Log"
        description="Immutable sequence of system actions with actor attribution, previous and target values."
      >
        <div className="space-y-4">
          {/* Controls: Search and Entity Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {['All', 'Device', 'Pole', 'Case'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedEntity(type)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    selectedEntity === type
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {type} {type !== 'All' && `(${targetCounts[type] || 0})`}
                </button>
              ))}
            </div>

            <div className="relative w-64">
              <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search actor, action, target..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Table */}
          {filteredEntries.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No audit log entries matching your current search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Timestamp (MYT)</th>
                    <th className="py-2.5 px-3 font-semibold">Actor</th>
                    <th className="py-2.5 px-3 font-semibold">Role</th>
                    <th className="py-2.5 px-3 font-semibold">Action</th>
                    <th className="py-2.5 px-3 font-semibold">Target Entity</th>
                    <th className="py-2.5 px-3 font-semibold">Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredEntries.slice(0, 30).map((entry) => (
                    <tr key={entry.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                        {formatAbsoluteMYT(entry.timestamp)}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-foreground">
                        {entry.actor}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                          {entry.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] font-semibold text-primary">
                        {entry.action}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-foreground whitespace-nowrap">
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
                          <span className="ml-1 text-[10px] text-primary">
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
    </div>
  );
};
