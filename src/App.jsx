import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import { I18nProvider } from '@/lib/i18n';
import { AuthProvider as PowerCareAuthProvider, useAuth as usePowerCareAuth } from '@/lib/PowerCareAuth';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import TrialExpiryGate from '@/components/TrialExpiryGate';
import AppErrorBoundary from '@/components/AppErrorBoundary';
import { canAccessPath } from '@/lib/navVisibility';

import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Landing stays eager so the first paint is instant; every other page is
// lazy-loaded on demand — the initial bundle shrinks dramatically.
import Landing from './pages/Landing';
import Assistant from './pages/Assistant';

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
const EmployeeProfile = lazy(() => import('./pages/EmployeeProfile'));
const HRStructureManagement = lazy(() => import('./pages/HRStructureManagement'));
const Payroll = lazy(() => import('./pages/Payroll'));
const Performance = lazy(() => import('./pages/Performance'));
const Safety = lazy(() => import('./pages/Safety'));
const DailyReport = lazy(() => import('./pages/DailyReport'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Files = lazy(() => import('./pages/Files'));
const FileSigning = lazy(() => import('./pages/FileSigning'));
const About = lazy(() => import('./pages/About'));
const Help = lazy(() => import('./pages/Help'));
const Verify = lazy(() => import('./pages/Verify'));
const PublicSign = lazy(() => import('./pages/PublicSign'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Security = lazy(() => import('./pages/Security'));
const Terms = lazy(() => import('./pages/Terms'));
const PowerCarePresentation = lazy(() => import('./pages/PowerCarePresentation'));
const AdAudio = lazy(() => import('./pages/AdAudio'));
const CopyrightDoc = lazy(() => import('./pages/CopyrightDoc'));
const SourceCodeDoc = lazy(() => import('./pages/SourceCodeDoc'));
const ProjectGuideDoc = lazy(() => import('./pages/ProjectGuideDoc'));
const SiteManual = lazy(() => import('./pages/SiteManual'));
const TiktokAd = lazy(() => import('./pages/TiktokAd'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Expenses = lazy(() => import('./pages/Expenses'));
const StationExpenses = lazy(() => import('./pages/StationExpenses'));

// After the first page is interactive, quietly download the most-used pages in
// the background so navigating to them later is instant.
if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    if (!localStorage.getItem("powercare_session")) return;
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 5000));
    idle(() => {
      import('./pages/Dashboard');
      import('./pages/MyTasks');
      import('./pages/Attendance');
      import('./pages/FileSigning');
    });
  }, { once: true });
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-6 h-6 animate-spin text-accent" />
    </div>
  );
}

function RequireAuth({ children }) {
  const { session, company, data, currentUser } = usePowerCareAuth();
  const location = useLocation();
  if (!session) return <Navigate to="/" replace />;
  // While the workspace is still loading (fresh device / restored account),
  // show a spinner instead of the blank page that pages render without a user.
  if (!data || (session.userId && !currentUser)) return <PageLoader />;
  if (!canAccessPath(location.pathname, currentUser, data)) return <Navigate to="/app" replace />;
  return <TrialExpiryGate company={company}><Layout>{children}</Layout></TrialExpiryGate>;
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
      <Route path="/verify" element={<Verify />} />
      <Route path="/sign" element={<PublicSign />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/security" element={<Security />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/powercare-presentation" element={<PowerCarePresentation />} />
      <Route path="/ad-audio" element={<AdAudio />} />
      <Route path="/copyright-doc" element={<CopyrightDoc />} />
      <Route path="/source-code-doc" element={<SourceCodeDoc />} />
      <Route path="/project-guide" element={<ProjectGuideDoc />} />
      <Route path="/manual" element={<SiteManual />} />
      <Route path="/tiktok-ad" element={<TiktokAd />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/owner-panel" element={<OwnerPanel />} />
      </Route>
      <Route path="/app" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/app/executive" element={<Navigate to="/app" replace />} />
      <Route path="/app/tasks" element={<RequireAuth><MyTasks /></RequireAuth>} />
      <Route path="/app/chat" element={<RequireAuth><StationChat /></RequireAuth>} />

      <Route path="/app/complaints" element={<RequireAuth><Complaints /></RequireAuth>} />
      <Route path="/app/employees/:employeeId" element={<RequireAuth><EmployeeProfile /></RequireAuth>} />
      <Route path="/app/hr" element={<RequireAuth><HRStructureManagement /></RequireAuth>} />
      <Route path="/app/payroll" element={<RequireAuth><Payroll /></RequireAuth>} />
      <Route path="/app/performance" element={<RequireAuth><Performance /></RequireAuth>} />
      <Route path="/app/safety" element={<RequireAuth><Safety /></RequireAuth>} />
      <Route path="/app/daily-report" element={<RequireAuth><DailyReport /></RequireAuth>} />
      <Route path="/app/attendance" element={<RequireAuth><Attendance /></RequireAuth>} />
      <Route path="/app/files" element={<RequireAuth><Files /></RequireAuth>} />
      <Route path="/app/inventory" element={<RequireAuth><Inventory /></RequireAuth>} />
      <Route path="/app/expenses" element={<RequireAuth><Expenses /></RequireAuth>} />
      <Route path="/app/stations/:stationId/expenses" element={<RequireAuth><StationExpenses /></RequireAuth>} />
      <Route path="/app/signing" element={<RequireAuth><FileSigning /></RequireAuth>} />
      <Route path="/app/assistant" element={<RequireAuth><Assistant /></RequireAuth>} />
      <Route path="/app/help" element={<RequireAuth><Help /></RequireAuth>} />
      <Route path="/app/manual" element={<RequireAuth><SiteManual /></RequireAuth>} />
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
              <AppErrorBoundary><AppRoutes /></AppErrorBoundary>
            </PowerCareAuthProvider>
          </I18nProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App