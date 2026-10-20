import React from 'react';
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
import { formatRelativeTime } from '@/lib/dateTime';
import { useEvents } from '@/contexts/EventsContext';
import { useToast } from '@/contexts/ToastContext';
import { cn, formatId } from '@/lib/utils';
import type { FalconEvent } from '@/data/events';

export interface EventDetailHeaderProps {
  event: FalconEvent;
  positionText: string;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onOpenCreateCase: () => void;
  onOpenDismiss: () => void;
  onOpenAssign: () => void;
}

export const EventDetailHeader: React.FC<EventDetailHeaderProps> = ({
  event,
  positionText,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  onOpenCreateCase,
  onOpenDismiss,
  onOpenAssign,
}) => {
  const navigate = useNavigate();
  const { acknowledgeEvent } = useEvents();
  const { addToast } = useToast();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    addToast('info', 'Event link copied to clipboard');
  };

  const handleExportPdf = () => {
    addToast('success', `Exporting dossier ${event.id} to PDF report...`);
  };

  const handleAcknowledge = () => {
    acknowledgeEvent(event.id);
    addToast('success', `Event ${event.id} acknowledged`);
  };

  // Stepper logic: New -> Acknowledged -> Case created -> Resolved
  const steps = [
    { key: 'New', label: 'New' },
    { key: 'Acknowledged', label: 'Acknowledged' },
    { key: 'Case created', label: 'Case created' },
    { key: 'Resolved', label: 'Resolved' },
  ];

  let currentStepIndex = 0;
  if (event.state === 'Resolved' || event.state === 'Closed') {
    currentStepIndex = 3;
  } else if (event.caseId || event.state === 'In case') {
    currentStepIndex = 2;
  } else if (event.state === 'Acknowledged' || event.state === 'Assigned') {
    currentStepIndex = 1;
  } else {
    currentStepIndex = 0;
  }

  // SLA calculation
  const isUnack = event.state === 'New';
  const ageStr = formatRelativeTime(event.captured);

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

        {/* Position control: "3 of 258" */}
        <div className="flex items-center gap-2">
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
            {/* Source chip */}
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground border border-border">
              {event.source}
            </span>
            <PriorityBadge priority={event.priority} size="default" />
            <StatusBadge status={event.state} size="default" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {event.state === 'New' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAcknowledge}
              className="h-8 px-3 text-xs gap-1.5 border-border text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-medium"
              title="Acknowledge event (E)"
            >
              <Check className="size-3.5" />
              <span>Acknowledge</span>
            </Button>
          )}

          <Button
            size="sm"
            onClick={onOpenCreateCase}
            className="h-8 px-3 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs"
            title="Create operational case (C)"
          >
            <Briefcase className="size-3.5" />
            <span>Create Case</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger render={
              <button className="size-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground border border-border">
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

      {/* 3. Status Stepper & SLA Timer */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        {/* Stepper */}
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-1">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div key={step.key} className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all',
                    isCompleted && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                    isCurrent && 'bg-primary text-primary-foreground border-primary shadow-xs',
                    !isCompleted && !isCurrent && 'bg-muted/50 text-muted-foreground border-border'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : (
                    <span className="size-4 rounded-full flex items-center justify-center text-[10px] font-mono bg-black/10 dark:bg-white/10">
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

        {/* SLA Timer Chip */}
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium tabular-nums',
            isUnack
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
              : 'bg-muted/60 border-border text-muted-foreground'
          )}
        >
          {isUnack ? (
            <AlertCircle className="size-3.5 text-amber-500 shrink-0" />
          ) : (
            <Clock className="size-3.5 text-muted-foreground shrink-0" />
          )}
          <span>
            {isUnack
              ? `Unacknowledged for ${ageStr} · SLA target: 30m`
              : 'Triage complete within SLA target'}
          </span>
        </div>
      </div>
    </div>
  );
};
