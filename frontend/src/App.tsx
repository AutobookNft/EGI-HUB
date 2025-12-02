import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import ComingSoon from './pages/ComingSoon'

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

// Tenant Management
import TenantsList from './pages/tenants/TenantsList'
import CreateTenant from './pages/tenants/CreateTenant'
import TenantConfigurations from './pages/tenants/TenantConfigurations'
import TenantPlans from './pages/tenants/TenantPlans'
import TenantActivity from './pages/tenants/TenantActivity'
import TenantStorage from './pages/tenants/TenantStorage'

// System Settings
import SystemConfig from './pages/system/SystemConfig'
import SystemDomains from './pages/system/SystemDomains'
import SystemSecurity from './pages/system/SystemSecurity'
import SystemNotifications from './pages/system/SystemNotifications'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
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
        
        {/* Tenant Management */}
        <Route path="tenants" element={<TenantsList />} />
        <Route path="tenants/create" element={<CreateTenant />} />
        <Route path="tenants/configurations" element={<TenantConfigurations />} />
        <Route path="tenants/plans" element={<TenantPlans />} />
        <Route path="tenants/activity" element={<TenantActivity />} />
        <Route path="tenants/storage" element={<TenantStorage />} />
        
        {/* System Settings */}
        <Route path="system/config" element={<SystemConfig />} />
        <Route path="system/domains" element={<SystemDomains />} />
        <Route path="system/security" element={<SystemSecurity />} />
        <Route path="system/notifications" element={<SystemNotifications />} />
        
        {/* Catch-all for unimplemented routes */}
        <Route path="*" element={<ComingSoon title="Coming Soon" />} />
      </Route>
    </Routes>
  )
}

export default App
