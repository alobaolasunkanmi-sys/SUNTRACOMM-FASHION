import React from "react";
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, Users, Scissors, 
  Settings, LogOut, Package, CreditCard, Database
} from 'lucide-react';
import clsx from 'clsx';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, business, login, logout } = useAuth();
  const location = useLocation();

  const superAdminNav = [
    { name: 'Dashboard', href: '/superadmin', icon: LayoutDashboard },
    { name: 'Businesses', href: '/superadmin/businesses', icon: Package },
    { name: 'Supabase DB', href: '/superadmin/supabase', icon: Database },
    { name: 'Settings', href: '/superadmin/settings', icon: Settings },
  ];

  const businessNav = [
    { name: 'Dashboard', href: '/business', icon: LayoutDashboard },
    { name: 'Customers', href: '/business/customers', icon: Users },
    { name: 'Orders', href: '/business/orders', icon: Scissors },
    { name: 'Payments', href: '/business/payments', icon: CreditCard },
    { name: 'Settings', href: '/business/settings', icon: Settings },
  ];

  const navigation = user?.role === 'superadmin' ? superAdminNav : businessNav;

  return (
    <div className="min-h-screen bg-background flex font-sans text-text">
      {/* Sidebar */}
      <div className="w-64 bg-surface border-r border-border flex flex-col p-8">
        <div className="mb-12 flex items-center gap-3">
          {user?.role !== 'superadmin' && business?.logoUrl ? (
            <div className="w-10 h-10 rounded-xl border border-border bg-white p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
              <img src={business.logoUrl} alt={business.name} className="max-w-full max-h-full object-contain rounded-lg" />
            </div>
          ) : null}
          <span className="text-xl font-serif italic text-primary font-bold tracking-tight line-clamp-2">
            {user?.role === 'superadmin' ? 'FDL Solution Admin' : business?.name || 'FDL Solution'}
          </span>
        </div>
        
        <nav className="flex-1 overflow-y-auto space-y-6">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  isActive ? 'text-primary font-semibold' : 'text-text-muted hover:text-primary opacity-70 hover:opacity-100',
                  'group flex items-center gap-3 text-sm transition-colors'
                )}
              >
                <div className={clsx(
                  'w-2 h-2 rounded-full',
                  isActive ? 'bg-primary' : 'bg-transparent'
                )} />
                <item.icon className="h-4 w-4" aria-hidden="true" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
        
        <div className="mt-auto space-y-2">
          {/* Quick Account Switcher Button */}
          <button
            type="button"
            onClick={async () => {
              const targetEmail = user?.role === 'superadmin' ? 'samuel@royaltailors.com' : 'admin@example.com';
              try {
                const res = await fetch('/api/auth/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: targetEmail, password: 'admin123' })
                });
                const data = await res.json();
                if (res.ok) {
                  login(data.token, data.user, data.business);
                  window.location.href = data.user.role === 'superadmin' ? '/superadmin' : '/business';
                } else {
                  alert(data.error || 'Failed to switch view');
                }
              } catch (e) {
                alert('Account switch failed');
              }
            }}
            className="w-full py-1.5 px-3 bg-white border border-border rounded-xl text-[11px] font-bold text-primary hover:bg-surface transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            🔄 Switch to {user?.role === 'superadmin' ? 'Business Admin' : 'Super Admin'}
          </button>

          <div className="p-3 bg-border rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-serif text-sm italic shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 truncate">
              <p className="text-xs font-bold text-text truncate">{user?.name}</p>
              <p className="text-[10px] opacity-60 uppercase tracking-tighter font-semibold truncate text-text">
                {user?.role === 'superadmin' ? 'Super Admin' : user?.role === 'admin' ? 'Business Admin' : 'Staff'}
              </p>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="p-1.5 text-text-muted hover:text-primary rounded-full hover:bg-surface transition-colors shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-background p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
