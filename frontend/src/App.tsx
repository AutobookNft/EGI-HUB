import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import ComingSoon from './pages/ComingSoon'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProjectProvider } from './contexts/ProjectContext'

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

// Global Project Management (SuperAdmin)
// NOTE: In EGI-HUB, "Projects" are SaaS applications (NATAN_LOC, EGI, etc.)
// "Tenants" are the end customers within each project (Comuni, Gallerie, etc.)
import ProjectsList from './pages/projects/ProjectsList'
import CreateProject from './pages/projects/CreateProject'
import ProjectActivity from './pages/projects/ProjectActivity'
import ProjectAdminsList from './pages/projects/ProjectAdminsList'
import TenantConfigurations from './pages/tenants/TenantConfigurations'
import TenantPlans from './pages/tenants/TenantPlans'
import TenantStorage from './pages/tenants/TenantStorage'

// Project Context Pages (when inside a specific project)
import ProjectDashboard from './pages/projects/ProjectDashboard'

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
    return <Navigate to="/" replace />;
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
        {/* ============================================ */}
        {/* GLOBAL CONTEXT (No project selected)        */}
        {/* ============================================ */}
        
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
        
        {/* Global Project Management (SuperAdmin only) */}
        <Route path="projects" element={<ProjectsList />} />
        <Route path="projects/create" element={<CreateProject />} />
        <Route path="projects/configurations" element={<TenantConfigurations />} />
        <Route path="projects/plans" element={<TenantPlans />} />
        <Route path="projects/activity" element={<ProjectActivity />} />
        <Route path="projects/storage" element={<TenantStorage />} />
        
        {/* System Settings */}
        <Route path="system/config" element={<SystemConfig />} />
        <Route path="system/domains" element={<SystemDomains />} />
        <Route path="system/security" element={<SystemSecurity />} />
        <Route path="system/notifications" element={<SystemNotifications />} />
        
        {/* ============================================ */}
        {/* PROJECT CONTEXT (Inside a specific project) */}
        {/* ============================================ */}
        
        {/* Project Dashboard */}
        <Route path="project/:slug" element={<ProjectDashboard />} />
        <Route path="project/:slug/activity" element={<ComingSoon title="Attività Progetto" />} />
        
        {/* Tenants Management (inside project) */}
        <Route path="project/:slug/tenants" element={<ComingSoon title="Lista Tenants" />} />
        <Route path="project/:slug/tenants/create" element={<ComingSoon title="Nuovo Tenant" />} />
        
        {/* Project Settings */}
        <Route path="project/:slug/settings" element={<ComingSoon title="Impostazioni Progetto" />} />
        <Route path="project/:slug/integrations" element={<ComingSoon title="Integrazioni" />} />
        
        {/* Project Admin */}
        <Route path="project/:slug/admins" element={<ProjectAdminsList />} />
        <Route path="project/:slug/permissions" element={<ComingSoon title="Permessi" />} />
        
        {/* Legacy routes (deprecated) */}
        <Route path="tenants" element={<ProjectsList />} />
        <Route path="tenants/create" element={<CreateProject />} />
        <Route path="my-projects" element={<Navigate to="/" replace />} />
        <Route path="projects/:slug/dashboard" element={<Navigate to="/project/:slug" replace />} />
        <Route path="projects/:slug/admins" element={<Navigate to="/project/:slug/admins" replace />} />
        
        {/* Catch-all for unimplemented routes */}
        <Route path="*" element={<ComingSoon title="Coming Soon" />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <AppRoutes />
      </ProjectProvider>
    </AuthProvider>
  );
}

export default App
