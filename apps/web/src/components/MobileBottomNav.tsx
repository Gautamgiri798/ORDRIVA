'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePosStore } from '@/lib/store';
import {
  LayoutDashboard,
  ShoppingBag,
  Receipt,
  Grid,
  Menu,
} from 'lucide-react';

export function MobileBottomNav() {
  const pathname = usePathname();

  // Hide on customer portal (/order) and print views
  if (pathname?.startsWith('/order')) {
    return null;
  }

  const { tables, cart, orders } = usePosStore();

  const unpaidCount = orders.filter((o) => o.paymentStatus === 'pending').length;

  const occupiedTablesCount = tables.filter(
    (t) => t.status === 'occupied' || t.status === 'billed'
  ).length;

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleOpenMore = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ordriva:open-mobile-menu'));
    }
  };

  const tabs = [
    {
      label: 'Overview',
      href: '/',
      icon: LayoutDashboard,
      isActive: pathname === '/',
    },
    {
      label: 'POS',
      href: '/pos',
      icon: ShoppingBag,
      isActive: pathname === '/pos',
      badge: totalCartCount > 0 ? totalCartCount : undefined,
      badgeColor: 'bg-blue-600 text-white',
    },
    {
      label: 'Bills',
      href: '/orders',
      icon: Receipt,
      isActive: pathname === '/orders',
      badge: unpaidCount > 0 ? unpaidCount : undefined,
      badgeColor: 'bg-amber-500 text-slate-950 font-black',
    },
    {
      label: 'Tables',
      href: '/tables',
      icon: Grid,
      isActive: pathname === '/tables' || pathname?.startsWith('/tables/'),
      badge: occupiedTablesCount > 0 ? `${occupiedTablesCount}/${tables.length}` : undefined,
      badgeColor: 'bg-blue-100 text-blue-700 font-bold',
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] print:hidden select-none pb-[calc(0.35rem+env(safe-area-inset-bottom,0px))]"
    >
      <div className="grid grid-cols-5 items-center justify-around h-14 max-w-lg mx-auto px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center py-1 transition-colors relative ${
                tab.isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${tab.isActive ? 'text-blue-600 stroke-[2.2]' : 'text-slate-500'}`} />
                {tab.badge !== undefined && (
                  <span
                    className={`absolute -top-1.5 -right-3 text-[9px] px-1 py-0.2 rounded-full font-bold shadow-xs ${tab.badgeColor}`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
              {tab.isActive && (
                <span className="w-1 h-1 rounded-full bg-blue-600 mt-0.5" />
              )}
            </Link>
          );
        })}

        {/* More / Menu Drawer Trigger */}
        <button
          onClick={handleOpenMore}
          className="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-slate-900 font-medium transition-colors focus:outline-none"
          aria-label="Open Full Navigation Menu"
        >
          <Menu className="w-5 h-5 text-slate-500" />
          <span className="text-[10px] mt-0.5 tracking-tight">More</span>
        </button>
      </div>
    </nav>
  );
}
