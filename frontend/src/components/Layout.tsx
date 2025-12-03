import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Brain,
  MessageSquare,
  CreditCard,
  ToggleLeft,
  BarChart3,
  Coins,
  Scale,
  Users,
  DollarSign,
  Megaphone,
  Calendar,
  BookOpen,
  Shield,
  AlertTriangle,
  Code2,
  Search,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Building2,
  UserPlus,
  Settings,
  FileText,
  Activity,
  Database,
  Globe,
  Lock,
  Bell,
  Wrench
} from 'lucide-react';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

interface MenuGroup {
  name: string;
  icon: React.ReactNode;
  items: MenuItem[];
}

/**
 * EGI-HUB SuperAdmin Layout
 * 
 * Replica esatta della struttura enterprise-sidebar di EGI
 * @see /home/fabio/dev/EGI/app/Services/Menu/ContextMenus.php
 */
const menuGroups: MenuGroup[] = [
  {
    name: 'Overview',
    icon: <LayoutDashboard className="w-5 h-5" />,
    items: [
      { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-4 h-4" /> },
    ],
  },
  {
    name: 'Projects',
    icon: <Building2 className="w-5 h-5" />,
    items: [
      { name: 'Tutti i Projects', path: '/projects', icon: <Building2 className="w-4 h-4" /> },
      { name: 'Nuovo Project', path: '/projects/create', icon: <UserPlus className="w-4 h-4" /> },
      { name: 'Configurazioni', path: '/projects/configurations', icon: <Settings className="w-4 h-4" /> },
      { name: 'Piani & Limiti', path: '/projects/plans', icon: <FileText className="w-4 h-4" /> },
      { name: 'Attività Projects', path: '/projects/activity', icon: <Activity className="w-4 h-4" /> },
      { name: 'Database & Storage', path: '/projects/storage', icon: <Database className="w-4 h-4" /> },
    ],
  },
  {
    name: 'AI Management',
    icon: <Brain className="w-5 h-5" />,
    items: [
      { name: 'Consultazioni', path: '/ai/consultations', icon: <MessageSquare className="w-4 h-4" /> },
      { name: 'Crediti', path: '/ai/credits', icon: <CreditCard className="w-4 h-4" /> },
      { name: 'Features', path: '/ai/features', icon: <ToggleLeft className="w-4 h-4" /> },
      { name: 'Statistiche', path: '/ai/statistics', icon: <BarChart3 className="w-4 h-4" /> },
    ],
  },
  {
    name: 'Tokenomics',
    icon: <Coins className="w-5 h-5" />,
    items: [
      { name: 'Egili Management', path: '/tokenomics/egili', icon: <Coins className="w-4 h-4" /> },
      { name: 'Equilibrium', path: '/tokenomics/equilibrium', icon: <Scale className="w-4 h-4" /> },
    ],
  },
  {
    name: 'Platform Management',
    icon: <Users className="w-5 h-5" />,
    items: [
      { name: 'Ruoli', path: '/platform/roles', icon: <Users className="w-4 h-4" /> },
      { name: 'Feature Pricing', path: '/platform/pricing', icon: <DollarSign className="w-4 h-4" /> },
      { name: 'Promozioni', path: '/platform/promotions', icon: <Megaphone className="w-4 h-4" /> },
      { name: 'Featured Calendar', path: '/platform/featured-calendar', icon: <Calendar className="w-4 h-4" /> },
      { name: 'Consumption Ledger', path: '/platform/consumption-ledger', icon: <BookOpen className="w-4 h-4" /> },
    ],
  },
  {
    name: 'System Settings',
    icon: <Wrench className="w-5 h-5" />,
    items: [
      { name: 'Configurazione Globale', path: '/system/config', icon: <Settings className="w-4 h-4" /> },
      { name: 'Domini & SSL', path: '/system/domains', icon: <Globe className="w-4 h-4" /> },
      { name: 'Sicurezza', path: '/system/security', icon: <Lock className="w-4 h-4" /> },
      { name: 'Notifiche', path: '/system/notifications', icon: <Bell className="w-4 h-4" /> },
    ],
  },
  {
    name: 'Padmin Analyzer',
    icon: <Shield className="w-5 h-5" />,
    items: [
      { name: 'OS3 Dashboard', path: '/padmin/dashboard', icon: <Shield className="w-4 h-4" /> },
      { name: 'Violations', path: '/padmin/violations', icon: <AlertTriangle className="w-4 h-4" /> },
      { name: 'Symbols', path: '/padmin/symbols', icon: <Code2 className="w-4 h-4" /> },
      { name: 'Search', path: '/padmin/search', icon: <Search className="w-4 h-4" /> },
      { name: 'Statistics', path: '/padmin/statistics', icon: <TrendingUp className="w-4 h-4" /> },
    ],
  },
];

export default function Layout() {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    // Apri automaticamente il gruppo che contiene la route corrente
    const activeGroup = menuGroups.find(group => 
      group.items.some(item => item.path === location.pathname)
    );
    return activeGroup ? [activeGroup.name] : ['Overview'];
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleGroup = (groupName: string) => {
    setOpenGroups(prev => 
      prev.includes(groupName)
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    );
  };

  const isActive = (path: string) => location.pathname === path;
  const isGroupActive = (group: MenuGroup) => 
    group.items.some(item => location.pathname === item.path);

  return (
    <div className="min-h-screen bg-base-200">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="btn btn-square btn-ghost bg-base-100 shadow-lg"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-80
          bg-gradient-to-b from-[#0B1F3A] to-[#123C7A]
          text-neutral-content
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Badge */}
          <div className="p-6 text-center border-b border-white/10">
            <h1 className="text-2xl font-bold text-white">EGI-HUB</h1>
            <span className="inline-block px-3 py-1 mt-2 text-xs font-semibold rounded-full bg-white/10 text-white/90">
              SuperAdmin
            </span>
          </div>

          {/* Menu Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {menuGroups.map((group) => {
              const isOpen = openGroups.includes(group.name);
              const groupActive = isGroupActive(group);

              return (
                <div key={group.name} className="space-y-1">
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(group.name)}
                    className={`
                      w-full flex items-center justify-between px-3 py-3 rounded-lg
                      transition-colors duration-150
                      ${groupActive 
                        ? 'bg-primary text-primary-content shadow-sm' 
                        : 'hover:bg-white/10'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span className={groupActive ? '' : 'opacity-60'}>
                        {group.icon}
                      </span>
                      <span className="font-medium">{group.name}</span>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 opacity-60" />
                    ) : (
                      <ChevronRight className="w-4 h-4 opacity-60" />
                    )}
                  </button>

                  {/* Group Items */}
                  {isOpen && (
                    <div className="pl-6 space-y-1">
                      {group.items.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                            transition-colors duration-150
                            ${isActive(item.path)
                              ? 'bg-primary/80 text-primary-content font-semibold shadow-sm'
                              : 'hover:bg-white/10 opacity-80 hover:opacity-100'
                            }
                          `}
                        >
                          {item.icon}
                          <span>{item.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="px-4 py-4">
            <button
              onClick={() => {
                // TODO: Implementare logout
                console.log('Logout');
              }}
              className="flex items-center w-full gap-3 px-4 py-3 text-sm font-medium text-white transition-colors duration-150 bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>

          {/* Footer */}
          <div className="p-4 text-xs text-center border-t border-white/10 opacity-60">
            <p>EGI-HUB Enterprise</p>
            <p className="mt-1">© 2025 FlorenceEGI</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className="min-h-screen transition-all duration-300 lg:ml-80"
      >
        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Page Content */}
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
