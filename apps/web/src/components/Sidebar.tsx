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
      countColor: 'bg-amber-500 text-slate-900',
    },
    {
      label: 'Floor & Tables',
      href: '/tables',
      icon: Grid,
      count: occupiedTablesCount > 0 ? `${occupiedTablesCount}/${tables.length}` : undefined,
      countColor: 'bg-blue-100 text-[#3B82F6]',
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
      countColor: 'bg-rose-500 text-white animate-pulse',
    },
    { label: 'Analytics & GST', href: '/reports', icon: BarChart3 },
    { label: 'Audit Trail', href: '/audit', icon: ShieldCheck },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)]">
      {/* Navigation Links */}
      <div className="p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Restaurant Modules
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-[#3B82F6] border-l-4 border-[#3B82F6] font-semibold'
                  : item.highlight
                  ? 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? 'text-[#3B82F6]' : item.highlight ? 'text-[#60A5FA]' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-100 text-[#A78BFA] border border-purple-200/50">
                  {item.badge}
                </span>
              )}

              {item.count !== undefined && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${item.countColor || 'bg-slate-200 text-slate-700'}`}
                >
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom Info / System Status */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Engine: <strong className="text-[#3B82F6]">Modular Monolith</strong></span>
          <span className="font-extrabold text-[11px] px-2 py-0.5 rounded bg-purple-50 text-[#A78BFA] border border-purple-200/50">v1.0 MVP</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-400">
          GST Ready (CGST + SGST) • POS 2.0
        </div>
      </div>
    </aside>
  );
}

