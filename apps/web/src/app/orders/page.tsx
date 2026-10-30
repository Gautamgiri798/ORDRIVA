'use client';

import React, { useState, useMemo } from 'react';
import { usePosStore } from '@/lib/store';
import { Order, PaymentMethod } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { print80mmReceipt, printA4TaxInvoice } from '@/lib/receiptPrinter';
import {
  Receipt,
  Search,
  Printer,
  RotateCcw,
  CheckCircle,
  Clock,
  Banknote,
  FileText,
  Calendar,
  Filter,
  DollarSign,
  TrendingUp,
  CreditCard,
  QrCode,
  CalendarDays,
  X,
} from 'lucide-react';

type DateFilterOption = 'all' | 'today' | 'yesterday' | '7days' | '30days' | 'custom';
type StatusFilterOption = 'all' | 'paid' | 'unpaid' | 'dine_in' | 'takeaway' | 'refunded';

export default function OrdersHistoryPage() {
  const { orders, currentBranch, currentUser, settlePayment, refundOrder } = usePosStore();
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [customDate, setCustomDate] = useState<string>('');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [printFormat, setPrintFormat] = useState<'80mm' | 'a4'>('80mm');

  // Settlement modal for pending order
  const [isSettling, setIsSettling] = useState<boolean>(false);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
  const [tenderedInput, setTenderedInput] = useState<string>('');

  // Refund modal
  const [isRefundOpen, setIsRefundOpen] = useState<boolean>(false);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState<string>('Customer Request');

  // Filtered orders with Date and Status intelligence
  const filteredOrders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return orders.filter((o) => {
      // 1. Search Query Match
      const matchesSearch =
        o.orderNumber.toString().includes(search) ||
        o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        o.tableLabel?.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      // 2. Status Match
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'paid'
          ? o.paymentStatus === 'succeeded'
          : statusFilter === 'unpaid'
          ? o.paymentStatus === 'pending'
          : statusFilter === 'refunded'
          ? o.paymentStatus === 'refunded'
          : o.orderType === statusFilter;

      if (!matchesStatus) return false;

      // 3. Date Match
      const orderDate = new Date(o.createdAt);
      const orderMidnight = new Date(orderDate);
      orderMidnight.setHours(0, 0, 0, 0);

      if (dateFilter === 'today') {
        return orderMidnight.getTime() === today.getTime();
      } else if (dateFilter === 'yesterday') {
        return orderMidnight.getTime() === yesterday.getTime();
      } else if (dateFilter === '7days') {
        return orderDate >= sevenDaysAgo;
      } else if (dateFilter === '30days') {
        return orderDate >= thirtyDaysAgo;
      } else if (dateFilter === 'custom' && customDate) {
        const selectedMidnight = new Date(`${customDate}T00:00:00`);
        return orderMidnight.getTime() === selectedMidnight.getTime();
      }

      return true;
    });
  }, [orders, search, statusFilter, dateFilter, customDate]);

  // Analytics for currently filtered list
  const filteredMetrics = useMemo(() => {
    const settled = filteredOrders.filter((o) => o.paymentStatus === 'succeeded');
    const revenue = settled.reduce((sum, o) => sum + o.grandTotal, 0);
    const tax = settled.reduce((sum, o) => sum + o.cgst + o.sgst, 0);
    const net = settled.reduce((sum, o) => sum + o.subtotal - o.discountTotal, 0);
    const aov = settled.length > 0 ? Math.round(revenue / settled.length) : 0;
    const unpaid = filteredOrders.filter((o) => o.paymentStatus === 'pending').length;

    // Payment channel split
    let upi = 0;
    let card = 0;
    let cash = 0;
    settled.forEach((o) => {
      const m = o.paymentMethod || 'cash';
      if (m === 'upi') upi += o.grandTotal;
      else if (m === 'card') card += o.grandTotal;
      else cash += o.grandTotal;
    });

    return {
      count: filteredOrders.length,
      settledCount: settled.length,
      revenue,
      tax,
      net,
      aov,
      unpaid,
      upi,
      card,
      cash,
    };
  }, [filteredOrders]);

  const handleSettleSubmit = () => {
    if (!selectedOrder) return;
    const amount = parseFloat(tenderedInput) || selectedOrder.grandTotal;
    const res = settlePayment(selectedOrder.id, payMethod, amount);
    if (res.success && res.order) {
      setSelectedOrder(res.order);
      setIsSettling(false);
      setTenderedInput('');
    }
  };

  const handleRefundSubmit = () => {
    if (!selectedOrder) return;
    const ok = refundOrder(selectedOrder.id, refundAmount, refundReason);
    if (ok) {
      setIsRefundOpen(false);
      setSelectedOrder(null);
    } else {
      alert('Refund failed: Amount cannot exceed total balance.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#0F172A] text-white p-6 sm:p-7 rounded-3xl border border-blue-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 backdrop-blur-md border border-blue-400/30 text-xs font-semibold text-[#60A5FA]">
            <Receipt className="w-3.5 h-3.5 text-blue-400" />
            <span>Admin Portal • Financial Orders &amp; Day-by-Day Revenue</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Orders, Bills &amp; Revenue Analytics
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
            Analyze daily revenue with exact timestamps, audit itemized guest orders, trigger 80mm thermal receipts, and print official GST tax invoices.
          </p>
        </div>

        {/* Global Stats */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-initial bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3.5 text-center min-w-[140px]">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filtered Revenue</div>
            <div className="text-base sm:text-xl font-black text-emerald-400 tabular-nums">
              {formatCurrency(filteredMetrics.revenue)}
            </div>
            <div className="text-[10px] text-slate-400">{filteredMetrics.settledCount} Settled Bills</div>
          </div>

          <div className="flex-1 md:flex-initial bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3.5 text-center min-w-[130px]">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Open Tabs</div>
            <div className="text-base sm:text-xl font-black text-amber-400 tabular-nums">
              {filteredMetrics.unpaid} Tabs
            </div>
            <div className="text-[10px] text-slate-400">Unsettled Balance</div>
          </div>
        </div>
      </div>

      {/* 2. DAY-BY-DAY REVENUE ANALYTICS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100">
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">
            Net Food Sales
          </span>
          <div className="text-lg font-black text-slate-900 tabular-nums mt-0.5">
            {formatCurrency(filteredMetrics.net)}
          </div>
          <span className="text-[10px] text-slate-500">Excluding GST taxes</span>
        </div>

        <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-100">
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 block">
            GST Dual-Tax (5%)
          </span>
          <div className="text-lg font-black text-slate-900 tabular-nums mt-0.5">
            {formatCurrency(filteredMetrics.tax)}
          </div>
          <span className="text-[10px] text-slate-500">CGST + SGST statutory pool</span>
        </div>

        <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">
            Average Ticket (AOV)
          </span>
          <div className="text-lg font-black text-slate-900 tabular-nums mt-0.5">
            {formatCurrency(filteredMetrics.aov)}
          </div>
          <span className="text-[10px] text-slate-500">Per settled transaction</span>
        </div>

        <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block">
            Payment Split
          </span>
          <div className="text-xs font-bold text-slate-800 space-y-0.5 mt-1">
            <div className="flex justify-between">
              <span className="text-slate-500">UPI:</span>
              <span className="tabular-nums">{formatCurrency(filteredMetrics.upi)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Card/Cash:</span>
              <span className="tabular-nums">{formatCurrency(filteredMetrics.card + filteredMetrics.cash)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DATE & STATUS FILTERING TOOLBAR */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        {/* Date Filters Row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2 text-xs font-black text-slate-700 uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Analyze By Date:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {[
              { id: 'all', label: 'All Dates' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7days', label: 'Last 7 Days (1 Wk)' },
              { id: '30days', label: 'Last 30 Days (1 Mo)' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setDateFilter(d.id as DateFilterOption);
                  setCustomDate('');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  dateFilter === d.id && !customDate
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d.label}
              </button>
            ))}

            {/* Specific Custom Date Picker */}
            <div className="flex items-center space-x-1.5 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
              <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setDateFilter('custom');
                }}
                aria-label="Pick Specific Trading Date"
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              />
              {customDate && (
                <button
                  onClick={() => {
                    setCustomDate('');
                    setDateFilter('all');
                  }}
                  className="text-slate-400 hover:text-slate-700 ml-1 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Filters & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Search Input */}
          <div className="relative flex-1 sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, guest name, or table..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 font-medium"
            />
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            {[
              { id: 'all', label: 'All Bills' },
              { id: 'paid', label: 'Paid & Settled' },
              { id: 'unpaid', label: 'Unpaid Tabs' },
              { id: 'dine_in', label: 'Dine-In' },
              { id: 'takeaway', label: 'Takeaway' },
              { id: 'refunded', label: 'Refunded' },
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => setStatusFilter(pill.id as StatusFilterOption)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  statusFilter === pill.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. ORDERS & BILLS LEDGER TABLE WITH DATE & TIME */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Date &amp; Time Placed</th>
                <th className="py-3.5 px-4">Type &amp; Table</th>
                <th className="py-3.5 px-4">Guest</th>
                <th className="py-3.5 px-4">Items Summary</th>
                <th className="py-3.5 px-4">Bill Total (₹)</th>
                <th className="py-3.5 px-4">Payment State</th>
                <th className="py-3.5 px-4 text-right">Receipt Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-400 text-xs">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);
                  const isPaid = order.paymentStatus === 'succeeded';
                  const orderDate = new Date(order.createdAt);

                  const dateFormatted = orderDate.toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });

                  const dayOfWeek = orderDate.toLocaleDateString('en-IN', {
                    weekday: 'short',
                  });

                  const timeFormatted = orderDate.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  });

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Invoice # */}
                      <td className="py-3.5 px-4 font-black text-slate-900 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span>#{order.orderNumber}</span>
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {order.orderType === 'dine_in' ? 'Dine-In' : 'Takeaway'}
                          </span>
                        </div>
                      </td>

                      {/* DATE & TIME PLACED */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                          <span>{dateFormatted}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-extrabold border border-blue-200/60">
                            {dayOfWeek}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium flex items-center space-x-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{timeFormatted}</span>
                        </div>
                      </td>

                      {/* Service & Table */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {order.tableLabel ? (
                          <span className="font-extrabold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60">
                            Table {order.tableLabel}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">Counter</span>
                        )}
                      </td>

                      {/* Guest */}
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {order.customerName || 'Walk-in Guest'}
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <span>
                          {totalItems} items ({order.items.map((i) => i.name).slice(0, 2).join(', ')}
                          {order.items.length > 2 ? '...' : ''})
                        </span>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 font-black text-slate-900 tabular-nums text-sm">
                        {formatCurrency(order.grandTotal)}
                      </td>

                      {/* Payment State */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isPaid ? (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3 h-3" />
                            <span>Paid ({order.paymentMethod?.toUpperCase() || 'CASH'})</span>
                          </span>
                        ) : order.paymentStatus === 'refunded' ? (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            <RotateCcw className="w-3 h-3" />
                            <span>Refunded</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Unpaid Tab</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1.5">
                          {/* Quick 1-Click Print 80mm */}
                          <button
                            onClick={() => print80mmReceipt(order, currentBranch, currentUser.name)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-1 shadow-xs transition-transform active:scale-95"
                            title="Print 80mm Thermal Slip"
                          >
                            <Printer className="w-3.5 h-3.5 text-blue-400" />
                            <span>Print Slip</span>
                          </button>

                          {/* View Full Receipt */}
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setPrintFormat('80mm');
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs transition-colors flex items-center space-x-1"
                            title="Preview Bill & Tax Invoice"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. REALISTIC THERMAL RECEIPT & PRINTING MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-5 sm:p-6 border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 print:hidden">
              <div>
                <h3 className="font-black text-lg text-slate-900 flex items-center space-x-2">
                  <span>Tax Invoice #{selectedOrder.orderNumber}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    {selectedOrder.orderType === 'dine_in' ? `Table ${selectedOrder.tableLabel}` : 'Takeaway'}
                  </span>
                </h3>
                <span className="text-xs text-slate-500">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleDateString()} at{' '}
                  {new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Print Format Tabs */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold print:hidden">
              <button
                onClick={() => setPrintFormat('80mm')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                  printFormat === '80mm'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Printer className="w-3.5 h-3.5 text-blue-600" />
                <span>80mm Thermal Slip</span>
              </button>
              <button
                onClick={() => setPrintFormat('a4')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                  printFormat === 'a4'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>A4 Corporate Invoice</span>
              </button>
            </div>

            {/* Realistic Paper Thermal Receipt Preview */}
            <div id="printable-receipt" className="relative bg-amber-50/40 p-4 sm:p-5 rounded-2xl border border-amber-200/70 shadow-inner font-mono text-xs text-slate-800 space-y-3 print:bg-white print:border-none print:shadow-none print:p-2">
              {/* Paper Watermark Header */}
              <div className="text-center pb-2 border-b border-dashed border-slate-300 space-y-0.5">
                <div className="font-sans font-black text-base text-slate-900 tracking-wider">ORDRIVA</div>
                <div className="text-[11px] font-sans font-bold text-slate-700">{currentBranch.name}</div>
                <div className="text-[10px] text-slate-500 font-sans">{currentBranch.address}</div>
                <div className="text-[10px] text-slate-600 font-sans">
                  GSTIN: <span className="font-mono font-bold">{currentBranch.gstin}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-sans">
                  Phone: {currentBranch.phone} • FSSAI Lic: 10019011000123
                </div>
                <div className="pt-1 text-[11px] font-bold uppercase tracking-widest text-slate-800">
                  {printFormat === '80mm' ? 'RETAIL TAX INVOICE' : 'GST CORPORATE TAX INVOICE'}
                </div>
              </div>

              {/* Bill Meta */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Bill No: #{selectedOrder.orderNumber}</span>
                  <span>{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type: {selectedOrder.orderType.toUpperCase()}</span>
                  <span>Table: {selectedOrder.tableLabel || 'Counter'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Placed At: {new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>Cashier: {currentUser.name}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1.5">
                <div className="flex justify-between font-bold text-[10px] uppercase text-slate-500">
                  <span>ITEM</span>
                  <span>AMOUNT</span>
                </div>
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-start text-[11px]">
                    <div className="pr-2">
                      <span className="font-bold">{it.quantity}x</span> {it.name}
                      {it.modifiers && it.modifiers.length > 0 && (
                        <div className="text-[9.5px] text-slate-500 font-sans">
                          + {it.modifiers.map((m) => m.name).join(', ')}
                        </div>
                      )}
                    </div>
                    <span className="font-bold tabular-nums">
                      {formatCurrency(it.itemTotal)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals Breakdown */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="tabular-nums">{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discountTotal > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Discount:</span>
                    <span className="tabular-nums">-{formatCurrency(selectedOrder.discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>CGST (2.5%):</span>
                  <span className="tabular-nums">{formatCurrency(selectedOrder.cgst)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>SGST (2.5%):</span>
                  <span className="tabular-nums">{formatCurrency(selectedOrder.sgst)}</span>
                </div>
                {selectedOrder.serviceChargeTotal > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Service Charge (5%):</span>
                    <span className="tabular-nums">{formatCurrency(selectedOrder.serviceChargeTotal)}</span>
                  </div>
                )}
                <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-baseline font-black text-sm text-slate-900">
                  <span>NET PAYABLE:</span>
                  <span className="tabular-nums text-blue-600 text-base">{formatCurrency(selectedOrder.grandTotal)}</span>
                </div>
              </div>

              {/* Settlement Stamp */}
              <div className="p-2 rounded-xl bg-white/90 border border-slate-200 text-center text-[10px] font-sans font-bold">
                {selectedOrder.paymentStatus === 'succeeded' ? (
                  <span className="text-emerald-700">
                    ✓ PAID IN FULL • {selectedOrder.paymentMethod?.toUpperCase()} • {formatCurrency(selectedOrder.grandTotal)}
                  </span>
                ) : (
                  <span className="text-amber-700">
                    ⚠ UNPAID / RUNNING TAB • AWAITING SETTLEMENT
                  </span>
                )}
              </div>

              <div className="text-center text-[9px] text-slate-500 font-sans pt-1">
                <div>*** THANK YOU FOR DINING WITH US ***</div>
                <div>Powered by ORDRIVA Restaurant OS</div>
              </div>
            </div>

            {/* Print Action Buttons */}
            <div className="space-y-2 pt-2 print:hidden">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => print80mmReceipt(selectedOrder, currentBranch, currentUser.name)}
                  className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-transform active:scale-95"
                >
                  <Printer className="w-4 h-4 text-blue-400" />
                  <span>Print 80mm Slip</span>
                </button>

                <button
                  onClick={() => printA4TaxInvoice(selectedOrder, currentBranch, currentUser.name)}
                  className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-transform active:scale-95"
                >
                  <FileText className="w-4 h-4" />
                  <span>Print A4 Invoice</span>
                </button>
              </div>

              {selectedOrder.paymentStatus === 'pending' && (
                <button
                  onClick={() => {
                    setIsSettling(true);
                    setTenderedInput(selectedOrder.grandTotal.toString());
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                >
                  <Banknote className="w-4 h-4" />
                  <span>Settle Bill ({formatCurrency(selectedOrder.grandTotal)})</span>
                </button>
              )}

              {selectedOrder.paymentStatus === 'succeeded' && (
                <button
                  onClick={() => {
                    setRefundAmount(selectedOrder.grandTotal);
                    setIsRefundOpen(true);
                  }}
                  className="w-full py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center justify-center space-x-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Issue Order Refund</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. SETTLE PAYMENT MODAL */}
      {isSettling && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 border border-slate-200 space-y-4">
            <h3 className="font-black text-base text-slate-900">
              Settle Payment for #{selectedOrder.orderNumber}
            </h3>
            <div className="text-xs text-slate-500">
              Amount Due: <strong className="text-slate-900">{formatCurrency(selectedOrder.grandTotal)}</strong>
            </div>

            {/* Method Tabs */}
            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'upi', 'card'] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setPayMethod(m)}
                  className={`py-2 rounded-xl text-xs font-bold border uppercase transition-all ${
                    payMethod === m
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Cash Tendered Input */}
            {payMethod === 'cash' && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Cash Tendered (₹):</label>
                <input
                  type="number"
                  value={tenderedInput}
                  onChange={(e) => setTenderedInput(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsSettling(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSettleSubmit}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                Confirm Settlement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. REFUND MODAL */}
      {isRefundOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 border border-slate-200 space-y-4">
            <h3 className="font-black text-base text-slate-900">
              Issue Refund for #{selectedOrder.orderNumber}
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Refund Amount (₹):</label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason for Refund:</label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsRefundOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleRefundSubmit}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              >
                Process Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
