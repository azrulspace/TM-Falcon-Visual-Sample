import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Briefcase,
  MoreHorizontal,
  Copy,
  FileDown,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Code2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useEvents } from '@/contexts/EventsContext';
import { useToast } from '@/contexts/ToastContext';
import { cn, formatId } from '@/lib/utils';
import type { FalconEvent } from '@/data/events';
import type { EventDetailViewModel } from '@/types/eventDetail';

export interface EventDetailHeaderProps {
  event: FalconEvent | EventDetailViewModel;
  isAcknowledging?: boolean;
  onAcknowledge?: () => Promise<void> | void;
  onOpenCreateCase: () => void;
  onOpenAssign: () => void;
  onOpenResolve?: () => void;
  onOpenVendorData?: () => void;
}

export const EventDetailHeader: React.FC<EventDetailHeaderProps> = ({
  event,
  isAcknowledging = false,
  onAcknowledge,
  onOpenCreateCase,
  onOpenAssign,
  onOpenResolve,
  onOpenVendorData,
}) => {
  const navigate = useNavigate();
  const { acknowledgeEvent } = useEvents();
  const { addToast } = useToast();

  // Return to previous inbox view or default /events
  const handleBackToInbox = () => {
    const stored = sessionStorage.getItem('last_inbox_url');
    if (stored && stored.startsWith('/events')) {
      navigate(stored);
    } else {
      navigate('/events');
    }
  };

  // Normalize event fields across FalconEvent and EventDetailViewModel
  const status = (event as any).status || (event as any).state || 'New';
  const priority = event.priority || 'High';
  const source = event.source || 'Edge service';
  const caseId = (event as any).caseId || null;
  const capturedAt = (event as any).capturedAt || (event as any).captured;
  const acknowledgedAt = (event as any).acknowledgedAt || null;

  // Dynamic SLA ticker: recompute every 30s without layout shift
  const [now, setNow] = useState<Date>(() => getServerNow());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(getServerNow());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const sla = useMemo(() => {
    return computeEventSla({
      priority,
      state: status,
      capturedAt,
      acknowledgedAt,
      now,
    });
  }, [priority, status, capturedAt, acknowledgedAt, now]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    addToast('info', 'Event link copied to clipboard');
  };

  const handleExport = () => {
    addToast('info', 'Exporting event telemetry...');
  };

  const handleAcknowledgeClick = async () => {
    if (onAcknowledge) {
      await onAcknowledge();
    } else {
      acknowledgeEvent(event.id);
      addToast('success', `Event ${formatId(event.id)} acknowledged`);
    }
  };

  // Stepper logic: New -> Acknowledged -> Case created -> Resolved
  const steps = [
    { key: 'New', num: 1, label: 'New' },
    { key: 'Acknowledged', num: 2, label: 'Acknowledged' },
    { key: 'Case created', num: 3, label: 'Case created' },
    { key: 'Resolved', num: 4, label: 'Resolved' },
  ];

  let currentStepIndex = 0;
  if (status === 'Resolved' || status === 'Closed') {
    currentStepIndex = 3;
  } else if (caseId || status === 'In case') {
    currentStepIndex = 2;
  } else if (status === 'Acknowledged' || status === 'Assigned') {
    currentStepIndex = 1;
  } else {
    currentStepIndex = 0;
  }

  const isUnack = status === 'New';

  return (
    <div className="flex flex-col gap-3 pb-3 border-b border-border select-none">
      {/* 1. Breadcrumb with Back Arrow (Section 4.1) */}
      <div className="flex items-center text-xs text-muted-foreground">
        <button
          type="button"
          onClick={handleBackToInbox}
          className="hover:text-primary transition-colors flex items-center gap-1 font-medium cursor-pointer"
          title="Return to Event inbox with saved filters restored"
        >
          <ArrowLeft className="size-3.5" />
          <span>Event inbox</span>
        </button>
        <span className="mx-2">/</span>
        <span className="font-mono text-foreground font-semibold">
          {formatId(event.id)}
        </span>
      </div>

      {/* 2. Main Title Row & Actions (DETAIL_FINAL) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Title & Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <span className="font-mono font-bold">{formatId(event.id)}</span>
            <span className="text-muted-foreground font-normal">·</span>
            <span>{event.type}</span>
          </h1>

          <div className="flex items-center gap-2 shrink-0">
            {/* Neutral Mono Edge service badge */}
            <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-muted text-muted-foreground border border-border">
              {source}
            </span>
            {/* Priority Badge */}
            <PriorityBadge priority={priority} size="default" />
            {/* Status Badge */}
            <StatusBadge status={status} size="default" />
          </div>
        </div>

        {/* Action Buttons: Acknowledge, Create Case, Overflow menu */}
        <div className="flex items-center gap-2">
          {isUnack ? (
            <Button
              size="sm"
              onClick={handleAcknowledgeClick}
              disabled={isAcknowledging}
              className="h-8 px-3 text-xs gap-1.5 bg-[#1D4ED8] hover:bg-[#1D4ED8]/90 dark:bg-primary dark:hover:bg-primary/90 text-white font-semibold shadow-xs cursor-pointer"
              title="Acknowledge event"
            >
              {isAcknowledging ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
              <span>{isAcknowledging ? 'Acknowledging...' : 'Acknowledge'}</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="h-8 px-3 text-xs gap-1.5 opacity-60 cursor-not-allowed border-border"
              title="Event already acknowledged"
            >
              <Check className="size-3.5 text-emerald-500" />
              <span>Acknowledged</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCreateCase}
            className="h-8 px-3 text-xs gap-1.5 border-border hover:bg-muted text-foreground font-medium cursor-pointer"
            title="Create operational case"
          >
            <Briefcase className="size-3.5 text-amber-500" />
            <span>Create Case</span>
          </Button>

          {/* Overflow Menu (Section 4.1: Resolve, Assign analyst, Copy link, View vendor data, Export) */}
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <button
                type="button"
                className="size-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground border border-border cursor-pointer focus-visible:outline-none"
                aria-label="More actions"
              >
                <MoreHorizontal className="size-4" />
              </button>
            } />
            <DropdownMenuContent align="end" className="w-48 text-xs bg-popover border border-border z-50">
              <DropdownMenuItem
                onClick={onOpenResolve}
                className="cursor-pointer gap-2"
              >
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                <span>Resolve</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={onOpenAssign}
                className="cursor-pointer gap-2"
              >
                <UserCheck className="size-3.5 text-blue-500" />
                <span>Assign analyst</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleCopyLink}
                className="cursor-pointer gap-2"
              >
                <Copy className="size-3.5 text-muted-foreground" />
                <span>Copy link</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={onOpenVendorData}
                className="cursor-pointer gap-2"
              >
                <Code2 className="size-3.5 text-violet-500" />
                <span>View vendor data</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleExport}
                className="cursor-pointer gap-2"
              >
                <FileDown className="size-3.5 text-muted-foreground" />
                <span>Export</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 3. Status Stepper & Dynamic SLA Timer (DETAIL_FINAL) */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        {/* Stepper: 1 New -> 2 Acknowledged -> 3 Case created -> 4 Resolved */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-0.5" data-testid="status-stepper">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div key={step.key} className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-all select-none',
                    isCurrent
                      ? 'bg-card text-foreground border-border font-semibold shadow-xs ring-1 ring-border'
                      : isCompleted
                      ? 'bg-muted/50 text-emerald-500 border-emerald-500/30'
                      : 'bg-muted/30 text-muted-foreground border-border/60 opacity-60'
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-3 text-emerald-500 stroke-[3]" />
                  ) : (
                    <span className="size-3.5 rounded-full flex items-center justify-center text-[10px] font-mono bg-muted text-muted-foreground font-bold">
                      {step.num}
                    </span>
                  )}
                  <span>{step.label}</span>
                </div>

                {idx < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-3 sm:w-6 h-px',
                      idx < currentStepIndex ? 'bg-emerald-500' : 'bg-border'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Dynamic SLA Timer Chip (DETAIL_FINAL: Overdue warning) */}
        <div
          data-testid="sla-chip"
          className={cn(
            'flex items-center gap-2 px-3 py-1 rounded-md border text-xs font-medium tabular-nums transition-colors',
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
          <span>{sla?.text || 'Unacknowledged for 16h 9m. Target 30m. Overdue by 15h 39m'}</span>
        </div>
      </div>
    </div>
  );
};
