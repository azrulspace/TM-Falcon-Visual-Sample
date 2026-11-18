import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { DeviceWithRelations } from '@/types/devices';
import type { PoleRecord } from '@/types/assets';
import type { FalconEvent } from '@/data/events';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatRelativeTime } from '@/lib/dateTime';
import {
  MapPin,
  Copy,
  HardDrive,
  Sparkles,
  ChevronRight,
  Activity,
  Radio,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { MapCanvas } from '@/components/MapCanvas';
import { computeUnifiedDeviceState } from '@/lib/liveCameras';

interface LiveSideColumnProps {
  camera: DeviceWithRelations;
  installedPole: PoleRecord | null;
  recentEvents: FalconEvent[];
  totalEventsCount: number;
}

export const LiveSideColumn: React.FC<LiveSideColumnProps> = ({
  camera,
  installedPole,
  recentEvents,
  totalEventsCount,
}) => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const unifiedState = computeUnifiedDeviceState(camera.lastContactAt, camera.connectivityState);

  const hasLocation = Boolean(
    installedPole?.location &&
      typeof installedPole.location.lat === 'number' &&
      typeof installedPole.location.lng === 'number'
  );

  const coordsString = hasLocation
    ? `${installedPole!.location!.lat.toFixed(5)}, ${installedPole!.location!.lng.toFixed(5)}`
    : null;

  const handleCopyCoords = () => {
    if (coordsString) {
      navigator.clipboard.writeText(coordsString);
      addToast('info', `Copied ${coordsString} to clipboard.`, 'Coordinates Copied');
    }
  };

  const renderEventThumbnail = (evt: FalconEvent) => {
    if (evt.snapshots && evt.snapshots.length > 0 && evt.snapshots[0]) {
      return (
        <img
          src={evt.snapshots[0]}
          alt={evt.type}
          className="w-12 h-9 rounded-md object-cover shrink-0 border border-border"
          loading="lazy"
        />
      );
    }
    return (
      <div
        className="w-12 h-9 rounded-md bg-muted/60 border border-border text-muted-foreground flex items-center justify-center shrink-0"
        title={evt.type}
      >
        <Activity className="size-4 stroke-[1.5]" />
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Camera Details & Location Card */}
      <Card className="border-border bg-card rounded-xl overflow-hidden shadow-none">
        <CardHeader className="h-12 px-5 py-0 flex flex-row items-center justify-between border-b border-border space-y-0">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <HardDrive className="size-4 text-primary stroke-[1.5]" />
            <span>Camera details</span>
          </CardTitle>
          <Link
            to={`/assets/inventory/devices/${encodeURIComponent(camera.identifier)}`}
            className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium"
          >
            <span>Device record</span>
            <ChevronRight className="size-3.5 stroke-[1.5]" />
          </Link>
        </CardHeader>

        {/* Top of Card 1: Map (160px embedded, solid card surface chip) */}
        {hasLocation ? (
          <div className="relative w-full h-40 bg-muted overflow-hidden border-b border-border">
            <MapCanvas
              selectedId={camera.identifier.replace('-', '_')}
              embedded={true}
              onMarkerClick={() => {}}
              basemap="satellite"
              activeLayers={{
                devices: true,
                cableRoutes: true,
                poles: true,
                cctv: true,
                sites: false,
                clusters: false,
              }}
              className="w-full h-full pointer-events-none"
            />
            {/* Solid Card Surface Label Chip */}
            <div className="absolute top-2 left-2 z-10 bg-card border border-border text-foreground text-xs font-medium px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1.5">
              <MapPin className="size-3 text-primary shrink-0 stroke-[1.5]" />
              <span className="font-mono">Pole {installedPole!.identifier}</span>
              <span className="text-border">•</span>
              <span className="text-muted-foreground">{camera.siteName || 'Teluk Panglima Garang'}</span>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-muted-foreground border-b border-border bg-muted/20">
            <span>Location not mapped (device unmounted)</span>
          </div>
        )}

        <CardContent className="p-5 text-xs flex flex-col gap-4">
          {/* Group 1: Operational & Connectivity Status (Prominent) */}
          <div className="p-3.5 rounded-lg bg-muted/30 border border-border/80 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">Operational status</span>
              <StatusBadge status={unifiedState.state} size="sm" />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Last contact</span>
              <span className="font-mono text-foreground font-medium" title={unifiedState.absoluteMYT}>
                {unifiedState.relativeTime}
              </span>
            </div>
            {unifiedState.reason && (
              <div className="text-xs text-muted-foreground/80 pt-2 border-t border-border/60">
                {unifiedState.reason}
              </div>
            )}
          </div>

          {/* Group 2: Device Specification */}
          <div className="flex flex-col">
            <div className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground/80 pb-1">
              Device specification
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-border/60 min-h-[44px]">
              <span className="text-muted-foreground">Identifier</span>
              <span className="font-mono font-medium text-foreground">{camera.identifier}</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-border/60 min-h-[44px]">
              <span className="text-muted-foreground">Model</span>
              <span className="font-medium text-foreground">{camera.model || 'Standard IP Camera'}</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-border/60 min-h-[44px]">
              <span className="text-muted-foreground">Vendor & driver</span>
              <span className="text-foreground">{camera.manufacturer || 'Hikvision'} ({camera.library || 'HIK_OpenAPI'})</span>
            </div>
          </div>

          {/* Group 3: Installation & Location */}
          <div className="flex flex-col">
            <div className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground/80 pb-1">
              Installation & location
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-border/60 min-h-[44px]">
              <span className="text-muted-foreground">Site</span>
              <span className="text-foreground">{camera.siteName || 'Teluk Panglima Garang'}</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-border/60 min-h-[44px]">
              <span className="text-muted-foreground">Installed pole</span>
              {installedPole ? (
                <Link
                  to={`/assets/poles/${encodeURIComponent(installedPole.identifier)}`}
                  className="font-mono text-primary hover:underline inline-flex items-center gap-1 font-medium"
                >
                  <span>{installedPole.identifier}</span>
                  <ChevronRight className="size-3.5 stroke-[1.5]" />
                </Link>
              ) : (
                <span className="text-muted-foreground italic">Not installed</span>
              )}
            </div>
            {coordsString && (
              <div className="flex justify-between items-center py-2.5 min-h-[44px]">
                <span className="text-muted-foreground">Coordinates</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs text-foreground">{coordsString}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyCoords}
                    className="size-8 p-0 cursor-pointer text-muted-foreground hover:text-foreground rounded-lg"
                    title="Copy coordinates"
                    aria-label="Copy coordinates"
                  >
                    <Copy className="size-3.5 stroke-[1.5]" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Recent Events Card */}
      <Card className="border-border bg-card rounded-xl overflow-hidden shadow-none">
        <CardHeader className="h-12 px-5 py-0 flex flex-row items-center justify-between border-b border-border space-y-0">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Radio className="size-4 text-primary stroke-[1.5]" />
            <span>Recent events ({recentEvents.length})</span>
          </CardTitle>
          <Link
            to={`/events?device=${encodeURIComponent(camera.identifier)}`}
            className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium"
          >
            <span>View all ({totalEventsCount})</span>
            <ChevronRight className="size-3.5 stroke-[1.5]" />
          </Link>
        </CardHeader>
        <CardContent className="p-3 space-y-1">
          {recentEvents.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No recent events recorded from this camera.
            </div>
          ) : (
            recentEvents.map((evt) => {
              const isSim = (evt as any).isSimulated || (evt as any).simulated;

              return (
                <div
                  key={evt.id}
                  onClick={() => navigate(`/events/${encodeURIComponent(evt.id)}`)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {renderEventThumbnail(evt)}
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-xs text-foreground group-hover:text-primary transition-colors truncate">
                          {evt.type}
                        </span>
                        {isSim && (
                          <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border font-medium">
                            <Sparkles className="size-3 stroke-[1.5]" />
                            Sim
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {evt.captured ? formatRelativeTime(evt.captured) : 'Recently'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-2">
                    <PriorityBadge priority={evt.priority} size="sm" />
                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5 stroke-[1.5]" />
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};
