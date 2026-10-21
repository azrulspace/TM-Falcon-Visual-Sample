import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { formatAbsoluteMYT } from '@/lib/dateTime';
import { RelativeTime } from '@/components/common/RelativeTime';
import { DeviceChip } from '@/components/common/DeviceChip';
import { AssetChip } from '@/components/common/AssetChip';
import type { FalconEvent } from '@/data/events';

export interface OverviewTabProps {
  event: FalconEvent;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ event }) => {
  const [showEmptyFields, setShowEmptyFields] = useState(false);

  // Field definitions
  const fields = [
    { label: 'Activity Type', value: event.type, isSupplied: !!event.type },
    { label: 'Detection Rule', value: event.detection, isSupplied: !!event.detection },
    { label: 'Captured Timestamp', value: <RelativeTime date={event.captured} />, isSupplied: !!event.captured },
    {
      label: 'Ingestion Timestamp (MYT)',
      value: (
        <span className="font-mono text-xs tabular-nums text-foreground">
          {formatAbsoluteMYT(event.receivedAt)}
        </span>
      ),
      isSupplied: !!event.receivedAt,
    },
    { label: 'Observed Telemetry', value: event.observed || 'Not supplied', isSupplied: !!event.observed },
    { label: 'Triggering Device', value: <DeviceChip deviceId={event.device} />, isSupplied: !!event.device },
    { label: 'Impacted Infrastructure', value: <AssetChip assetId={event.asset} />, isSupplied: !!event.asset },
    { label: 'Vendor Equipment Code', value: <span className="font-mono">{event.vendorCode || '10002'}</span>, isSupplied: !!event.vendorCode },
    { label: 'Model Confidence', value: '94.2%', isSupplied: true },
    { label: 'Dispatch Recommendation', value: event.priority === 'Critical' || event.priority === 'High' ? 'Field verification required' : 'Remote monitor', isSupplied: true },
    { label: 'Secondary Sensor Cross-Check', value: 'Not supplied', isSupplied: false },
    { label: 'Acoustic Signature', value: 'Not supplied', isSupplied: false },
    { label: 'Optical Path Loss dB', value: 'Not supplied', isSupplied: false },
  ];

  const visibleFields = showEmptyFields ? fields : fields.filter((f) => f.isSupplied);

  return (
    <div className="flex flex-col gap-4 p-5 rounded-xl border border-border bg-card shadow-xs">
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

      {/* 2-Column Definition List */}
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-xs">
        {visibleFields.map((field, idx) => (
          <div
            key={idx}
            className="flex flex-col gap-1 p-2.5 rounded-lg bg-muted/20 border border-border/50 transition-colors hover:bg-muted/40"
          >
            <dt className="text-[11px] font-medium text-muted-foreground">
              {field.label}
            </dt>
            <dd className="font-medium text-foreground text-xs break-words">
              {field.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};
