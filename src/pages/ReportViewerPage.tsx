import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Activity,
  Layers,
  Radio,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { REPORT_TEMPLATES } from '@/data/reportsCatalog';
import { ReportViewerHeader } from '@/components/reports/ReportViewerHeader';
import { ReportParameterBar } from '@/components/reports/ReportParameterBar';
import { ReportDataNotesBar } from '@/components/reports/ReportDataNotesBar';
import { ReportKpiStrip } from '@/components/reports/ReportKpiStrip';
import { ReportSection } from '@/components/reports/ReportSection';
import { DefinitionsDrawer } from '@/components/reports/DefinitionsDrawer';
import { DailyOperationsReport } from '@/components/reports/templates/DailyOperationsReport';
import { WeeklyOperationsReport } from '@/components/reports/templates/WeeklyOperationsReport';
import { EventIncidentAnalysisReport } from '@/components/reports/templates/EventIncidentAnalysisReport';
import { CaseManagementReport } from '@/components/reports/templates/CaseManagementReport';
import { DeviceHealthReport } from '@/components/reports/templates/DeviceHealthReport';
import { AssetInventoryReport } from '@/components/reports/templates/AssetInventoryReport';
import { RiskPreventiveWorkReport } from '@/components/reports/templates/RiskPreventiveWorkReport';
import { ExecutiveSummaryReport } from '@/components/reports/templates/ExecutiveSummaryReport';
import { formatAbsoluteMYT } from '@/lib/dateTime';
import { ScheduleReportDialog } from '@/components/reports/ScheduleReportDialog';
import {
  computeReportDateRange,
  computeComparisonRange,
  computeDelta,
  computeEventMetrics,
  computeCaseMetrics,
  computeDeviceMetrics,
  computeAssetMetrics,
  computeRiskMetrics,
  computeDataQualityMetrics,
} from '@/data/reportsSelectors';
import { getMetricById } from '@/lib/metricDictionary';
import { useEvents } from '@/contexts/EventsContext';
import { useCases } from '@/contexts/CasesContext';
import { useAssets } from '@/contexts/AssetsContext';
import { segments as initialRiskSegments } from '@/data/segments';
import { INITIAL_DEVICES_REGISTRY as initialDevices } from '@/data/devicesRegistry';
import { useToast } from '@/contexts/ToastContext';
import type {
  PeriodPreset,
  ReportParameters,
  ReportKpiItem,
  ReportSnapshot,
} from '@/types/reports';

export const ReportViewerPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Context stores
  const { events } = useEvents();
  const { cases } = useCases();
  const { poles, cableSpans } = useAssets();
  const devices = initialDevices;
  const segments = initialRiskSegments;

  // Modals & drawers
  const [definitionsOpen, setDefinitionsOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  // Look up current template by slug or ID
  const report = useMemo(() => {
    if (!slug) return null;
    return (
      REPORT_TEMPLATES.find(
        (t) => t.slug === slug || t.id.toLowerCase() === slug.toLowerCase()
      ) || null
    );
  }, [slug]);

  // Read URL search params
  const periodParam = (searchParams.get('period') as PeriodPreset) || report?.defaultPeriod || 'today';
  const siteParam = searchParams.get('site') || 'All sites';
  const compareParam = searchParams.get('compare') !== 'false'; // default true
  const simParam = searchParams.get('sim') === 'true'; // default false
  const customStartParam = searchParams.get('customStart') || undefined;
  const customEndParam = searchParams.get('customEnd') || undefined;

  const parameters: ReportParameters = useMemo(
    () => ({
      reportId: report?.id,
      periodPreset: periodParam,
      customStartDate: customStartParam,
      customEndDate: customEndParam,
      site: siteParam,
      compareWithPrevious: compareParam,
      includeSimulatedEvents: simParam,
    }),
    [report?.id, periodParam, customStartParam, customEndParam, siteParam, compareParam, simParam]
  );

  // Update URL search parameters
  const updateParameters = useCallback(
    (next: Partial<ReportParameters>) => {
      const nextParams = new URLSearchParams(searchParams);

      if (next.periodPreset) nextParams.set('period', next.periodPreset);
      if (next.site !== undefined) nextParams.set('site', next.site);
      if (next.compareWithPrevious !== undefined)
        nextParams.set('compare', next.compareWithPrevious ? 'true' : 'false');
      if (next.includeSimulatedEvents !== undefined)
        nextParams.set('sim', next.includeSimulatedEvents ? 'true' : 'false');
      if (next.customStartDate !== undefined) {
        if (next.customStartDate) nextParams.set('customStart', next.customStartDate);
        else nextParams.delete('customStart');
      }
      if (next.customEndDate !== undefined) {
        if (next.customEndDate) nextParams.set('customEnd', next.customEndDate);
        else nextParams.delete('customEnd');
      }

      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const resetDefaults = useCallback(() => {
    if (!report) return;
    const nextParams = new URLSearchParams();
    nextParams.set('period', report.defaultPeriod);
    nextParams.set('site', 'All sites');
    nextParams.set('compare', 'true');
    nextParams.set('sim', 'false');
    setSearchParams(nextParams, { replace: true });
    addToast('info', 'Report parameters reset to template defaults.');
  }, [report, setSearchParams, addToast]);

  // Compute primary and comparison date ranges
  const dateRange = useMemo(() => {
    return computeReportDateRange(
      parameters.periodPreset || 'today',
      parameters.customStartDate,
      parameters.customEndDate
    );
  }, [parameters.periodPreset, parameters.customStartDate, parameters.customEndDate]);

  const comparisonRange = useMemo(() => {
    return computeComparisonRange(dateRange);
  }, [dateRange]);

  // Compute metrics across domains
  const eventMetrics = useMemo(() => {
    return computeEventMetrics(
      events,
      dateRange,
      parameters.site,
      parameters.includeSimulatedEvents || false
    );
  }, [events, dateRange, parameters.site, parameters.includeSimulatedEvents]);

  const priorEventMetrics = useMemo(() => {
    if (!parameters.compareWithPrevious) return null;
    return computeEventMetrics(
      events,
      comparisonRange,
      parameters.site,
      parameters.includeSimulatedEvents || false
    );
  }, [events, comparisonRange, parameters.site, parameters.compareWithPrevious, parameters.includeSimulatedEvents]);

  const caseMetrics = useMemo(() => {
    return computeCaseMetrics(cases, dateRange, parameters.site);
  }, [cases, dateRange, parameters.site]);

  const priorCaseMetrics = useMemo(() => {
    if (!parameters.compareWithPrevious) return null;
    return computeCaseMetrics(cases, comparisonRange, parameters.site);
  }, [cases, comparisonRange, parameters.site, parameters.compareWithPrevious]);

  const deviceMetrics = useMemo(() => {
    return computeDeviceMetrics(devices, dateRange, parameters.site);
  }, [devices, dateRange, parameters.site]);

  const assetMetrics = useMemo(() => {
    return computeAssetMetrics(poles, cableSpans, parameters.site);
  }, [poles, cableSpans, parameters.site]);

  const riskMetrics = useMemo(() => {
    return computeRiskMetrics(segments, events, dateRange, parameters.site);
  }, [segments, events, dateRange, parameters.site]);

  const dataQualityMetrics = useMemo(() => {
    return computeDataQualityMetrics(devices, poles, events);
  }, [devices, poles, events]);

  // Build KPI Strip items dynamically based on report template metrics
  const kpiItems = useMemo((): ReportKpiItem[] => {
    if (!report) return [];

    return report.metricIds.slice(0, 6).map((metricId) => {
      const def = getMetricById(metricId);

      let value: number | string = 0;
      let delta = null;
      let isInverse = false;

      // Map metric ID to calculated value
      switch (metricId) {
        case 'events_total':
          value = eventMetrics.total;
          if (priorEventMetrics) {
            const d = computeDelta(eventMetrics.total, priorEventMetrics.total);
            delta = { ...d, formattedText: d.label };
          }
          break;

        case 'events_unacknowledged_now':
          value = eventMetrics.unacknowledgedNow;
          isInverse = true;
          break;

        case 'events_high_critical_share':
          value = `${eventMetrics.highCriticalShare}%`;
          isInverse = true;
          break;

        case 'cases_opened':
          value = caseMetrics.casesOpened;
          if (priorCaseMetrics) {
            const d = computeDelta(caseMetrics.casesOpened, priorCaseMetrics.casesOpened);
            delta = { ...d, formattedText: d.label };
          }
          break;

        case 'cases_closed':
          value = caseMetrics.casesClosed;
          if (priorCaseMetrics) {
            const d = computeDelta(caseMetrics.casesClosed, priorCaseMetrics.casesClosed);
            delta = { ...d, formattedText: d.label };
          }
          break;

        case 'availability_percent':
          value = `${deviceMetrics.availabilityPercent}%`;
          break;

        case 'devices_by_state_now':
          value = `${deviceMetrics.byState.online}/${deviceMetrics.devicesTotal}`;
          break;

        case 'devices_online_but_stale_contact':
          value = deviceMetrics.staleDevicesCount;
          isInverse = true;
          break;

        case 'poles_total':
          value = assetMetrics.polesTotal;
          break;

        case 'installation_coverage':
          value = `${assetMetrics.installationCoverage}%`;
          break;

        case 'risk_corridors_ranked':
        case 'segments_under_investigation':
          value = riskMetrics.investigated;
          break;

        case 'vendor_conflicts_total':
          value = dataQualityMetrics.vendorConflicts;
          isInverse = true;
          break;

        default:
          value = def?.status === 'computable now' ? 0 : 'N/A';
          break;
      }

      return {
        id: metricId,
        label: def?.label || metricId,
        value,
        unit: def?.unit !== 'ratio' && def?.unit !== 'status' ? def?.unit : undefined,
        status: def?.status || 'computable now',
        missingReason: def?.missingFieldReason,
        delta,
        isInverseDelta: isInverse,
      };
    });
  }, [
    report,
    eventMetrics,
    priorEventMetrics,
    caseMetrics,
    priorCaseMetrics,
    deviceMetrics,
    assetMetrics,
    riskMetrics,
    dataQualityMetrics,
  ]);

  // Action handlers
  const handleShareLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    addToast('success', 'Report URL copied to clipboard with current parameters.', 'Link copied');
  }, [addToast]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleExportCsv = useCallback(() => {
    // Basic CSV export
    const rows = [
      ['Report', report?.name || ''],
      ['Period', dateRange.label],
      ['Scope', parameters.site],
      ['Generated At', new Date().toISOString()],
      [],
      ['Metric ID', 'Label', 'Value', 'Unit', 'Status'],
      ...kpiItems.map((k) => [k.id, k.label, String(k.value), k.unit || '', k.status || '']),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${report?.slug || 'report'}_${dateRange.preset}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('success', `Exported ${report?.name} summary to CSV.`, 'CSV Exported');
  }, [report, dateRange, parameters.site, kpiItems, addToast]);

  const handleGenerateSnapshot = useCallback(() => {
    if (!report) return;
    const nowIso = new Date().toISOString();
    const snapId = `REP-${Date.now().toString().slice(-6)}`;

    const newSnapshot: ReportSnapshot = {
      id: snapId,
      templateId: report.id,
      templateName: report.name,
      parameters,
      generatedAt: nowIso,
      generatedBy: 'Current Operator',
      dataFreshnessAt: nowIso,
      dictionaryVersion: 'v1.0.0',
      recordCount: eventMetrics.total + caseMetrics.casesOpened,
      format: 'PDF',
      sizeBytes: 245000,
      status: 'Completed',
    };

    try {
      const stored = localStorage.getItem('falcon_reports_history');
      const list: ReportSnapshot[] = stored ? JSON.parse(stored) : [];
      list.unshift(newSnapshot);
      localStorage.setItem('falcon_reports_history', JSON.stringify(list));
    } catch {
      // Ignore fallback
    }

    addToast(
      'success',
      `Snapshot ${snapId} generated with frozen parameters and stored in History.`,
      'Snapshot saved'
    );
  }, [report, parameters, eventMetrics.total, caseMetrics.casesOpened, addToast]);

  // If report not found, show error state
  if (!report) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <div className="size-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertTriangle className="size-6" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Report Template Not Found</h2>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          The requested report slug <span className="font-mono text-primary">{slug}</span> does not exist in the FALCON reports catalog.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/reports?tab=library')}
          className="gap-1.5 text-xs"
        >
          <ArrowLeft className="size-3.5" />
          <span>Return to Reports Library</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1720px] mx-auto animate-in fade-in duration-150">
      {/* Print-only Header (A4 PDF layout) */}
      <div className="hidden print-only mb-6 border-b-2 border-black pb-4 text-black">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xl font-black uppercase tracking-wider">TM FALCON Operations Console</div>
            <div className="text-sm font-bold text-gray-700">{report.name} ({report.id})</div>
          </div>
          <div className="text-right text-xs">
            <div className="font-bold text-rose-700">CONFIDENTIAL / INTERNAL USE ONLY</div>
            <div>Generated: {formatAbsoluteMYT(new Date().toISOString())}</div>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-gray-300">
          <div><strong>Period:</strong> {dateRange.label}</div>
          <div><strong>Site Scope:</strong> {parameters.site}</div>
          <div><strong>Dictionary Version:</strong> v1.0.0</div>
        </div>
      </div>

      {/* Report Header */}
      <ReportViewerHeader
        report={report}
        parameters={parameters}
        onOpenDefinitions={() => setDefinitionsOpen(true)}
        onOpenSchedule={() => setScheduleOpen(true)}
        onGenerateSnapshot={handleGenerateSnapshot}
        onExportCsv={handleExportCsv}
        onPrint={handlePrint}
        onShareLink={handleShareLink}
        isSimulatedIncluded={parameters.includeSimulatedEvents}
      />

      {/* Sticky Parameter Bar */}
      <ReportParameterBar
        parameters={parameters}
        onParametersChange={updateParameters}
        onResetDefaults={resetDefaults}
      />

      {/* Data Notes & Freshness Bar */}
      <ReportDataNotesBar
        range={dateRange}
        siteName={parameters.site}
        recordCount={eventMetrics.total + caseMetrics.casesOpened}
        recordLabel="events and cases"
        onOpenDefinitions={() => setDefinitionsOpen(true)}
        dataQualityIssuesCount={dataQualityMetrics.onlineStale + dataQualityMetrics.polesWithoutLocation}
      />

      {/* Primary KPI Strip */}
      <ReportKpiStrip items={kpiItems} />

      {/* Dynamic Content Sections */}
      <div className="space-y-6 pt-2">
        {report.id === 'R1' ? (
          <DailyOperationsReport
            events={events}
            cases={cases}
            devices={devices}
            dateRange={dateRange}
            parameters={parameters}
          />
        ) : report.id === 'R2' ? (
          <WeeklyOperationsReport
            events={events}
            cases={cases}
            devices={devices}
            dateRange={dateRange}
            parameters={parameters}
          />
        ) : report.id === 'R3' ? (
          <EventIncidentAnalysisReport
            events={events}
            dateRange={dateRange}
            parameters={parameters}
          />
        ) : report.id === 'R5' ? (
          <CaseManagementReport
            cases={cases}
            dateRange={dateRange}
            parameters={parameters}
          />
        ) : report.id === 'R6' ? (
          <DeviceHealthReport
            devices={devices}
            range={dateRange}
            siteFilter={parameters.site}
          />
        ) : report.id === 'R7' ? (
          <AssetInventoryReport
            poles={poles}
            cableSpans={cableSpans}
            devices={devices}
            range={dateRange}
            siteFilter={parameters.site}
          />
        ) : report.id === 'R8' ? (
          <RiskPreventiveWorkReport
            segments={segments}
            events={events}
            range={dateRange}
            siteFilter={parameters.site}
          />
        ) : report.id === 'R10' ? (
          <ExecutiveSummaryReport
            events={events}
            cases={cases}
            devices={devices}
            poles={poles}
            cableSpans={cableSpans}
            segments={segments}
            dateRange={dateRange}
            parameters={parameters}
          />
        ) : (
          <>
            {/* Generic Operational Highlights */}
            <ReportSection
              id="summary-section"
              title="Executive Operational Highlights"
              description="High-level operational performance indicators across active site corridors."
              onExportCsv={handleExportCsv}
              hasTableView={false}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Activity className="size-3.5 text-primary" />
                    <span>Detection & Triage</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Recorded <strong className="text-foreground">{eventMetrics.total}</strong> incidents in the selected period.
                    High & Critical priority events constitute <strong className="text-foreground">{eventMetrics.highCriticalShare}%</strong> of overall volume.
                  </p>
                  <div className="pt-2 text-[11px] text-muted-foreground">
                    Unacknowledged queue now: <strong className="text-foreground">{eventMetrics.unacknowledgedNow}</strong> events
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Layers className="size-3.5 text-primary" />
                    <span>Case Resolutions</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Field teams opened <strong className="text-foreground">{caseMetrics.casesOpened}</strong> cases and successfully closed{' '}
                    <strong className="text-foreground">{caseMetrics.casesClosed}</strong> cases.
                  </p>
                  <div className="pt-2 text-[11px] text-muted-foreground">
                    Open backlog at period end: <strong className="text-foreground">{caseMetrics.casesOpenAtEnd}</strong> active investigations
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Radio className="size-3.5 text-primary" />
                    <span>Telemetry & Network State</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Overall sensor network availability averaged <strong className="text-foreground">{deviceMetrics.availabilityPercent}%</strong>.
                  </p>
                  <div className="pt-2 text-[11px] text-muted-foreground">
                    Online devices: <strong className="text-foreground">{deviceMetrics.byState.online}</strong> · Stale: <strong className="text-foreground">{deviceMetrics.byState.stale}</strong>
                  </div>
                </div>
              </div>
            </ReportSection>

            {/* Generic Details Table */}
            <ReportSection
              id="details-table"
              title="Event & Detection Breakdown"
              description="Classified incident occurrences grouped by trigger category and priority tiers."
              onExportCsv={handleExportCsv}
              hasTableView={false}
            >
              <div className="overflow-x-auto border border-border rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b border-border text-[11px] text-muted-foreground uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Event Category / Type</th>
                      <th className="py-2.5 px-4">Priority Class</th>
                      <th className="py-2.5 px-4 text-right">Count</th>
                      <th className="py-2.5 px-4 text-right">Share (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {Object.entries(eventMetrics.byType).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-muted-foreground">
                          No events recorded for the active timeframe and site scope.
                        </td>
                      </tr>
                    ) : (
                      Object.entries(eventMetrics.byType).map(([type, count]) => {
                        const share = eventMetrics.total > 0 ? Math.round((count / eventMetrics.total) * 100) : 0;
                        return (
                          <tr key={type} className="hover:bg-muted/30">
                            <td className="py-2.5 px-4 font-medium text-foreground">{type}</td>
                            <td className="py-2.5 px-4 text-muted-foreground">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-muted border border-border">
                                Operational
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-medium">{count}</td>
                            <td className="py-2.5 px-4 text-right font-mono text-muted-foreground">{share}%</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </ReportSection>
          </>
        )}
      </div>

      {/* Print-only Footer */}
      <div className="hidden print-only mt-8 pt-4 border-t border-gray-400 text-center text-[10px] text-gray-600">
        TM FALCON Telecom Infrastructure Surveillance Platform · Data as of {formatAbsoluteMYT(new Date().toISOString())} · Page 1 of 1
      </div>

      {/* Definitions Drawer */}
      <DefinitionsDrawer
        open={definitionsOpen}
        onOpenChange={setDefinitionsOpen}
        reportName={report.name}
        reportMetricIds={report.metricIds}
      />

      {/* Scheduling Dialog */}
      <ScheduleReportDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        report={report}
        parameters={parameters}
      />
    </div>
  );
};
