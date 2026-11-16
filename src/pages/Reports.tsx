import { useMemo } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { useAppContext } from '@/contexts/AppContext';
import { getRoleFromAccountLabel, getReportPermissions } from '@/lib/permissions';
import { getDefaultReportForUser } from '@/data/reportsCatalog';

/**
 * Route /reports handler:
 * Per Stakeholder Verdict:
 * The Reports menu lands directly on an operational report, not on a 2,500px card library page.
 * If query has tab=scheduled -> redirects to /reports/schedules.
 * If query has tab=history -> redirects to /reports/saved.
 * Otherwise -> redirects to the default report based on last opened or user role.
 */
export default function Reports() {
  const [searchParams] = useSearchParams();
  const { accountLabel } = useAppContext();

  // Derive role and permissions unconditionally
  const userRole = useMemo(() => getRoleFromAccountLabel(accountLabel), [accountLabel]);
  const permissions = useMemo(() => getReportPermissions(userRole), [userRole]);

  // Determine landing report
  const defaultReport = useMemo(
    () => getDefaultReportForUser(accountLabel, permissions.canViewAuditLog),
    [accountLabel, permissions.canViewAuditLog]
  );

  // Redirect legacy tabs to dedicated secondary pages
  const tab = searchParams.get('tab');
  if (tab === 'scheduled') {
    return <Navigate to="/reports/schedules" replace />;
  }
  if (tab === 'history') {
    return <Navigate to="/reports/saved" replace />;
  }

  const compareQuery = defaultReport.compareWithPrevious ? '&compare=true' : '';
  const targetUrl = `/reports/${defaultReport.slug}?period=${defaultReport.preset}${compareQuery}`;

  return <Navigate to={targetUrl} replace />;
}
