import React from 'react';
import {
  FolderOpen,
  User,
  Clock,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useOverview } from '@/contexts/OverviewContext';
import type { ResolvedEntity } from '@/lib/selection';
import { initialCases } from '@/data/cases';

export interface CasePopupContentProps {
  entity: ResolvedEntity;
  onClose: () => void;
}

export const CasePopupContent: React.FC<CasePopupContentProps> = ({ entity, onClose }) => {
  const navigate = useNavigate();
  const { selectEntity } = useOverview();

  // Find underlying case record
  const c = initialCases.find((item) => item.id === entity.id) || null;

  const sourceEventId = c?.sourceEventId || 'EVT-0257';
  const assigneeName =
    typeof c?.assignee === 'string'
      ? c.assignee
      : (c?.assignee as any)?.name || 'Unassigned';

  return (
    <div className="space-y-3.5" data-testid="case-popup-content">
      {/* 1. Header & Status */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <FolderOpen className="size-4 text-purple-600 dark:text-purple-400 shrink-0" />
          <h3 className="text-sm font-bold text-foreground leading-snug">
            {c?.title || entity.title || `Case ${entity.id}`}
          </h3>
        </div>
      </div>

      {/* 2. Key Details Grid */}
      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/40 border border-border text-xs">
        <div>
          <span className="text-[10px] text-muted-foreground block">Case ID</span>
          <span className="font-mono font-medium text-purple-600 dark:text-purple-400">{entity.id}</span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground block flex items-center gap-1">
            <User className="size-3 text-muted-foreground/70" />
            Assignee
          </span>
          <span className="text-foreground font-medium text-[11px] truncate block">
            {assigneeName}
          </span>
        </div>

        {/* Source Event Link */}
        <div className="col-span-2 border-t border-border/40 pt-1.5 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <ShieldAlert className="size-3 text-muted-foreground/70" />
            Source event
          </span>
          <button
            type="button"
            onClick={() => selectEntity('event', sourceEventId, { fly: true })}
            className="font-mono text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{sourceEventId}</span>
          </button>
        </div>

        {/* Created Timestamp */}
        {c?.createdAt && (
          <div className="col-span-2 border-t border-border/40 pt-1.5 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="size-3 text-muted-foreground/70" />
              Created
            </span>
            <span className="font-mono text-muted-foreground text-[10.5px]">
              {c.createdAt}
            </span>
          </div>
        )}
      </div>

      {/* 3. Footer Action */}
      <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
        <Button
          size="sm"
          onClick={() => {
            onClose();
            navigate(`/cases?case=${entity.id}`);
          }}
          className="h-8 px-3 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          <span>Open case details</span>
          <ExternalLink className="size-3" />
        </Button>
      </div>
    </div>
  );
};
