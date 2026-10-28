import React from 'react';
import {
  Check,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  List,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCaseTabState } from '@/lib/caseGates';
import type { FalconCase } from '@/types/cases';
import type { CaseDetailTab } from '@/pages/CaseDetail';

export interface CaseTabStateChipProps {
  tab: CaseDetailTab;
  caseData: FalconCase;
  className?: string;
}

export const CaseTabStateChip: React.FC<CaseTabStateChipProps> = ({
  tab,
  caseData,
  className,
}) => {
  const state = getCaseTabState(tab, caseData);

  if (!state.label) {
    return null;
  }

  const renderIcon = () => {
    switch (state.iconName) {
      case 'check':
        return <Check className="size-3 shrink-0 stroke-[2.5]" aria-hidden="true" />;
      case 'check-circle':
        return <CheckCircle2 className="size-3 shrink-0 stroke-[2]" aria-hidden="true" />;
      case 'alert-circle':
        return <AlertCircle className="size-3 shrink-0 stroke-[2]" aria-hidden="true" />;
      case 'file-text':
        return <FileText className="size-3 shrink-0 stroke-[2]" aria-hidden="true" />;
      case 'clock':
        return <Clock className="size-3 shrink-0 stroke-[2]" aria-hidden="true" />;
      case 'list':
        return <List className="size-3 shrink-0 stroke-[2]" aria-hidden="true" />;
      default:
        return null;
    }
  };

  const variantStyles: Record<string, string> = {
    success: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50',
    warning: 'bg-amber-950/40 text-amber-300 border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50',
    muted: 'bg-muted/50 text-muted-foreground border-border',
    neutral: 'bg-muted/70 text-foreground border-border',
    count: 'bg-muted/70 text-foreground font-mono font-bold border-border',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border leading-none transition-colors select-none',
        variantStyles[state.variant] || variantStyles.muted,
        className
      )}
      aria-label={state.ariaLabel}
      title={state.ariaLabel}
    >
      {renderIcon()}
      <span className="truncate max-w-[140px] sm:max-w-[200px]">{state.label}</span>
    </span>
  );
};
