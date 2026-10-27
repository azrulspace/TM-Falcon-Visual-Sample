import React, { useState } from 'react';
import { DeviceChip } from '@/components/common/DeviceChip';
import { AssetChip } from '@/components/common/AssetChip';
import { formatAbsoluteMYT, formatRelativeTime } from '@/lib/dateTime';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { UserCheck, Briefcase, Info, UserX, Search, Check } from 'lucide-react';
import { useEvents } from '@/contexts/EventsContext';
import { useToast } from '@/contexts/ToastContext';
import { cn, formatId } from '@/lib/utils';
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
  const capturedRelative = formatRelativeTime(capturedRaw);

  const receivedRaw = (event as any).receivedAt || (event as any).ingestedAt || (event as any).captured;
  const receivedAbsolute = receivedRaw ? formatAbsoluteMYT(receivedRaw) : null;
  const receivedRelative = receivedRaw ? formatRelativeTime(receivedRaw) : null;

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
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Info className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Key operational facts</h3>
        </div>
      </div>

      {/* Facts List */}
      <div className="p-4 flex flex-col divide-y divide-border text-xs">
        {/* Source Device */}
        <div className="flex items-center justify-between py-2.5">
          <span className="text-muted-foreground font-medium">Source device</span>
          <DeviceChip deviceId={deviceId} />
        </div>

        {/* Affected Asset */}
        <div className="flex items-center justify-between py-2.5">
          <span className="text-muted-foreground font-medium">Affected asset</span>
          <AssetChip assetId={assetId} />
        </div>

        {/* Operational Case */}
        <div className="flex items-center justify-between py-2.5">
          <span className="text-muted-foreground font-medium">Case</span>
          {event.caseId ? (
            <span className="font-mono text-xs font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {event.caseId}
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">No case</span>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenCreateCase}
                className="h-6 px-2 text-[11px] gap-1 text-primary border-primary/30 hover:bg-primary/10 cursor-pointer"
              >
                <Briefcase className="size-3" />
                <span>Create case</span>
              </Button>
            </div>
          )}
        </div>

        {/* Captured Timestamp */}
        <div className="flex items-center justify-between py-2.5">
          <span className="text-muted-foreground font-medium">Captured</span>
          <div className="flex items-center gap-1.5 text-right">
            <span className="font-mono text-[11px] text-foreground" title={capturedAbsolute}>
              {capturedAbsolute}
            </span>
            <span className="text-[11px] text-muted-foreground">({capturedRelative})</span>
          </div>
        </div>

        {/* Ingested Timestamp */}
        {receivedAbsolute && (
          <div className="flex items-center justify-between py-2.5">
            <span className="text-muted-foreground font-medium">Ingested</span>
            <div className="flex items-center gap-1.5 text-right">
              <span className="font-mono text-[11px] text-foreground" title={receivedAbsolute}>
                {receivedAbsolute}
              </span>
              <span className="text-[11px] text-muted-foreground">({receivedRelative})</span>
            </div>
          </div>
        )}

        {/* Assignee (Shown only when capability/field exists) */}
        {hasAssigneeCapability && (
          <div className="flex items-center justify-between py-2.5">
            <span className="text-muted-foreground font-medium">Assigned analyst</span>
            <div className="flex items-center gap-1.5">
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger render={
                  <button
                    type="button"
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted text-foreground transition-colors cursor-pointer text-xs"
                    title="Assign analyst"
                  >
                    {currentAssignee ? (
                      <div className="flex items-center gap-1.5">
                        <span className="size-5 rounded-full bg-primary/20 text-primary font-bold text-[10px] flex items-center justify-center">
                          {currentAssignee.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </span>
                        <span className="font-medium text-foreground">{currentAssignee}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">Unassigned</span>
                    )}
                    <UserCheck className="size-3 text-muted-foreground" />
                  </button>
                } />
                <PopoverContent align="end" className="w-64 p-2 bg-popover border border-border shadow-lg z-50 text-xs">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between border-b border-border pb-1.5">
                      <span className="font-semibold text-foreground">Assign Analyst</span>
                      {currentAssignee && (
                        <button
                          type="button"
                          onClick={handleUnassign}
                          className="text-[11px] text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <UserX className="size-3" />
                          <span>Unassign</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 border border-border">
                      <Search className="size-3 text-muted-foreground" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search analyst..."
                        className="w-full bg-transparent text-xs text-foreground focus:outline-none placeholder:text-muted-foreground"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                      {filteredAnalysts.map((analyst) => {
                        const isSelected = currentAssignee === analyst.name;
                        return (
                          <button
                            key={analyst.name}
                            type="button"
                            onClick={() => handleSelectAssignee(analyst.name)}
                            className={cn(
                              'flex items-center justify-between p-1.5 rounded hover:bg-muted text-left transition-colors cursor-pointer',
                              isSelected && 'bg-primary/10'
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span className="size-6 rounded-full bg-muted font-bold text-[10px] flex items-center justify-center text-muted-foreground">
                                {analyst.avatar}
                              </span>
                              <div className="flex flex-col">
                                <span className="font-medium text-foreground text-xs leading-tight">
                                  {analyst.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground leading-tight">
                                  {analyst.role}
                                </span>
                              </div>
                            </div>
                            {isSelected && <Check className="size-3.5 text-primary" />}
                          </button>
                        );
                      })}
                    </div>
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
