import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  UserPlus,
  Play,
  Send,
  CheckCircle,
  RotateCcw,
  MoreHorizontal,
  Copy,
  Download,
  ExternalLink,
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
import { CaseStatusBadge } from '@/components/common/CaseStatusBadge';
import { AssignPopover } from '../AssignPopover';
import { useCases } from '@/contexts/CasesContext';
import { useToast } from '@/contexts/ToastContext';
import { useUiMode } from '@/contexts/UiModeContext';
import { cn, formatId } from '@/lib/utils';
import { exportCasesToCsv } from '@/data/caseSelectors';
import { getServerNow } from '@/lib/dateTime';
import type { FalconCase, AssigneeType } from '@/types/cases';

export interface CaseWorkspaceHeaderProps {
  caseData: FalconCase;
  onOpenClosureTab?: () => void;
}

export const CaseWorkspaceHeader: React.FC<CaseWorkspaceHeaderProps> = ({
  caseData,
  onOpenClosureTab,
}) => {
  const navigate = useNavigate();
  const { assignCase, startWork, sendForReview, reopenCase } = useCases();
  const { addToast } = useToast();
  const { isTablet, orientation } = useUiMode();
  const isPortrait = isTablet && orientation === 'portrait';

  const [isPending, setIsPending] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  // Return to stored list URL or fallback
  const handleBack = () => {
    const lastUrl = sessionStorage.getItem('last_cases_url');
    if (lastUrl) {
      navigate(lastUrl);
    } else {
      navigate('/cases');
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(
      () => addToast('success', `Copied link to ${caseData.id}`),
      () => addToast('error', 'Failed to copy link')
    );
  };

  const handleExport = () => {
    const now = getServerNow();
    const csvContent = exportCasesToCsv([caseData], now);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${caseData.id}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('success', `Exported ${caseData.id} to CSV`);
  };

  // Primary action executor
  const handlePrimaryAction = async () => {
    if (isPending) return;
    setIsPending(true);

    try {
      if (!caseData.assignee || caseData.assignee.toLowerCase() === 'unassigned') {
        setIsAssignOpen(true);
      } else if (caseData.status === 'Open') {
        await startWork(caseData.id);
        addToast('success', `Started work on case ${formatId(caseData.id)}`);
      } else if (caseData.status === 'In progress') {
        await sendForReview(caseData.id);
        addToast('success', `Case ${formatId(caseData.id)} sent for review`);
      } else if (caseData.status === 'In review') {
        onOpenClosureTab?.();
      }
    } finally {
      setIsPending(false);
    }
  };

  const handleReopen = async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      await reopenCase(caseData.id);
      addToast('info', `Case ${formatId(caseData.id)} reopened.`);
    } finally {
      setIsPending(false);
    }
  };

  const handleAssignSelect = async (assignee: string | null, assigneeType: AssigneeType) => {
    setIsPending(true);
    try {
      await assignCase(caseData.id, assignee, assigneeType);
      setIsAssignOpen(false);
    } finally {
      setIsPending(false);
    }
  };

  // Determine Primary Action label & icon (Section 5.1)
  const isUnassigned = !caseData.assignee || caseData.assignee.toLowerCase() === 'unassigned';

  const renderPrimaryAction = () => {
    const primaryBtnClass = cn(
      "font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer",
      isTablet ? "h-11 px-4 text-sm gap-2" : "gap-2 text-xs h-8 px-3"
    );

    if (isUnassigned && caseData.status === 'Open') {
      return (
        <AssignPopover
          open={isAssignOpen}
          onOpenChange={setIsAssignOpen}
          currentAssignee={caseData.assignee}
          onAssign={handleAssignSelect}
          trigger={
            <Button
              className={primaryBtnClass}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UserPlus className="size-4" />
              )}
              <span>Assign</span>
            </Button>
          }
        />
      );
    }

    if (caseData.status === 'Open') {
      return (
        <Button
          onClick={handlePrimaryAction}
          disabled={isPending}
          className={primaryBtnClass}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Play className="size-4 fill-current" />
          )}
          <span>Start work</span>
        </Button>
      );
    }

    if (caseData.status === 'In progress') {
      return (
        <Button
          onClick={handlePrimaryAction}
          disabled={isPending}
          className={primaryBtnClass}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          <span>Send for review</span>
        </Button>
      );
    }

    if (caseData.status === 'In review') {
      return (
        <Button
          onClick={handlePrimaryAction}
          disabled={isPending}
          className={primaryBtnClass}
        >
          <CheckCircle className="size-4" />
          <span>Go to Closure</span>
        </Button>
      );
    }

    // Closed: no primary action (Section 5.1)
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Title Row (Section 4.2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Title + Status Badge */}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            <span className="font-mono">{formatId(caseData.id)}</span>
            <span className="mx-2 text-muted-foreground/60 font-normal">·</span>
            <span>{caseData.title}</span>
          </h1>

          <CaseStatusBadge status={caseData.status} size="default" />
        </div>

        {/* Right: Back to Cases (secondary), Primary State Action, Overflow Menu */}
        <div className="hidden sm:flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className={cn("border-border hover:bg-muted text-foreground", isTablet ? "h-11 px-4 text-sm" : "text-xs h-8 px-2.5")}
          >
            <span>Back to Cases</span>
          </Button>

          {/* Primary Action Button (in header for desktop and landscape tablet) */}
          {!isPortrait && renderPrimaryAction()}

          {/* Overflow Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "p-0 border-border hover:bg-muted text-muted-foreground hover:text-foreground",
                    isTablet ? "size-11 min-w-[44px] min-h-[44px]" : "size-8"
                  )}
                  aria-label="More case actions"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-52 bg-popover border border-border shadow-xl z-50 text-xs">
              <DropdownMenuItem onClick={handleCopyLink} className={cn("gap-2 cursor-pointer", isTablet ? "h-12 text-sm" : "h-8 text-xs")}>
                <Copy className="size-3.5 text-muted-foreground" />
                <span>Copy link</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleExport} className={cn("gap-2 cursor-pointer", isTablet ? "h-12 text-sm" : "h-8 text-xs")}>
                <Download className="size-3.5 text-muted-foreground" />
                <span>Export case (CSV)</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => navigate(`/events/${caseData.sourceEventId}`)}
                className={cn("gap-2 cursor-pointer", isTablet ? "h-12 text-sm" : "h-8 text-xs")}
              >
                <ExternalLink className="size-3.5 text-muted-foreground" />
                <span>Open source event</span>
              </DropdownMenuItem>

              {caseData.status === 'Closed' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleReopen}
                    className={cn("gap-2 cursor-pointer text-primary focus:text-primary", isTablet ? "h-12 text-sm" : "h-8 text-xs")}
                  >
                    <RotateCcw className="size-3.5" />
                    <span>Reopen case</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile & Portrait Tablet Sticky Bottom Action Bar */}
      {renderPrimaryAction() && (
        <div className={cn(
          "fixed bottom-0 left-0 right-0 p-3 bg-card border-t border-border z-40 flex items-center justify-between gap-3 shadow-2xl",
          isPortrait ? "flex" : "flex sm:hidden"
        )}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className={cn("border-border", isTablet ? "h-11 px-4 text-sm" : "text-xs h-9 px-3")}
          >
            <ArrowLeft className="size-4 mr-1" />
            <span>Back</span>
          </Button>

          <div className="flex-1 flex justify-end">
            {renderPrimaryAction()}
          </div>
        </div>
      )}
    </div>
  );
};
