import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { DeviceWithRelations } from '@/types/devices';
import type { PoleRecord } from '@/types/assets';
import type { FalconEvent } from '@/data/events';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/dateTime';
import {
  ExternalLink,
  MapPin,
  Radio,
  Copy,
  HardDrive,
  Sparkles,
  ChevronRight,
  Trees,
  ShieldAlert,
  Compass,
  Truck,
  Wrench,
  Activity,
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
    const typeLower = (evt.type || '').toLowerCase();
    if (typeLower.includes('wildlife') || typeLower.includes('animal') || typeLower.includes('monkey')) {
      return (
        <img
          src="/monkey-fiber.jpg"
          alt={evt.type}
          className="size-9 rounded object-cover shrink-0 border border-border"
        />
      );
    }
    if (typeLower.includes('vegetation') || typeLower.includes('tree') || typeLower.includes('branch')) {
      return (
        <div className="size-9 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0" title={evt.type}>
          <Trees className="size-4" />
        </div>
      );
    }
    if (typeLower.includes('vandalism') || typeLower.includes('intrusion') || typeLower.includes('theft')) {
      return (
        <div className="size-9 rounded bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0" title={evt.type}>
          <ShieldAlert className="size-4" />
        </div>
      );
    }
    if (typeLower.includes('tilt') || typeLower.includes('lean') || typeLower.includes('structural')) {
      return (
        <div className="size-9 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0" title={evt.type}>
          <Compass className="size-4" />
        </div>
      );
    }
    if (typeLower.includes('vehicle') || typeLower.includes('overheight') || typeLower.includes('truck')) {
      return (
        <div className="size-9 rounded bg-sky-500/10 border border-sky-500/20 text-sky-500 flex items-center justify-center shrink-0" title={evt.type}>
          <Truck className="size-4" />
        </div>
      );
    }
    if (typeLower.includes('fault') || typeLower.includes('sensor') || typeLower.includes('camera') || typeLower.includes('hardware')) {
      return (
        <div className="size-9 rounded bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center shrink-0" title={evt.type}>
          <Wrench className="size-4" />
        </div>
      );
    }
    return (
      <div className="size-9 rounded bg-muted border border-border text-muted-foreground flex items-center justify-center shrink-0" title={evt.type}>
        <Activity className="size-4" />
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Camera Info Card */}
      <Card className="border-border bg-card shadow-xs rounded-xl overflow-hidden">
        <CardHeader className="h-12 px-5 py-0 flex flex-row items-center justify-between border-b border-border space-y-0">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <HardDrive className="size-4 text-primary" />
            <span>Camera details</span>
          </CardTitle>
          <Link
            to={`/assets/inventory/devices/${encodeURIComponent(camera.identifier)}`}
            className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium"
          >
            <span>Device record</span>
            <ExternalLink className="size-3" />
          </Link>
        </CardHeader>
        <CardContent className="p-5 text-xs divide-y divide-border">
          <div className="flex justify-between items-center py-2.5 first:pt-0">
            <span className="text-muted-foreground">Identifier</span>
            <span className="font-mono font-semibold text-foreground">{camera.identifier}</span>
          </div>

          <div className="flex justify-between items-center py-2.5">
            <span className="text-muted-foreground">Model</span>
            <span className="font-medium text-foreground">{camera.model || 'Standard IP Camera'}</span>
          </div>

          <div className="flex justify-between items-center py-2.5">
            <span className="text-muted-foreground">Vendor / Driver</span>
            <span className="text-foreground">{camera.manufacturer || 'Hikvision'} ({camera.library || 'HIK_OpenAPI'})</span>
          </div>

          <div className="flex justify-between items-center py-2.5">
            <span className="text-muted-foreground">Connectivity</span>
            <div className="flex items-center gap-2" title={unifiedState.reason}>
              <span
                className={`size-2 rounded-full ${
                  unifiedState.state === 'online'
                    ? 'bg-emerald-500'
                    : unifiedState.state === 'stale'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              />
              <span className="capitalize font-medium text-foreground">{unifiedState.state}</span>
            </div>
          </div>

          <div className="flex justify-between items-center py-2.5">
            <span className="text-muted-foreground">Last Contact</span>
            <span
              className="text-foreground cursor-help"
              title={unifiedState.absoluteMYT}
            >
              {unifiedState.relativeTime}
            </span>
          </div>

          <div className="flex justify-between items-center py-2.5">
            <span className="text-muted-foreground">Installed Pole</span>
            {installedPole ? (
              <Link
                to={`/assets/poles/${encodeURIComponent(installedPole.identifier)}`}
                className="font-mono text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>{installedPole.identifier}</span>
                <ExternalLink className="size-3" />
              </Link>
            ) : (
              <span className="text-muted-foreground italic">Not installed</span>
            )}
          </div>

          <div className="flex justify-between items-center py-2.5 last:pb-0">
            <span className="text-muted-foreground">Site</span>
            <span className="text-foreground">{camera.siteName || 'Teluk Panglima Garang'}</span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Recent Events Card */}
      <Card className="border-border bg-card shadow-xs rounded-xl overflow-hidden">
        <CardHeader className="h-12 px-5 py-0 flex flex-row items-center justify-between border-b border-border space-y-0">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Radio className="size-4 text-primary" />
            <span>Recent events ({recentEvents.length})</span>
          </CardTitle>
          <Link
            to={`/events?device=${encodeURIComponent(camera.identifier)}`}
            className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium"
          >
            <span>View all ({totalEventsCount})</span>
            <ExternalLink className="size-3" />
          </Link>
        </CardHeader>
        <CardContent className="p-2 space-y-1 divide-y divide-border">
          {recentEvents.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No recent events recorded from this camera.
            </div>
          ) : (
            recentEvents.map((evt) => {
              const isSim = (evt as any).isSimulated || (evt as any).simulated;
              const priority = (evt.priority || 'medium').toLowerCase();

              return (
                <div
                  key={evt.id}
                  onClick={() => navigate(`/events/${encodeURIComponent(evt.id)}`)}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {renderEventThumbnail(evt)}
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-xs text-foreground group-hover:text-primary transition-colors truncate">
                          {evt.type}
                        </span>
                        {isSim && (
                          <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
                            <Sparkles className="size-3" />
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
                    <Badge
                      variant="outline"
                      className={`text-xs px-2 py-0.5 capitalize font-medium ${
                        priority === 'critical'
                          ? 'border-rose-500/30 text-rose-500 bg-rose-500/10'
                          : priority === 'high'
                          ? 'border-amber-500/30 text-amber-500 bg-amber-500/10'
                          : 'border-blue-500/30 text-blue-500 bg-blue-500/10'
                      }`}
                    >
                      {evt.priority || 'Medium'}
                    </Badge>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* 3. Location Mini Map Card */}
      <Card className="border-border bg-card shadow-xs rounded-xl overflow-hidden">
        <CardHeader className="h-12 px-5 py-0 flex flex-row items-center justify-between border-b border-border space-y-0">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MapPin className="size-4 text-primary" />
            <span>Camera location</span>
          </CardTitle>
          {installedPole && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/overview?pole=${encodeURIComponent(installedPole.identifier)}`)}
              className="h-7 px-2 text-xs text-primary hover:underline p-0"
            >
              Open overview
              <ExternalLink className="size-3 ml-1" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {hasLocation ? (
            <div className="flex flex-col">
              <div className="relative w-full h-48 bg-muted overflow-hidden">
                <MapCanvas
                  selectedId={installedPole ? installedPole.identifier : camera.identifier.replace('-', '_')}
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
                <div className="absolute top-2 left-2 z-10 bg-black/80 backdrop-blur-xs text-white text-xs font-mono px-2.5 py-1 rounded-md border border-white/15 shadow-sm flex items-center gap-1.5">
                  <MapPin className="size-3 text-primary shrink-0" />
                  <span>Pole {installedPole!.identifier}</span>
                  <span className="text-white/40">•</span>
                  <span className="text-white/80 font-sans">{camera.siteName || 'Teluk Panglima Garang'}</span>
                </div>
              </div>

              {/* Coordinates bar with copy button */}
              <div className="h-11 px-5 bg-muted/30 border-t border-border flex items-center justify-between text-xs">
                <span className="font-mono text-xs text-muted-foreground">
                  {coordsString}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyCoords}
                  className="h-8 px-2 text-xs gap-1.5 cursor-pointer"
                >
                  <Copy className="size-3.5" />
                  <span>Copy</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
              <MapPin className="size-6 text-muted-foreground/40 mx-auto mb-2" />
              <div className="font-medium text-foreground">Location not available</div>
              <div>This device is not mounted on a physical pole with GPS coordinates.</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
