import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  const { assignCase, startWork, sendForReview, closeCase, reopenCase } = useCases();
  const { addToast } = useToast();

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
      } else if (caseData.status === 'In progress') {
        await sendForReview(caseData.id);
      } else if (caseData.status === 'In review') {
        if (onOpenClosureTab) {
          onOpenClosureTab();
        } else {
          await closeCase(caseData.id, {
            rootCause: 'Verified and resolved by field technician',
            resolutionNotes: 'Inspection confirmed clearance and hardware integrity',
            closedBy: 'Field Team',
          });
        }
      } else if (caseData.status === 'Closed') {
        await reopenCase(caseData.id);
      }
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

  // Determine Primary Action label & icon
  const isUnassigned = !caseData.assignee || caseData.assignee.toLowerCase() === 'unassigned';

  const renderPrimaryAction = () => {
    if (isUnassigned) {
      return (
        <AssignPopover
          open={isAssignOpen}
          onOpenChange={setIsAssignOpen}
          currentAssignee={caseData.assignee}
          onAssign={handleAssignSelect}
          trigger={
            <Button
              className="gap-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <UserPlus className="size-3.5" />
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
          className="gap-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer"
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Play className="size-3.5 fill-current" />
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
          className="gap-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer"
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Send className="size-3.5" />
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
          className="gap-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer"
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <CheckCircle className="size-3.5" />
          )}
          <span>Close case</span>
        </Button>
      );
    }

    if (caseData.status === 'Closed') {
      return (
        <Button
          variant="outline"
          onClick={handlePrimaryAction}
          disabled={isPending}
          className="gap-2 text-xs font-semibold border-border hover:bg-muted text-foreground cursor-pointer"
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RotateCcw className="size-3.5" />
          )}
          <span>Reopen case</span>
        </Button>
      );
    }

    return null;
  };

  return (
    <div className="space-y-3">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
            aria-label="Back to cases"
          >
            <ArrowLeft className="size-3.5" />
            <span>Cases</span>
          </button>
          <span>/</span>
          <span className="font-mono font-semibold text-foreground">{caseData.id}</span>
        </div>

        {/* Desktop Secondary Buttons */}
        <div className="hidden sm:flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="text-xs h-8 px-2.5 border-border hover:bg-muted"
          >
            <span>Back to Cases</span>
          </Button>

          {/* Primary Action Button */}
          {renderPrimaryAction()}

          {/* Overflow Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="size-8 p-0 border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                  aria-label="More case actions"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48 bg-popover border border-border shadow-xl z-50 text-xs">
              <DropdownMenuItem onClick={handleCopyLink} className="gap-2 cursor-pointer">
                <Copy className="size-3.5 text-muted-foreground" />
                <span>Copy link</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleExport} className="gap-2 cursor-pointer">
                <Download className="size-3.5 text-muted-foreground" />
                <span>Export case (CSV)</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => navigate(`/events/${caseData.sourceEventId}`)}
                className="gap-2 cursor-pointer"
              >
                <ExternalLink className="size-3.5 text-muted-foreground" />
                <span>View source event</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Title, Badge & Source Event Chip */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            <span className="font-mono">{caseData.id}</span>
            <span className="mx-2 text-muted-foreground/60 font-normal">·</span>
            <span>{caseData.title}</span>
          </h1>

          <CaseStatusBadge status={caseData.status} size="default" />

          {/* Source event chip */}
          <Link
            to={`/events/${caseData.sourceEventId}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/70 hover:bg-muted border border-border text-foreground hover:text-primary font-mono text-xs font-semibold transition-colors"
            title={`View source event ${caseData.sourceEventId}`}
          >
            <span>{caseData.sourceEventId}</span>
            <ExternalLink className="size-3 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar (<768px from Section 7.3) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-card/95 backdrop-blur-md border-t border-border z-40 flex items-center justify-between gap-2 shadow-2xl">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          className="text-xs h-9 px-3 border-border"
        >
          <ArrowLeft className="size-3.5 mr-1" />
          <span>Back</span>
        </Button>

        <div className="flex-1 flex justify-end">
          {renderPrimaryAction()}
        </div>
      </div>
    </div>
  );
};
