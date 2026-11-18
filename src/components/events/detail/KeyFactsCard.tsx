import React, { useState } from 'react';
import { DeviceChip } from '@/components/common/DeviceChip';
import { AssetChip } from '@/components/common/AssetChip';
import { formatAbsoluteMYT, formatRelativeTime } from '@/lib/dateTime';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Info, UserX, Search, Check } from 'lucide-react';
import { useEvents } from '@/contexts/EventsContext';
import { useToast } from '@/contexts/ToastContext';
import { formatId } from '@/lib/utils';
import type { FalconEvent } from '@/data/events';
import type { EventDetailViewModel } from '@/types/eventDetail';

export interface KeyFactsCardProps {
  event: FalconEvent | EventDetailViewModel;
  onOpenCreateCase: () => void;
  onOpenAssign?: () => void;
}

const ANALYSTS = [
  { name: 'Farah Zulkifli', role: 'Patrol Team Lead', avatar: 'FZ', status: 'Online' },
  { name: 'Haris Danial', role: 'Field Operations Specialist', avatar: 'HD', status: 'In Field' },
  { name: 'Siti Aminah', role: 'CCTV Triage Analyst', avatar: 'SA', status: 'Online' },
  { name: 'Azman Ali', role: 'Fiber Infrastructure Engineer', avatar: 'AA', status: 'Online' },
  { name: 'Nurul Huda', role: 'Physical Security Ops', avatar: 'NH', status: 'On Duty' },
];

export const KeyFactsCard: React.FC<KeyFactsCardProps> = ({
  event,
  onOpenCreateCase,
}) => {
  const { assignEvent } = useEvents();
  const { addToast } = useToast();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const deviceId = (event as any).device || (event as any).sourceDevice?.id || 'DEV-001';
  const assetId = (event as any).asset || (event as any).affectedAsset?.id || 'CBL-001';

  const capturedRaw = (event as any).captured || (event as any).capturedAt;
  const capturedAbsolute = formatAbsoluteMYT(capturedRaw);
  const capturedRelative = (event as any).capturedRelative || formatRelativeTime(capturedRaw);

  const receivedRaw = (event as any).receivedAt || (event as any).ingestedAt || (event as any).captured;
  const receivedAbsolute = receivedRaw ? formatAbsoluteMYT(receivedRaw) : null;
  const receivedRelative = receivedRaw ? ((event as any).receivedRelative || formatRelativeTime(receivedRaw)) : null;

  // Staging capability: only show assignee if explicitly present on event record
  const hasAssigneeCapability = Boolean((event as any).assignee || (event as any).hasAssignee);
  const currentAssignee = event.assignee || null;

  const filteredAnalysts = ANALYSTS.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAssignee = (name: string) => {
    assignEvent(event.id, name);
    addToast('success', `Assigned event ${formatId(event.id)} to ${name}`);
    setPopoverOpen(false);
    setSearchQuery('');
  };

  const handleUnassign = () => {
    assignEvent(event.id, '');
    addToast('info', `Unassigned analyst from event ${formatId(event.id)}`);
    setPopoverOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-xs overflow-hidden select-none">
      {/* 1. Header: Unified 48px anatomy (V8) */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <Info className="size-4 text-primary shrink-0 stroke-[1.5]" />
          <h3 className="text-sm font-semibold text-foreground">Key operational facts</h3>
        </div>
      </div>

      {/* 2. Facts Rows (V18: 44px height, 1px divider, label left tertiary, value right primary, sans timestamps) */}
      <div className="p-5 flex flex-col text-xs font-sans">
        {/* Source Device */}
        <div className="flex items-center justify-between min-h-[44px] py-2 border-b border-border">
          <span className="text-xs text-muted-foreground font-normal">Source device</span>
          <DeviceChip deviceId={deviceId} />
        </div>

        {/* Affected Asset */}
        <div className="flex items-center justify-between min-h-[44px] py-2 border-b border-border">
          <span className="text-xs text-muted-foreground font-normal">Affected asset</span>
          <AssetChip assetId={assetId} />
        </div>

        {/* Operational Case (V6: Header is sole primary button; row shows text link) */}
        <div className="flex items-center justify-between min-h-[44px] py-2 border-b border-border">
          <span className="text-xs text-muted-foreground font-normal">Case</span>
          {event.caseId ? (
            <span className="font-mono text-xs font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              {event.caseId}
            </span>
          ) : (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">No case</span>
              <span className="text-muted-foreground/60">·</span>
              <button
                type="button"
                onClick={onOpenCreateCase}
                className="text-primary hover:underline font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-xs"
              >
                Create case
              </button>
            </div>
          )}
        </div>

        {/* Captured Timestamp (V3: sans with tabular figures; V4: Fog neutral labels) */}
        <div className="flex items-center justify-between min-h-[44px] py-2 border-b border-border">
          <span className="text-xs text-muted-foreground font-normal">Captured</span>
          <div className="flex items-center gap-1.5 text-right font-sans">
            <span className="text-xs font-medium text-foreground tabular-nums" title={capturedAbsolute}>
              {capturedAbsolute}
            </span>
            <span className="text-xs text-muted-foreground">({capturedRelative})</span>
          </div>
        </div>

        {/* Ingested Timestamp */}
        {receivedAbsolute && (
          <div className="flex items-center justify-between min-h-[44px] py-2 border-b border-border last:border-b-0">
            <span className="text-xs text-muted-foreground font-normal">Ingested</span>
            <div className="flex items-center gap-1.5 text-right font-sans">
              <span className="text-xs font-medium text-foreground tabular-nums" title={receivedAbsolute}>
                {receivedAbsolute}
              </span>
              <span className="text-xs text-muted-foreground">({receivedRelative})</span>
            </div>
          </div>
        )}

        {/* Assignee (Shown only when capability/field exists) */}
        {hasAssigneeCapability && (
          <div className="flex items-center justify-between min-h-[44px] py-2 last:border-b-0">
            <span className="text-xs text-muted-foreground font-normal">Assigned analyst</span>
            <div className="flex items-center gap-1.5">
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger
                  render={
                    <button
                      type="button"
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-muted text-foreground transition-colors cursor-pointer text-xs border border-border"
                      title="Assign analyst"
                    >
                      {currentAssignee ? (
                        <div className="flex items-center gap-1.5 font-medium">
                          <span className="size-2 rounded-full bg-emerald-500" />
                          <span>{currentAssignee}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </button>
                  }
                />
                <PopoverContent align="end" className="w-64 p-2 bg-card border-border shadow-md">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 px-2 py-1 bg-muted/40 rounded border border-border">
                      <Search className="size-3.5 text-muted-foreground stroke-[1.5]" />
                      <input
                        type="text"
                        placeholder="Search analyst..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none w-full"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                      {filteredAnalysts.map((a) => (
                        <button
                          key={a.name}
                          type="button"
                          onClick={() => handleSelectAssignee(a.name)}
                          className="flex items-center justify-between p-2 rounded hover:bg-muted text-left text-xs transition-colors cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{a.name}</span>
                            <span className="text-muted-foreground text-xs">{a.role}</span>
                          </div>
                          {currentAssignee === a.name && (
                            <Check className="size-3.5 text-primary stroke-[1.5]" />
                          )}
                        </button>
                      ))}
                    </div>
                    {currentAssignee && (
                      <button
                        type="button"
                        onClick={handleUnassign}
                        className="flex items-center gap-1.5 p-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer mt-1 border-t border-border"
                      >
                        <UserX className="size-3.5 stroke-[1.5]" />
                        <span>Unassign</span>
                      </button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
