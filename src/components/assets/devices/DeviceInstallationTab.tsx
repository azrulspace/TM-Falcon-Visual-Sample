import React from 'react';
import { Link } from 'react-router-dom';
import {
  Link2,
  MapPin,
  Unplug,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatAbsoluteMYT } from '@/lib/dateTime';
import { formatCoordinates } from '@/lib/geo';
import type { DeviceWithRelations } from '@/types/devices';
import type { DevicePermissions } from '@/lib/permissions';

export interface DeviceInstallationTabProps {
  device: DeviceWithRelations;
  permissions: DevicePermissions;
  onOpenManageInstallation: () => void;
}

export const DeviceInstallationTab: React.FC<DeviceInstallationTabProps> = ({
  device,
  permissions,
  onOpenManageInstallation,
}) => {
  return (
    <div className="space-y-4">
      {/* Current Installation Card */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Link2 className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Current physical mounting</h2>
          </div>

          {permissions.canManageInstallation && (
            <Button
              size="sm"
              variant={device.isInstalled ? 'outline' : 'default'}
              onClick={onOpenManageInstallation}
              className="h-8 px-3 text-xs gap-1.5 cursor-pointer"
            >
              <Link2 className="size-3.5" />
              <span>{device.isInstalled ? 'Change pole or uninstall' : 'Install on a pole'}</span>
            </Button>
          )}
        </div>

        {device.isInstalled ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
            <div>
              <span className="text-[11px] text-muted-foreground block">Pole identifier</span>
              <Link
                to={`/assets/poles/${encodeURIComponent(device.installedPoleId!)}`}
                className="font-mono text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1 mt-0.5"
              >
                <MapPin className="size-3.5" />
                <span>{device.installedPoleId}</span>
                <ExternalLink className="size-3" />
              </Link>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Site & coordinates</span>
              <div className="font-medium text-foreground mt-0.5">
                {device.installedPoleSiteName || device.siteName || 'Unassigned'}
              </div>
              <div className="font-mono text-[11px] text-muted-foreground">
                {formatCoordinates(device.location)}
              </div>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Connected cable spans</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {device.poleSpans.length > 0 ? (
                  device.poleSpans.map((sp) => (
                    <span
                      key={sp.identifier}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted border border-border font-mono text-[11px] text-foreground"
                    >
                      <Layers className="size-3 text-sky-400" />
                      {sp.identifier}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground">No spans connected</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-5 pb-2 text-center space-y-2">
            <Unplug className="size-7 text-muted-foreground/70 mx-auto" />
            <div className="text-xs font-semibold text-foreground">Not currently installed</div>
            <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
              Mount this device onto a site pole so its coordinates appear on the Operations map and cable-span events inherit the pole location.
            </p>
          </div>
        )}
      </section>

      {/* Historical Mounting Records */}
      <section className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/20 text-xs font-semibold text-foreground">
          Installation history ({device.installationHistory.length})
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-4 font-semibold">Pole</th>
                <th className="py-2.5 px-4 font-semibold">Site</th>
                <th className="py-2.5 px-4 font-semibold">From</th>
                <th className="py-2.5 px-4 font-semibold">To</th>
                <th className="py-2.5 px-4 font-semibold">Recorded by</th>
                <th className="py-2.5 px-4 font-semibold">Note / reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {device.installationHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No prior installation assignments recorded.
                  </td>
                </tr>
              ) : (
                device.installationHistory.map((h) => (
                  <tr key={h.id} className="hover:bg-muted/30">
                    <td className="py-2.5 px-4">
                      <Link
                        to={`/assets/poles/${encodeURIComponent(h.poleIdentifier)}`}
                        className="font-mono font-semibold text-primary hover:underline"
                      >
                        {h.poleIdentifier}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4 text-foreground">{h.siteName}</td>
                    <td className="py-2.5 px-4 font-mono text-foreground whitespace-nowrap">
                      {formatAbsoluteMYT(h.from, { showSeconds: false })}
                    </td>
                    <td className="py-2.5 px-4 font-mono whitespace-nowrap">
                      {h.to ? (
                        formatAbsoluteMYT(h.to, { showSeconds: false })
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                          Current
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-muted-foreground">{h.actor}</td>
                    <td className="py-2.5 px-4 text-muted-foreground">
                      {h.uninstallReason ? `Removed: ${h.uninstallReason}` : h.note || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

