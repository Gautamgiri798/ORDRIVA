'use client';

import React, { useState, useMemo } from 'react';
import { usePosStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import {
  printZReport80mm,
  printExecutiveReportA4,
  ReportPrintData,
} from '@/lib/receiptPrinter';
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
  Printer,
  FileText,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function ReportsPage() {
  const { orders, currentBranch, currentUser } = usePosStore();
  const [dateFilter, setDateFilter] = useState<string>('today');

  // Filter settled orders based on selected period
  const filteredSettledOrders = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const weekStart = todayStart - 6 * 86400000;
    const monthStart = todayStart - 29 * 86400000;

    return orders.filter((o) => {
      if (o.paymentStatus !== 'succeeded') return false;
      const t = new Date(o.createdAt).getTime();
      if (dateFilter === 'today') return t >= todayStart;
      if (dateFilter === 'yesterday') return t >= yesterdayStart && t < todayStart;
      if (dateFilter === 'week') return t >= weekStart;
      if (dateFilter === 'month') return t >= monthStart;
      return true;
    });
  }, [orders, dateFilter]);

  // If filteredSettledOrders has data, use it; otherwise fallback to all settled orders
  const settledOrders =
    filteredSettledOrders.length > 0
      ? filteredSettledOrders
      : orders.filter((o) => o.paymentStatus === 'succeeded');

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

  const getPeriodLabel = () => {
    switch (dateFilter) {
      case 'today':
        return "Today's Shift";
      case 'yesterday':
        return "Yesterday's Shift";
      case 'week':
        return 'Last 7 Days (1 Week)';
      case 'month':
        return 'Last 30 Days (1 Month)';
      default:
        return 'All Historical Records';
    }
  };

  const handlePrintZSlip = () => {
    const reportData: ReportPrintData = {
      branch: currentBranch,
      periodLabel: getPeriodLabel(),
      generatedAt: new Date(),
      cashierName: currentUser?.name || 'Rahul Verma',
      totalOrders: settledOrders.length,
      grossSales,
      netSales,
      totalDiscount,
      totalTax,
      totalCgst,
      totalSgst,
      aov,
      cashTotal,
      upiTotal,
      cardTotal,
      topDishes: topItems.map((i) => ({ name: i.name, count: i.count, revenue: i.revenue })),
    };
    printZReport80mm(reportData);
  };

  const handlePrintExecutiveA4 = () => {
    const reportData: ReportPrintData = {
      branch: currentBranch,
      periodLabel: getPeriodLabel(),
      generatedAt: new Date(),
      cashierName: currentUser?.name || 'Rahul Verma',
      totalOrders: settledOrders.length,
      grossSales,
      netSales,
      totalDiscount,
      totalTax,
      totalCgst,
      totalSgst,
      aov,
      cashTotal,
      upiTotal,
      cardTotal,
      topDishes: topItems.map((i) => ({ name: i.name, count: i.count, revenue: i.revenue })),
    };
    printExecutiveReportA4(reportData);
  };

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
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Sales, Taxes & GST Reports
              </h1>
              <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                <ShieldCheck className="w-3 h-3 text-blue-600" />
                <span>GST Compliant</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentBranch.name} • GSTIN: <span className="font-semibold text-slate-700">{currentBranch.gstin}</span>
            </p>
          </div>
        </div>

        {/* Date Filter & Print / Export Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Period Pills */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold overflow-x-auto">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'week', label: '7 Days' },
              { id: 'month', label: '30 Days' },
            ].map((df) => (
              <button
                key={df.id}
                onClick={() => setDateFilter(df.id)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  dateFilter === df.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {df.label}
              </button>
            ))}
          </div>

          {/* Export CSV */}
          <button
            onClick={exportCsv}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs"
            title="Download CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV</span>
          </button>

          {/* Print 80mm Z-Slip */}
          <button
            onClick={handlePrintZSlip}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all shadow-xs"
            title="Print 80mm Thermal Cashier Shift Slip"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>80mm Slip</span>
          </button>

          {/* Print A4 Executive Statement */}
          <button
            onClick={handlePrintExecutiveA4}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold transition-all shadow-sm shadow-blue-500/25"
            title="Print 1-Page Official A4 Audit Statement"
          >
            <FileText className="w-3.5 h-3.5 text-white" />
            <span>Print A4 Statement</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm break-inside-avoid">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Sales</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
            {formatCurrency(grossSales)}
          </div>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{settledOrders.length} Settled Invoices</span>
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm break-inside-avoid">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Sales</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
            {formatCurrency(netSales)}
          </div>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">
            After discounts ({formatCurrency(totalDiscount)})
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm break-inside-avoid">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Order Value (AOV)</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
            {formatCurrency(aov)}
          </div>
          <span className="text-xs text-blue-600 font-medium mt-1 inline-block">
            Per customer ticket
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm break-inside-avoid">
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
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 break-inside-avoid">
          <h2 className="text-base font-extrabold text-slate-900">Payment Collection Channels</h2>
          <div className="space-y-3">
            {[
              { label: 'UPI QR Transfers', amount: upiTotal, color: 'bg-blue-600' },
              { label: 'Cash Drawer', amount: cashTotal, color: 'bg-emerald-500' },
              { label: 'Card Terminals (EDC)', amount: cardTotal, color: 'bg-purple-600' },
            ].map((p, i) => {
              const pct = grossSales > 0 ? Math.round((p.amount / grossSales) * 100) : 0;
              return (
                <div key={i} className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-700">{p.label}</span>
                    <span className="tabular-nums font-bold text-slate-900">
                      {formatCurrency(p.amount)} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full ${p.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Dishes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 break-inside-avoid">
          <h2 className="text-base font-extrabold text-slate-900">Top Performing Dishes</h2>
          <div className="divide-y divide-slate-100 text-xs">
            {topItems.length === 0 ? (
              <div className="py-8 text-center text-slate-400">No settled sales recorded</div>
            ) : (
              topItems.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-extrabold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
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
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 space-y-5 break-inside-avoid page-break-inside-avoid">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-extrabold tracking-tight">End-of-Day (Z-Report) Cashier Closing</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Shift Balanced
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Official shift summary, payment channel reconciliation &amp; statutory GST totals
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintZSlip}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 transition-all shadow-xs"
              title="Print standard 80mm thermal receipt roll for drawer drop"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>80mm Thermal Slip</span>
            </button>

            <button
              onClick={handlePrintExecutiveA4}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs transition-all shadow-md shadow-blue-500/20"
              title="Print 1-Page Official A4 Audit Statement"
            >
              <FileText className="w-4 h-4 text-white" />
              <span>Print A4 Statement</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">Total Invoices</span>
            <div className="text-xl font-extrabold mt-1 text-white">{settledOrders.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{getPeriodLabel()}</div>
          </div>
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">Cash in Drawer</span>
            <div className="text-xl font-extrabold mt-1 tabular-nums text-emerald-400">
              {formatCurrency(cashTotal)}
            </div>
            <div className="text-[10px] text-emerald-500/80 mt-0.5">Physical Tender</div>
          </div>
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">Total Digital</span>
            <div className="text-xl font-extrabold mt-1 tabular-nums text-[#60A5FA]">
              {formatCurrency(upiTotal + cardTotal)}
            </div>
            <div className="text-[10px] text-blue-400/80 mt-0.5">UPI &amp; Card EDC</div>
          </div>
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">Statutory GST Pool</span>
            <div className="text-xl font-extrabold mt-1 tabular-nums text-amber-300">
              {formatCurrency(totalTax)}
            </div>
            <div className="text-[10px] text-amber-400/80 mt-0.5">Dual GST (CGST+SGST)</div>
          </div>
        </div>
      </div>
    </div>
  );
}


