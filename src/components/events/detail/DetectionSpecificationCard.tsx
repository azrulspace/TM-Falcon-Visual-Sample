import React from 'react';
import { Info } from 'lucide-react';
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
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      {/* 1. Header (Title & Exact Staging Subtitle) */}
      <div className="p-4 sm:p-5 border-b border-border bg-muted/20 flex flex-col gap-1">
        <h2 className="text-base font-bold text-foreground">Detection specification</h2>
        <p className="text-xs text-muted-foreground">
          The detection and timestamps reported with this event.
        </p>
      </div>

      <div className="p-4 sm:p-5 flex flex-col gap-5 text-xs">
        {/* 2. Note Callout: "A detection is not proof of damage." (Section 6.4) */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-foreground">
          <Info className="size-4 shrink-0 text-blue-500 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-blue-500 text-xs">Note</span>
            <span className="text-xs text-muted-foreground">
              A detection is not proof of damage.
            </span>
          </div>
        </div>

        {/* 3. Two-Column List matching Staging Screenshot 4 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-1">
          {/* Row 1: Type & Detection */}
          <div className="flex flex-col gap-1 pb-3 border-b border-border">
            <span className="text-[11px] font-mono text-muted-foreground">
              Type
            </span>
            <span className="text-xs font-semibold text-foreground">
              {activityType}
            </span>
          </div>

          <div className="flex flex-col gap-1 pb-3 border-b border-border">
            <span className="text-[11px] font-mono text-muted-foreground">
              Detection
            </span>
            <span className="text-xs font-mono text-foreground">
              {detectionRule}
            </span>
          </div>

          {/* Row 2: Captured & Received */}
          <div className="flex flex-col gap-1 pb-3 border-b border-border">
            <span className="text-[11px] font-mono text-muted-foreground">
              Captured
            </span>
            <span className="text-xs font-mono text-foreground">
              {capturedAbsolute}
            </span>
          </div>

          <div className="flex flex-col gap-1 pb-3 border-b border-border">
            <span className="text-[11px] font-mono text-muted-foreground">
              Received
            </span>
            <span className="text-xs font-mono text-foreground">
              {receivedAbsolute}
            </span>
          </div>

          {/* Row 3: Observed */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-mono text-muted-foreground">
              Observed
            </span>
            {observedTelemetry ? (
              <span className="text-xs text-foreground font-mono">{observedTelemetry}</span>
            ) : (
              <span className="text-xs text-muted-foreground">Not supplied</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
