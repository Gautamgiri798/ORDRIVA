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
  UtensilsCrossed,
  Boxes,
  BarChart3,
  Settings,
  AlertTriangle,
  QrCode,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  // Hide sidebar on the customer-facing ordering site
  if (pathname?.startsWith('/order')) {
    return null;
  }
  const { inventory, tables } = usePosStore();

  const lowStockCount = inventory.filter(
    (item) => item.currentStock <= item.minReorderLevel
  ).length;

  const occupiedTablesCount = tables.filter(
    (t) => t.status === 'occupied' || t.status === 'billed'
  ).length;

  const navItems = [
    { label: 'Overview', href: '/', icon: LayoutDashboard },
    {
      label: 'Cashier POS',
      href: '/pos',
      icon: ShoppingBag,
      highlight: true,
      badge: 'Touch',
    },
    {
      label: 'Floor & Tables',
      href: '/tables',
      icon: Grid,
      count: occupiedTablesCount > 0 ? `${occupiedTablesCount}/${tables.length}` : undefined,
      countColor: 'bg-blue-50 text-blue-700 border-blue-200/80',
    },
    {
      label: 'Table QR Stands',
      href: '/tables/qr',
      icon: QrCode,
      badge: 'Print',
    },
    { label: 'Orders & Bills', href: '/orders', icon: Receipt },
    { label: 'Menu Catalog', href: '/menu', icon: UtensilsCrossed },
    {
      label: 'Inventory & Stock',
      href: '/inventory',
      icon: Boxes,
      count: lowStockCount > 0 ? lowStockCount : undefined,
      countColor: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    { label: 'Analytics & GST', href: '/reports', icon: BarChart3 },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 hidden md:flex flex-col justify-between shrink-0 h-full overflow-hidden print:hidden select-none">
      {/* Navigation Links */}
      <div className="p-3 space-y-1 overflow-y-auto flex-1 min-h-0">
        <div className="px-3 py-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
          Restaurant Modules
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-blue-50/90 text-[#1D4ED8] shadow-xs'
                  : item.highlight
                  ? 'text-slate-800 hover:bg-slate-50 hover:text-slate-950'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#3B82F6] rounded-r-full" />
              )}

              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? 'text-[#3B82F6]'
                      : item.highlight
                      ? 'text-[#60A5FA] group-hover:text-[#3B82F6]'
                      : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span className="tracking-tight">{item.label}</span>
              </div>

              {item.badge && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {item.badge}
                </span>
              )}

              {item.count !== undefined && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    item.countColor || 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

