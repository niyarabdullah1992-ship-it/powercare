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

import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Landing stays eager so the first paint is instant; every other page is
// lazy-loaded on demand — the initial bundle shrinks dramatically.
import Landing from './pages/Landing';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const OwnerPanel = lazy(() => import('./pages/OwnerPanel'));
const Pricing = lazy(() => import('./pages/Pricing'));
const PricingSuccess = lazy(() => import('./pages/PricingSuccess'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MyTasks = lazy(() => import('./pages/MyTasks'));
const StationChat = lazy(() => import('./pages/StationChat'));
const Complaints = lazy(() => import('./pages/Complaints'));
const Stations = lazy(() => import('./pages/Stations'));
const Employees = lazy(() => import('./pages/Employees'));
const EmployeeProfile = lazy(() => import('./pages/EmployeeProfile'));
const HR = lazy(() => import('./pages/HR'));
const Performance = lazy(() => import('./pages/Performance'));
const Reports = lazy(() => import('./pages/Reports'));
const DailyReport = lazy(() => import('./pages/DailyReport'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Files = lazy(() => import('./pages/Files'));
const FileSigning = lazy(() => import('./pages/FileSigning'));
const Assistant = lazy(() => import('./pages/Assistant'));
const About = lazy(() => import('./pages/About'));
const Help = lazy(() => import('./pages/Help'));

// After the first page is interactive, quietly download the most-used pages in
// the background so navigating to them later is instant.
if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 2000));
    idle(() => {
      import('./pages/Dashboard');
      import('./pages/MyTasks');
      import('./pages/Attendance');
      import('./pages/StationChat');
      import('./pages/Reports');
      import('./pages/DailyReport');
      import('./pages/Login');
    });
  });
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-6 h-6 animate-spin text-accent" />
    </div>
  );
}

function RequireAuth({ children }) {
  const { session } = usePowerCareAuth();
  if (!session) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/about" element={<About />} />
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
      <Route path="/app/performance" element={<RequireAuth><Performance /></RequireAuth>} />
      <Route path="/app/reports" element={<RequireAuth><Reports /></RequireAuth>} />
      <Route path="/app/daily-report" element={<RequireAuth><DailyReport /></RequireAuth>} />
      <Route path="/app/attendance" element={<RequireAuth><Attendance /></RequireAuth>} />
      <Route path="/app/files" element={<RequireAuth><Files /></RequireAuth>} />
      <Route path="/app/signing" element={<RequireAuth><FileSigning /></RequireAuth>} />
      <Route path="/app/assistant" element={<RequireAuth><Assistant /></RequireAuth>} />
      <Route path="/app/help" element={<RequireAuth><Help /></RequireAuth>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
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