import { Briefcase, ExternalLink, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/ToastContext';
import type { FalconEvent } from '@/data/events';
import type { EventDetailViewModel } from '@/types/eventDetail';

export interface CaseCardProps {
  event: FalconEvent | EventDetailViewModel;
}

export const CaseCard: React.FC<CaseCardProps> = ({ event }) => {
  const { addToast } = useToast();

  if (!event.caseId) return null;

  const handleOpenCase = () => {
    addToast('info', `Opening Case ${event.caseId} management module`);
  };

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Briefcase className="size-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-foreground">Linked Operational Case</h3>
        </div>

        <span className="font-mono text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
          {event.caseId}
        </span>
      </div>

      {/* Case Details */}
      <div className="p-4 flex flex-col gap-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-medium">Case Status</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            Field Dispatched
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-medium">Case Owner</span>
          <span className="font-medium text-foreground flex items-center gap-1">
            <User className="size-3 text-muted-foreground" />
            <span>{event.assignee || 'Haris Danial (Field Lead)'}</span>
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-medium">Case Age</span>
          <span className="font-medium text-foreground flex items-center gap-1">
            <Clock className="size-3 text-muted-foreground" />
            <span>Active</span>
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-medium">SLA Target</span>
          <span className="font-medium text-foreground">4h resolution target</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenCase}
          className="w-full mt-1 text-xs gap-1.5 border-border text-foreground hover:bg-muted"
        >
          <ExternalLink className="size-3.5" />
          <span>Open Field Case File</span>
        </Button>
      </div>
    </div>
  );
};
