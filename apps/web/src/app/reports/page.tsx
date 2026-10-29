'use client';

import React, { useState } from 'react';
import { usePosStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Percent,
  Receipt,
  Download,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function ReportsPage() {
  const { orders, currentBranch } = usePosStore();
  const [dateFilter, setDateFilter] = useState<string>('today');

  const settledOrders = orders.filter((o) => o.paymentStatus === 'succeeded');
  const grossSales = settledOrders.reduce((s, o) => s + o.grandTotal, 0);
  const netSales = settledOrders.reduce((s, o) => s + (o.subtotal - o.discountTotal), 0);
  const totalTax = settledOrders.reduce((s, o) => s + o.taxTotal, 0);
  const totalCgst = settledOrders.reduce((s, o) => s + o.cgst, 0);
  const totalSgst = settledOrders.reduce((s, o) => s + o.sgst, 0);
  const totalDiscount = settledOrders.reduce((s, o) => s + o.discountTotal, 0);
  const aov = settledOrders.length > 0 ? Math.round(grossSales / settledOrders.length) : 0;

  // Payment Breakdown
  const cashTotal = settledOrders
    .filter((o) => o.paymentMethod === 'cash')
    .reduce((s, o) => s + o.grandTotal, 0);
  const upiTotal = settledOrders
    .filter((o) => o.paymentMethod === 'upi')
    .reduce((s, o) => s + o.grandTotal, 0);
  const cardTotal = settledOrders
    .filter((o) => o.paymentMethod === 'card')
    .reduce((s, o) => s + o.grandTotal, 0);

  // Top Selling Dishes Aggregator
  const itemMap: Record<string, { count: number; revenue: number }> = {};
  settledOrders.forEach((o) => {
    o.items.forEach((item) => {
      if (!itemMap[item.name]) {
        itemMap[item.name] = { count: 0, revenue: 0 };
      }
      itemMap[item.name].count += item.quantity;
      itemMap[item.name].revenue += item.itemTotal;
    });
  });

  const topItems = Object.entries(itemMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const exportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Order Number,Date,Type,Table,Subtotal,Discount,Tax,Grand Total,Payment Method\n' +
      settledOrders
        .map(
          (o) =>
            `${o.orderNumber},"${new Date(o.createdAt).toLocaleString()}",${o.orderType},${o.tableLabel || 'N/A'},${o.subtotal},${o.discountTotal},${o.taxTotal},${o.grandTotal},${o.paymentMethod || 'N/A'}`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ordriva_sales_${dateFilter}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#3B82F6]">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Sales, Taxes & GST Reports
            </h1>
            <p className="text-xs text-slate-500">
              {currentBranch.name} • GSTIN: {currentBranch.gstin}
            </p>
          </div>
        </div>

        {/* Date Filter & Export Button */}
        <div className="flex items-center space-x-2">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            {['today', 'yesterday', 'week', 'month'].map((df) => (
              <button
                key={df}
                onClick={() => setDateFilter(df)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  dateFilter === df ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {df}
              </button>
            ))}
          </div>

          <button
            onClick={exportCsv}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Sales</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
            {formatCurrency(grossSales)}
          </div>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">
            {settledOrders.length} Settled Invoices
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Sales</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
            {formatCurrency(netSales)}
          </div>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">
            After discounts ({formatCurrency(totalDiscount)})
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Order Value (AOV)</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
            {formatCurrency(aov)}
          </div>
          <span className="text-xs text-[#3B82F6] font-medium mt-1 inline-block">
            Per customer ticket
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total GST Collected</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
            {formatCurrency(totalTax)}
          </div>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">
            CGST: {formatCurrency(totalCgst)} | SGST: {formatCurrency(totalSgst)}
          </span>
        </div>
      </div>

      {/* Grid: Payment Method Breakdown & Top Sellers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-base font-extrabold text-slate-900">Payment Collection Channels</h2>
          <div className="space-y-3">
            {[
              { label: 'UPI QR Transfers', amount: upiTotal, color: 'bg-[#3B82F6]' },
              { label: 'Cash Drawer', amount: cashTotal, color: 'bg-emerald-500' },
              { label: 'Card Terminals (EDC)', amount: cardTotal, color: 'bg-[#A78BFA]' },
            ].map((p, i) => {
              const pct = grossSales > 0 ? Math.round((p.amount / grossSales) * 100) : 0;
              return (
                <div key={i} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-700">{p.label}</span>
                    <span className="tabular-nums font-bold text-slate-900">
                      {formatCurrency(p.amount)} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full ${p.color}`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Dishes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-base font-extrabold text-slate-900">Top Performing Dishes</h2>
          <div className="divide-y divide-slate-100 text-xs">
            {topItems.length === 0 ? (
              <div className="py-8 text-center text-slate-400">No settled sales yet today</div>
            ) : (
              topItems.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-slate-400 w-4">{idx + 1}.</span>
                    <div>
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <span className="text-[10px] text-slate-500">{item.count} portions sold</span>
                    </div>
                  </div>
                  <span className="font-extrabold text-slate-900 tabular-nums">
                    {formatCurrency(item.revenue)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* End of Day Z-Report Summary Box */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-lg font-extrabold">End-of-Day (Z-Report) Cashier Closing</h2>
            <p className="text-xs text-slate-400">Shift summary & register reconciliation</p>
          </div>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs shadow-md shadow-blue-500/20"
          >
            Print Z-Report
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 uppercase text-[10px] font-bold">Total Invoices</span>
            <div className="text-xl font-bold mt-0.5">{settledOrders.length}</div>
          </div>
          <div>
            <span className="text-slate-400 uppercase text-[10px] font-bold">Expected Cash in Drawer</span>
            <div className="text-xl font-bold mt-0.5 tabular-nums text-emerald-400">
              {formatCurrency(cashTotal)}
            </div>
          </div>
          <div>
            <span className="text-slate-400 uppercase text-[10px] font-bold">Total Digital (UPI/Card)</span>
            <div className="text-xl font-bold mt-0.5 tabular-nums text-[#60A5FA]">
              {formatCurrency(upiTotal + cardTotal)}
            </div>
          </div>
          <div>
            <span className="text-slate-400 uppercase text-[10px] font-bold">Total Taxes (CGST+SGST)</span>
            <div className="text-xl font-bold mt-0.5 tabular-nums text-amber-300">
              {formatCurrency(totalTax)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

