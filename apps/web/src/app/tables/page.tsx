'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePosStore } from '@/lib/store';
import { DiningTable, TableStatus } from '@/types';
import { formatCurrency, formatDuration } from '@/lib/utils';
import {
  Grid,
  Users,
  Clock,
  PlusCircle,
  Receipt,
  CheckCircle,
  BookmarkCheck,
  QrCode,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Utensils,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export default function TablesPage() {
  const { tables, orders, updateTableStatus, currentBranch } = usePosStore();
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionModalTable, setActionModalTable] = useState<DiningTable | null>(null);

  const sections = ['Main Dining', 'Garden Terrace', 'VIP Lounge'];

  const filteredTables = tables.filter((t) => {
    const matchesSection = selectedSection === 'all' || t.section === selectedSection;
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSection && matchesStatus;
  });

  // Calculate High-Level Floor Metrics
  const totalTables = tables.length;
  const totalSeats = tables.reduce((s, t) => s + t.capacity, 0);
  const availableTables = tables.filter((t) => t.status === 'available');
  const occupiedTables = tables.filter((t) => t.status === 'occupied');
  const reservedTables = tables.filter((t) => t.status === 'reserved');
  const billedTables = tables.filter((t) => t.status === 'billed');

  const occupiedSeats = occupiedTables.reduce((s, t) => s + t.capacity, 0);
  const occupancyPercent = Math.round((occupiedSeats / (totalSeats || 1)) * 100);

  // Active Running Tabs Revenue
  const activeOrderIds = tables.map((t) => t.activeOrderId).filter(Boolean);
  const activeRunningRevenue = orders
    .filter((o) => activeOrderIds.includes(o.id) && o.paymentStatus === 'pending')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* 1. Header Bar with Luxury Hospitality Styling */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-white via-slate-50/50 to-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Grid className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Floor Plan &amp; Table Management
              </h1>
              <span className="inline-flex items-center space-x-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Seating</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Architectural dining floor view • Real-time occupancy, seat allocations &amp; dining duration timers
            </p>
          </div>
        </div>

        {/* Quick QR Table Stands Print Studio Action */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <Link
            href="/tables/qr"
            className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            <QrCode className="w-4 h-4 text-[#60A5FA]" />
            <span>Print Table QR Stands</span>
          </Link>
        </div>
      </div>

      {/* 2. Executive Floor Analytics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Capacity */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Seating Capacity
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black text-slate-900 tabular-nums">
                {occupiedSeats}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                / {totalSeats} Guests Seated
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Across {tables.length} dining tables
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#3B82F6] border border-blue-100 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Utilization Rate with Progress Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1 flex-1 pr-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Floor Utilization
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black text-slate-900 tabular-nums">
                {occupancyPercent}%
              </span>
              <span className="text-xs font-semibold text-amber-700">Occupied</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
              />
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Ready for Seating */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Ready for Seating
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black text-emerald-700 tabular-nums">
                {availableTables.length}
              </span>
              <span className="text-xs font-semibold text-emerald-700">Vacant Tables</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Cleaned, sanitized &amp; set
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: Active Revenue Tabs */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Dining Tabs
            </span>
            <div className="text-2xl font-black text-blue-700 tabular-nums">
              {formatCurrency(activeRunningRevenue)}
            </div>
            <div className="text-[11px] text-slate-500">
              {occupiedTables.length} open tab bills in dining
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Section Tabs & Live Status Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Area / Section Segmented Control */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 lg:pb-0 text-xs no-scrollbar">
          <button
            onClick={() => setSelectedSection('all')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap text-xs ${
              selectedSection === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            All Areas ({tables.length})
          </button>
          {sections.map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSection(sec)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap text-xs ${
                selectedSection === sec
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              {sec} ({tables.filter((t) => t.section === sec).length})
            </button>
          ))}
        </div>

        {/* Live Status Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs no-scrollbar">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-full font-bold transition-all text-xs border ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All ({tables.length})
          </button>
          <button
            onClick={() => setStatusFilter('available')}
            className={`px-3 py-1 rounded-full font-bold transition-all text-xs border flex items-center space-x-1.5 ${
              statusFilter === 'available'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Available ({availableTables.length})</span>
          </button>
          <button
            onClick={() => setStatusFilter('occupied')}
            className={`px-3 py-1 rounded-full font-bold transition-all text-xs border flex items-center space-x-1.5 ${
              statusFilter === 'occupied'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Occupied ({occupiedTables.length})</span>
          </button>
          <button
            onClick={() => setStatusFilter('reserved')}
            className={`px-3 py-1 rounded-full font-bold transition-all text-xs border flex items-center space-x-1.5 ${
              statusFilter === 'reserved'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Reserved ({reservedTables.length})</span>
          </button>
          <button
            onClick={() => setStatusFilter('billed')}
            className={`px-3 py-1 rounded-full font-bold transition-all text-xs border flex items-center space-x-1.5 ${
              statusFilter === 'billed'
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Billed ({billedTables.length})</span>
          </button>
        </div>
      </div>

      {/* 4. Luxury Architectural Floor Plan Grid (Calibrated Widths to Prevent Wrapping) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredTables.map((table) => {
          const activeOrder = orders.find((o) => o.id === table.activeOrderId);
          const isCircle = table.capacity <= 2;
          const isBanquet = table.capacity >= 8;
          const isOccupied = table.status === 'occupied';
          const isBilled = table.status === 'billed';
          const isReserved = table.status === 'reserved';

          return (
            <div
              key={table.id}
              className={`bg-white rounded-3xl border shadow-xs overflow-hidden flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:-translate-y-1 relative group ${
                isOccupied
                  ? 'border-amber-300 ring-1 ring-amber-300/40'
                  : isBilled
                  ? 'border-purple-300 ring-1 ring-purple-300/40'
                  : isReserved
                  ? 'border-blue-300 ring-1 ring-blue-300/40'
                  : 'border-slate-200/90 hover:border-blue-400'
              }`}
            >
              {/* Card Header: Table Number & Status Pill (Never wraps) */}
              <div className="p-4 pb-3 flex items-center justify-between border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <h3 className="whitespace-nowrap font-black text-lg text-slate-900 tracking-tight shrink-0">
                    {table.label}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-600 px-2 py-0.5 rounded-md bg-white border border-slate-200/80 truncate">
                    {table.section}
                  </span>
                </div>

                {/* Status Pill Badge */}
                <span
                  className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border flex items-center space-x-1.5 shrink-0 shadow-xs ${
                    isOccupied
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : isBilled
                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                      : isReserved
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isOccupied
                        ? 'bg-amber-500 animate-pulse'
                        : isBilled
                        ? 'bg-purple-500 animate-pulse'
                        : isReserved
                        ? 'bg-blue-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <span>{table.status}</span>
                </span>
              </div>

              {/* Card Body: Realistic Seating Architecture & Live Tab Summary */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                {/* 2D Architectural Seating Representation with Chairs */}
                <div className="py-2 flex items-center justify-center">
                  <div className="relative flex items-center justify-center">
                    {/* Top Chairs Row */}
                    <div className="absolute -top-2 flex space-x-2 z-0">
                      {Array.from({ length: isCircle ? 1 : isBanquet ? 4 : 2 }).map((_, i) => (
                        <div
                          key={`top-${i}`}
                          className={`w-4 h-2 rounded-t-md transition-all ${
                            isOccupied
                              ? 'bg-amber-400 border border-amber-500/40 shadow-xs'
                              : isBilled
                              ? 'bg-purple-400 border border-purple-500/40'
                              : isReserved
                              ? 'bg-blue-300 border border-blue-400'
                              : 'bg-slate-200 border border-slate-300'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Table Surface */}
                    <div
                      className={`relative z-10 flex flex-col items-center justify-center transition-all ${
                        isCircle
                          ? 'w-16 h-16 rounded-full border-2'
                          : isBanquet
                          ? 'w-32 h-14 rounded-2xl border-2'
                          : 'w-24 h-14 rounded-2xl border-2'
                      } ${
                        isOccupied
                          ? 'bg-gradient-to-b from-amber-50 to-amber-100/90 border-amber-300 text-amber-900 shadow-sm'
                          : isBilled
                          ? 'bg-gradient-to-b from-purple-50 to-purple-100/90 border-purple-300 text-purple-900 shadow-sm'
                          : isReserved
                          ? 'bg-gradient-to-b from-blue-50 to-blue-100/90 border-blue-300 text-blue-900 shadow-sm'
                          : 'bg-gradient-to-b from-slate-50 to-slate-100 border-slate-200 text-slate-700 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center space-x-1 font-black text-xs">
                        <Users className="w-3.5 h-3.5 opacity-70" />
                        <span>{table.capacity}P</span>
                      </div>
                      <span className="text-[9px] font-semibold opacity-60">
                        {isCircle ? 'Bistro' : isBanquet ? 'Banquet' : 'Dining'}
                      </span>
                    </div>

                    {/* Bottom Chairs Row */}
                    <div className="absolute -bottom-2 flex space-x-2 z-0">
                      {Array.from({ length: isCircle ? 1 : isBanquet ? 4 : 2 }).map((_, i) => (
                        <div
                          key={`bottom-${i}`}
                          className={`w-4 h-2 rounded-b-md transition-all ${
                            isOccupied
                              ? 'bg-amber-400 border border-amber-500/40 shadow-xs'
                              : isBilled
                              ? 'bg-purple-400 border border-purple-500/40'
                              : isReserved
                              ? 'bg-blue-300 border border-blue-400'
                              : 'bg-slate-200 border border-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* State-Specific Dining Information Box */}
                {activeOrder ? (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/90 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span className="truncate max-w-[130px] text-xs font-bold" title={activeOrder.customerName || 'Walk-in Guest'}>
                        {activeOrder.customerName || 'Walk-in Guest'}
                      </span>
                      <span className="text-xs text-blue-700 tabular-nums font-black">
                        {formatCurrency(activeOrder.grandTotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 border-t border-slate-200/60">
                      <span className="font-medium">Order #{activeOrder.orderNumber}</span>
                      {table.seatedAt && (
                        <span className="flex items-center space-x-1 text-amber-700 font-semibold" suppressHydrationWarning>
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span suppressHydrationWarning>{formatDuration(table.seatedAt)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ) : isReserved ? (
                  <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-100 text-xs text-blue-900 text-center space-y-0.5">
                    <span className="font-black block text-xs">Reserved Party</span>
                    <span className="text-[11px] text-blue-700">Awaiting guest check-in</span>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-center text-xs text-emerald-800 space-y-0.5">
                    <span className="font-black block text-xs text-emerald-800">Ready to Seat</span>
                    <span className="text-[11px] text-emerald-600 font-medium">Cleaned &amp; set for up to {table.capacity} guests</span>
                  </div>
                )}
              </div>

              {/* Card Footer Actions: High Affordance Primary & Management Buttons */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link
                  href={`/pos?table=${table.id}`}
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 active:scale-95"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Take Order</span>
                </Link>

                <button
                  onClick={() => setActionModalTable(table)}
                  className="py-2 px-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                >
                  Manage
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Quick Table Status Management Drawer / Modal */}
      {actionModalTable && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  Manage Table {actionModalTable.label}
                </h3>
                <span className="text-xs text-slate-500">
                  {actionModalTable.section} • {actionModalTable.capacity} Seats • Currently{' '}
                  <strong className="uppercase text-slate-800 font-bold">{actionModalTable.status}</strong>
                </span>
              </div>
              <button
                onClick={() => setActionModalTable(null)}
                aria-label="Close table actions"
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-base leading-none"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5">
              {/* POS Action */}
              <Link
                href={`/pos?table=${actionModalTable.id}`}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Open in Cashier POS (Take Order)</span>
              </Link>

              <div className="pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Update Seating Status
              </div>

              {/* Status Toggles */}
              <button
                onClick={() => {
                  updateTableStatus(actionModalTable.id, 'available');
                  setActionModalTable(null);
                }}
                className="w-full py-2 px-3.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all"
              >
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Mark Available (Vacant &amp; Cleaned)</span>
              </button>

              <button
                onClick={() => {
                  updateTableStatus(actionModalTable.id, 'occupied');
                  setActionModalTable(null);
                }}
                className="w-full py-2 px-3.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all"
              >
                <Users className="w-4 h-4 text-amber-600" />
                <span>Mark Occupied (Seat Walk-in Guests)</span>
              </button>

              <button
                onClick={() => {
                  updateTableStatus(actionModalTable.id, 'reserved');
                  setActionModalTable(null);
                }}
                className="w-full py-2 px-3.5 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all"
              >
                <BookmarkCheck className="w-4 h-4 text-blue-600" />
                <span>Mark Reserved (Upcoming Booking)</span>
              </button>

              <button
                onClick={() => {
                  updateTableStatus(actionModalTable.id, 'billed');
                  setActionModalTable(null);
                }}
                className="w-full py-2 px-3.5 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all"
              >
                <Receipt className="w-4 h-4 text-purple-600" />
                <span>Mark Billed (Check Printed)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
