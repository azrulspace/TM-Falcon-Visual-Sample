import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  RefreshCw,
  ArrowLeft,
  AlertTriangle,
  Copy,
  Plus,
  ExternalLink,
  Search,
  X,
  Radar,
  Radio,
} from 'lucide-react';
import { useAssets } from '@/contexts/AssetsContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DeviceConnectivityBadge,
  VendorMatchBadge,
} from '@/components/assets/devices/DeviceStateBadge';
import { ResolveConflictSheet } from '@/components/assets/devices/ResolveConflictSheet';
import { formatAbsoluteMYT, formatRelativeTime } from '@/lib/dateTime';
import { cn } from '@/lib/utils';
import type { VendorDiscoveryRecord, VendorMatchStatus } from '@/types/devices';

type VendorTabKey = 'all' | VendorMatchStatus | 'vendor_offline';

export default function VendorDiscovery() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const {
    vendorRecords,
    vendorSyncSummary,
    devicePermissions,
    isRefreshing,
    reloadVendorList,
    triggerVendorSync,
  } = useAssets();

  const [selectedLibrary, setSelectedLibrary] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<VendorTabKey>('all');
  const [search, setSearch] = useState('');
  const [conflictTarget, setConflictTarget] = useState<VendorDiscoveryRecord | null>(null);

  const availableLibraries = useMemo(
    () => Array.from(new Set(vendorRecords.map((v) => v.library))).sort(),
    [vendorRecords]
  );

  const libraryScoped = useMemo(() => {
    if (selectedLibrary === 'ALL') return vendorRecords;
    return vendorRecords.filter((v) => v.library === selectedLibrary);
  }, [vendorRecords, selectedLibrary]);

  const counts = useMemo(() => {
    return {
      total: libraryScoped.length,
      registered: libraryScoped.filter((v) => v.matchStatus === 'Registered').length,
      notRegistered: libraryScoped.filter((v) => v.matchStatus === 'Not registered').length,
      conflict: libraryScoped.filter((v) => v.matchStatus === 'Conflict').length,
      vendorOffline: libraryScoped.filter((v) => v.vendorState === 'offline').length,
    };
  }, [libraryScoped]);

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return libraryScoped.filter((v) => {
      if (activeTab === 'Registered' && v.matchStatus !== 'Registered') return false;
      if (activeTab === 'Not registered' && v.matchStatus !== 'Not registered') return false;
      if (activeTab === 'Conflict' && v.matchStatus !== 'Conflict') return false;
      if (activeTab === 'vendor_offline' && v.vendorState !== 'offline') return false;

      if (q) {
        const hay = [
          v.serial,
          v.vendorName,
          v.model,
          v.matchedFalconId || '',
          v.library,
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [libraryScoped, activeTab, search]);

  const kpiCells: {
    key: VendorTabKey;
    label: string;
    value: number;
    accent?: string;
  }[] = [
    { key: 'all', label: 'Vendor devices', value: counts.total },
    { key: 'Registered', label: 'Registered', value: counts.registered, accent: 'text-emerald-500' },
    { key: 'Not registered', label: 'Not registered', value: counts.notRegistered, accent: 'text-primary' },
    { key: 'Conflict', label: 'Conflict', value: counts.conflict, accent: 'text-red-500' },
    { key: 'vendor_offline', label: 'Offline at vendor', value: counts.vendorOffline, accent: 'text-amber-500' },
  ];

  const firstConflict = libraryScoped.find((v) => v.matchStatus === 'Conflict') || null;

  return (
    <div className="space-y-4">
      {/* Unified Breadcrumb */}
      <nav
        className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium"
        aria-label="Breadcrumb"
      >
        <Link to="/overview" className="hover:text-foreground transition-colors">
          Falcon
        </Link>
        <ChevronRight className="size-3 text-muted-foreground/60" />
        <Link to="/assets/poles" className="hover:text-foreground transition-colors">
          Assets and devices
        </Link>
        <ChevronRight className="size-3 text-muted-foreground/60" />
        <Link to="/assets/inventory" className="hover:text-foreground transition-colors">
          Devices
        </Link>
        <ChevronRight className="size-3 text-muted-foreground/60" />
        <span className="text-foreground font-semibold">Vendor discovery</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Vendor discovery
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Devices that the vendor library holds on Edge, compared with the FALCON registry.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <select
            aria-label="Filter vendor library"
            value={selectedLibrary}
            onChange={(e) => setSelectedLibrary(e.target.value)}
            className="h-8 rounded-lg border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="ALL">All libraries</option>
            {availableLibraries.map((lib) => (
              <option key={lib} value={lib}>
                {lib}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            onClick={reloadVendorList}
            title="Reload cached vendor snapshot returned by Edge"
            className="h-8 px-3 text-xs gap-1.5 border-border bg-card hover:bg-muted cursor-pointer"
          >
            <RefreshCw
              className={cn(
                'size-3.5',
                isRefreshing ? 'animate-spin text-primary' : 'text-muted-foreground'
              )}
            />
            <span>Reload list</span>
          </Button>

          {devicePermissions.canTriggerVendorSync ? (
            <Button
              size="sm"
              disabled={isRefreshing}
              onClick={() =>
                triggerVendorSync(
                  selectedLibrary === 'ALL' ? vendorSyncSummary.library : selectedLibrary
                )
              }
              className="h-8 px-3 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
            >
              <Radio className="size-3.5" />
              <span>Sync now</span>
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="inline-flex">
                    <Button
                      size="sm"
                      disabled
                      className="h-8 px-3 text-xs gap-1.5 opacity-60 cursor-not-allowed"
                    >
                      <Radio className="size-3.5" />
                      <span>Sync now</span>
                    </Button>
                  </span>
                }
              />
              <TooltipContent className="max-w-xs text-xs">
                {devicePermissions.vendorSyncDisabledReason}
              </TooltipContent>
            </Tooltip>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/assets/inventory')}
            className="h-8 px-3 text-xs gap-1.5 border-border bg-card hover:bg-muted cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to devices</span>
          </Button>
        </div>
      </div>

      {/* Sync Freshness Summary Card */}
      <div className="rounded-xl border border-border bg-card px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Radar className="size-4 text-primary shrink-0" />
          <span>{vendorSyncSummary.source}</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
          <span>
            Last full Edge sync:{' '}
            <strong className="font-mono text-foreground">
              {formatAbsoluteMYT(vendorSyncSummary.lastFullSyncAt, { showSeconds: false })}
            </strong>{' '}
            <span>({formatRelativeTime(vendorSyncSummary.lastFullSyncAt)})</span>
          </span>
          <span>
            Snapshot reloaded:{' '}
            <strong className="font-mono text-foreground">
              {formatAbsoluteMYT(vendorSyncSummary.lastListReloadAt, { showSeconds: false })}
            </strong>
          </span>
        </div>
      </div>

      {/* Conflict Consequence Callout */}
      {counts.conflict > 0 && firstConflict && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/8 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-xs">
            <AlertTriangle className="size-4 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-semibold text-foreground">
                {counts.conflict} mapping conflict needs resolution
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Vendor serial{' '}
                <span className="font-mono font-semibold text-foreground">
                  {firstConflict.serial}
                </span>{' '}
                ({firstConflict.vendorName}) claims FALCON device{' '}
                <Link
                  to={`/assets/inventory/devices/${encodeURIComponent(
                    firstConflict.matchedFalconId || ''
                  )}`}
                  className="font-mono font-semibold text-primary hover:underline"
                >
                  {firstConflict.matchedFalconId}
                </Link>
                , which is mapped elsewhere. Events from this hardware display raw serial{' '}
                <span className="font-mono text-foreground">{firstConflict.serial}</span> until resolved.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setConflictTarget(firstConflict)}
            className="h-8 px-3 text-xs border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/15 shrink-0 cursor-pointer"
          >
            Resolve conflict
          </Button>
        </div>
      )}

      {/* 5-Cell KPI Strip */}
      <div className="w-full rounded-xl border border-border bg-card shadow-xs grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 overflow-hidden">
        {kpiCells.map((cell, idx) => {
          const isActive = activeTab === cell.key;
          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => setActiveTab(isActive && cell.key !== 'all' ? 'all' : cell.key)}
              aria-pressed={isActive}
              className={cn(
                'flex flex-col justify-center px-4 py-3 text-left transition-all cursor-pointer border-border min-h-[72px]',
                idx > 0 && 'lg:border-l',
                idx % 2 === 1 && 'border-l sm:border-l-0',
                idx >= 2 && 'border-t sm:border-t lg:border-t-0',
                isActive ? 'bg-primary/8 ring-1 ring-inset ring-primary/40' : 'hover:bg-muted/40'
              )}
            >
              <span className="text-xs text-muted-foreground">{cell.label}</span>
              <span className={cn('text-2xl font-bold tabular-nums mt-0.5', cell.accent || 'text-foreground')}>
                {cell.value}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5 overflow-x-auto no-scrollbar">
          {[
            { key: 'all' as VendorTabKey, label: 'All', count: counts.total },
            { key: 'Registered' as VendorTabKey, label: 'Registered', count: counts.registered },
            { key: 'Not registered' as VendorTabKey, label: 'Not registered', count: counts.notRegistered },
            { key: 'Conflict' as VendorTabKey, label: 'Conflict', count: counts.conflict },
          ].map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md h-7 px-2.5 text-xs font-medium whitespace-nowrap cursor-pointer transition-all',
                  active
                    ? 'bg-card text-foreground shadow-xs font-semibold border border-border/60'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search serial, vendor name, model..."
            className="w-full h-8 rounded-lg border border-border bg-card pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-muted-foreground uppercase tracking-wider text-[11px]">
              <th className="py-2.5 px-4 font-semibold">Serial number</th>
              <th className="py-2.5 px-4 font-semibold">Vendor name & model</th>
              <th className="py-2.5 px-4 font-semibold">Vendor state</th>
              <th className="py-2.5 px-4 font-semibold">FALCON match & explanation</th>
              <th className="py-2.5 px-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredRecords.map((vr) => (
              <tr key={vr.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3.5 px-4 align-top whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-semibold text-foreground">{vr.serial}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(vr.serial);
                        addToast('info', `Copied serial ${vr.serial}`);
                      }}
                      title="Copy serial number"
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <Copy className="size-3" />
                    </button>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                    {vr.library}
                  </div>
                </td>

                <td className="py-3.5 px-4 align-top">
                  <div className="font-medium text-foreground">{vr.vendorName}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{vr.model}</div>
                </td>

                <td className="py-3.5 px-4 align-top">
                  <DeviceConnectivityBadge state={vr.vendorState} />
                </td>

                <td className="py-3.5 px-4 align-top max-w-md space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <VendorMatchBadge status={vr.matchStatus} />
                    {vr.matchedFalconId && (
                      <Link
                        to={`/assets/inventory/devices/${encodeURIComponent(vr.matchedFalconId)}`}
                        className="font-mono font-semibold text-primary hover:underline"
                      >
                        {vr.matchedFalconId}
                      </Link>
                    )}
                  </div>
                  {vr.conflictReason && (
                    <p className="text-[11px] text-red-600 dark:text-red-400 leading-relaxed">
                      {vr.conflictReason}
                    </p>
                  )}
                  {vr.matchStatus === 'Not registered' && (
                    <p className="text-[11px] text-muted-foreground">
                      Not linked to any FALCON device yet. Register to attribute telemetry & events.
                    </p>
                  )}
                </td>

                <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                  {vr.matchStatus === 'Conflict' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!devicePermissions.canResolveVendorConflict}
                      onClick={() => setConflictTarget(vr)}
                      className="h-8 px-3 text-xs border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/10 cursor-pointer"
                    >
                      Resolve conflict
                    </Button>
                  ) : vr.matchStatus === 'Not registered' ? (
                    <Button
                      size="sm"
                      disabled={!devicePermissions.canRegisterDevice}
                      onClick={() =>
                        navigate(
                          `/assets/inventory/devices/new?vendorSerial=${encodeURIComponent(
                            vr.serial
                          )}`
                        )
                      }
                      className="h-8 px-3 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
                    >
                      <Plus className="size-3.5" />
                      <span>Register in FALCON</span>
                    </Button>
                  ) : vr.matchedFalconId ? (
                    <Link to={`/assets/inventory/devices/${encodeURIComponent(vr.matchedFalconId)}`}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2.5 text-xs gap-1 text-primary hover:bg-primary/10 cursor-pointer"
                      >
                        <span>Open device</span>
                        <ExternalLink className="size-3" />
                      </Button>
                    </Link>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Resolve Conflict Sheet */}
      <ResolveConflictSheet
        vendorRecord={conflictTarget}
        onOpenChange={(open) => {
          if (!open) setConflictTarget(null);
        }}
      />
    </div>
  );
}
