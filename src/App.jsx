import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import PlatformMusicButton from '@/components/PlatformMusicButton';
import SyncFailureAlerts from '@/components/SyncFailureAlerts';
import { I18nProvider } from '@/lib/i18n';
import { PeriodProvider } from '@/lib/PeriodContext';
import { AuthProvider as PowerCareAuthProvider, useAuth as usePowerCareAuth } from '@/lib/PowerCareAuth';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import TrialExpiryGate from '@/components/TrialExpiryGate';
import AppErrorBoundary from '@/components/AppErrorBoundary';
import { canAccessPath, canAccessPlanPath } from '@/lib/navVisibility';
import { isBase44BackendConfigured } from '@/lib/localPreview';

import { lazy, Suspense, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { applyStoredPlatformTheme } from '@/lib/platformTheme';

// Landing stays eager so the first paint is instant; every other page is
// lazy-loaded on demand — the initial bundle shrinks dramatically.
import Landing from './pages/Landing';
import Assistant from './pages/Assistant';
import LocalPreviewEntry from './pages/LocalPreviewEntry';

const Login = lazy(() => import('./pages/Login'));
const LoginPortal = lazy(() => import('./pages/LoginPortal'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const OwnerPanel = lazy(() => import('./pages/OwnerPanel'));
const Pricing = lazy(() => import('./pages/Pricing'));
const PricingSuccess = lazy(() => import('./pages/PricingSuccess'));
const Mobile = lazy(() => import('./pages/Mobile'));
const SalesDeck = lazy(() => import('./pages/SalesDeck'));
const Careers = lazy(() => import('./pages/Careers'));
const Workspace = lazy(() => import('./pages/Workspace'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Operations = lazy(() => import('./pages/Operations'));
const StationChat = lazy(() => import('./pages/StationChat'));
const Complaints = lazy(() => import('./pages/Complaints'));
const EmployeeProfile = lazy(() => import('./pages/EmployeeProfile'));
const HRStructureManagement = lazy(() => import('./pages/HRStructureManagement'));
const OrgStructure = lazy(() => import('./pages/OrgStructure'));
const CompanySettings = lazy(() => import('./pages/CompanySettings'));
const Reports = lazy(() => import('./pages/Reports'));
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
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const PowerCarePresentation = lazy(() => import('./pages/PowerCarePresentation'));
const PowerCareProfile = lazy(() => import('./pages/PowerCareProfile'));
const PowerCareSapComparisonV2 = lazy(() => import('./pages/PowerCareSapComparisonV2'));
const AcwaComprehensiveProposal = lazy(() => import('./pages/AcwaComprehensiveProposal'));
const AdAudio = lazy(() => import('./pages/AdAudio'));
const CopyrightDoc = lazy(() => import('./pages/CopyrightDoc'));
const SourceCodeDoc = lazy(() => import('./pages/SourceCodeDoc'));
const ProjectGuideDoc = lazy(() => import('./pages/ProjectGuideDoc'));
const TiktokAd = lazy(() => import('./pages/TiktokAd'));
const TruePerformanceDoc = lazy(() => import('./pages/TruePerformanceDoc'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Expenses = lazy(() => import('./pages/Expenses'));
const StationExpenses = lazy(() => import('./pages/StationExpenses'));
const WorkProof = lazy(() => import('./pages/WorkProof'));
const Recruitment = lazy(() => import('./pages/Recruitment'));
const ProofVerify = lazy(() => import('./pages/ProofVerify'));

// Start the workspace chunk immediately when a session already exists so /app
// does not wait for window load — that delay was a blank spinner then a jump.
if (typeof window !== "undefined" && localStorage.getItem("powercare_session")) {
  import('./pages/Dashboard');
  import('./pages/Operations');
  import('./pages/Attendance');
  import('./pages/FileSigning');
}

const LOADER_STYLE = { background: "#F7F8FA", color: "#14284B" };

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={LOADER_STYLE}>
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#14284B" }} />
    </div>
  );
}

function InteriorLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#14284B" }} />
    </div>
  );
}

function RequireAuth({ children }) {
  const { session, company, data, currentUser } = usePowerCareAuth();
  const location = useLocation();
  if (!session) {
    return (
      <Navigate
        to={isBase44BackendConfigured() ? "/login" : "/preview"}
        replace
        state={{ from: location.pathname }}
      />
    );
  }
  // While the workspace is still loading (fresh device / restored account),
  // show a spinner instead of the blank page that pages render without a user.
  if (!data || (session.userId && !currentUser)) return <PageLoader />;
  if (!canAccessPath(location.pathname, currentUser, data, company)) return <Navigate to={canAccessPlanPath(location.pathname, company) ? "/app" : "/pricing"} replace />;
  return (
    <TrialExpiryGate company={company}>
      <Layout>
        <Suspense fallback={<InteriorLoader />}>{children}</Suspense>
      </Layout>
    </TrialExpiryGate>
  );
}

function AppRoutes() {
  const isPlatform = useLocation().pathname.startsWith("/app");
  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/preview" element={<LocalPreviewEntry />} />
      <Route path="/about" element={<About />} />
      <Route path="/mobile" element={<Mobile />} />
      <Route path="/deck" element={<SalesDeck />} />
      <Route path="/careers" element={<Careers />} />
      <Route path="/workspace" element={<Workspace />} />
      <Route path="/workspace/:slug" element={<Workspace />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/pricing-success" element={<PricingSuccess />} />
      <Route path="/login" element={<Login />} />
      <Route path="/login/:portal" element={<LoginPortal />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/sign" element={<PublicSign />} />
      <Route path="/proof" element={<ProofVerify />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/security" element={<Security />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/refund-policy" element={<RefundPolicy />} />
      <Route path="/powercare-presentation" element={<PowerCarePresentation />} />
      <Route path="/powercare-profile" element={<PowerCareProfile />} />
      <Route path="/powercare-sap-comparison" element={<PowerCareSapComparisonV2 />} />
      <Route path="/powercare-sap-comparison-v2" element={<Navigate to="/powercare-sap-comparison" replace />} />
      <Route path="/acwa-powercare-proposal" element={<AcwaComprehensiveProposal />} />
      <Route path="/acwa-executive-brief" element={<Navigate to="/acwa-powercare-proposal" replace />} />
      <Route path="/acwa-pilot-proposal" element={<Navigate to="/acwa-powercare-proposal" replace />} />
      <Route path="/ad-audio" element={<AdAudio />} />
      <Route path="/copyright-doc" element={<CopyrightDoc />} />
      <Route path="/source-code-doc" element={<SourceCodeDoc />} />
      <Route path="/project-guide" element={<ProjectGuideDoc />} />
      <Route path="/manual" element={<ProjectGuideDoc />} />
      <Route path="/tiktok-ad" element={<TiktokAd />} />
      <Route path="/true-performance" element={<TruePerformanceDoc />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/owner-panel" element={<OwnerPanel />} />
      </Route>
      <Route path="/app" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/app/executive" element={<Navigate to="/app" replace />} />
      <Route path="/app/tasks" element={<RequireAuth><Operations /></RequireAuth>} />
      <Route path="/app/tasks-classic" element={<Navigate to="/app/tasks" replace />} />
      <Route path="/app/my-tasks" element={<Navigate to="/app/tasks" replace />} />
      <Route path="/MyTasks" element={<Navigate to="/app/tasks" replace />} />
      <Route path="/app/chat" element={<RequireAuth><StationChat /></RequireAuth>} />

      <Route path="/app/complaints" element={<RequireAuth><Complaints /></RequireAuth>} />
      <Route path="/app/employees/:employeeId" element={<RequireAuth><EmployeeProfile /></RequireAuth>} />
      <Route path="/app/hr" element={<RequireAuth><HRStructureManagement /></RequireAuth>} />
      <Route path="/app/org" element={<RequireAuth><OrgStructure /></RequireAuth>} />
      <Route path="/app/settings" element={<RequireAuth><CompanySettings /></RequireAuth>} />
      <Route path="/app/hiring" element={<RequireAuth><Recruitment /></RequireAuth>} />
      <Route path="/app/payroll" element={<RequireAuth><Payroll /></RequireAuth>} />
      <Route path="/app/performance" element={<RequireAuth><Performance /></RequireAuth>} />
      <Route path="/app/safety" element={<RequireAuth><Safety /></RequireAuth>} />
      <Route path="/app/daily-report" element={<RequireAuth><DailyReport /></RequireAuth>} />
      <Route path="/app/reports" element={<RequireAuth><Reports /></RequireAuth>} />
      <Route path="/app/attendance" element={<RequireAuth><Attendance /></RequireAuth>} />
      <Route path="/app/attendance/shifts" element={<RequireAuth><Attendance /></RequireAuth>} />
      <Route path="/app/attendance/leave" element={<RequireAuth><Attendance /></RequireAuth>} />
      <Route path="/app/shifts" element={<RequireAuth><Attendance /></RequireAuth>} />
      <Route path="/app/leave" element={<RequireAuth><Attendance /></RequireAuth>} />
      <Route path="/app/files" element={<RequireAuth><Files /></RequireAuth>} />
      <Route path="/app/inventory" element={<RequireAuth><Inventory /></RequireAuth>} />
      <Route path="/app/expenses" element={<RequireAuth><Expenses /></RequireAuth>} />
      <Route path="/app/stations/:stationId/expenses" element={<RequireAuth><StationExpenses /></RequireAuth>} />
      <Route path="/app/signing" element={<RequireAuth><FileSigning /></RequireAuth>} />
      <Route path="/app/client-proof" element={<Navigate to="/app/work-proof" replace />} />
      <Route path="/app/work-proof" element={<RequireAuth><WorkProof /></RequireAuth>} />
      <Route path="/app/assistant" element={<RequireAuth><Assistant /></RequireAuth>} />
      <Route path="/app/help" element={<RequireAuth><Help /></RequireAuth>} />
      <Route path="/app/manual" element={<RequireAuth><ProjectGuideDoc /></RequireAuth>} />
      <Route path="/api/*" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    <PlatformMusicButton inPlatform={isPlatform} />
    </Suspense>
  );
}

function PublicThemeBoot() {
  useEffect(() => {
    applyStoredPlatformTheme();
  }, []);
  return null;
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <PublicThemeBoot />
          <ScrollToTop />
          <I18nProvider>
            <PowerCareAuthProvider>
              <SyncFailureAlerts />
              <PeriodProvider>
                <AppErrorBoundary><AppRoutes /></AppErrorBoundary>
              </PeriodProvider>
            </PowerCareAuthProvider>
          </I18nProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App