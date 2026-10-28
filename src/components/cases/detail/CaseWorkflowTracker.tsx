import React from 'react';
import { Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FalconCase, CaseStatus } from '@/types/cases';
import { getCaseAge } from '@/data/caseSelectors';
import { getServerNow, formatAbsoluteMYT, parseDate } from '@/lib/dateTime';

export interface CaseWorkflowTrackerProps {
  caseData: FalconCase;
  className?: string;
}

interface StepInfo {
  status: CaseStatus;
  label: string;
  order: number;
}

const STEPS: StepInfo[] = [
  { status: 'Open', label: 'Open', order: 1 },
  { status: 'In progress', label: 'In progress', order: 2 },
  { status: 'In review', label: 'In review', order: 3 },
  { status: 'Closed', label: 'Closed', order: 4 },
];

const STATUS_ORDER_MAP: Record<CaseStatus, number> = {
  Open: 1,
  'In progress': 2,
  'In review': 3,
  Closed: 4,
};

export const CaseWorkflowTracker: React.FC<CaseWorkflowTrackerProps> = ({
  caseData,
  className,
}) => {
  const currentOrder = STATUS_ORDER_MAP[caseData.status] || 1;
  const now = getServerNow();
  const age = getCaseAge(caseData, now);

  // Extract reached timestamps from activities and case timestamps
  const getStepTimestamp = (status: CaseStatus): string | null => {
    if (status === 'Open') {
      return caseData.createdAt;
    }
    if (status === 'Closed') {
      return caseData.closedAt;
    }

    // Search activities for transition to this step
    const targetText =
      status === 'In progress'
        ? ['work started', 'in progress', 'assigned']
        : ['review', 'in review', 'sent for review'];

    const act = caseData.activities?.find((a) =>
      targetText.some((term) => a.text.toLowerCase().includes(term))
    );
    return act ? act.timestamp : null;
  };

  const formatStepTime = (isoString: string | null) => {
    if (!isoString) return null;
    const d = parseDate(isoString);
    if (!d) return null;
    return formatAbsoluteMYT(d, { showSeconds: false });
  };

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:px-4 rounded-xl bg-card border border-border shadow-xs',
        className
      )}
    >
      {/* Steps List */}
      <div className="flex items-center gap-1.5 sm:gap-3 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {STEPS.map((step, idx) => {
          const isCompleted = step.order < currentOrder;
          const isCurrent = step.order === currentOrder;
          const isUpcoming = step.order > currentOrder;
          const timestamp = isCompleted || isCurrent ? getStepTimestamp(step.status) : null;
          const formattedTime = formatStepTime(timestamp);

          return (
            <React.Fragment key={step.status}>
              <div className="flex items-center gap-2 shrink-0">
                {/* Step indicator circle */}
                <div
                  className={cn(
                    'size-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors shrink-0',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isCurrent && 'bg-primary ring-4 ring-primary/20 text-primary-foreground',
                    isUpcoming && 'bg-muted text-muted-foreground border border-border'
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-3.5 stroke-[2.5]" />
                  ) : (
                    <span>{step.order}</span>
                  )}
                </div>

                {/* Step labels */}
                <div className="flex flex-col">
                  <span
                    className={cn(
                      'text-xs font-semibold whitespace-nowrap',
                      isCurrent && 'text-primary',
                      isCompleted && 'text-foreground',
                      isUpcoming && 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </span>
                  {formattedTime ? (
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formattedTime}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap">
                      Not reached
                    </span>
                  )}
                </div>
              </div>

              {/* Connecting line */}
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-6 sm:w-10 h-0.5 shrink-0 transition-colors',
                    step.order < currentOrder ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Age & SLA display */}
      <div className="flex items-center gap-2 shrink-0 self-start sm:self-center pl-1 sm:pl-3 sm:border-l border-border">
        <Clock className="size-3.5 text-muted-foreground" />
        <span className="text-xs text-foreground font-medium tabular-nums">
          {caseData.status === 'Closed' ? (
            <>Closed after {age.durationText || 'completed duration'}</>
          ) : (
            <>Open for {age.durationText || 'recent'}</>
          )}
        </span>
      </div>
    </div>
  );
};
