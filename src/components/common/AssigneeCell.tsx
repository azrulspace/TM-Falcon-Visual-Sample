import React from 'react';
import { Users, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AssigneeType } from '@/types/cases';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface AssigneeCellProps {
  assignee: string | null;
  assigneeType?: AssigneeType;
  assignees?: string[]; // for multiple assignees
  className?: string;
  onAssignClick?: (e: React.MouseEvent) => void;
  showQuickAssign?: boolean;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'U';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const AssigneeCell: React.FC<AssigneeCellProps> = ({
  assignee,
  assigneeType,
  assignees,
  className,
  onAssignClick,
  showQuickAssign = false,
}) => {
  // If multiple assignees provided
  if (assignees && assignees.length > 1) {
    const primary = assignees[0];
    const rest = assignees.slice(1);

    return (
      <Tooltip>
        <TooltipTrigger>
          <div className={cn('inline-flex items-center gap-1.5 cursor-default', className)}>
            <div className="flex -space-x-1.5 overflow-hidden">
              <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-semibold text-primary ring-1 ring-background">
                {getInitials(primary)}
              </span>
              <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground ring-1 ring-background">
                +{rest.length}
              </span>
            </div>
            <span className="text-xs text-foreground font-medium truncate max-w-[120px]">
              {primary}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p className="font-semibold mb-1">Assignees ({assignees.length})</p>
          <ul className="space-y-0.5">
            {assignees.map((name, idx) => (
              <li key={idx} className="text-muted-foreground">{name}</li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Unassigned state
  if (!assignee || assigneeType === 'unassigned' || assignee.toLowerCase() === 'unassigned') {
    return (
      <div className={cn('inline-flex items-center gap-1.5 group/assignee', className)}>
        {onAssignClick ? (
          <button
            type="button"
            onClick={onAssignClick}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors py-0.5 px-1.5 -ml-1.5 rounded hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            title="Click to assign case"
          >
            <UserPlus className="size-3.5 shrink-0 text-muted-foreground group-hover/assignee:text-primary transition-colors" />
            <span>Unassigned</span>
            {showQuickAssign && (
              <span className="text-[10px] font-medium text-primary ml-1 opacity-0 group-hover/assignee:opacity-100 transition-opacity">
                Assign
              </span>
            )}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <UserPlus className="size-3.5 shrink-0 text-muted-foreground" />
            <span>Unassigned</span>
          </span>
        )}
      </div>
    );
  }

  // Team assignee (e.g. "Field Team", "Field Team Alpha")
  const isTeam =
    assigneeType === 'team' ||
    assignee.toLowerCase().includes('team') ||
    assignee.toLowerCase().includes('crew');

  if (isTeam) {
    return (
      <div className={cn('inline-flex items-center gap-1.5', className)}>
        <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground ring-1 ring-border">
          <Users className="size-3" />
        </span>
        <span className="text-xs text-foreground font-medium truncate max-w-[130px]" title={assignee}>
          {assignee}
        </span>
      </div>
    );
  }

  // Individual Person assignee
  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-semibold text-primary ring-1 ring-border">
        {getInitials(assignee)}
      </span>
      <span className="text-xs text-foreground font-medium truncate max-w-[130px]" title={assignee}>
        {assignee}
      </span>
    </div>
  );
};
