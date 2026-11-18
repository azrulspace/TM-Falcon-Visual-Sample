import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { UiModeProvider } from './contexts/UiModeContext';
import { OverviewProvider } from './contexts/OverviewContext';
import { EventsProvider } from './contexts/EventsContext';
import { CasesProvider } from './contexts/CasesContext';
import { AssetsProvider } from './contexts/AssetsContext';
import { AppShell } from './components/AppShell';
import { TooltipProvider } from './components/ui/tooltip';
import { PreviewFrameModal } from './components/common/PreviewFrameModal';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Overview from './pages/Overview';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Risk from './pages/Risk';
import Poles from './pages/Poles';
import PoleDetail from './pages/PoleDetail';
import CableSpans from './pages/CableSpans';
import Inventory from './pages/Inventory';
import VendorDiscovery from './pages/VendorDiscovery';
import CreateDevice from './pages/CreateDevice';
import DeviceDetail from './pages/DeviceDetail';
import PlannedPage from './pages/PlannedPage';
import Cases from './pages/Cases';
import CaseDetail from './pages/CaseDetail';
import Reports from './pages/Reports';
import SchedulesPage from './pages/SchedulesPage';
import SavedRunsPage from './pages/SavedRunsPage';
import { ReportViewerPage } from './pages/ReportViewerPage';
import { LiveViewPage, LiveViewRedirect } from './pages/LiveViewPage';
import { LiveStreamProvider } from './contexts/LiveStreamContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { accountLabel } = useAppContext();
  const location = useLocation();
  if (!accountLabel) return <Navigate to="/signin" state={{ from: location }} replace />;
  return <AppShell>{children}</AppShell>;
};

const DefaultRedirect = () => {
  const { accountLabel } = useAppContext();
  return <Navigate to={accountLabel ? "/overview" : "/signin"} replace />;
};

export default function App() {
  return (
    <AppProvider>
      <UiModeProvider>
        <OverviewProvider>
          <EventsProvider>
            <CasesProvider>
              <AssetsProvider>
                <LiveStreamProvider>
                  <TooltipProvider>
                    <Routes>
                      <Route path="/" element={<DefaultRedirect />} />
                      <Route path="/signin" element={<SignIn />} />
                      <Route path="/signup" element={<SignUp />} />
                      
                      <Route path="/overview" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
                      <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
                      <Route path="/events/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
                      <Route path="/cases" element={<ProtectedRoute><Cases /></ProtectedRoute>} />
                      <Route path="/cases/:id" element={<ProtectedRoute><CaseDetail /></ProtectedRoute>} />
                      <Route path="/planned/cases" element={<Navigate to="/cases" replace />} />
                      <Route path="/risk" element={<ProtectedRoute><Risk /></ProtectedRoute>} />
                      <Route path="/assets" element={<Navigate to="/assets/poles" replace />} />
                      <Route path="/assets/poles" element={<ProtectedRoute><Poles /></ProtectedRoute>} />
                      <Route path="/assets/poles/:id" element={<ProtectedRoute><PoleDetail /></ProtectedRoute>} />
                      <Route path="/assets/cable-spans" element={<ProtectedRoute><CableSpans /></ProtectedRoute>} />
                      <Route path="/assets/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
                      <Route path="/assets/devices" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
                      <Route path="/assets/inventory/vendor-discovery" element={<ProtectedRoute><VendorDiscovery /></ProtectedRoute>} />
                      <Route path="/assets/inventory/devices/new" element={<ProtectedRoute><CreateDevice /></ProtectedRoute>} />
                      <Route path="/assets/inventory/devices/:id" element={<ProtectedRoute><DeviceDetail /></ProtectedRoute>} />
                      <Route path="/assets/inventory/devices/:id/edit" element={<ProtectedRoute><CreateDevice /></ProtectedRoute>} />
                      
                      <Route path="/live" element={<ProtectedRoute><LiveViewRedirect /></ProtectedRoute>} />
                      <Route path="/live/single" element={<ProtectedRoute><LiveViewRedirect /></ProtectedRoute>} />
                      <Route path="/live/single/:deviceId" element={<ProtectedRoute><LiveViewPage mode="single" /></ProtectedRoute>} />
                      <Route path="/live/monitor" element={<ProtectedRoute><LiveViewRedirect /></ProtectedRoute>} />
                      <Route path="/live/monitor/:groupId" element={<ProtectedRoute><LiveViewPage mode="monitor" /></ProtectedRoute>} />
                      <Route path="/live/:deviceId" element={<ProtectedRoute><LiveViewPage /></ProtectedRoute>} />
                      <Route path="/planned/live" element={<Navigate to="/live" replace />} />
                      <Route path="/planned/live/*" element={<Navigate to="/live" replace />} />

                      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                      <Route path="/reports/schedules" element={<ProtectedRoute><SchedulesPage /></ProtectedRoute>} />
                      <Route path="/reports/saved" element={<ProtectedRoute><SavedRunsPage /></ProtectedRoute>} />
                      <Route path="/reports/:slug" element={<ProtectedRoute><ReportViewerPage /></ProtectedRoute>} />
                      <Route path="/planned/reports" element={<Navigate to="/reports" replace />} />
                      <Route path="/planned/reports/*" element={<Navigate to="/reports" replace />} />
                      <Route path="*" element={<ProtectedRoute><PlannedPage /></ProtectedRoute>} />
                    </Routes>
                    <PreviewFrameModal />
                  </TooltipProvider>
                </LiveStreamProvider>
              </AssetsProvider>
            </CasesProvider>
          </EventsProvider>
        </OverviewProvider>
      </UiModeProvider>
    </AppProvider>
  );
}
