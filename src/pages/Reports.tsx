import { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ReportsPageHeader } from '@/components/reports/ReportsPageHeader';
import { ReportsTabs, type ReportsTabKey } from '@/components/reports/ReportsTabs';
import { LibraryTab } from '@/components/reports/LibraryTab';
import { ScheduledTab } from '@/components/reports/ScheduledTab';
import { HistoryTab } from '@/components/reports/HistoryTab';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { getRoleFromAccountLabel, getReportPermissions } from '@/lib/permissions';
import type { ReportTemplateMeta, ReportSnapshot, ScheduledReportConfig } from '@/types/reports';

export default function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { accountLabel } = useAppContext();
  const { addToast } = useToast();

  // Active tab state synced with URL query parameter
  const tabParam = (searchParams.get('tab') || 'library').toLowerCase();
  const activeTab: ReportsTabKey =
    tabParam === 'scheduled' || tabParam === 'history' ? tabParam : 'library';

  const setTab = (newTab: ReportsTabKey) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', newTab);
      return next;
    });
  };

  // Derive role and permissions
  const userRole = useMemo(() => getRoleFromAccountLabel(accountLabel), [accountLabel]);
  const permissions = useMemo(() => getReportPermissions(userRole), [userRole]);

  // Handle report navigation
  const handleOpenReport = (template: ReportTemplateMeta) => {
    navigate(`/reports/${template.slug}`);
  };

  const handleOpenSnapshot = (snapshot: ReportSnapshot) => {
    navigate(`/reports/${snapshot.templateId}?snapshot=${snapshot.id}`);
  };

  const handleRerunSnapshot = (snapshot: ReportSnapshot) => {
    navigate(`/reports/${snapshot.templateId}?snapshot=${snapshot.id}&rerun=true`);
  };

  const handleRunScheduledNow = (schedule: ScheduledReportConfig) => {
    addToast(
      'success',
      `Executing ${schedule.reportName}. Fresh snapshot generated.`,
      'Report executed'
    );
    navigate(`/reports/${schedule.templateId}?scheduled=true`);
  };

  const handleNewSchedule = () => {
    addToast(
      'info',
      'Select a report to configure an automated recurring schedule.',
      'Schedule report'
    );
    setTab('library');
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4">
      {/* Header */}
      <ReportsPageHeader
        title="Reports"
        subtitle="Ready made reports for operations, management and review."
        onRefresh={() => {
          addToast(
            'info',
            'Reports catalog and metadata synced with latest state.',
            'Data refreshed'
          );
        }}
        onNewSchedule={handleNewSchedule}
        permissions={permissions}
      />

      {/* Tab Bar */}
      <ReportsTabs
        activeTab={activeTab}
        onSelectTab={setTab}
        libraryCount={12}
        scheduledCount={3}
        historyCount={3}
      />

      {/* Tab Panels */}
      {activeTab === 'library' && (
        <LibraryTab
          userRole={userRole}
          permissions={permissions}
          onOpenReport={handleOpenReport}
        />
      )}

      {activeTab === 'scheduled' && (
        <ScheduledTab
          permissions={permissions}
          onNewSchedule={handleNewSchedule}
          onRunNow={handleRunScheduledNow}
        />
      )}

      {activeTab === 'history' && (
        <HistoryTab
          permissions={permissions}
          onOpenSnapshot={handleOpenSnapshot}
          onRerunSnapshot={handleRerunSnapshot}
        />
      )}
    </div>
  );
}
