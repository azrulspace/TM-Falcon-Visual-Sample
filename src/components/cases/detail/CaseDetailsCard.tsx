import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CaseStatusBadge } from '@/components/common/CaseStatusBadge';
import { AssigneeCell } from '@/components/common/AssigneeCell';
import { RelativeTime } from '@/components/common/RelativeTime';
import { AssignPopover } from '../AssignPopover';
import { useCases } from '@/contexts/CasesContext';
import { getCaseAge } from '@/data/caseSelectors';
import { getServerNow, formatAbsoluteMYT, parseDate } from '@/lib/dateTime';
import type { CaseWithSourceEvent, AssigneeType } from '@/types/cases';

export interface CaseDetailsCardProps {
  caseData: CaseWithSourceEvent;
}

export const CaseDetailsCard: React.FC<CaseDetailsCardProps> = ({ caseData }) => {
  const { assignCase } = useCases();
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const now = getServerNow();
  const age = getCaseAge(caseData, now);

  const createdDate = parseDate(caseData.createdAt);
  const updatedDate = parseDate(caseData.lastUpdatedAt);
  const closedDate = caseData.closedAt ? parseDate(caseData.closedAt) : null;

  const handleAssignSelect = async (assignee: string | null, assigneeType: AssigneeType) => {
    await assignCase(caseData.id, assignee, assigneeType);
    setIsAssignOpen(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Case details</h2>
        </div>
      </div>

      <div className="p-4 space-y-4 text-xs">
        {/* Case ID */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-medium">Case ID</span>
          <span className="font-mono font-bold text-foreground">{caseData.id}</span>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-medium">Status</span>
          <CaseStatusBadge status={caseData.status} size="sm" />
        </div>

        {/* Assignees with change action */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground font-medium">Assignees</span>
          <div className="flex items-center gap-1.5">
            <AssigneeCell
              assignee={caseData.assignee}
              assigneeType={caseData.assigneeType}
            />
            <AssignPopover
              open={isAssignOpen}
              onOpenChange={setIsAssignOpen}
              currentAssignee={caseData.assignee}
              onAssign={handleAssignSelect}
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-[11px] text-primary hover:bg-primary/10"
                >
                  Change
                </Button>
              }
            />
          </div>
        </div>

        {/* Created */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground font-medium">Created</span>
          <div className="text-right">
            <div className="text-foreground font-medium tabular-nums">
              {createdDate ? formatAbsoluteMYT(createdDate) : caseData.createdAt}
            </div>
            <div className="text-[11px] text-muted-foreground">
              <RelativeTime date={caseData.createdAt} />
            </div>
          </div>
        </div>

        {/* Last updated (if API provides it) */}
        {caseData.lastUpdatedAt && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground font-medium">Last updated</span>
            <div className="text-right">
              <div className="text-foreground font-medium tabular-nums">
                {updatedDate ? formatAbsoluteMYT(updatedDate) : caseData.lastUpdatedAt}
              </div>
              <div className="text-[11px] text-muted-foreground">
                <RelativeTime date={caseData.lastUpdatedAt} />
              </div>
            </div>
          </div>
        )}

        {/* Closed (if closed and API provides it) */}
        {caseData.closedAt && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground font-medium">Closed</span>
            <div className="text-right">
              <div className="text-foreground font-medium tabular-nums">
                {closedDate ? formatAbsoluteMYT(closedDate) : caseData.closedAt}
              </div>
            </div>
          </div>
        )}

        {/* Age */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-muted-foreground font-medium">Age</span>
          <span className="font-semibold text-foreground tabular-nums">
            {caseData.status === 'Closed' ? (
              <>Closed after {age.durationText || '—'}</>
            ) : (
              <>Open for {age.durationText || '—'}</>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
