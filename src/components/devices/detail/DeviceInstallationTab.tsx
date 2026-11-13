import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  MapPinOff,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatAbsoluteMYT } from '@/lib/dateTime';
import type { DeviceRecord } from '@/types/devices';

export interface DeviceInstallationTabProps {
  device: DeviceRecord;
  onManageInstallation: () => void;
}

export const DeviceInstallationTab: React.FC<DeviceInstallationTabProps> = ({
  device,
  onManageInstallation,
}) => {
  const navigate = useNavigate();
  const isMounted = Boolean(device.installedOnPoleId);
  const history = device.installationHistory || [];

  return (
    <div className="space-y-6 select-none">
      {/* 1. Current Deployment Card */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Current Pole Deployment
            </span>
            {isMounted ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Active Mount
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                Unmounted
              </span>
            )}
          </div>

          <Button
            size="sm"
            onClick={onManageInstallation}
            className="h-8 gap-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
          >
            <MapPin className="size-3.5" />
            <span>Manage installation</span>
          </Button>
        </div>

        {isMounted ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                Mounted on Pole
              </span>
              <button
                type="button"
                onClick={() => navigate(`/assets/poles/${device.installedOnPoleId}`)}
                className="font-mono text-base font-bold text-primary hover:underline flex items-center gap-1 mt-0.5 cursor-pointer"
              >
                <span>{device.installedOnPoleId}</span>
                <ExternalLink className="size-3.5" />
              </button>
            </div>

            <div>
              <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                Site
              </span>
              <span className="font-medium text-foreground block mt-1">
                {device.siteName}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                Deployment Date
              </span>
              <span className="text-muted-foreground block mt-1 font-mono">
                {history.length > 0 && history[0].from
                  ? formatAbsoluteMYT(history[0].from)
                  : 'Nov 3, 2026, 3:33 PM MYT'}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                Installed By
              </span>
              <span className="text-foreground block mt-1">
                {history.length > 0 && history[0].installedBy
                  ? history[0].installedBy
                  : 'Field Technician'}
              </span>
            </div>
          </div>
        ) : (
          <div className="py-6 px-4 text-center space-y-3 bg-muted/20 rounded-lg border border-dashed border-border">
            <MapPinOff className="size-8 text-amber-500 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-foreground">
                Device is currently not mounted on any pole
              </h4>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                Select a physical pole on {device.siteName || 'the site'} to assign telemetry coordinates and field assets.
              </p>
            </div>
            <Button
              size="sm"
              onClick={onManageInstallation}
              className="h-8 gap-1.5 text-xs font-semibold bg-primary text-primary-foreground cursor-pointer shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>Install on pole</span>
            </Button>
          </div>
        )}
      </div>

      {/* 2. Historical Pole Deployments Table */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-border/80 pb-2">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Pole Deployment History
          </h3>
          <span className="text-[11px] font-mono text-muted-foreground">
            {history.length} deployment records
          </span>
        </div>

        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Pole ID</th>
                <th className="py-2.5 px-3">Site</th>
                <th className="py-2.5 px-3">Mounted from (MYT)</th>
                <th className="py-2.5 px-3">Mounted to (MYT)</th>
                <th className="py-2.5 px-3">Installed by</th>
                <th className="py-2.5 px-3">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-mono">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground font-sans">
                    No historical pole records recorded yet.
                  </td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr key={h.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/assets/poles/${h.poleId}`)}
                        className="font-bold text-primary hover:underline cursor-pointer"
                      >
                        {h.poleId}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-foreground">
                      {device.siteName}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {formatAbsoluteMYT(h.from)}
                    </td>
                    <td className="py-2.5 px-3">
                      {h.to ? (
                        <span className="text-muted-foreground">{formatAbsoluteMYT(h.to)}</span>
                      ) : (
                        <strong className="text-emerald-500 font-sans font-bold">Current</strong>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-foreground">
                      {h.installedBy}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-muted-foreground">
                      {h.note || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
