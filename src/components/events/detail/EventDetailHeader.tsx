import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Briefcase,
  MoreHorizontal,
  Copy,
  FileDown,
  ArrowLeft,
  Code2,
  Video,
  Check,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { computeEventSla } from '@/config/slaPolicy';
import { getServerNow } from '@/lib/dateTime';
import { useToast } from '@/contexts/ToastContext';
import { devices } from '@/data/devices';
import { cn, formatId } from '@/lib/utils';
import { useUiMode } from '@/hooks/useUiMode';
import type { FalconEvent } from '@/data/events';
import type { EventDetailViewModel } from '@/types/eventDetail';

export interface EventDetailHeaderProps {
  event: FalconEvent | EventDetailViewModel;
  isAcknowledging?: boolean;
  onAcknowledge?: () => Promise<void> | void;
  onOpenCreateCase: () => void;
  onOpenAssign?: () => void;
  onOpenResolve?: () => void;
  onOpenVendorData?: () => void;
  onWatchLive?: () => void;
  updatedNotice?: { time: string; changes: string[] } | null;
}

export const EventDetailHeader: React.FC<EventDetailHeaderProps> = ({
  event,
  isAcknowledging = false,
  onAcknowledge,
  onOpenCreateCase,
  onOpenVendorData,
  onWatchLive,
  updatedNotice,
}) => {
  const { isTablet } = useUiMode();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  // Navigation continuity: check if opened from Overview map
  const queryParams = new URLSearchParams(location.search);
  const isFromOverview =
    queryParams.get('source') === 'overview' ||
    sessionStorage.getItem('falcon_last_source') === 'overview';

  const handleBack = () => {
    if (isFromOverview) {
      sessionStorage.setItem(
        'falcon_return_to_map',
        JSON.stringify({ entityId: event.id, entityType: 'event' })
      );
      navigate(`/overview?selected=${event.id}`);
    } else {
      const stored = sessionStorage.getItem('last_inbox_url');
      if (stored && stored.startsWith('/events')) {
        navigate(stored);
      } else {
        navigate('/events');
      }
    }
  };

  // Device online check for "Watch live"
  const rawDeviceId = (event as any).device || (event as any).sourceDevice?.id || 'DEV-001';
  const devRecord = devices.find(
    (d) => d.id === rawDeviceId || formatId(d.id) === formatId(rawDeviceId)
  );
  const isDeviceOnline = devRecord ? devRecord.status === 'online' : true;

  // Staging event data fields
  const priority = event.priority || 'High';
  const source = event.source || 'Edge-service';

  // Capability checks: staging has NO status badge, NO stepper, and NO SLA chip unless capability exists
  const supportsStatus = Boolean((event as any).supportsStatusWorkflow || (event as any).showStatusBadge);
  const supportsSla = Boolean((event as any).hasSla);
  const supportsAcknowledge = Boolean((event as any).hasAcknowledgeEndpoint);
  const status = (event as any).status || (event as any).state || 'New';

  // Dynamic SLA ticker: only runs if SLA capability enabled
  const [now, setNow] = useState<Date>(() => getServerNow());
  useEffect(() => {
    if (!supportsSla) return;
    const timer = setInterval(() => {
      setNow(getServerNow());
    }, 30000);
    return () => clearInterval(timer);
  }, [supportsSla]);

  const sla = useMemo(() => {
    if (!supportsSla) return null;
    return computeEventSla({
      priority,
      state: status,
      capturedAt: (event as any).capturedAt || (event as any).captured,
      acknowledgedAt: (event as any).acknowledgedAt || null,
      now,
    });
  }, [supportsSla, priority, status, event, now]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    addToast('info', 'Event link copied to clipboard');
  };

  const handleExport = () => {
    addToast('info', 'Exporting event telemetry...');
  };

  const handleWatchLiveClick = () => {
    if (!isDeviceOnline) return;
    if (onWatchLive) {
      onWatchLive();
    } else {
      addToast('info', `Connecting to ${formatId(rawDeviceId)} live camera stream...`);
    }
  };

  return (
    <div className="flex flex-col gap-3 pb-3 border-b border-border select-none">
      {/* 1. Breadcrumb with Back Arrow (Section 6.1) */}
      <div className="flex items-center text-xs text-muted-foreground">
        <button
          type="button"
          onClick={handleBack}
          className={`hover:text-primary transition-colors flex items-center gap-1 font-medium cursor-pointer ${
            isTablet ? 'min-h-[44px]' : ''
          }`}
          title={isFromOverview ? 'Return to Overview map' : 'Return to Event inbox'}
        >
          <ArrowLeft className={isTablet ? 'size-4' : 'size-3.5'} />
          <span>{isFromOverview ? 'Overview' : 'Event inbox'}</span>
        </button>
        <span className="mx-2">/</span>
        <span className="font-mono text-foreground font-semibold">
          {formatId(event.id)}
        </span>
      </div>

      {/* 2. Main Title Row & Actions matching Staging Screenshot 3 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Title & Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <span className="font-mono font-bold">{formatId(event.id)}</span>
            <span className="text-muted-foreground font-normal">·</span>
            <span>{event.type}</span>
          </h1>

          <div className="flex items-center gap-2 shrink-0">
            {/* Neutral Mono Edge-service badge */}
            <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-muted text-muted-foreground border border-border">
              {source}
            </span>
            {/* Priority Badge */}
            <PriorityBadge priority={priority} size="default" />
            {/* Status Badge only if capability exists */}
            {supportsStatus && <StatusBadge status={status} size="default" />}
            {/* Transient Updated Chip (Section 6.5) */}
            {updatedNotice && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <div className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 text-[11px] font-mono flex items-center gap-1.5 animate-in fade-in transition-opacity cursor-help">
                      <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                      <span>Updated at {updatedNotice.time}</span>
                    </div>
                  }
                />
                <TooltipContent side="bottom" className="text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-foreground">Recent changes:</span>
                    {updatedNotice.changes.map((c, i) => (
                      <span key={i} className="text-muted-foreground">• {c}</span>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Action Buttons: Create Case, Watch live, Overflow menu */}
        <div className="flex items-center gap-2">
          {/* Primary Action: Create Case */}
          <Button
            size="sm"
            onClick={onOpenCreateCase}
            className={`${
              isTablet ? 'h-[44px] px-4 text-sm gap-2' : 'h-8 px-3 text-xs gap-1.5'
            } bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs cursor-pointer`}
            title="Create operational case"
          >
            <Briefcase className={`${isTablet ? 'size-4' : 'size-3.5'}`} />
            <span>Create case</span>
          </Button>

          {/* Secondary Action: Watch live (camera icon, staging behavior) */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!isDeviceOnline}
                  onClick={handleWatchLiveClick}
                  className={`${
                    isTablet ? 'h-[44px] px-4 text-sm gap-2' : 'h-8 px-3 text-xs gap-1.5'
                  } border-border hover:bg-muted text-foreground font-medium disabled:opacity-40 cursor-pointer`}
                  title={isDeviceOnline ? 'Watch live camera stream' : 'The device is offline'}
                >
                  <Video className={`${isTablet ? 'size-4' : 'size-3.5'}`} />
                  <span>Watch live</span>
                </Button>
              }
            />
            <TooltipContent side="bottom" className="text-xs">
              {isDeviceOnline ? 'Watch live camera stream' : 'The device is offline'}
            </TooltipContent>
          </Tooltip>

          {/* Overflow Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className={`${
                    isTablet ? 'size-11' : 'size-8'
                  } rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground border border-border cursor-pointer focus-visible:outline-none`}
                  aria-label="More actions"
                >
                  <MoreHorizontal className={isTablet ? 'size-5' : 'size-4'} />
                </button>
              }
            />
            <DropdownMenuContent
              align="end"
              className="w-52 text-xs bg-popover border border-border z-50"
            >
              <DropdownMenuItem
                onClick={handleCopyLink}
                className={`cursor-pointer gap-2.5 ${isTablet ? 'h-11 text-sm' : ''}`}
              >
                <Copy className="size-4 text-muted-foreground" />
                <span>Copy link</span>
              </DropdownMenuItem>

              {onOpenVendorData && (
                <DropdownMenuItem
                  onClick={onOpenVendorData}
                  className={`cursor-pointer gap-2.5 ${isTablet ? 'h-11 text-sm' : ''}`}
                >
                  <Code2 className="size-4 text-violet-500" />
                  <span>View vendor data</span>
                </DropdownMenuItem>
              )}

              {supportsAcknowledge && (
                <DropdownMenuItem
                  onClick={() => onAcknowledge?.()}
                  disabled={isAcknowledging}
                  className={`cursor-pointer gap-2.5 ${isTablet ? 'h-11 text-sm' : ''}`}
                >
                  {isAcknowledging ? (
                    <Loader2 className="size-4 animate-spin text-primary" />
                  ) : (
                    <Check className="size-4 text-emerald-500" />
                  )}
                  <span>Acknowledge</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleExport}
                className={`cursor-pointer gap-2.5 ${isTablet ? 'h-11 text-sm' : ''}`}
              >
                <FileDown className="size-4 text-muted-foreground" />
                <span>Export</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 3. Status Stepper & Dynamic SLA Timer (Shown ONLY if data/capabilities support it) */}
      {supportsStatus && supportsSla && (
        <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar pt-1 w-full flex-nowrap shrink-0">
          <div
            data-testid="sla-chip"
            className={cn(
              'flex items-center gap-2 px-3 py-1 rounded-md border text-xs font-medium tabular-nums transition-colors shrink-0 whitespace-nowrap',
              sla?.badgeClass || 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
            )}
          >
            {sla?.status === 'overdue' ? (
              <AlertCircle className="size-3.5 text-red-500 shrink-0" />
            ) : sla?.status === 'warning' ? (
              <Clock className="size-3.5 text-amber-500 shrink-0" />
            ) : (
              <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
            )}
            <span>{sla?.text}</span>
          </div>
        </div>
      )}
    </div>
  );
};
