'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  AlertTriangle,
  History,
  BrainCircuit,
  Settings,
  Package,
  ChevronLeft,
  ChevronRight,
  LucideIcon
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard },
  { href: '/dashboard/alerts', label: 'Alertas', icon: AlertTriangle },
  { href: '/dashboard/history', label: 'Histórico', icon: History },
  { href: '/dashboard/ia', label: 'Centro IA', icon: BrainCircuit },
  { href: '/dashboard/settings', label: 'Configuración', icon: Settings },
];

const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE !== 'false';

export default function Sidebar({ alertCount = 0 }: { alertCount?: number }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="
        hidden lg:flex flex-col h-screen sticky top-0
        bg-black text-white
        border-r border-white/5
      "
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 h-16 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
          <Package size={18} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="min-w-0 overflow-hidden"
            >
              <h1 className="text-sm font-bold tracking-tight truncate">Agrilion+</h1>
              <p className="text-[10px] text-white/50 uppercase tracking-widest">Monitoreo</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          const badge = item.href === '/dashboard/alerts' ? alertCount : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                transition-colors duration-150 cursor-pointer
                ${collapsed ? 'justify-center' : ''}
                ${isActive
                  ? 'text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                }
              `}
              title={collapsed ? item.label : undefined}
            >
              {/* Animated active background */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-emerald-600"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              <span className="relative z-10 shrink-0">
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
              </span>

              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="relative z-10 text-sm font-medium flex-1 overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Badge */}
              {!collapsed && badge > 0 && (
                <span className="
                  relative z-10 flex items-center justify-center
                  min-w-[20px] h-5 px-1.5
                  text-[10px] font-bold rounded-full
                  bg-red-500 text-white
                ">
                  {badge}
                </span>
              )}
              {collapsed && badge > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setCollapsed(!collapsed)}
        className="
          flex items-center justify-center
          mx-2 mb-4 p-2 rounded-lg
          text-white/40 hover:text-white hover:bg-white/5
          transition-colors duration-150 cursor-pointer
        "
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </motion.button>

      {/* Modo de datos */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-3 mb-4 px-3 py-2 rounded-lg bg-white/5 border border-white/10 overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full animate-pulse ${MOCK_MODE ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <span className="text-xs text-white/60 font-medium">
                {MOCK_MODE ? 'MODO DEMO' : 'DATOS REALES'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
