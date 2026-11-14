import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Search,
  Layers,
  MapPin,
  ExternalLink,
  Cpu,
  Route,
  Activity,
  Ruler,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useAssets } from '@/contexts/AssetsContext';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { PolesPageHeader } from '@/components/assets/PolesPageHeader';
import { AssetsModuleTabs } from '@/components/assets/AssetsModuleTabs';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { CableSpanRecord } from '@/types/assets';

export default function CableSpans() {
  const { selectedSite } = useAppContext();
  const { poles, cableSpans, richDevices, permissions, isRefreshing, refreshAssets } = useAssets();
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [siteFilter, setSiteFilter] = useState<string>(selectedSite);
  const [selectedSpan, setSelectedSpan] = useState<CableSpanRecord | null>(null);

  // Pagination state (default: 10 rows per page, matching user request for 10-15 rows)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Reset to first page when search or site filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, siteFilter]);

  const activePolesCount = useMemo(
    () => poles.filter((p) => p.lifecycle !== 'Deleted').length,
    [poles]
  );

  const filteredSpans = useMemo(() => {
    return cableSpans.filter((s) => {
      if (siteFilter && siteFilter !== 'ALL' && s.siteName !== siteFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          s.identifier.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.fromPole.toLowerCase().includes(q) ||
          s.toPole.toLowerCase().includes(q) ||
          (s.route && s.route.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [cableSpans, siteFilter, search]);

  // Pagination calculation
  const totalFiltered = filteredSpans.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / rowsPerPage));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIdx = (safePage - 1) * rowsPerPage;

  const paginatedSpans = useMemo(() => {
    return filteredSpans.slice(startIdx, startIdx + rowsPerPage);
  }, [filteredSpans, startIdx, rowsPerPage]);

  // Network Telemetry KPIs
  const spanStats = useMemo(() => {
    const total = filteredSpans.length;
    const active = filteredSpans.filter((s) => s.lifecycle === 'Active').length;
    let totalLengthM = 0;
    let countedSpans = 0;
    for (const s of filteredSpans) {
      if (typeof s.lengthKm === 'number' && !isNaN(s.lengthKm)) {
        totalLengthM += s.lengthKm * 1000;
        countedSpans++;
      }
    }
    const avgLengthM = countedSpans > 0 ? Math.round(totalLengthM / countedSpans) : 0;
    const totalKm = (totalLengthM / 1000).toFixed(1);

    return { total, active, totalKm, avgLengthM };
  }, [filteredSpans]);

  // Map poles to their mounted devices count
  const poleDevicesCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of richDevices) {
      if (d.installedPoleId) {
        map.set(d.installedPoleId, (map.get(d.installedPoleId) || 0) + 1);
      }
    }
    return map;
  }, [richDevices]);

  const handleExport = () => {
    const headers = [
      'Identifier',
      'Name',
      'Site',
      'From Pole',
      'To Pole',
      'Length (km)',
      'Lifecycle',
      'Route',
    ];
    const rows = filteredSpans.map((s) => [
      s.identifier,
      `"${s.name.replace(/"/g, '""')}"`,
      s.siteName,
      s.fromPole,
      s.toPole,
      s.lengthKm !== null && s.lengthKm !== undefined ? s.lengthKm : '',
      s.lifecycle,
      s.route || '',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `falcon_cable_spans_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('success', `Exported ${filteredSpans.length} cable spans to CSV.`);
  };

  const uniqueSites = useMemo(
    () => Array.from(new Set(cableSpans.map((s) => s.siteName))).sort(),
    [cableSpans]
  );

  // Selected Span Details
  const fromPoleObj = useMemo(
    () => (selectedSpan ? poles.find((p) => p.identifier === selectedSpan.fromPole) : null),
    [selectedSpan, poles]
  );
  const toPoleObj = useMemo(
    () => (selectedSpan ? poles.find((p) => p.identifier === selectedSpan.toPole) : null),
    [selectedSpan, poles]
  );
  const fromPoleDevices = useMemo(
    () => (selectedSpan ? richDevices.filter((d) => d.installedPoleId === selectedSpan.fromPole) : []),
    [selectedSpan, richDevices]
  );
  const toPoleDevices = useMemo(
    () => (selectedSpan ? richDevices.filter((d) => d.installedPoleId === selectedSpan.toPole) : []),
    [selectedSpan, richDevices]
  );

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-10 space-y-4">
      <PolesPageHeader
        title="Cable spans"
        subtitle="Fibre cable spans connecting poles on a site."
        moduleBreadcrumbLabel="Cable spans"
        isRefreshing={isRefreshing}
        onRefresh={refreshAssets}
        onExport={handleExport}
        exportDisabled={filteredSpans.length === 0}
        permissions={permissions}
        showRegisterAction={false}
      />

      <AssetsModuleTabs
        activeTab="cable_spans"
        polesCount={activePolesCount}
        cableSpansCount={cableSpans.length}
      />

      {/* 4-Cell Telemetry KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Layers className="size-4 text-primary" />
            <span>Total cable spans</span>
          </div>
          <div className="mt-2 text-2xl font-semibold font-mono text-foreground">
            {spanStats.total}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Activity className="size-4 text-emerald-500" />
            <span>Active spans</span>
          </div>
          <div className="mt-2 text-2xl font-semibold font-mono text-emerald-600 dark:text-emerald-400">
            {spanStats.active}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Ruler className="size-4 text-sky-400" />
            <span>Total network length</span>
          </div>
          <div className="mt-2 text-2xl font-semibold font-mono text-foreground">
            {spanStats.totalKm} <span className="text-sm font-normal text-muted-foreground">km</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Route className="size-4 text-amber-500" />
            <span>Average span</span>
          </div>
          <div className="mt-2 text-2xl font-semibold font-mono text-foreground">
            {spanStats.avgLengthM} <span className="text-sm font-normal text-muted-foreground">m</span>
          </div>
        </div>
      </div>

      {/* Spans Table Container */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search identifier, route, or pole..."
                className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="h-8 px-2.5 text-xs rounded-lg border border-border bg-background text-foreground cursor-pointer"
              aria-label="Filter cable spans by site"
            >
              <option value="ALL">All sites</option>
              {uniqueSites.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            Showing {totalFiltered === 0 ? 0 : startIdx + 1}–{Math.min(startIdx + rowsPerPage, totalFiltered)} of {totalFiltered} cable spans
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 px-4">Identifier</th>
                <th className="py-2.5 px-4">Name & Route</th>
                <th className="py-2.5 px-4">Site</th>
                <th className="py-2.5 px-4">Length</th>
                <th className="py-2.5 px-4">Endpoints</th>
                <th className="py-2.5 px-4">Mounted Devices</th>
                <th className="py-2.5 px-4">Lifecycle</th>
                <th className="py-2.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedSpans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <Layers className="size-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="font-semibold text-foreground text-xs">No cable spans found</p>
                    <p className="text-[11px] mt-0.5">
                      No cable spans match the search query or site filter.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedSpans.map((span) => {
                  const fromDevs = poleDevicesCountMap.get(span.fromPole) || 0;
                  const toDevs = poleDevicesCountMap.get(span.toPole) || 0;
                  const totalEndpointDevs = fromDevs + toDevs;
                  const formattedLength =
                    typeof span.lengthKm === 'number'
                      ? span.lengthKm >= 1
                        ? `${span.lengthKm.toFixed(2)} km`
                        : `${Math.round(span.lengthKm * 1000)} m`
                      : '—';

                  return (
                    <tr key={span.identifier} className="hover:bg-muted/30 transition-colors h-12">
                      <td className="py-2 px-4 font-mono font-semibold">
                        <button
                          type="button"
                          onClick={() => setSelectedSpan(span)}
                          className="text-primary hover:underline text-left cursor-pointer"
                        >
                          {span.identifier}
                        </button>
                      </td>

                      <td className="py-2 px-4">
                        <div className="font-medium text-foreground">{span.name}</div>
                        {span.route && (
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Route className="size-3 text-muted-foreground/80" />
                            <span>{span.route}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-2 px-4 text-muted-foreground">{span.siteName}</td>

                      <td className="py-2 px-4 font-mono text-foreground font-medium">
                        {formattedLength}
                      </td>

                      <td className="py-2 px-4 font-mono">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            to={`/assets/poles/${encodeURIComponent(span.fromPole)}`}
                            className="text-primary hover:underline"
                          >
                            {span.fromPole}
                          </Link>
                          <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                          <Link
                            to={`/assets/poles/${encodeURIComponent(span.toPole)}`}
                            className="text-primary hover:underline"
                          >
                            {span.toPole}
                          </Link>
                        </div>
                      </td>

                      <td className="py-2 px-4">
                        {totalEndpointDevs > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-medium">
                            <Cpu className="size-3" />
                            <span>{totalEndpointDevs} IoT device{totalEndpointDevs === 1 ? '' : 's'}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">No sensors</span>
                        )}
                      </td>

                      <td className="py-2 px-4">
                        <StatusBadge status={span.lifecycle} size="sm" />
                      </td>

                      <td className="py-2 px-4 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSpan(span)}
                          className="h-7 px-2 text-[11px] text-primary hover:underline cursor-pointer"
                        >
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-border bg-card text-xs text-muted-foreground">
          <div>
            Showing{' '}
            <span className="font-mono font-semibold text-foreground">
              {totalFiltered === 0 ? 0 : startIdx + 1}
            </span>
            –
            <span className="font-mono font-semibold text-foreground">
              {Math.min(startIdx + rowsPerPage, totalFiltered)}
            </span>{' '}
            of{' '}
            <span className="font-mono font-semibold text-foreground">
              {totalFiltered}
            </span>{' '}
            cable {totalFiltered === 1 ? 'span' : 'spans'}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <div className="relative bg-background border border-border rounded-md flex items-center h-8">
                <select
                  aria-label="Rows per page"
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-full pl-2.5 pr-7 bg-transparent text-xs font-medium text-foreground cursor-pointer outline-none appearance-none"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <ChevronDown className="absolute right-1.5 size-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-8 w-8 p-0 border-border bg-card hover:bg-muted cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="w-14 text-center font-mono font-medium text-foreground">
                {safePage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 w-8 p-0 border-border bg-card hover:bg-muted cursor-pointer"
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Cable Span Details Dialog */}
      <Dialog open={Boolean(selectedSpan)} onOpenChange={(open) => !open && setSelectedSpan(null)}>
        {selectedSpan && (
          <DialogContent className="sm:max-w-2xl bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Layers className="size-4 text-primary" />
                <span>Cable Span: {selectedSpan.identifier}</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Physical fibre segment connecting poles on {selectedSpan.siteName}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-1 text-xs">
              {/* Span Overview Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg border border-border bg-background">
                <div>
                  <span className="text-[11px] text-muted-foreground block">Route name</span>
                  <span className="font-semibold text-foreground">{selectedSpan.name}</span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Length</span>
                  <span className="font-mono font-semibold text-foreground">
                    {typeof selectedSpan.lengthKm === 'number'
                      ? `${selectedSpan.lengthKm} km (${Math.round(selectedSpan.lengthKm * 1000)} m)`
                      : 'Unrecorded'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Jurisdiction</span>
                  <span className="text-foreground">{selectedSpan.siteName}</span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Lifecycle</span>
                  <StatusBadge status={selectedSpan.lifecycle} size="sm" />
                </div>
              </div>

              {/* Endpoint Poles Side-by-Side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* From Pole */}
                <div className="p-3.5 rounded-lg border border-border bg-background space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Endpoint A (From Pole)
                    </span>
                    <Link
                      to={`/assets/poles/${encodeURIComponent(selectedSpan.fromPole)}`}
                      className="text-primary hover:underline font-mono font-semibold flex items-center gap-1"
                    >
                      <span>{selectedSpan.fromPole}</span>
                      <ExternalLink className="size-3" />
                    </Link>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {fromPoleObj ? (
                      <>
                        <span>{fromPoleObj.name}</span>
                        <div className="font-mono mt-0.5">
                          {fromPoleObj.location ? `${fromPoleObj.location.lat.toFixed(5)}, ${fromPoleObj.location.lng.toFixed(5)}` : 'Unlocated'}
                        </div>
                      </>
                    ) : (
                      'Pole record referenced'
                    )}
                  </div>
                  <div className="pt-1 border-t border-border/50 text-[11px]">
                    <span className="text-muted-foreground">Mounted sensors: </span>
                    <strong className="text-foreground">{fromPoleDevices.length}</strong>
                    {fromPoleDevices.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {fromPoleDevices.map((d) => (
                          <Link
                            key={d.identifier}
                            to={`/assets/inventory/devices/${encodeURIComponent(d.identifier)}`}
                            className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px] text-primary hover:underline"
                          >
                            {d.identifier}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* To Pole */}
                <div className="p-3.5 rounded-lg border border-border bg-background space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Endpoint B (To Pole)
                    </span>
                    <Link
                      to={`/assets/poles/${encodeURIComponent(selectedSpan.toPole)}`}
                      className="text-primary hover:underline font-mono font-semibold flex items-center gap-1"
                    >
                      <span>{selectedSpan.toPole}</span>
                      <ExternalLink className="size-3" />
                    </Link>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {toPoleObj ? (
                      <>
                        <span>{toPoleObj.name}</span>
                        <div className="font-mono mt-0.5">
                          {toPoleObj.location ? `${toPoleObj.location.lat.toFixed(5)}, ${toPoleObj.location.lng.toFixed(5)}` : 'Unlocated'}
                        </div>
                      </>
                    ) : (
                      'Pole record referenced'
                    )}
                  </div>
                  <div className="pt-1 border-t border-border/50 text-[11px]">
                    <span className="text-muted-foreground">Mounted sensors: </span>
                    <strong className="text-foreground">{toPoleDevices.length}</strong>
                    {toPoleDevices.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {toPoleDevices.map((d) => (
                          <Link
                            key={d.identifier}
                            to={`/assets/inventory/devices/${encodeURIComponent(d.identifier)}`}
                            className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px] text-primary hover:underline"
                          >
                            {d.identifier}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action shortcuts */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                <Link
                  to={`/overview?selection=${encodeURIComponent(selectedSpan.identifier)}`}
                  className="h-8 px-3 rounded-lg border border-border text-xs font-medium inline-flex items-center gap-1.5 hover:bg-muted text-foreground transition-colors"
                >
                  <MapPin className="size-3.5 text-primary" />
                  <span>View on Operations Map</span>
                </Link>

                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setSelectedSpan(null)}
                  className="text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
