import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Briefcase,
  MoreHorizontal,
  Copy,
  FileDown,
  UserCheck,
  XCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
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
  positionText?: string;
  hasContext?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  isAcknowledging?: boolean;
  onAcknowledge?: () => Promise<void> | void;
  onOpenCreateCase: () => void;
  onOpenDismiss: () => void;
  onOpenAssign: () => void;
}

export const EventDetailHeader: React.FC<EventDetailHeaderProps> = ({
  event,
  positionText,
  hasContext = false,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
  isAcknowledging = false,
  onAcknowledge,
  onOpenCreateCase,
  onOpenDismiss,
  onOpenAssign,
}) => {
  const navigate = useNavigate();
  const { acknowledgeEvent } = useEvents();
  const { addToast } = useToast();

  // Normalize event fields across FalconEvent and EventDetailViewModel
  const status = (event as any).status || (event as any).state || 'New';
  const priority = event.priority || 'Medium';
  const source = event.source || 'Edge-service';
  const caseId = (event as any).caseId || null;
  const capturedAt = (event as any).capturedAt || (event as any).captured;
  const acknowledgedAt = (event as any).acknowledgedAt || null;

  // Dynamic SLA ticker: recompute every 30s
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

  const handleExportPdf = () => {
    addToast('success', `Exporting dossier ${event.id} to PDF report...`);
  };

  const handleAcknowledgeClick = async () => {
    if (onAcknowledge) {
      await onAcknowledge();
    } else {
      acknowledgeEvent(event.id);
      addToast('success', `Event ${event.id} acknowledged`);
    }
  };

  // Stepper logic: New -> Acknowledged -> Case created -> Resolved
  const steps = [
    { key: 'New', label: 'New' },
    { key: 'Acknowledged', label: 'Acknowledged' },
    { key: 'Case created', label: 'Case created' },
    { key: 'Resolved', label: 'Resolved' },
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
    <div className="flex flex-col gap-4 pb-4 border-b border-border select-none">
      {/* 1. Breadcrumb and Back Action */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Link
            to="/events"
            className="hover:text-primary transition-colors flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="size-3.5" />
            <span>Event inbox</span>
          </Link>
          <span>/</span>
          <span className="font-mono text-foreground font-semibold">
            {formatId(event.id)}
          </span>
        </div>

        {/* Position control: Only displayed when arriving with list context (from inbox) */}
        {hasContext && positionText && (
          <div className="flex items-center gap-2" data-testid="position-control">
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {positionText}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onPrev}
                disabled={!hasPrev}
                className="size-7 p-0 border-border"
                title="Previous event (K)"
                aria-label="Previous event"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onNext}
                disabled={!hasNext}
                className="size-7 p-0 border-border"
                title="Next event (J)"
                aria-label="Next event"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Main Title Row & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Title & Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <span className="font-mono text-primary font-bold">{formatId(event.id)}</span>
            <span className="text-muted-foreground font-normal">·</span>
            <span>{event.type}</span>
          </h1>

          <div className="flex items-center gap-2 shrink-0">
            {/* Source chip: neutral chip */}
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground border border-border">
              {source}
            </span>
            {/* Priority Badge: Orange for High */}
            <PriorityBadge priority={priority} size="default" />
            {/* Status Badge: Amber for New */}
            <StatusBadge status={status} size="default" />
          </div>
        </div>

        {/* Action Buttons: Strict Action Hierarchy */}
        <div className="flex items-center gap-2">
          {isUnack ? (
            <>
              {/* Primary action when New: Acknowledge */}
              <Button
                size="sm"
                onClick={handleAcknowledgeClick}
                disabled={isAcknowledging}
                className="h-8 px-3 text-xs gap-1.5 bg-[#1D4ED8] hover:bg-[#1D4ED8]/90 dark:bg-primary dark:hover:bg-primary/90 text-white font-semibold shadow-xs"
                title="Acknowledge event (E)"
                data-testid="header-btn-acknowledge"
              >
                {isAcknowledging ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                <span>{isAcknowledging ? 'Acknowledging...' : 'Acknowledge'}</span>
              </Button>

              {/* Secondary action when New: Create Case */}
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenCreateCase}
                className="h-8 px-3 text-xs gap-1.5 border-border hover:bg-muted text-foreground font-medium"
                title="Create operational case (C)"
                data-testid="header-btn-create-case"
              >
                <Briefcase className="size-3.5" />
                <span>Create Case</span>
              </Button>
            </>
          ) : (
            <>
              {/* Primary action when Acknowledged/In case: Create Case */}
              <Button
                size="sm"
                onClick={onOpenCreateCase}
                className="h-8 px-3 text-xs gap-1.5 bg-[#1D4ED8] hover:bg-[#1D4ED8]/90 dark:bg-primary dark:hover:bg-primary/90 text-white font-semibold shadow-xs"
                title="Create operational case (C)"
                data-testid="header-btn-create-case"
              >
                <Briefcase className="size-3.5" />
                <span>Create Case</span>
              </Button>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger render={
              <button
                className="size-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground border border-border"
                aria-label="More actions"
              >
                <MoreHorizontal className="size-4" />
              </button>
            } />
            <DropdownMenuContent align="end" className="w-48 text-xs">
              <DropdownMenuItem onClick={onOpenAssign}>
                <UserCheck className="size-3.5 mr-2" />
                Assign analyst
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenDismiss}>
                <XCircle className="size-3.5 mr-2" />
                Dismiss as false positive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCopyLink}>
                <Copy className="size-3.5 mr-2" />
                Copy dossier link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPdf}>
                <FileDown className="size-3.5 mr-2" />
                Export PDF report
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/events')}>
                <ArrowLeft className="size-3.5 mr-2" />
                Back to Event inbox
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 3. Status Stepper & Dynamic SLA Timer */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        {/* Stepper: New -> Acknowledged -> Case created -> Resolved */}
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-1" data-testid="status-stepper">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div key={step.key} className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all',
                    isCompleted && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                    isCurrent && 'bg-[#1D4ED8] dark:bg-primary text-white border-[#1D4ED8] dark:border-primary shadow-xs',
                    !isCompleted && !isCurrent && 'bg-muted/50 text-muted-foreground border-border'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : (
                    <span className="size-4 rounded-full flex items-center justify-center text-[10px] font-mono bg-white/20 dark:bg-white/10 text-white">
                      {idx + 1}
                    </span>
                  )}
                  <span>{step.label}</span>
                </div>

                {idx < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-4 sm:w-8 h-0.5 rounded-full',
                      idx < currentStepIndex ? 'bg-emerald-500' : 'bg-border'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Dynamic SLA Timer Chip (updating every 30s) */}
        <div
          data-testid="sla-chip"
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium tabular-nums transition-colors',
            sla?.badgeClass || 'bg-muted/60 border-border text-muted-foreground'
          )}
        >
          {sla?.status === 'overdue' ? (
            <AlertCircle className="size-3.5 text-red-500 shrink-0" />
          ) : sla?.status === 'warning' ? (
            <Clock className="size-3.5 text-amber-500 shrink-0" />
          ) : sla?.status === 'acknowledged' ? (
            <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
          ) : (
            <Clock className="size-3.5 text-muted-foreground shrink-0" />
          )}
          <span>{sla?.text || 'SLA policy active'}</span>
        </div>
      </div>
    </div>
  );
};
