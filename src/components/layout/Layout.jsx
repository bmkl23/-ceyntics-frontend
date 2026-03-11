import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Package, ArrowLeftRight,
  ScrollText, Users, Archive, LogOut, Menu, X, ChevronRight
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/inventory',  icon: Package,         label: 'Inventory'  },
  { to: '/borrowing',  icon: ArrowLeftRight,  label: 'Borrowing'  },
  { to: '/logs',       icon: ScrollText,      label: 'Activity Log' },
];

const adminItems = [
  { to: '/users',     icon: Users,   label: 'Users'     },
  { to: '/cupboards', icon: Archive, label: 'Cupboards' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-dark-700 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0">
          <Package className="w-4 h-4 text-accent" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-semibold text-sm">Ceyntics IMS</p>
            <p className="text-dark-500 text-xs">v1.0.0</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group
              ${isActive
                ? 'bg-accent/15 text-accent border border-accent/20'
                : 'text-dark-300 hover:bg-dark-700 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">{label}</span>}
          </NavLink>
        ))}

        {/* Admin Section */}
        {user?.role === 'admin' && (
          <>
            <div className={`pt-4 pb-1 ${collapsed ? 'hidden' : ''}`}>
              <p className="text-dark-500 text-xs font-medium uppercase tracking-wider px-3">Admin</p>
            </div>
            {collapsed && <div className="border-t border-dark-700 my-2"/>}
            {adminItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to} to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150
                  ${isActive
                    ? 'bg-accent/15 text-accent border border-accent/20'
                    : 'text-dark-300 hover:bg-dark-700 hover:text-white'
                  } ${collapsed ? 'justify-center' : ''}`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{label}</span>}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-dark-700 space-y-1">
        {!collapsed && (
          <div className="px-3 py-2 rounded-xl bg-dark-800 mb-2">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-dark-400 text-xs capitalize">{user?.role}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-dark-300 hover:bg-red-500/10 hover:text-red-400 transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-dark-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col bg-dark-900 border-r border-dark-700 transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}>
        <SidebarContent />
        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute left-0 top-1/2 -translate-y-1/2 translate-x-full bg-dark-700 hover:bg-dark-600 border border-dark-600 rounded-r-lg p-1 transition-colors z-10"
          style={{ marginLeft: collapsed ? '64px' : '240px' }}
        >
          <ChevronRight className={`w-3 h-3 text-dark-300 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
        </button>
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)}/>
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-dark-900 border-r border-dark-700">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-dark-900 border-b border-dark-700 px-4 py-3 flex items-center justify-between md:hidden">
          <button onClick={() => setMobileOpen(true)} className="text-dark-300 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <p className="text-white font-semibold text-sm">Ceyntics IMS</p>
          <div className="w-5"/>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}