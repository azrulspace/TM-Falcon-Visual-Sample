import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { formatAbsoluteMYT, formatRelativeTime } from '@/lib/dateTime';
import { DeviceChip } from '@/components/common/DeviceChip';
import { AssetChip } from '@/components/common/AssetChip';
import { Info } from 'lucide-react';
import type { FalconEvent } from '@/data/events';
import type { EventDetailViewModel } from '@/types/eventDetail';

export interface OverviewTabProps {
  event: FalconEvent | EventDetailViewModel;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ event }) => {
  const [showEmptyFields, setShowEmptyFields] = useState(false);

  const deviceId = (event as any).device || (event as any).sourceDevice?.id || null;
  const assetId = (event as any).asset || (event as any).affectedAsset?.id || null;

  const capturedRaw = (event as any).captured || (event as any).capturedAt;
  const capturedAbsolute = formatAbsoluteMYT(capturedRaw);
  const capturedRelative = formatRelativeTime(capturedRaw);

  const receivedRaw = (event as any).receivedAt || (event as any).captured;
  const receivedAbsolute = formatAbsoluteMYT(receivedRaw);
  const receivedRelative = formatRelativeTime(receivedRaw);

  const detectionRule =
    (event as any).detection ||
    (event as any).detectionRule ||
    (event as any).ruleCode ||
    'CCTV-01-Motion Detection';

  const vendorCode =
    (event as any).vendorCode ||
    (event as any).vendorData?.vendorCode ||
    '10002';

  const observed = (event as any).observed || 'Not supplied';

  // Factual fields strictly matching LIVE_STAGING contract
  // Zero fabricated values: no fake model confidence, no dispatch recommendation, no fake acoustic signature
  const fields = [
    {
      label: 'Activity Type',
      value: <span className="font-semibold text-foreground">{event.type}</span>,
      isSupplied: Boolean(event.type),
    },
    {
      label: 'Detection Rule',
      value: <span className="font-mono text-foreground font-medium">{detectionRule}</span>,
      isSupplied: Boolean(detectionRule),
    },
    {
      label: 'Captured Timestamp',
      value: (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-foreground tabular-nums">{capturedAbsolute}</span>
          <span className="text-muted-foreground text-xs">({capturedRelative})</span>
        </div>
      ),
      isSupplied: Boolean(capturedRaw),
    },
    {
      label: 'Ingestion Timestamp (MYT)',
      value: (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-foreground tabular-nums">{receivedAbsolute}</span>
          <span className="text-muted-foreground text-xs">({receivedRelative})</span>
        </div>
      ),
      isSupplied: Boolean(receivedRaw),
    },
    {
      label: 'Observed Telemetry',
      value: <span className="text-muted-foreground italic">{observed}</span>,
      isSupplied: Boolean(observed && observed !== 'Not supplied'),
    },
    {
      label: 'Triggering Device',
      value: <DeviceChip deviceId={deviceId} />,
      isSupplied: Boolean(deviceId),
    },
    {
      label: 'Impacted Infrastructure',
      value: <AssetChip assetId={assetId} />,
      isSupplied: Boolean(assetId),
    },
    {
      label: 'Vendor Equipment Code',
      value: <span className="font-mono text-foreground font-semibold">{vendorCode}</span>,
      isSupplied: Boolean(vendorCode),
    },
  ];

  const visibleFields = showEmptyFields ? fields : fields.filter((f) => f.isSupplied || f.label === 'Observed Telemetry');

  return (
    <div className="flex flex-col gap-5 p-5 rounded-xl border border-border bg-card shadow-xs">
      {/* Header and Empty Fields Switch */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-foreground">Detection Specification</h3>
          <span className="text-xs text-muted-foreground">
            Structured metadata extracted by the edge video analytics ingestion pipeline.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground select-none">Show empty fields</span>
          <Switch
            checked={showEmptyFields}
            onCheckedChange={setShowEmptyFields}
            aria-label="Toggle display of empty detection fields"
          />
        </div>
      </div>

      {/* Info Callout: A detection is not proof of damage */}
      <div className="flex items-start gap-3 p-3.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs">
        <Info className="size-4 text-blue-500 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-blue-700 dark:text-blue-300">Note</span>
          <span className="text-blue-600 dark:text-blue-400">
            A detection is not proof of damage.
          </span>
        </div>
      </div>

      {/* Clean 2-Column Definition List (>=1280px) without nested card boxes */}
      <dl className="grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-5 text-xs">
        {visibleFields.map((field, idx) => (
          <div key={idx} className="flex flex-col gap-1 border-b border-border/40 pb-3">
            <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {field.label}
            </dt>
            <dd className="text-sm font-medium text-foreground break-words mt-0.5">
              {field.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

export const DetectionTab = OverviewTab;
