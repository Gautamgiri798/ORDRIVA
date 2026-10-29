'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePosStore } from '@/lib/store';
import { DiningTable, TableStatus } from '@/types';
import { formatDuration } from '@/lib/utils';
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
} from 'lucide-react';

export default function TablesPage() {
  const { tables, orders, updateTableStatus } = usePosStore();
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionModalTable, setActionModalTable] = useState<DiningTable | null>(null);

  const sections = ['Main Dining', 'Garden Terrace', 'VIP Lounge'];

  const filteredTables = tables.filter((t) => {
    const matchesSection = selectedSection === 'all' || t.section === selectedSection;
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSection && matchesStatus;
  });

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-50 border-emerald-300 text-emerald-950 hover:border-emerald-500';
      case 'occupied':
        return 'bg-amber-50 border-amber-300 text-amber-950 hover:border-amber-500';
      case 'reserved':
        return 'bg-blue-50 border-blue-300 text-blue-950 hover:border-blue-500';
      case 'billed':
        return 'bg-purple-50 border-purple-300 text-purple-950 hover:border-purple-500';
      default:
        return 'bg-slate-50 border-slate-300 text-slate-800';
    }
  };

  const getStatusBadge = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'occupied':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'reserved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'billed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#3B82F6]">
            <Grid className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Floor Plan & Table Management
            </h1>
            <p className="text-xs text-slate-500">Live occupancy, seating & elapsed dining times</p>
          </div>
        </div>

        {/* Section Tabs & QR Stand Print Action */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            <button
              onClick={() => setSelectedSection('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedSection === 'all' ? 'bg-[#3B82F6] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Areas ({tables.length})
            </button>
            {sections.map((sec) => (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedSection === sec ? 'bg-[#3B82F6] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>

          <Link
            href="/tables/qr"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-sm transition-all"
          >
            <QrCode className="w-4 h-4 text-[#60A5FA]" />
            <span>Print Table QR Stands</span>
          </Link>
        </div>
      </div>

      {/* Summary Occupancy Pill Bar */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1 rounded-full font-bold border transition-all ${
            statusFilter === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
          }`}
        >
          All ({tables.length})
        </button>
        <button
          onClick={() => setStatusFilter('available')}
          className={`px-3 py-1 rounded-full font-bold border transition-all ${
            statusFilter === 'available' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          Available ({tables.filter((t) => t.status === 'available').length})
        </button>
        <button
          onClick={() => setStatusFilter('occupied')}
          className={`px-3 py-1 rounded-full font-bold border transition-all ${
            statusFilter === 'occupied' ? 'bg-amber-600 text-white border-amber-600' : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
        >
          Occupied ({tables.filter((t) => t.status === 'occupied').length})
        </button>
        <button
          onClick={() => setStatusFilter('reserved')}
          className={`px-3 py-1 rounded-full font-bold border transition-all ${
            statusFilter === 'reserved' ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}
        >
          Reserved ({tables.filter((t) => t.status === 'reserved').length})
        </button>
        <button
          onClick={() => setStatusFilter('billed')}
          className={`px-3 py-1 rounded-full font-bold border transition-all ${
            statusFilter === 'billed' ? 'bg-purple-600 text-white border-purple-600' : 'bg-purple-50 text-purple-800 border-purple-200'
          }`}
        >
          Billed ({tables.filter((t) => t.status === 'billed').length})
        </button>
      </div>

      {/* Tables Grid Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredTables.map((table) => {
          const activeOrder = orders.find((o) => o.id === table.activeOrderId);

          return (
            <div
              key={table.id}
              onClick={() => setActionModalTable(table)}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-xs flex flex-col justify-between h-44 select-none ${getStatusColor(
                table.status
              )}`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900">{table.label}</h3>
                    <span className="text-[10px] text-slate-500 font-medium">{table.section}</span>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${getStatusBadge(
                      table.status
                    )}`}
                  >
                    {table.status}
                  </span>
                </div>

                <div className="flex items-center space-x-1 text-xs text-slate-600 mt-2">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{table.capacity} Guests</span>
                </div>

                {/* Seated Order Info */}
                {activeOrder && (
                  <div className="mt-2 text-xs font-semibold text-slate-900 bg-white/70 p-1.5 rounded-lg border border-slate-200/60">
                    <div>Order #{activeOrder.orderNumber}</div>
                    <div className="text-[11px] text-slate-500 font-normal">
                      {activeOrder.customerName || 'Walk-in'}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Timer or Action */}
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                {table.seatedAt ? (
                  <div className="flex items-center space-x-1 text-slate-500 font-medium" suppressHydrationWarning>
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span suppressHydrationWarning>{formatDuration(table.seatedAt)}</span>
                  </div>
                ) : (
                  <span className="text-slate-400 text-[11px]">Ready to seat</span>
                )}

                <span className="font-bold text-[#3B82F6] hover:underline text-[11px]">
                  Manage &rarr;
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table Quick Action Modal */}
      {actionModalTable && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-5 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  {actionModalTable.label} ({actionModalTable.section})
                </h3>
                <span className="text-xs text-slate-500">
                  Capacity: {actionModalTable.capacity} Seats • Currently {actionModalTable.status.toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setActionModalTable(null)}
                aria-label="Close table actions"
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {/* Action 1: Open POS Order for this table */}
              <Link
                href={`/pos?table=${actionModalTable.id}`}
                className="w-full py-2.5 px-3 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Take Order / Add Items in POS</span>
              </Link>

              {/* Action 2: Change Status Buttons */}
              <button
                onClick={() => {
                  updateTableStatus(actionModalTable.id, 'available');
                  setActionModalTable(null);
                }}
                className="w-full py-2 px-3 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-all"
              >
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Mark Available (Vacant)</span>
              </button>

              <button
                onClick={() => {
                  updateTableStatus(actionModalTable.id, 'reserved');
                  setActionModalTable(null);
                }}
                className="w-full py-2 px-3 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-all"
              >
                <BookmarkCheck className="w-4 h-4 text-blue-600" />
                <span>Mark Reserved</span>
              </button>

              <button
                onClick={() => {
                  updateTableStatus(actionModalTable.id, 'billed');
                  setActionModalTable(null);
                }}
                className="w-full py-2 px-3 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-800 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-all"
              >
                <Receipt className="w-4 h-4 text-purple-600" />
                <span>Mark Bill Printed</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

