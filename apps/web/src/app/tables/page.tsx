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
  Ban,
  Sparkles,
  QrCode,
  Printer,
  ChevronRight,
  TrendingUp,
  Store,
  Compass,
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
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#3B82F6]">
            <Grid className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Floor Plan &amp; Table Management
              </h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-[#1D4ED8] border border-blue-200">
                Live Dining Floor
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time table occupancy, guest seating capacities &amp; dining timers
            </p>
          </div>
        </div>

        {/* Quick QR Studio Action */}
        <div className="flex items-center space-x-2.5">
          <Link
            href="/tables/qr"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center space-x-2 shadow-sm transition-all"
          >
            <QrCode className="w-4 h-4 text-[#60A5FA]" />
            <span>Print 4×6&quot; QR Table Stands</span>
          </Link>
        </div>
      </div>

      {/* 2. Executive Floor Analytics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3B82F6] flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Live Seating Capacity
            </span>
            <span className="text-xl font-black text-slate-900 tabular-nums">
              {occupiedSeats} <span className="text-xs font-semibold text-slate-500">/ {totalSeats} Seats</span>
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Floor Utilization
            </span>
            <span className="text-xl font-black text-slate-900 tabular-nums">
              {occupancyPercent}% <span className="text-xs font-semibold text-amber-600">Occupied</span>
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Ready for Seating
            </span>
            <span className="text-xl font-black text-slate-900 tabular-nums">
              {availableTables.length} <span className="text-xs font-semibold text-emerald-600">Vacant Tables</span>
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Dining Tabs
            </span>
            <span className="text-xl font-black text-[#1D4ED8] tabular-nums">
              {formatCurrency(activeRunningRevenue)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Section Tabs & Status Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Left: Area / Section Selector */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 text-xs no-scrollbar">
          <button
            onClick={() => setSelectedSection('all')}
            className={`px-3.5 py-1.5 rounded-xl font-extrabold transition-all whitespace-nowrap ${
              selectedSection === 'all'
                ? 'bg-[#0B1120] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Areas ({tables.length})
          </button>
          {sections.map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSection(sec)}
              className={`px-3.5 py-1.5 rounded-xl font-extrabold transition-all whitespace-nowrap ${
                selectedSection === sec
                  ? 'bg-[#3B82F6] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sec} ({tables.filter((t) => t.section === sec).length})
            </button>
          ))}
        </div>

        {/* Right: Live Status Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 text-xs no-scrollbar">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-full font-bold transition-all text-xs border ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            All ({tables.length})
          </button>
          <button
            onClick={() => setStatusFilter('available')}
            className={`px-3 py-1 rounded-full font-bold transition-all text-xs border flex items-center space-x-1.5 ${
              statusFilter === 'available'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
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
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
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
                : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
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
                : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Billed ({billedTables.length})</span>
          </button>
        </div>
      </div>

      {/* 4. Floor Plan Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {filteredTables.map((table) => {
          const activeOrder = orders.find((o) => o.id === table.activeOrderId);
          const isCircle = table.capacity <= 2;

          return (
            <div
              key={table.id}
              className={`bg-white rounded-3xl border shadow-xs overflow-hidden flex flex-col justify-between transition-all hover:shadow-xl hover:-translate-y-1 relative group ${
                table.status === 'occupied'
                  ? 'border-amber-300 ring-1 ring-amber-300/30'
                  : table.status === 'billed'
                  ? 'border-purple-300 ring-1 ring-purple-300/30'
                  : table.status === 'reserved'
                  ? 'border-blue-300 ring-1 ring-blue-300/30'
                  : 'border-slate-200/90 hover:border-[#3B82F6]/60'
              }`}
            >
              {/* Card Top Banner */}
              <div className="p-3.5 pb-2.5 flex items-start justify-between border-b border-slate-100 bg-slate-50/60">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-black text-base text-slate-900 tracking-tight">
                      {table.label}
                    </h3>
                    <span className="text-[10px] font-semibold text-slate-500 px-2 py-0.5 rounded-md bg-white border border-slate-200">
                      {table.section}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <span
                  className={`text-[9px] uppercase font-black px-2.5 py-1 rounded-full border flex items-center space-x-1.5 shadow-xs ${
                    table.status === 'occupied'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : table.status === 'billed'
                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                      : table.status === 'reserved'
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      table.status === 'occupied'
                        ? 'bg-amber-600 animate-pulse'
                        : table.status === 'billed'
                        ? 'bg-purple-600 animate-pulse'
                        : table.status === 'reserved'
                        ? 'bg-blue-600'
                        : 'bg-emerald-600'
                    }`}
                  />
                  <span>{table.status}</span>
                </span>
              </div>

              {/* Card Middle: Table Shape Visualization & Seated Info */}
              <div className="p-4 py-3 flex-1 flex flex-col justify-between space-y-3">
                {/* Visual Dining Table Shape */}
                <div className="flex items-center justify-center my-1">
                  <div
                    className={`flex items-center justify-center transition-all ${
                      isCircle
                        ? 'w-14 h-14 rounded-full border-2'
                        : table.capacity >= 8
                        ? 'w-24 h-12 rounded-xl border-2'
                        : 'w-20 h-12 rounded-xl border-2'
                    } ${
                      table.status === 'occupied'
                        ? 'bg-amber-100/70 border-amber-300 text-amber-900 shadow-xs'
                        : table.status === 'billed'
                        ? 'bg-purple-100/70 border-purple-300 text-purple-900 shadow-xs'
                        : table.status === 'reserved'
                        ? 'bg-blue-100/70 border-blue-300 text-blue-900 shadow-xs'
                        : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-1 font-black text-xs">
                      <Users className="w-3.5 h-3.5 opacity-70" />
                      <span>{table.capacity}</span>
                    </div>
                  </div>
                </div>

                {/* Seated Order Information */}
                {activeOrder ? (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span className="truncate max-w-[120px]" title={activeOrder.customerName || 'Walk-in Guest'}>
                        {activeOrder.customerName || 'Walk-in Guest'}
                      </span>
                      <span className="text-xs text-[#1D4ED8] tabular-nums font-extrabold">
                        {formatCurrency(activeOrder.grandTotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Order #{activeOrder.orderNumber}</span>
                      {table.seatedAt && (
                        <span className="flex items-center space-x-1 text-amber-700 font-semibold" suppressHydrationWarning>
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span suppressHydrationWarning>{formatDuration(table.seatedAt)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ) : table.status === 'reserved' ? (
                  <div className="bg-blue-50/60 p-3 rounded-2xl border border-blue-100 text-xs text-blue-900 text-center">
                    <span className="font-extrabold block text-xs">Reserved Seating</span>
                    <span className="text-[10px] text-blue-700">Awaiting guest arrival</span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-center text-xs text-emerald-800">
                    <span className="font-bold block text-[11px]">Ready to Seat</span>
                    <span className="text-[10px] text-emerald-600">Cleaned &amp; set for {table.capacity} guests</span>
                  </div>
                )}
              </div>

              {/* Card Action Footer */}
              <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link
                  href={`/pos?table=${table.id}`}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-white hover:bg-[#3B82F6] text-slate-700 hover:text-white font-extrabold text-[11px] flex items-center justify-center space-x-1 border border-slate-200 hover:border-transparent transition-all shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Take Order</span>
                </Link>

                <button
                  onClick={() => setActionModalTable(table)}
                  className="py-1.5 px-3 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-extrabold text-[11px] transition-colors"
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
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  Manage Table {actionModalTable.label}
                </h3>
                <span className="text-xs text-slate-500">
                  {actionModalTable.section} • {actionModalTable.capacity} Seats • Currently{' '}
                  <strong className="uppercase text-slate-800">{actionModalTable.status}</strong>
                </span>
              </div>
              <button
                onClick={() => setActionModalTable(null)}
                aria-label="Close table actions"
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {/* POS Action */}
              <Link
                href={`/pos?table=${actionModalTable.id}`}
                className="w-full py-2.5 px-4 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-extrabold text-xs flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Open in Cashier POS (Take Order)</span>
              </Link>

              {/* Status Toggles */}
              <button
                onClick={() => {
                  updateTableStatus(actionModalTable.id, 'available');
                  setActionModalTable(null);
                }}
                className="w-full py-2 px-3.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center space-x-1.5 transition-all"
              >
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Mark Available (Vacant &amp; Cleaned)</span>
              </button>

              <button
                onClick={() => {
                  updateTableStatus(actionModalTable.id, 'occupied');
                  setActionModalTable(null);
                }}
                className="w-full py-2 px-3.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-extrabold text-xs flex items-center justify-center space-x-1.5 transition-all"
              >
                <Users className="w-4 h-4 text-amber-600" />
                <span>Mark Occupied (Seat Walk-in Guests)</span>
              </button>

              <button
                onClick={() => {
                  updateTableStatus(actionModalTable.id, 'reserved');
                  setActionModalTable(null);
                }}
                className="w-full py-2 px-3.5 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-800 font-extrabold text-xs flex items-center justify-center space-x-1.5 transition-all"
              >
                <BookmarkCheck className="w-4 h-4 text-blue-600" />
                <span>Mark Reserved (Upcoming Booking)</span>
              </button>

              <button
                onClick={() => {
                  updateTableStatus(actionModalTable.id, 'billed');
                  setActionModalTable(null);
                }}
                className="w-full py-2 px-3.5 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-800 font-extrabold text-xs flex items-center justify-center space-x-1.5 transition-all"
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

