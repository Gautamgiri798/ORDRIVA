'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePosStore } from '@/lib/store';
import { formatCurrency, formatTime } from '@/lib/utils';
import {
  DollarSign,
  ShoppingBag,
  Grid,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ChefHat,
  Receipt,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
  const {
    currentBranch,
    orders,
    tables,
    inventory,
    kitchenTickets,
    currentUser,
  } = usePosStore();

  const completedOrders = orders.filter((o) => o.paymentStatus === 'succeeded');
  const todayGrossSales = completedOrders.reduce((sum, o) => sum + o.grandTotal, 0);

  const activeOrders = orders.filter(
    (o) => o.status === 'placed' || o.status === 'preparing' || o.status === 'ready' || o.status === 'served'
  );

  const occupiedTables = tables.filter((t) => t.status === 'occupied' || t.status === 'billed');
  const occupancyPercent = Math.round((occupiedTables.length / tables.length) * 100);

  const lowStockItems = inventory.filter((i) => i.currentStock <= i.minReorderLevel);

  const pendingTickets = kitchenTickets.filter((kt) => kt.status === 'pending' || kt.status === 'preparing');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner with ORDRIVA Branding */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#3B82F6] text-white p-6 sm:p-8 shadow-lg border border-[#3B82F6]/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-[#60A5FA]">
              <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span>Next-Gen Restaurant POS &amp; Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {currentUser.name}
            </h1>
            <p className="text-slate-200 text-sm max-w-xl">
              Operating <strong className="text-white font-semibold">{currentBranch.name}</strong> • GSTIN: {currentBranch.gstin}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/pos"
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#1E3A8A] font-extrabold text-sm shadow-md flex items-center space-x-2 transition-transform transform active:scale-95"
            >
              <ShoppingBag className="w-4 h-4 text-[#3B82F6]" />
              <span>Launch POS Terminal</span>
            </Link>
            <Link
              href="/kitchen"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-[#60A5FA]/30 backdrop-blur-sm flex items-center space-x-2 transition-all"
            >
              <ChefHat className="w-4 h-4 text-[#A78BFA]" />
              <span>Kitchen KDS ({pendingTickets.length})</span>
            </Link>
          </div>
        </div>

        {/* Subtle Decorative Logo Watermark */}
        <div className="absolute right-4 -bottom-6 opacity-25 pointer-events-none w-72 h-36">
          <Image src="/ordriva-horizontal-transparent.png" alt="watermark" fill className="object-contain" priority />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Sales */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today&apos;s Gross Sales</div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {formatCurrency(todayGrossSales)}
            </div>
            <div className="flex items-center space-x-1 text-xs text-emerald-600 mt-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{completedOrders.length} settled orders</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#3B82F6]">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Live Orders</div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {activeOrders.length}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              {orders.filter((o) => o.status === 'preparing').length} in kitchen prep
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Floor Occupancy */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Floor Occupancy</div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {occupancyPercent}%
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              {occupiedTables.length} of {tables.length} tables seated
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Grid className="w-6 h-6" />
          </div>
        </div>

        {/* Inventory Stock Alerts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Alerts</div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {lowStockItems.length}
            </div>
            <div className="text-xs text-rose-600 mt-1 font-medium">
              {lowStockItems.length > 0 ? 'Action required: reorder' : 'All stock healthy'}
            </div>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${lowStockItems.length > 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-50 text-slate-400'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Split Sections: Live Floor Map Preview + Live Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Active Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Live & Recent Orders</h2>
              <p className="text-xs text-slate-500">Real-time order statuses and customer bills</p>
            </div>
            <Link
              href="/orders"
              className="text-xs font-bold text-[#3B82F6] hover:text-[#2563EB] flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs font-semibold text-slate-400 uppercase border-b border-slate-100">
                  <th className="py-2.5">Order #</th>
                  <th className="py-2.5">Type & Table</th>
                  <th className="py-2.5">Items</th>
                  <th className="py-2.5">Total (₹)</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 font-semibold text-slate-900">
                      #{order.orderNumber}
                    </td>
                    <td className="py-3">
                      <span className="capitalize text-xs font-medium text-slate-700">
                        {order.orderType.replace('_', ' ')}
                      </span>
                      {order.tableLabel && (
                        <span className="ml-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800">
                          {order.tableLabel}
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-xs text-slate-600">
                      {order.items.reduce((s, i) => s + i.quantity, 0)} items ({order.items[0]?.name}
                      {order.items.length > 1 ? ` +${order.items.length - 1}` : ''})
                    </td>
                    <td className="py-3 font-semibold text-slate-900 tabular-nums">
                      {formatCurrency(order.grandTotal)}
                    </td>
                    <td className="py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                          order.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : order.status === 'ready'
                            ? 'bg-blue-50 text-blue-700'
                            : order.status === 'preparing'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-right text-xs text-slate-400" suppressHydrationWarning>
                      {formatTime(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Floor Plan Overview & Quick Seat */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Floor Layout</h2>
              <p className="text-xs text-slate-500">Table states & guest seating</p>
            </div>
            <Link
              href="/tables"
              className="text-xs font-bold text-[#3B82F6] hover:text-[#2563EB] flex items-center space-x-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mini Table Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {tables.slice(0, 8).map((tbl) => {
              const isOccupied = tbl.status === 'occupied';
              const isBilled = tbl.status === 'billed';
              const isReserved = tbl.status === 'reserved';

              return (
                <Link
                  key={tbl.id}
                  href={`/pos?table=${tbl.id}`}
                  className={`p-3 rounded-lg border text-left transition-all hover:shadow-sm ${
                    isOccupied
                      ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                      : isBilled
                      ? 'bg-purple-50/60 border-purple-200 text-purple-900'
                      : isReserved
                      ? 'bg-blue-50/60 border-blue-200 text-blue-900'
                      : 'bg-emerald-50/40 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{tbl.label}</span>
                    <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-white/70">
                      {tbl.capacity}P
                    </span>
                  </div>
                  <div className="text-[11px] font-medium capitalize mt-1">
                    {tbl.status}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Quick Legend */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Available
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Occupied
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span> Billed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

