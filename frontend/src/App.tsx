import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import ComingSoon from './pages/ComingSoon'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// AI Management
import AiConsultations from './pages/ai/Consultations'
import AiCredits from './pages/ai/Credits'
import AiFeatures from './pages/ai/Features'
import AiStatistics from './pages/ai/Statistics'

// Tokenomics
import Egili from './pages/tokenomics/Egili'
import Equilibrium from './pages/tokenomics/Equilibrium'

// Platform Management
import Roles from './pages/platform/Roles'
import FeaturePricing from './pages/platform/FeaturePricing'
import Promotions from './pages/platform/Promotions'
import FeaturedCalendar from './pages/platform/FeaturedCalendar'
import ConsumptionLedger from './pages/platform/ConsumptionLedger'

// Padmin Analyzer
import PadminDashboard from './pages/padmin/Dashboard'
import PadminViolations from './pages/padmin/Violations'
import PadminSymbols from './pages/padmin/Symbols'
import PadminSearch from './pages/padmin/Search'
import PadminStatistics from './pages/padmin/Statistics'

// Project Management (was Tenant Management - renamed for clarity)
// NOTE: In EGI-HUB, "Projects" are SaaS applications (NATAN_LOC, EGI, etc.)
// "Tenants" are the end customers within each project (Comuni, Gallerie, etc.)
import ProjectsList from './pages/projects/ProjectsList'
import CreateProject from './pages/projects/CreateProject'
import ProjectActivity from './pages/projects/ProjectActivity'
import MyProjects from './pages/projects/MyProjects'
import ProjectDashboard from './pages/projects/ProjectDashboard'
import ProjectAdminsList from './pages/projects/ProjectAdminsList'
import TenantConfigurations from './pages/tenants/TenantConfigurations'
import TenantPlans from './pages/tenants/TenantPlans'
import TenantStorage from './pages/tenants/TenantStorage'

// System Settings
import SystemConfig from './pages/system/SystemConfig'
import SystemDomains from './pages/system/SystemDomains'
import SystemSecurity from './pages/system/SystemSecurity'
import SystemNotifications from './pages/system/SystemNotifications'

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Public Route (redirects to dashboard if already logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/my-projects" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />
      
      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        {/* Overview */}
        <Route index element={<Dashboard />} />
        
        {/* AI Management */}
        <Route path="ai/consultations" element={<AiConsultations />} />
        <Route path="ai/credits" element={<AiCredits />} />
        <Route path="ai/features" element={<AiFeatures />} />
        <Route path="ai/statistics" element={<AiStatistics />} />
        
        {/* Tokenomics */}
        <Route path="tokenomics/egili" element={<Egili />} />
        <Route path="tokenomics/equilibrium" element={<Equilibrium />} />
        
        {/* Platform Management */}
        <Route path="platform/roles" element={<Roles />} />
        <Route path="platform/pricing" element={<FeaturePricing />} />
        <Route path="platform/promotions" element={<Promotions />} />
        <Route path="platform/featured-calendar" element={<FeaturedCalendar />} />
        <Route path="platform/consumption-ledger" element={<ConsumptionLedger />} />
        
        {/* Padmin Analyzer */}
        <Route path="padmin/dashboard" element={<PadminDashboard />} />
        <Route path="padmin/violations" element={<PadminViolations />} />
        <Route path="padmin/symbols" element={<PadminSymbols />} />
        <Route path="padmin/search" element={<PadminSearch />} />
        <Route path="padmin/statistics" element={<PadminStatistics />} />
        
        {/* Project Management (SaaS applications: NATAN_LOC, EGI, etc.) */}
        <Route path="projects" element={<ProjectsList />} />
        <Route path="projects/create" element={<CreateProject />} />
        <Route path="projects/configurations" element={<TenantConfigurations />} />
        <Route path="projects/plans" element={<TenantPlans />} />
        <Route path="projects/activity" element={<ProjectActivity />} />
        <Route path="projects/storage" element={<TenantStorage />} />
        
        {/* My Projects (user's accessible projects) */}
        <Route path="my-projects" element={<MyProjects />} />
        
        {/* Project Admin Routes (inside a project) */}
        <Route path="projects/:slug/dashboard" element={<ProjectDashboard />} />
        <Route path="projects/:slug/admins" element={<ProjectAdminsList />} />
        
        {/* Legacy routes (deprecated, kept for backward compatibility) */}
        <Route path="tenants" element={<ProjectsList />} />
        <Route path="tenants/create" element={<CreateProject />} />
        
        {/* System Settings */}
        <Route path="system/config" element={<SystemConfig />} />
        <Route path="system/domains" element={<SystemDomains />} />
        <Route path="system/security" element={<SystemSecurity />} />
        <Route path="system/notifications" element={<SystemNotifications />} />
        
        {/* Catch-all for unimplemented routes */}
        <Route path="*" element={<ComingSoon title="Coming Soon" />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App
