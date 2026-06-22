'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  AlertTriangle,
  History,
  BrainCircuit,
  Settings,
  Package,
  ChevronLeft,
  ChevronRight,
  Bell,
  LucideIcon
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard },
  { href: '/dashboard/alerts', label: 'Alertas', icon: AlertTriangle, badge: 4 },
  { href: '/dashboard/history', label: 'Histórico', icon: History },
  { href: '/dashboard/ia', label: 'Centro IA', icon: BrainCircuit },
  { href: '/dashboard/settings', label: 'Configuración', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`
        hidden lg:flex flex-col h-screen sticky top-0
        bg-black text-white
        border-r border-white/5
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[72px]' : 'w-[240px]'}
      `}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 h-16 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary)] flex items-center justify-center shrink-0">
          <Package size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-sm font-bold tracking-tight truncate">Agrilion+</h1>
            <p className="text-[10px] text-white/50 uppercase tracking-widest">Monitoreo</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg
                transition-colors duration-150 cursor-pointer
                ${collapsed ? 'justify-center' : ''}
                ${isActive
                  ? 'bg-[var(--brand-primary)] text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                }
              `}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} className="shrink-0" />
              {!collapsed && (
                <>
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="
                      flex items-center justify-center
                      min-w-[20px] h-5 px-1.5
                      text-[10px] font-bold rounded-full
                      bg-[var(--state-critical)] text-white
                    ">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {collapsed && item.badge && item.badge > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--state-critical)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="
          flex items-center justify-center
          mx-2 mb-4 p-2 rounded-lg
          text-white/40 hover:text-white hover:bg-white/5
          transition-colors duration-150 cursor-pointer
        "
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      {/* Demo badge */}
      {!collapsed && (
        <div className="mx-3 mb-4 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--state-ok)] animate-pulse" />
            <span className="text-xs text-white/60 font-medium">MODO DEMO</span>
          </div>
        </div>
      )}
    </aside>
  );
}
