import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Copy,
  Check,
  AlertTriangle,
  ExternalLink,
  Plus,
  Radio,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ResolveConflictSheet } from '@/components/devices/ResolveConflictSheet';
import { useDevices } from '@/contexts/DevicesContext';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';
import type { VendorDeviceRecord } from '@/types/devices';

export default function VendorDiscovery() {
  const navigate = useNavigate();
  const { vendorDevices, devices, refreshDevices, isRefreshing } = useDevices();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'all' | 'Registered' | 'Not registered' | 'Conflict'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendorForConflict, setSelectedVendorForConflict] = useState<VendorDeviceRecord | null>(null);
  const [copiedSerial, setCopiedSerial] = useState<string | null>(null);

  // Status Tab Counts
  const counts = useMemo(() => {
    return {
      all: vendorDevices.length,
      Registered: vendorDevices.filter((v) => v.matchStatus === 'Registered').length,
      'Not registered': vendorDevices.filter((v) => v.matchStatus === 'Not registered').length,
      Conflict: vendorDevices.filter((v) => v.matchStatus === 'Conflict').length,
      offlineAtVendor: vendorDevices.filter((v) => v.vendorState === 'Offline at vendor').length,
    };
  }, [vendorDevices]);

  // Filtered dataset
  const filteredList = useMemo(() => {
    return vendorDevices.filter((v) => {
      if (activeTab !== 'all' && v.matchStatus !== activeTab) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const serialMatch = v.serialNumber.toLowerCase().includes(q);
        const nameMatch = v.vendorName.toLowerCase().includes(q);
        const modelMatch = v.vendorModel.toLowerCase().includes(q);
        const mappedMatch = v.mappedFalconId ? v.mappedFalconId.toLowerCase().includes(q) : false;
        if (!serialMatch && !nameMatch && !modelMatch && !mappedMatch) return false;
      }
      return true;
    });
  }, [vendorDevices, activeTab, searchQuery]);

  const handleCopy = (serial: string) => {
    navigator.clipboard.writeText(serial);
    setCopiedSerial(serial);
    setTimeout(() => setCopiedSerial(null), 1500);
  };

  const handleReload = async () => {
    await refreshDevices();
    addToast('success', 'Vendor discovery records reloaded.');
  };

  const activeFalconConflictDevice = useMemo(() => {
    if (!selectedVendorForConflict || !selectedVendorForConflict.mappedFalconId) return null;
    return (
      devices.find(
        (d) => d.identifier === selectedVendorForConflict.mappedFalconId
      ) || null
    );
  }, [selectedVendorForConflict, devices]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. Header & Breadcrumb */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => navigate('/assets/devices')}
            className="hover:text-foreground transition-colors cursor-pointer"
          >
            Falcon
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={() => navigate('/assets/devices')}
            className="hover:text-foreground transition-colors cursor-pointer"
          >
            Assets and devices
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={() => navigate('/assets/devices')}
            className="hover:text-foreground transition-colors cursor-pointer"
          >
            Devices
          </button>
          <span>/</span>
          <span className="text-foreground font-medium">Vendor discovery</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/assets/devices')}
              className="size-8 rounded-lg cursor-pointer"
              title="Back to devices"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Vendor discovery
              </h1>
              <p className="text-xs text-muted-foreground">
                Devices that the vendor holds, compared with the FALCON devices.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-xs">
              <span className="text-muted-foreground">Vendor:</span>
              <span className="font-semibold text-foreground">Hikvision</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sync Card */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Radio className="size-4.5" />
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-foreground flex items-center gap-2">
              <span>Complete vendor list from Edge.</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-normal text-emerald-500">
                <span className="size-1.5 rounded-full bg-emerald-500" /> Connected
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Last full sync <span className="text-foreground font-medium">Nov 12, 2026, 6:59 AM MYT</span> via Edge OpenAPI integration.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReload}
            disabled={isRefreshing}
            className="h-8 gap-1.5 text-xs cursor-pointer"
          >
            <RefreshCw className={cn('size-3.5', isRefreshing && 'animate-spin')} />
            <span>Reload list</span>
          </Button>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="sm"
                  disabled
                  className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground opacity-50 cursor-not-allowed"
                >
                  <RefreshCw className="size-3.5" />
                  <span>Sync now</span>
                </Button>
              }
            />
            <TooltipContent side="top">
              Edge synchronization endpoint is not available yet.
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* 3. KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={cn(
            'p-3.5 rounded-xl border text-left transition-all cursor-pointer bg-card',
            activeTab === 'all'
              ? 'border-primary ring-1 ring-primary/40 shadow-xs'
              : 'border-border hover:border-border/80'
          )}
        >
          <span className="text-[11px] font-medium text-muted-foreground block">
            Vendor devices
          </span>
          <span className="text-xl font-bold font-mono text-foreground mt-0.5 block">
            {counts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('Registered')}
          className={cn(
            'p-3.5 rounded-xl border text-left transition-all cursor-pointer bg-card',
            activeTab === 'Registered'
              ? 'border-primary ring-1 ring-primary/40 shadow-xs'
              : 'border-border hover:border-border/80'
          )}
        >
          <span className="text-[11px] font-medium text-muted-foreground block">
            Registered
          </span>
          <span className="text-xl font-bold font-mono text-emerald-500 mt-0.5 block">
            {counts.Registered}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('Not registered')}
          className={cn(
            'p-3.5 rounded-xl border text-left transition-all cursor-pointer bg-card',
            activeTab === 'Not registered'
              ? 'border-primary ring-1 ring-primary/40 shadow-xs'
              : 'border-border hover:border-border/80'
          )}
        >
          <span className="text-[11px] font-medium text-muted-foreground block">
            Not registered
          </span>
          <span className="text-xl font-bold font-mono text-foreground mt-0.5 block">
            {counts['Not registered']}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('Conflict')}
          className={cn(
            'p-3.5 rounded-xl border text-left transition-all cursor-pointer bg-card',
            activeTab === 'Conflict'
              ? 'border-rose-500 ring-1 ring-rose-500/40 shadow-xs'
              : 'border-border hover:border-border/80'
          )}
        >
          <span className="text-[11px] font-medium text-rose-500 block">
            Conflicts
          </span>
          <span className="text-xl font-bold font-mono text-rose-500 mt-0.5 block">
            {counts.Conflict}
          </span>
        </button>

        <div className="p-3.5 rounded-xl border border-border bg-card text-left">
          <span className="text-[11px] font-medium text-muted-foreground block">
            Offline at vendor
          </span>
          <span className="text-xl font-bold font-mono text-amber-500 mt-0.5 block">
            {counts.offlineAtVendor}
          </span>
        </div>
      </div>

      {/* 4. Toolbar & Status Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-3">
        <div className="flex items-center gap-1 border-b sm:border-b-0 border-border pb-2 sm:pb-0">
          {(['all', 'Registered', 'Not registered', 'Conflict'] as const).map((tab) => {
            const count = counts[tab];
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <span>{tab === 'all' ? 'All' : tab}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px] font-mono',
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search serial, name, model..."
            className="w-full h-8.5 rounded-lg border border-border bg-card pl-8.5 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* 5. Table */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Serial number</th>
                <th className="py-3 px-4">Vendor name & model</th>
                <th className="py-3 px-4">Vendor state</th>
                <th className="py-3 px-4">FALCON match</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    No vendor devices matched the selected filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((row) => {
                  const isConflict = row.matchStatus === 'Conflict';
                  const isRegistered = row.matchStatus === 'Registered';

                  return (
                    <tr
                      key={row.serialNumber}
                      className={cn(
                        'hover:bg-muted/30 transition-colors',
                        isConflict && 'bg-rose-500/5'
                      )}
                    >
                      {/* Serial Number */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-foreground">
                            {row.serialNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(row.serialNumber)}
                            className="text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Copy serial"
                          >
                            {copiedSerial === row.serialNumber ? (
                              <Check className="size-3 text-emerald-500" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Vendor name & model */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-foreground">
                          {row.vendorName}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {row.vendorModel}
                        </div>
                      </td>

                      {/* Vendor state */}
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border',
                            row.vendorState === 'Online'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : 'bg-muted text-muted-foreground border-border'
                          )}
                        >
                          <span
                            className={cn(
                              'size-1.5 rounded-full',
                              row.vendorState === 'Online' ? 'bg-emerald-500' : 'bg-slate-400'
                            )}
                          />
                          <span>{row.vendorState}</span>
                        </span>
                      </td>

                      {/* FALCON match */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div>
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border',
                                isRegistered && 'bg-primary/10 text-primary border-primary/20',
                                isConflict && 'bg-rose-500/10 text-rose-500 border-rose-500/20',
                                row.matchStatus === 'Not registered' &&
                                  'bg-muted text-muted-foreground border-border'
                              )}
                            >
                              {isConflict && <AlertTriangle className="size-3 text-rose-500" />}
                              <span>{row.matchStatus}</span>
                            </span>
                          </div>

                          <div className="text-[11px] text-muted-foreground">
                            {isRegistered && row.mappedFalconId && (
                              <button
                                type="button"
                                onClick={() => navigate(`/assets/devices/${row.mappedFalconId}`)}
                                className="font-mono font-semibold text-primary hover:underline cursor-pointer"
                              >
                                {row.mappedFalconId} (Online)
                              </button>
                            )}

                            {isConflict && (
                              <div className="flex flex-col">
                                <span className="font-mono font-bold text-foreground">
                                  {row.mappedFalconId}
                                </span>
                                <span className="text-rose-500">
                                  Mapped to another vendor device.
                                </span>
                              </div>
                            )}

                            {row.matchStatus === 'Not registered' && (
                              <span>{row.explanation}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        {isRegistered && row.mappedFalconId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/assets/devices/${row.mappedFalconId}`)}
                            className="h-7 px-2.5 text-xs gap-1 text-primary hover:text-primary cursor-pointer"
                          >
                            <span>Open device</span>
                            <ExternalLink className="size-3" />
                          </Button>
                        )}

                        {row.matchStatus === 'Not registered' && (
                          <Button
                            size="sm"
                            onClick={() => navigate(`/assets/devices/new?serial=${row.serialNumber}`)}
                            className="h-7 px-2.5 text-xs gap-1 bg-primary text-primary-foreground font-semibold cursor-pointer"
                          >
                            <Plus className="size-3" />
                            <span>Register in FALCON</span>
                          </Button>
                        )}

                        {isConflict && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setSelectedVendorForConflict(row)}
                            className="h-7 px-2.5 text-xs gap-1 font-semibold cursor-pointer shadow-xs"
                          >
                            <AlertTriangle className="size-3" />
                            <span>Resolve conflict</span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Conflict Resolution Sheet */}
      <ResolveConflictSheet
        isOpen={Boolean(selectedVendorForConflict)}
        onClose={() => setSelectedVendorForConflict(null)}
        vendorRecord={selectedVendorForConflict}
        falconDevice={activeFalconConflictDevice}
      />
    </div>
  );
}
