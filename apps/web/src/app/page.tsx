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
              <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" aria-hidden="true" />
              <span>Next-Gen Restaurant POS &amp; Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {currentUser.name}
            </h1>
            <p className="text-slate-200 text-sm max-w-xl">
              Operating <strong className="text-white font-semibold">{currentBranch.name}</strong> • GSTIN: {currentBranch.gstin}
            </p>
          </div>

          {/* Quick Actions (Issues 3, 4, 5) */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/pos"
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-md flex items-center space-x-2 transition-transform transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ShoppingBag className="w-4 h-4 text-[#3B82F6]" aria-hidden="true" />
              <span>Launch POS</span>
            </Link>
            <Link
              href="/kitchen"
              className="px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white font-semibold text-sm border border-white/20 shadow-sm backdrop-blur-md flex items-center space-x-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChefHat className="w-4 h-4 text-[#A78BFA]" aria-hidden="true" />
              <span>Kitchen KDS ({pendingTickets.length})</span>
            </Link>
          </div>
        </div>

        {/* Subtle Decorative Logo Watermark (Issue 11) */}
        <div className="absolute right-2 -bottom-8 opacity-5 pointer-events-none w-64 h-32 select-none" aria-hidden="true">
          <Image src="/ordriva-logo.svg" alt="" fill className="object-contain" priority />
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
            <div className="flex items-center space-x-1 text-xs text-emerald-700 mt-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{completedOrders.length} settled orders</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#3B82F6]">
            <DollarSign className="w-6 h-6" aria-hidden="true" />
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Live Orders</div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {activeOrders.length}
            </div>
            <div className="text-xs text-slate-600 mt-1 font-medium">
              {orders.filter((o) => o.status === 'preparing').length} in kitchen prep
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
            <Clock className="w-6 h-6" aria-hidden="true" />
          </div>
        </div>

        {/* Floor Occupancy */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Floor Occupancy</div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {occupancyPercent}%
            </div>
            <div className="text-xs text-slate-600 mt-1 font-medium">
              {occupiedTables.length} of {tables.length} tables seated
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Grid className="w-6 h-6" aria-hidden="true" />
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
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${lowStockItems.length > 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-50 text-slate-500'}`}>
            <AlertTriangle className="w-6 h-6" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Main Split Sections: Live Floor Map Preview + Live Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Active Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          <div className="flex items-start justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">Live &amp; Recent Orders</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time order statuses and customer bills</p>
            </div>
            <Link
              href="/orders"
              className="mt-0.5 text-xs font-bold text-[#3B82F6] hover:text-[#2563EB] flex items-center space-x-1 focus-visible:outline-none focus-visible:underline"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-2.5">Order #</th>
                  <th className="py-2.5">Type &amp; Table</th>
                  <th className="py-2.5">Items</th>
                  <th className="py-2.5">Total (₹)</th>
                  {/* Issue 8: Optical alignment for Status column */}
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.slice(0, 5).map((order) => {
                  const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
                  const additionalCount = totalQty - 1;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 font-semibold text-slate-900">
                        #{order.orderNumber}
                      </td>
                      {/* Issue 7: Clear horizontal gap between order type and table badge */}
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="capitalize text-xs font-medium text-slate-700">
                            {order.orderType.replace('_', ' ')}
                          </span>
                          {order.tableLabel && (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/60">
                              {order.tableLabel}
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Issue 1: Correct calculation of total items and remaining breakdown */}
                      <td className="py-3 text-xs text-slate-600">
                        <span className="font-medium text-slate-700">
                          {totalQty} {totalQty === 1 ? 'item' : 'items'}
                        </span>
                        {order.items[0] && (
                          <span className="text-slate-500">
                            {' '}({order.items[0].name}
                            {additionalCount > 0 ? ` +${additionalCount}` : ''})
                          </span>
                        )}
                      </td>
                      <td className="py-3 font-semibold text-slate-900 tabular-nums">
                        {formatCurrency(order.grandTotal)}
                      </td>
                      {/* Issue 14: Conventional actionable colors for 'ready' */}
                      <td className="py-3 px-2">
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                            order.status === 'ready'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : order.status === 'completed'
                              ? 'bg-slate-100 text-slate-600 border border-slate-200'
                              : order.status === 'preparing'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 text-right text-xs text-slate-500" suppressHydrationWarning>
                        {formatTime(order.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Floor Plan Overview & Quick Seat */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          {/* Issue 16: Align Manage link with Floor Layout heading baseline */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">Floor Layout</h2>
              <p className="text-xs text-slate-500 mt-0.5">Table states &amp; guest seating</p>
            </div>
            <Link
              href="/tables"
              className="mt-0.5 text-xs font-bold text-[#3B82F6] hover:text-[#2563EB] flex items-center space-x-1 focus-visible:outline-none focus-visible:underline"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
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

          {/* Quick Legend (Issues 2 & 10: Includes 'Reserved' state) */}
          <div
            className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 text-[11px] text-slate-500"
            role="list"
            aria-label="Table status legend"
          >
            <span className="flex items-center gap-1.5" role="listitem">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" aria-hidden="true" />
              <span>Available</span>
            </span>
            <span className="flex items-center gap-1.5" role="listitem">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" aria-hidden="true" />
              <span>Occupied</span>
            </span>
            <span className="flex items-center gap-1.5" role="listitem">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" aria-hidden="true" />
              <span>Reserved</span>
            </span>
            <span className="flex items-center gap-1.5" role="listitem">
              <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" aria-hidden="true" />
              <span>Billed</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
