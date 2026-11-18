import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { DeviceWithRelations } from '@/types/devices';
import type { PoleRecord } from '@/types/assets';
import type { FalconEvent } from '@/data/events';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatRelativeTime, formatAbsoluteMYT } from '@/lib/dateTime';
import {
  ExternalLink,
  MapPin,
  Radio,
  Copy,
  HardDrive,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { MapCanvas } from '@/components/MapCanvas';

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

  const isOnline = camera.connectivityState === 'online';
  const isStale = camera.connectivityState === 'stale';

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

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Camera Info Card */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="py-3 px-4 border-b border-border/60">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <HardDrive className="size-3.5 text-primary" />
              Camera Details
            </CardTitle>
            <Link
              to={`/assets/inventory/devices/${encodeURIComponent(camera.identifier)}`}
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>Device record</span>
              <ExternalLink className="size-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-2.5 text-xs">
          <div className="flex justify-between items-center py-0.5 border-b border-border/40">
            <span className="text-muted-foreground">Identifier</span>
            <span className="font-mono font-bold text-foreground">{camera.identifier}</span>
          </div>

          <div className="flex justify-between items-center py-0.5 border-b border-border/40">
            <span className="text-muted-foreground">Model</span>
            <span className="font-medium text-foreground">{camera.model || 'Standard IP Camera'}</span>
          </div>

          <div className="flex justify-between items-center py-0.5 border-b border-border/40">
            <span className="text-muted-foreground">Vendor / Driver</span>
            <span className="text-foreground">{camera.manufacturer || 'Hikvision'} ({camera.library || 'HIK_OpenAPI'})</span>
          </div>

          <div className="flex justify-between items-center py-0.5 border-b border-border/40">
            <span className="text-muted-foreground">Connectivity</span>
            <div className="flex items-center gap-1.5">
              <span
                className={`size-2 rounded-full ${
                  isOnline ? 'bg-emerald-500' : isStale ? 'bg-amber-500' : 'bg-rose-500'
                }`}
              />
              <span className="capitalize font-medium text-foreground">{camera.connectivityState}</span>
            </div>
          </div>

          <div className="flex justify-between items-center py-0.5 border-b border-border/40">
            <span className="text-muted-foreground">Last Contact</span>
            <span
              className="text-foreground cursor-help"
              title={camera.lastContactAt ? formatAbsoluteMYT(camera.lastContactAt) : 'Never'}
            >
              {camera.lastContactAt ? formatRelativeTime(camera.lastContactAt) : 'Never'}
            </span>
          </div>

          <div className="flex justify-between items-center py-0.5 border-b border-border/40">
            <span className="text-muted-foreground">Installed Pole</span>
            {installedPole ? (
              <Link
                to={`/assets/poles/${encodeURIComponent(installedPole.identifier)}`}
                className="font-mono text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>{installedPole.identifier}</span>
                <ExternalLink className="size-2.5" />
              </Link>
            ) : (
              <span className="text-muted-foreground italic">Not installed</span>
            )}
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-muted-foreground">Site</span>
            <span className="text-foreground">{camera.siteName || 'Teluk Panglima Garang'}</span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Recent Events Card */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="py-3 px-4 border-b border-border/60">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Radio className="size-3.5 text-primary" />
              Recent Detections ({recentEvents.length})
            </CardTitle>
            <Link
              to={`/events?device=${encodeURIComponent(camera.identifier)}`}
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>View all ({totalEventsCount})</span>
              <ExternalLink className="size-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-2 space-y-1">
          {recentEvents.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No recent detections recorded from this camera.
            </div>
          ) : (
            recentEvents.map((evt) => {
              const isSim = (evt as any).isSimulated || (evt as any).simulated;
              const priority = (evt.priority || 'medium').toLowerCase();

              return (
                <div
                  key={evt.id}
                  onClick={() => navigate(`/events/${encodeURIComponent(evt.id)}`)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src="/monkey-fiber.jpg"
                      alt={evt.type}
                      className="size-9 rounded object-cover shrink-0 border border-border"
                    />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-xs text-foreground group-hover:text-primary transition-colors truncate">
                          {evt.type}
                        </span>
                        {isSim && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] px-1 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
                            <Sparkles className="size-2.5" />
                            Sim
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {evt.captured ? formatRelativeTime(evt.captured) : 'Recently'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pl-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 capitalize ${
                        priority === 'critical'
                          ? 'border-rose-500/30 text-rose-500 bg-rose-500/10'
                          : priority === 'high'
                          ? 'border-amber-500/30 text-amber-500 bg-amber-500/10'
                          : 'border-blue-500/30 text-blue-500 bg-blue-500/10'
                      }`}
                    >
                      {evt.priority || 'Medium'}
                    </Badge>
                    <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* 3. Location Mini Map Card */}
      <Card className="border-border bg-card shadow-xs overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-border/60">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="size-3.5 text-primary" />
              Camera Location
            </CardTitle>
            {installedPole && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/overview?pole=${encodeURIComponent(installedPole.identifier)}`)}
                className="h-6 px-2 text-[11px] text-primary hover:underline p-0"
              >
                Open Overview
                <ExternalLink className="size-2.5 ml-1" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {hasLocation ? (
            <div className="flex flex-col">
              <div className="relative w-full h-48 bg-slate-950 overflow-hidden">
                <MapCanvas
                  selectedId={camera.identifier.replace('-', '_')}
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
                <div className="absolute top-2 left-2 z-10 bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded border border-white/10">
                  Pole {installedPole!.identifier}
                </div>
              </div>

              {/* Coordinates bar with copy button */}
              <div className="p-3 bg-muted/20 border-t border-border flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-muted-foreground">
                  {coordsString}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyCoords}
                  className="h-7 px-2 text-xs gap-1"
                >
                  <Copy className="size-3" />
                  <span>Copy</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-muted-foreground space-y-1">
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
