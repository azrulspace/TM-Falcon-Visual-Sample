import { useCases } from '@/contexts/CasesContext';
import { useEvents } from '@/contexts/EventsContext';
import { CaseStatusBadge } from '@/components/common/CaseStatusBadge';
import { AssigneeCell } from '@/components/common/AssigneeCell';
import { getCaseStatusCounts, getCaseKpiCounts } from '@/data/caseSelectors';

export default function Cases() {
  const { cases } = useCases();
  const { events } = useEvents();

  const statusCounts = getCaseStatusCounts(cases, {}, events);
  const kpis = getCaseKpiCounts(cases);

  return (
    <div className="flex flex-col min-h-full bg-background text-foreground animate-in fade-in duration-200">
      <div className="p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Cases</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Follow-up work raised from events. Open a case to verify, record field findings and decide closure.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 rounded-xl border border-border bg-card">
          <div className="p-2">
            <span className="text-xs text-muted-foreground">Open</span>
            <p className="text-xl font-bold text-foreground">{kpis.open}</p>
          </div>
          <div className="p-2">
            <span className="text-xs text-muted-foreground">In progress</span>
            <p className="text-xl font-bold text-foreground">{kpis.inProgress}</p>
          </div>
          <div className="p-2">
            <span className="text-xs text-muted-foreground">In review</span>
            <p className="text-xl font-bold text-foreground">{kpis.inReview}</p>
          </div>
          <div className="p-2">
            <span className="text-xs text-muted-foreground">Unassigned</span>
            <p className="text-xl font-bold text-foreground">{kpis.unassigned}</p>
          </div>
          <div className="p-2">
            <span className="text-xs text-muted-foreground">Oldest open</span>
            <p className="text-xl font-bold text-foreground">{kpis.oldestOpenAge || '—'}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <span className="text-sm font-semibold">{statusCounts.all} Cases</span>
          </div>
          <div className="divide-y divide-border">
            {cases.map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm font-semibold text-primary">{c.id}</span>
                  <span className="text-sm text-foreground">{c.title}</span>
                </div>
                <div className="flex items-center gap-4">
                  <CaseStatusBadge status={c.status} />
                  <AssigneeCell assignee={c.assignee} assigneeType={c.assigneeType} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
