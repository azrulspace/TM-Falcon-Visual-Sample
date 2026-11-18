import React from 'react';
import { Info, ShieldAlert } from 'lucide-react';
import { formatAbsoluteMYT } from '@/lib/dateTime';
import type { FalconEvent } from '@/data/events';
import type { EventDetailViewModel } from '@/types/eventDetail';

export interface DetectionSpecificationCardProps {
  event: FalconEvent | EventDetailViewModel;
}

export const DetectionSpecificationCard: React.FC<DetectionSpecificationCardProps> = ({ event }) => {
  const activityType = event.type || 'Monkey near cable';
  const detectionRule = (event as any).detectionRule || (event as any).detection || 'CCTV-01-Motion Detection';

  const capturedRaw = (event as any).captured || (event as any).capturedAt;
  const capturedAbsolute = formatAbsoluteMYT(capturedRaw);

  const receivedRaw = (event as any).receivedAt || (event as any).captured;
  const receivedAbsolute = formatAbsoluteMYT(receivedRaw);

  // Observed telemetry: e.g. accelerometer, tension sensor, or not supplied
  const observedTelemetry = (event as any).observedTelemetry || (event as any).telemetryMetrics || null;

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-xs overflow-hidden select-none">
      {/* 1. Header: Unified 48px anatomy (V8) */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-4 text-primary shrink-0 stroke-[1.5]" />
          <h3 className="text-sm font-semibold text-foreground">Detection specification</h3>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4 text-xs font-sans">
        {/* Subtitle helper text placed in body (V8) */}
        <p className="text-xs text-muted-foreground font-sans">
          The detection and timestamps reported with this event.
        </p>

        {/* 2. Note Callout: "A detection is not proof of damage." (V4, V9) */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-foreground">
          <Info className="size-4 shrink-0 text-blue-400 mt-0.5 stroke-[1.5]" />
          <div className="flex flex-col gap-0.5 font-sans">
            <span className="font-semibold text-blue-400 text-xs">Note</span>
            <span className="text-xs text-muted-foreground">
              A detection is not proof of damage.
            </span>
          </div>
        </div>

        {/* 3. Two-Column List matching Staging (V3: sans labels/timestamps, mono for rule/channel) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-1">
          {/* Row 1: Type & Detection */}
          <div className="flex flex-col gap-1 pb-3 border-b border-border">
            <span className="text-xs text-muted-foreground font-normal font-sans">
              Type
            </span>
            <span className="text-xs font-semibold text-foreground font-sans">
              {activityType}
            </span>
          </div>

          <div className="flex flex-col gap-1 pb-3 border-b border-border">
            <span className="text-xs text-muted-foreground font-normal font-sans">
              Detection
            </span>
            <span className="text-xs font-mono text-foreground">
              {detectionRule}
            </span>
          </div>

          {/* Row 2: Captured & Received */}
          <div className="flex flex-col gap-1 pb-3 border-b border-border">
            <span className="text-xs text-muted-foreground font-normal font-sans">
              Captured
            </span>
            <span className="text-xs font-sans font-medium text-foreground tabular-nums">
              {capturedAbsolute}
            </span>
          </div>

          <div className="flex flex-col gap-1 pb-3 border-b border-border">
            <span className="text-xs text-muted-foreground font-normal font-sans">
              Received
            </span>
            <span className="text-xs font-sans font-medium text-foreground tabular-nums">
              {receivedAbsolute}
            </span>
          </div>

          {/* Row 3: Observed */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-normal font-sans">
              Observed
            </span>
            {observedTelemetry ? (
              <span className="text-xs text-foreground font-mono">{observedTelemetry}</span>
            ) : (
              <span className="text-xs text-muted-foreground font-sans">Not supplied</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
