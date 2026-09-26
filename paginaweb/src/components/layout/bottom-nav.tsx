'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, AlertTriangle, History, BrainCircuit } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard },
  { href: '/dashboard/alerts', label: 'Alertas', icon: AlertTriangle },
  { href: '/dashboard/history', label: 'Histórico', icon: History },
  { href: '/dashboard/ia', label: 'IA', icon: BrainCircuit },
];

export default function BottomNav({ alertCount = 0 }: { alertCount?: number }) {
  const pathname = usePathname();

  return (
    <nav
      className="
        lg:hidden fixed bottom-0 left-0 right-0 z-50
        glass border-t border-[var(--border-default)]
        safe-area-inset-bottom
      "
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
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
                relative flex flex-col items-center justify-center
                w-16 h-full gap-0.5
                transition-colors duration-150 cursor-pointer
                ${isActive
                  ? 'text-[var(--brand-primary)]'
                  : 'text-[var(--text-muted)]'
                }
              `}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.3 : 1.8} />
                {badge > 0 && (
                  <span className="
                    absolute -top-1 -right-2
                    flex items-center justify-center
                    min-w-[16px] h-4 px-1
                    text-[9px] font-bold rounded-full
                    bg-[var(--state-critical)] text-white
                  ">
                    {badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>

              {/* Active indicator */}
              {isActive && (
                <span className="
                  absolute top-0 left-1/2 -translate-x-1/2
                  w-8 h-0.5 rounded-full
                  bg-[var(--brand-primary)]
                " />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
