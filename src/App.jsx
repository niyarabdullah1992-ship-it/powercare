import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import { I18nProvider } from '@/lib/i18n';
import { AuthProvider as PowerCareAuthProvider, useAuth as usePowerCareAuth } from '@/lib/PowerCareAuth';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import OwnerPanel from './pages/OwnerPanel';

import Landing from './pages/Landing';
import Pricing from './pages/Pricing';
import PricingSuccess from './pages/PricingSuccess';
import Dashboard from './pages/Dashboard';
import MyTasks from './pages/MyTasks';
import StationChat from './pages/StationChat';
import Complaints from './pages/Complaints';
import Stations from './pages/Stations';
import Employees from './pages/Employees';
import EmployeeProfile from './pages/EmployeeProfile';
import HR from './pages/HR';

import Safety from './pages/Safety';
import Performance from './pages/Performance';
import Reports from './pages/Reports';
import DailyReport from './pages/DailyReport';
import Attendance from './pages/Attendance';
import Files from './pages/Files';
import Assistant from './pages/Assistant';

function RequireAuth({ children }) {
  const { session } = usePowerCareAuth();
  if (!session) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/pricing-success" element={<PricingSuccess />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/owner-panel" element={<OwnerPanel />} />
      </Route>
      <Route path="/app" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/app/tasks" element={<RequireAuth><MyTasks /></RequireAuth>} />
      <Route path="/app/chat" element={<RequireAuth><StationChat /></RequireAuth>} />

      <Route path="/app/complaints" element={<RequireAuth><Complaints /></RequireAuth>} />
      <Route path="/app/stations" element={<RequireAuth><Stations /></RequireAuth>} />
      <Route path="/app/employees" element={<RequireAuth><Employees /></RequireAuth>} />
      <Route path="/app/employees/:employeeId" element={<RequireAuth><EmployeeProfile /></RequireAuth>} />
      <Route path="/app/hr" element={<RequireAuth><HR /></RequireAuth>} />
      <Route path="/app/safety" element={<RequireAuth><Safety /></RequireAuth>} />
      <Route path="/app/performance" element={<RequireAuth><Performance /></RequireAuth>} />
      <Route path="/app/reports" element={<RequireAuth><Reports /></RequireAuth>} />
      <Route path="/app/daily-report" element={<RequireAuth><DailyReport /></RequireAuth>} />
      <Route path="/app/attendance" element={<RequireAuth><Attendance /></RequireAuth>} />
      <Route path="/app/files" element={<RequireAuth><Files /></RequireAuth>} />
      <Route path="/app/assistant" element={<RequireAuth><Assistant /></RequireAuth>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <I18nProvider>
            <PowerCareAuthProvider>
              <AppRoutes />
            </PowerCareAuthProvider>
          </I18nProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App