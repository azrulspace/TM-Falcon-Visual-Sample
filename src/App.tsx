import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { AppShell } from './components/AppShell';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Overview from './pages/Overview';
import Events from './pages/Events';
import Risk from './pages/Risk';
import Inventory from './pages/Inventory';
import CreateDevice from './pages/CreateDevice';
import DeviceDetail from './pages/DeviceDetail';
import PlannedPage from './pages/PlannedPage';

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
      <Routes>
        <Route path="/" element={<DefaultRedirect />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        
        <Route path="/overview" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
        <Route path="/risk" element={<ProtectedRoute><Risk /></ProtectedRoute>} />
        <Route path="/assets/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
        <Route path="/assets/inventory/devices/new" element={<ProtectedRoute><CreateDevice /></ProtectedRoute>} />
        <Route path="/assets/inventory/devices/:id" element={<ProtectedRoute><DeviceDetail /></ProtectedRoute>} />
        <Route path="/assets/inventory/devices/:id/edit" element={<ProtectedRoute><CreateDevice /></ProtectedRoute>} />
        
        <Route path="*" element={<ProtectedRoute><PlannedPage /></ProtectedRoute>} />
      </Routes>
    </AppProvider>
  );
}
