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
import CreateDevice from './pages/CreateDevice';
import DeviceDetail from './pages/DeviceDetail';
import PlannedPage from './pages/PlannedPage';
import Cases from './pages/Cases';
import CaseDetail from './pages/CaseDetail';

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
                    <Route path="/assets/inventory/devices/new" element={<ProtectedRoute><CreateDevice /></ProtectedRoute>} />
                    <Route path="/assets/inventory/devices/:id" element={<ProtectedRoute><DeviceDetail /></ProtectedRoute>} />
                    <Route path="/assets/inventory/devices/:id/edit" element={<ProtectedRoute><CreateDevice /></ProtectedRoute>} />
                    
                    <Route path="*" element={<ProtectedRoute><PlannedPage /></ProtectedRoute>} />
                  </Routes>
                  <PreviewFrameModal />
                </TooltipProvider>
              </AssetsProvider>
            </CasesProvider>
          </EventsProvider>
        </OverviewProvider>
      </UiModeProvider>
    </AppProvider>
  );
}
