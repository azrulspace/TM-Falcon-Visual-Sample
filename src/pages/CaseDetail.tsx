import { useParams, useNavigate } from 'react-router-dom';
import { useCases } from '@/contexts/CasesContext';
import { CaseStatusBadge } from '@/components/common/CaseStatusBadge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCaseById } = useCases();

  const caseData = id ? getCaseById(id) : undefined;

  if (!caseData) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold">Case not found</h2>
        <Button variant="outline" onClick={() => navigate('/cases')}>
          <ArrowLeft className="size-4 mr-2" />
          Back to Cases
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-background text-foreground animate-in fade-in duration-200">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/cases')}>
            <ArrowLeft className="size-4 mr-1.5" />
            Cases
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="font-mono text-sm font-semibold">{caseData.id}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{caseData.id} · {caseData.title}</h1>
            <CaseStatusBadge status={caseData.status} />
          </div>
        </div>
      </div>
    </div>
  );
}
