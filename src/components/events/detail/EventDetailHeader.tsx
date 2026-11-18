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
    if (onWatchLive) {
      onWatchLive();
    } else {
      navigate(`/live/${encodeURIComponent(formatId(rawDeviceId))}?autostart=1`);
    }
  };

  return (
    <div className="flex flex-col gap-3 pb-3 border-b border-border select-none">
      {/* 1. Breadcrumb with Back Arrow (V15: min 32px desktop, 44px tablet) */}
      <div className="flex items-center text-xs text-muted-foreground font-sans">
        <button
          type="button"
          onClick={handleBack}
          className={`hover:text-primary transition-colors flex items-center gap-1.5 font-medium cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
            isTablet ? 'min-h-[44px]' : 'min-h-[32px]'
          }`}
          title={isFromOverview ? 'Return to Overview map' : 'Return to Event inbox'}
        >
          <ArrowLeft className={isTablet ? 'size-4 stroke-[1.5]' : 'size-3.5 stroke-[1.5]'} />
          <span>{isFromOverview ? 'Overview' : 'Event inbox'}</span>
        </button>
        <span className="mx-2 text-border">/</span>
        <span className="font-mono text-foreground font-semibold">
          {formatId(event.id)}
        </span>
      </div>

      {/* 2. Main Title Row & Actions matching Staging (V3, V7, V17) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Title & Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="font-mono font-bold">{formatId(event.id)}</span>
            <span className="text-muted-foreground font-normal">·</span>
            <span className="font-sans">{event.type}</span>
          </h1>

          <div className="flex items-center gap-2 shrink-0">
            {/* Neutral Outlined Edge-service badge (V17: 24px height, px-2, 6px radius, sans font) */}
            <span className="h-6 px-2 rounded-md text-xs font-sans font-medium bg-muted/40 text-muted-foreground border border-border inline-flex items-center">
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
                    <div className="h-6 px-2 rounded-md bg-primary/10 text-primary border border-primary/30 text-xs font-sans font-medium flex items-center gap-1.5 animate-in fade-in transition-opacity cursor-help">
                      <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                      <span>Updated at {updatedNotice.time}</span>
                    </div>
                  }
                />
                <TooltipContent side="bottom" className="text-xs font-sans">
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
          {/* Primary Action: Create Case (Sole primary button on page, V6) */}
          <Button
            size="sm"
            onClick={onOpenCreateCase}
            className={`${
              isTablet ? 'h-11 px-4 text-sm gap-2' : 'h-9 px-4 text-xs gap-1.5'
            } bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`}
            title="Create operational case (C)"
          >
            <Briefcase className={`${isTablet ? 'size-4 stroke-[1.5]' : 'size-3.5 stroke-[1.5]'}`} />
            <span>Create case</span>
          </Button>

          {/* Secondary Action: Watch live with accessible disabled reason (V7) */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!isDeviceOnline}
                  onClick={handleWatchLiveClick}
                  className={`${
                    isTablet ? 'h-11 px-4 text-sm gap-2' : 'h-9 px-3.5 text-xs gap-1.5'
                  } border-border hover:bg-muted text-foreground font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`}
                  aria-description={!isDeviceOnline ? `The camera is offline. Last contact ${devRecord?.lastContact || 'recently'}` : undefined}
                >
                  <Video className={`${isTablet ? 'size-4 stroke-[1.5]' : 'size-3.5 stroke-[1.5]'}`} />
                  <span>Watch live</span>
                </Button>
              }
            />
            <TooltipContent side="bottom" className="text-xs font-sans">
              {isDeviceOnline
                ? 'Watch live camera stream'
                : `The camera is offline. Last contact ${devRecord?.lastContact || 'recently'}`}
            </TooltipContent>
          </Tooltip>

          {/* Overflow Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className={`${
                    isTablet ? 'size-11' : 'size-9'
                  } rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground border border-border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`}
                  aria-label="More actions"
                >
                  <MoreHorizontal className={isTablet ? 'size-5 stroke-[1.5]' : 'size-4 stroke-[1.5]'} />
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
