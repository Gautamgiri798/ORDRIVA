'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePosStore } from '@/lib/store';
import {
  LayoutDashboard,
  ShoppingBag,
  Receipt,
  ChefHat,
  Grid,
  UtensilsCrossed,
  Boxes,
  BarChart3,
  ShieldCheck,
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
  const { kitchenTickets, inventory, tables } = usePosStore();

  const pendingTicketsCount = kitchenTickets.filter(
    (kt) => kt.status === 'pending' || kt.status === 'preparing'
  ).length;

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
      label: 'Kitchen KDS',
      href: '/kitchen',
      icon: ChefHat,
      count: pendingTicketsCount > 0 ? pendingTicketsCount : undefined,
      countColor: 'bg-amber-50 text-amber-800 border-amber-200',
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
    { label: 'Audit Trail', href: '/audit', icon: ShieldCheck },
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

      {/* Bottom Info / System Status */}
      <div className="p-3.5 mx-3 mb-8 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1 shrink-0">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold text-slate-700">ORDRIVA POS</span>
          <span className="font-extrabold text-[9px] uppercase px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-200/60">
            v1.0 MVP
          </span>
        </div>
        <div className="text-[10px] text-slate-400 flex items-center justify-between">
          <span>Engine: <strong className="text-slate-600">Modular Monolith</strong></span>
          <span className="text-emerald-600 font-bold">● Active</span>
        </div>
      </div>
    </aside>
  );
}

