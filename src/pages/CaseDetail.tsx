import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useCases } from '@/contexts/CasesContext';
import { useEvents } from '@/contexts/EventsContext';
import { CaseWorkspaceHeader } from '@/components/cases/detail/CaseWorkspaceHeader';
import { CaseWorkflowTracker } from '@/components/cases/detail/CaseWorkflowTracker';
import { CaseSourceEventCard } from '@/components/cases/detail/CaseSourceEventCard';
import { CaseEvidenceCard } from '@/components/cases/detail/CaseEvidenceCard';
import { CaseRecentActivityCard } from '@/components/cases/detail/CaseRecentActivityCard';
import { CaseDetailsCard } from '@/components/cases/detail/CaseDetailsCard';
import { CaseLocationCard } from '@/components/cases/detail/CaseLocationCard';
import { CaseVerificationTab } from '@/components/cases/detail/tabs/CaseVerificationTab';
import { CaseFieldFindingsTab } from '@/components/cases/detail/tabs/CaseFieldFindingsTab';
import { CaseClosureTab } from '@/components/cases/detail/tabs/CaseClosureTab';
import { CaseActivityTab } from '@/components/cases/detail/tabs/CaseActivityTab';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiMode } from '@/contexts/UiModeContext';
import { joinCaseWithEvent, createEventMap } from '@/data/caseSelectors';

export type CaseDetailTab =
  | 'overview'
  | 'verification'
  | 'field_findings'
  | 'closure'
  | 'activity';

interface TabItem {
  key: CaseDetailTab;
  label: string;
}

const TABS: TabItem[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'verification', label: 'Verification' },
  { key: 'field_findings', label: 'Field findings' },
  { key: 'closure', label: 'Closure' },
  { key: 'activity', label: 'Activity' },
];

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { getCaseById } = useCases();
  const { events } = useEvents();
  const { isTablet, orientation } = useUiMode();
  const isPortrait = isTablet && orientation === 'portrait';

  // Tab state synced with URL query param `?tab=...` (Section 7.4)
  const initialTab = (searchParams.get('tab') as CaseDetailTab) || 'overview';
  const [activeTab, setActiveTab] = useState<CaseDetailTab>(
    TABS.some((t) => t.key === initialTab) ? initialTab : 'overview'
  );

  useEffect(() => {
    const currentParam = searchParams.get('tab') as CaseDetailTab;
    if (currentParam && currentParam !== activeTab && TABS.some((t) => t.key === currentParam)) {
      setActiveTab(currentParam);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (tab: CaseDetailTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams);
    if (tab === 'overview') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    setSearchParams(params, { replace: true });
  };

  const rawCase = id ? getCaseById(id) : undefined;
  const eventMap = createEventMap(events);
  const caseData = rawCase ? joinCaseWithEvent(rawCase, eventMap) : undefined;

  if (!caseData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-[500px]">
        <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <Inbox className="size-6 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Case not found</h2>
        <p className="text-xs text-muted-foreground max-w-sm mb-4">
          The requested case ID could not be found or may have been removed.
        </p>
        <Button variant="outline" onClick={() => navigate('/cases')} className="gap-2 text-xs">
          <ArrowLeft className="size-4" />
          <span>Back to Cases</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-background text-foreground animate-in fade-in duration-200">
      <div className="p-4 sm:p-6 max-w-[1600px] w-full mx-auto space-y-5 pb-20 sm:pb-8">
        {/* 7.1 Header */}
        <CaseWorkspaceHeader
          caseData={caseData}
          onOpenClosureTab={() => handleTabChange('closure')}
        />

        {/* 7.2 Workflow Tracker */}
        <div className="overflow-x-auto scrollbar-none pb-1">
          <CaseWorkflowTracker caseData={caseData} />
        </div>

        {/* 7.4 Tabs Bar */}
        <div className="border-b border-border">
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none" aria-label="Case tabs">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTabChange(tab.key)}
                  className={cn(
                    'border-b-2 transition-colors whitespace-nowrap cursor-pointer',
                    isTablet ? 'px-5 py-3 text-sm min-h-[44px]' : 'px-3.5 py-2.5 text-xs font-medium',
                    isActive
                      ? 'border-primary text-primary font-semibold'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* 7.3 Two Column Layout (Landscape: ~60% main / ~40% side, Portrait: 1 column) */}
        <div className={cn(
          "gap-6 items-start",
          isPortrait ? "flex flex-col" : "grid grid-cols-1 md:grid-cols-12 xl:grid-cols-12"
        )}>
          {/* Main Column */}
          <div className={cn("space-y-6 w-full", !isPortrait && "md:col-span-7 xl:col-span-8")}>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <CaseSourceEventCard caseData={caseData} />
                <CaseEvidenceCard caseData={caseData} />
                <CaseRecentActivityCard
                  activities={caseData.activities}
                  onOpenAllActivity={() => handleTabChange('activity')}
                />
              </div>
            )}

            {/* Verification Tab */}
            {activeTab === 'verification' && (
              <CaseVerificationTab caseData={caseData} />
            )}

            {/* Field Findings Tab */}
            {activeTab === 'field_findings' && (
              <CaseFieldFindingsTab caseData={caseData} />
            )}

            {/* Closure Tab */}
            {activeTab === 'closure' && (
              <CaseClosureTab caseData={caseData} />
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <CaseActivityTab activities={caseData.activities} />
            )}
          </div>

          {/* Side Column */}
          <div className={cn("space-y-6 w-full", !isPortrait && "md:col-span-5 xl:col-span-4")}>
            {/* Case Details Card */}
            <CaseDetailsCard caseData={caseData} />

            {/* Location Card */}
            <CaseLocationCard caseData={caseData} />
          </div>
        </div>
      </div>
    </div>
  );
}
