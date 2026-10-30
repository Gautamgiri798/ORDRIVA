'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePosStore } from '@/lib/store';
import { formatCurrency, formatTime } from '@/lib/utils';
import { Order, PaymentMethod } from '@/types';
import {
  DollarSign,
  ShoppingBag,
  Grid,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  Receipt,
  Printer,
  Search,
  Filter,
  CheckCircle,
  CreditCard,
  Banknote,
  QrCode,
  Calendar,
  Flame,
  ArrowUpRight,
  BarChart3,
  Layers,
  X,
  Check,
  ChevronDown,
  ChevronRight,
  Zap,
} from 'lucide-react';

type TimeRange = '1day' | '7days' | '30days' | 'all';
type OrderFilterTab = 'all' | 'succeeded' | 'pending' | 'dine_in' | 'takeaway';

export default function AdminDashboardPage() {
  const {
    currentBranch,
    orders,
    tables,
    inventory,
    currentUser,
    settlePayment,
  } = usePosStore();

  // Revenue Range Filter
  const [timeRange, setTimeRange] = useState<TimeRange>('7days');

  // Selected Day for drill-down focus (null = aggregate for entire period)
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  // Orders & Bills Section State
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [orderTab, setOrderTab] = useState<OrderFilterTab>('all');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // Settlement Modal State
  const [settlingOrder, setSettlingOrder] = useState<Order | null>(null);
  const [settleMethod, setSettleMethod] = useState<PaymentMethod>('cash');
  const [tenderedInput, setTenderedInput] = useState<string>('');

  // 1. CALCULATE REVENUE IN RANGE (1 Day, 1 Week, 1 Month, All Time)
  const rangeConfig = useMemo(() => {
    let daysToInclude = 7;
    let label = 'Last 7 Days (1 Week)';

    if (timeRange === '1day') {
      daysToInclude = 1;
      label = "Today's Trading (1 Day)";
    } else if (timeRange === '7days') {
      daysToInclude = 7;
      label = 'Last 7 Days (1 Week)';
    } else if (timeRange === '30days') {
      daysToInclude = 30;
      label = 'Last 30 Days (1 Month)';
    } else {
      daysToInclude = 30;
      label = 'All Historical Records (30 Days)';
    }

    return { daysToInclude, label };
  }, [timeRange]);

  // Aggregate daily data for each calendar day in the selected period
  const { dailyBreakdown, periodTotals, peakDay } = useMemo(() => {
    const days = rangeConfig.daysToInclude;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Map of dateKey -> orders
    const dayMap = new Map<string, Order[]>();

    // Pre-populate days in chronological order (oldest to newest for bar chart)
    const dayKeysChronological: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const key = d.toISOString().split('T')[0];
      dayKeysChronological.push(key);
      dayMap.set(key, []);
    }

    // Place completed/settled orders into the appropriate bucket
    orders.forEach((o) => {
      if (o.paymentStatus === 'succeeded') {
        const orderDateStr = new Date(o.createdAt).toISOString().split('T')[0];
        if (dayMap.has(orderDateStr)) {
          dayMap.get(orderDateStr)?.push(o);
        }
      }
    });

    let totalRevenue = 0;
    let totalNet = 0;
    let totalTax = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalOrders = 0;
    const methodCounts: Record<PaymentMethod, { count: number; amount: number }> = {
      cash: { count: 0, amount: 0 },
      upi: { count: 0, amount: 0 },
      card: { count: 0, amount: 0 },
    };

    let maxRev = 0;
    let peakDayData: any = null;

    const breakdown = dayKeysChronological.map((key) => {
      const ordersInDay = dayMap.get(key) || [];
      const [year, month, dayNum] = key.split('-');
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(dayNum));

      const isToday = key === today.toISOString().split('T')[0];
      const yesterday = new Date(today.getTime() - 86400000).toISOString().split('T')[0];
      const isYesterday = key === yesterday;

      const dayRevenue = ordersInDay.reduce((sum, o) => sum + o.grandTotal, 0);
      const dayNet = ordersInDay.reduce((sum, o) => sum + (o.subtotal - o.discountTotal), 0);
      const dayTax = ordersInDay.reduce((sum, o) => sum + o.taxTotal, 0);
      const dayCgst = ordersInDay.reduce((sum, o) => sum + o.cgst, 0);
      const daySgst = ordersInDay.reduce((sum, o) => sum + o.sgst, 0);
      const dayAov = ordersInDay.length > 0 ? Math.round(dayRevenue / ordersInDay.length) : 0;

      // Method counts for this day
      const dayMethods: Record<string, number> = { upi: 0, card: 0, cash: 0 };
      ordersInDay.forEach((o) => {
        const m = o.paymentMethod || 'cash';
        dayMethods[m] = (dayMethods[m] || 0) + 1;
        if (methodCounts[m]) {
          methodCounts[m].count++;
          methodCounts[m].amount += o.grandTotal;
        }
      });

      const dominantMethod = Object.entries(dayMethods).sort((a, b) => b[1] - a[1])[0]?.[0] || 'upi';

      totalRevenue += dayRevenue;
      totalNet += dayNet;
      totalTax += dayTax;
      totalCgst += dayCgst;
      totalSgst += daySgst;
      totalOrders += ordersInDay.length;

      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const displayDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

      const dayRecord = {
        key,
        dateObj,
        displayDate,
        dayName,
        isToday,
        isYesterday,
        orderCount: ordersInDay.length,
        grossRevenue: dayRevenue,
        netSales: dayNet,
        tax: dayTax,
        cgst: dayCgst,
        sgst: daySgst,
        aov: dayAov,
        dominantMethod,
        isPeak: false,
      };

      if (dayRevenue > maxRev) {
        maxRev = dayRevenue;
        peakDayData = dayRecord;
      }

      return dayRecord;
    });

    // Mark peak day
    if (peakDayData && maxRev > 0) {
      const target = breakdown.find((b) => b.key === peakDayData.key);
      if (target) target.isPeak = true;
    }

    const aovTotal = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    return {
      dailyBreakdown: breakdown,
      peakDay: peakDayData,
      periodTotals: {
        totalRevenue,
        totalNet,
        totalTax,
        totalCgst,
        totalSgst,
        totalOrders,
        aovTotal,
        maxDailyRevenue: maxRev || 1,
        methodCounts,
      },
    };
  }, [orders, rangeConfig]);

  // Reverse list for the Day-by-Day ledger table (newest days at the top)
  const tableDailyList = useMemo(() => {
    return [...dailyBreakdown].reverse();
  }, [dailyBreakdown]);

  // Filtered Orders for the Orders & Bills section
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.orderNumber.toString().includes(orderSearch) ||
        (o.customerName && o.customerName.toLowerCase().includes(orderSearch.toLowerCase())) ||
        (o.tableLabel && o.tableLabel.toLowerCase().includes(orderSearch.toLowerCase()));

      let matchTab = true;
      if (orderTab === 'succeeded') matchTab = o.paymentStatus === 'succeeded';
      if (orderTab === 'pending') matchTab = o.paymentStatus === 'pending';
      if (orderTab === 'dine_in') matchTab = o.orderType === 'dine_in';
      if (orderTab === 'takeaway') matchTab = o.orderType === 'takeaway';

      return matchSearch && matchTab;
    });
  }, [orders, orderSearch, orderTab]);

  // Instant 80mm Isolated Bill Printing
  const executePrintBill = (order: Order) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const itemsHtml = order.items
      .map(
        (it) => `
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:11px;">
        <div>
          <span style="font-weight:bold;">${it.quantity}x</span> ${it.name}
          ${it.modifiers && it.modifiers.length > 0 ? `<div style="font-size:9.5px;color:#555;">+ ${it.modifiers.map((m) => m.name).join(', ')}</div>` : ''}
        </div>
        <div style="font-weight:bold;text-align:right;">₹${it.itemTotal.toFixed(2)}</div>
      </div>
    `
      )
      .join('');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Tax Invoice #${order.orderNumber} - ${currentBranch.name}</title>
          <style>
            @page { size: 80mm auto; margin: 4mm; }
            * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Courier New", monospace; color: #000; }
            body { margin: 0; padding: 4px; font-size: 11px; }
            .header { text-align: center; border-bottom: 1.5px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
            .brand { font-size: 17px; font-weight: 900; letter-spacing: 0.15em; font-family: Georgia, serif; }
            .sub { font-size: 9.5px; margin-top: 2px; }
            .meta { border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; font-size: 10px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 3px; }
            .items { border-bottom: 1.5px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
            .totals { font-size: 11px; }
            .grand-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; padding: 5px 0; margin-top: 5px; }
            .footer { text-align: center; margin-top: 10px; font-size: 9px; border-top: 1px dashed #000; padding-top: 6px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">ORDRIVA</div>
            <div class="sub" style="font-weight:bold;">${currentBranch.name}</div>
            <div class="sub">${currentBranch.address}</div>
            <div class="sub">GSTIN: ${currentBranch.gstin}</div>
            <div class="sub">Phone: ${currentBranch.phone}</div>
          </div>
          <div class="meta">
            <div class="row">
              <span><strong>Tax Invoice #${order.orderNumber}</strong></span>
              <span>${order.tableLabel ? `Table: ${order.tableLabel}` : order.orderType.toUpperCase()}</span>
            </div>
            <div class="row">
              <span>Date: ${new Date(order.createdAt).toLocaleDateString()}</span>
              <span>Time: ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="row">
              <span>Staff: ${order.createdByName || 'Rahul Verma'}</span>
              <span>Guest: ${order.customerName || 'Dine-In Guest'}</span>
            </div>
          </div>
          <div class="items">
            ${itemsHtml}
          </div>
          <div class="totals">
            <div class="row"><span>Item Subtotal:</span><span>₹${order.subtotal.toFixed(2)}</span></div>
            ${order.discountTotal > 0 ? `<div class="row" style="color:#d00;"><span>Special Discount:</span><span>-₹${order.discountTotal.toFixed(2)}</span></div>` : ''}
            <div class="row"><span>CGST (2.5%):</span><span>₹${order.cgst.toFixed(2)}</span></div>
            <div class="row"><span>SGST (2.5%):</span><span>₹${order.sgst.toFixed(2)}</span></div>
            ${order.serviceChargeTotal > 0 ? `<div class="row"><span>Service Charge (5%):</span><span>₹${order.serviceChargeTotal.toFixed(2)}</span></div>` : ''}
            <div class="grand-row">
              <span>NET PAYABLE:</span>
              <span>₹${order.grandTotal.toFixed(2)}</span>
            </div>
          </div>
          <div class="footer">
            <div style="font-weight:bold;">Payment: ${order.paymentStatus === 'succeeded' ? `SETTLED VIA ${order.paymentMethod?.toUpperCase() || 'CASH'}` : 'UNPAID / RUNNING TAB'}</div>
            <div style="margin-top:3px;">Thank you for dining with us!</div>
            <div style="margin-top:2px;color:#666;">Powered by ORDRIVA Restaurant OS</div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        iframe.remove();
      }, 2000);
    }, 250);
  };

  // Settle Bill Submit Handler
  const handleSettleOrder = () => {
    if (!settlingOrder) return;
    const tenderedNum = parseFloat(tenderedInput) || settlingOrder.grandTotal;
    const res = settlePayment(settlingOrder.id, settleMethod, tenderedNum);
    if (res.success) {
      setSettlingOrder(null);
      setTenderedInput('');
      if (viewingOrder?.id === settlingOrder.id && res.order) {
        setViewingOrder(res.order);
      }
    }
  };

  // Payment Breakdown Percentages
  const upiPercent =
    periodTotals.totalRevenue > 0
      ? Math.round((periodTotals.methodCounts.upi.amount / periodTotals.totalRevenue) * 100)
      : 0;
  const cardPercent =
    periodTotals.totalRevenue > 0
      ? Math.round((periodTotals.methodCounts.card.amount / periodTotals.totalRevenue) * 100)
      : 0;
  const cashPercent =
    periodTotals.totalRevenue > 0
      ? Math.max(0, 100 - upiPercent - cardPercent)
      : 0;

  // Active Floor Stats
  const occupiedTables = tables.filter((t) => t.status === 'occupied' || t.status === 'billed');
  const occupancyPercent = tables.length > 0 ? Math.round((occupiedTables.length / tables.length) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 text-slate-800">
      {/* 1. EXECUTIVE WELCOME BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#0F172A] text-white p-6 sm:p-8 shadow-xl border border-blue-500/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 backdrop-blur-md border border-blue-400/30 text-xs font-semibold text-[#60A5FA]">
              <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span>ORDRIVA Executive Management Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome back, {currentUser.name}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              Operating <strong className="text-white">{currentBranch.name}</strong> • GSTIN: <span className="font-mono text-blue-200">{currentBranch.gstin}</span>
            </p>
          </div>

          {/* Quick Hub Navigation */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/pos"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/30 flex items-center space-x-2 transition-all active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cashier POS</span>
            </Link>
            <Link
              href="/orders"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 shadow-xs flex items-center space-x-2 transition-all active:scale-95"
            >
              <Receipt className="w-4 h-4 text-blue-400" />
              <span>Orders &amp; Bills ({orders.length})</span>
            </Link>
            <Link
              href="/tables/qr"
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center space-x-2 transition-all active:scale-95"
            >
              <QrCode className="w-4 h-4 text-blue-400" />
              <span>Table QR Stands</span>
            </Link>
          </div>
        </div>

        {/* Decorative Watermark */}
        <div
          className="absolute right-4 -bottom-8 opacity-10 pointer-events-none select-none overflow-hidden"
          style={{ width: '220px', height: '110px' }}
        >
          <Image src="/ordriva-logo.svg" alt="" width={220} height={110} className="object-contain" priority />
        </div>
      </div>

      {/* 2. REVENUE INTELLIGENCE DASHBOARD (1 Day, 1 Week, 1 Month & Day-by-Day) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm space-y-6">
        {/* Dashboard Header with Period Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Revenue &amp; Financial Performance
              </h2>
            </div>
            <p className="text-xs text-slate-500 pl-10.5">
              Track gross sales, net revenue, GST compliance and day-by-day trading comparisons
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 shadow-inner overflow-x-auto">
            <button
              onClick={() => setTimeRange('1day')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
                timeRange === '1day'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>1 Day (Today)</span>
            </button>
            <button
              onClick={() => setTimeRange('7days')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
                timeRange === '7days'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>1 Week (7 Days)</span>
            </button>
            <button
              onClick={() => setTimeRange('30days')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
                timeRange === '30days'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>1 Month (30 Days)</span>
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
                timeRange === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>All Time</span>
            </button>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Gross Sales */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 via-white to-blue-50/30 border border-blue-200/80 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-bold text-blue-900">
              <span className="uppercase tracking-wider">Gross Sales</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                {timeRange === '1day' ? 'Today' : timeRange === '7days' ? '7D Total' : '30D Total'}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tabular-nums">
              {formatCurrency(periodTotals.totalRevenue)}
            </div>
            <div className="flex items-center space-x-1.5 mt-2 text-xs font-bold text-emerald-700">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{periodTotals.totalOrders} settled guest bills</span>
            </div>
          </div>

          {/* Card 2: Net Sales */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span className="uppercase tracking-wider">Net Sales</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                Excl. GST &amp; Tips
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tabular-nums">
              {formatCurrency(periodTotals.totalNet)}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Avg Ticket (AOV): <strong className="text-slate-800 tabular-nums">{formatCurrency(periodTotals.aovTotal)}</strong>
            </div>
          </div>

          {/* Card 3: GST Tax Collection */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span className="uppercase tracking-wider">GST Statutory Tax</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                5.0% Dual GST
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2 tabular-nums">
              {formatCurrency(periodTotals.totalTax)}
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-2">
              <span>CGST: <strong className="text-slate-700 tabular-nums">{formatCurrency(periodTotals.totalCgst)}</strong></span>
              <span>•</span>
              <span>SGST: <strong className="text-slate-700 tabular-nums">{formatCurrency(periodTotals.totalSgst)}</strong></span>
            </div>
          </div>

          {/* Card 4: Payment Split */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span className="uppercase tracking-wider">Payment Channels</span>
              <span className="text-[10px] font-bold text-blue-600">UPI Preferred</span>
            </div>
            {/* Visual Split Bar */}
            <div className="w-full h-3 bg-slate-100 rounded-full flex overflow-hidden">
              <div
                style={{ width: `${upiPercent}%` }}
                className="bg-blue-600 h-full"
                title={`UPI: ${upiPercent}%`}
              />
              <div
                style={{ width: `${cardPercent}%` }}
                className="bg-purple-600 h-full"
                title={`Card: ${cardPercent}%`}
              />
              <div
                style={{ width: `${cashPercent}%` }}
                className="bg-emerald-500 h-full"
                title={`Cash: ${cashPercent}%`}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 pt-1">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>UPI {upiPercent}%</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-purple-600" />
                <span>Card {cardPercent}%</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Cash {cashPercent}%</span>
              </span>
            </div>
          </div>
        </div>

        {/* 2B. DAY-BY-DAY REVENUE BAR CHART */}
        <div className="p-5 rounded-3xl bg-slate-50/80 border border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  Day-by-Day Revenue Progression
                </h3>
                {peakDay && (
                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    <Flame className="w-3 h-3 text-amber-600" />
                    <span>Peak Day: {peakDay.displayDate} ({formatCurrency(peakDay.grossRevenue)})</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Visual sales curve across {dailyBreakdown.length} trading days. Hover or click a bar to inspect.
              </p>
            </div>

            <div className="flex items-center space-x-3 text-[11px] text-slate-500">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
                <span>Sales Bar</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                <span>Peak Volume</span>
              </span>
            </div>
          </div>

          {/* Interactive CSS Bar Chart */}
          <div className="pt-6 pb-2 px-2 overflow-x-auto">
            <div className="flex items-end justify-between gap-2 sm:gap-3 min-w-[500px] h-48 border-b border-slate-200 pb-2">
              {dailyBreakdown.map((day) => {
                const heightPercent = Math.max(
                  10,
                  Math.round((day.grossRevenue / periodTotals.maxDailyRevenue) * 100)
                );
                const isSelected = selectedDayKey === day.key;

                return (
                  <div
                    key={day.key}
                    onClick={() => setSelectedDayKey(isSelected ? null : day.key)}
                    className="flex-1 flex flex-col items-center group cursor-pointer relative"
                  >
                    {/* Tooltip on Hover */}
                    <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center pointer-events-none whitespace-nowrap bg-slate-900 text-white text-[10px] px-2.5 py-1 rounded-xl shadow-lg font-bold">
                      <span>{day.displayDate}: {formatCurrency(day.grossRevenue)}</span>
                      <span className="text-[9px] text-slate-300 font-normal">{day.orderCount} orders • AOV {formatCurrency(day.aov)}</span>
                    </div>

                    {/* Bar Value on top of tallest bars */}
                    {day.grossRevenue > 0 && (
                      <span className="text-[9px] font-bold text-slate-400 mb-1 tabular-nums hidden sm:block">
                        {Math.round(day.grossRevenue / 1000)}k
                      </span>
                    )}

                    {/* Vertical Bar */}
                    <div className="w-full max-w-[42px] h-32 bg-slate-200/60 rounded-xl flex items-end p-0.5">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-lg transition-all duration-300 ${
                          day.isPeak
                            ? 'bg-gradient-to-t from-amber-500 to-amber-300 shadow-sm shadow-amber-500/30 ring-2 ring-amber-400/40'
                            : day.isToday
                            ? 'bg-gradient-to-t from-blue-700 to-blue-500 ring-2 ring-blue-500/50 shadow-sm'
                            : 'bg-gradient-to-t from-blue-600 to-blue-400 group-hover:from-blue-700 group-hover:to-blue-500'
                        } ${isSelected ? 'ring-2 ring-slate-900 scale-105' : ''}`}
                      />
                    </div>

                    {/* X-Axis Date Label */}
                    <div className="mt-2 text-center">
                      <span className="block text-[10px] font-bold text-slate-800">
                        {day.dayName}
                      </span>
                      <span className="block text-[9px] text-slate-400 font-medium whitespace-nowrap">
                        {day.displayDate.split(' ')[0]} {day.displayDate.split(' ')[1]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2C. DAY-BY-DAY REVENUE DETAILED HISTORICAL TABLE */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 tracking-tight">
              Day-by-Day Historical Ledger
            </h3>
            <span className="text-xs text-slate-500">
              Showing {tableDailyList.length} trading days in selected period
            </span>
          </div>

          <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="py-2.5 px-4">Date &amp; Day</th>
                    <th className="py-2.5 px-4">Settled Bills</th>
                    <th className="py-2.5 px-4">Net Sales</th>
                    <th className="py-2.5 px-4">GST (5%)</th>
                    <th className="py-2.5 px-4">Gross Revenue</th>
                    <th className="py-2.5 px-4">Avg Ticket (AOV)</th>
                    <th className="py-2.5 px-4">Dominant Channel</th>
                    <th className="py-2.5 px-4 text-right">Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tableDailyList.map((day) => (
                    <tr
                      key={day.key}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        day.isToday ? 'bg-blue-50/20 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900">
                            {day.displayDate}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                            {day.dayName}
                          </span>
                          {day.isToday && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-extrabold uppercase">
                              Today
                            </span>
                          )}
                          {day.isYesterday && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                              Yesterday
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium tabular-nums">
                        {day.orderCount} orders
                      </td>
                      <td className="py-3 px-4 text-slate-700 tabular-nums">
                        {formatCurrency(day.netSales)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 tabular-nums">
                        {formatCurrency(day.tax)}
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900 tabular-nums text-sm">
                        {formatCurrency(day.grossRevenue)}
                      </td>
                      <td className="py-3 px-4 text-slate-700 tabular-nums">
                        {formatCurrency(day.aov)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {day.dominantMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {day.isPeak ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center space-x-1">
                            <span>🔥</span>
                            <span>Peak Day</span>
                          </span>
                        ) : day.grossRevenue > periodTotals.aovTotal * 4 ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            High Volume
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            Regular
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ORDER AND BILL SECTION IN ADMIN PORTAL */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm space-y-6">
        {/* Orders Header & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Orders &amp; Bills Ledger
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {orders.length} Total Bills
                </span>
              </div>
              <p className="text-xs text-slate-500">
                View itemized breakdowns, print 80mm GST customer tax receipts &amp; settle payments
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {/* Real-time Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search by order #, table or guest..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
              />
            </div>
            <Link
              href="/orders"
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center space-x-1 transition-colors shrink-0"
              title="Full Orders Screen"
            >
              <span>Full Screen</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { key: 'all', label: 'All Orders' },
              { key: 'succeeded', label: 'Paid / Settled Bills' },
              { key: 'pending', label: 'Unpaid / Running Tabs' },
              { key: 'dine_in', label: 'Dine-In Tables' },
              { key: 'takeaway', label: 'Takeaway' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setOrderTab(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                orderTab === tab.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Service &amp; Table</th>
                  <th className="py-3 px-4">Guest</th>
                  <th className="py-3 px-4">Order Items</th>
                  <th className="py-3 px-4">Bill Total (₹)</th>
                  <th className="py-3 px-4">Payment State</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.slice(0, 15).map((order) => {
                  const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);
                  const isPaid = order.paymentStatus === 'succeeded';

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-black text-slate-900 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span>#{order.orderNumber}</span>
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {order.orderType === 'dine_in' ? 'Dine-In' : 'Takeaway'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {order.tableLabel ? (
                          <span className="font-extrabold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60">
                            Table {order.tableLabel}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">Counter</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {order.customerName || 'Walk-in Guest'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span>
                          {totalItems} items ({order.items.map((i) => i.name).slice(0, 2).join(', ')}
                          {order.items.length > 2 ? '...' : ''})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900 tabular-nums text-sm">
                        {formatCurrency(order.grandTotal)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isPaid ? (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3 h-3" />
                            <span>Paid ({order.paymentMethod?.toUpperCase() || 'CASH'})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Unpaid Tab</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1.5">
                          {/* View Bill Button */}
                          <button
                            onClick={() => setViewingOrder(order)}
                            className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs transition-colors flex items-center space-x-1"
                            title="View Full Tax Receipt"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>View Bill</span>
                          </button>

                          {/* Quick 80mm Print */}
                          <button
                            onClick={() => executePrintBill(order)}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="Print 80mm Tax Invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Settle Action if pending */}
                          {!isPaid && (
                            <button
                              onClick={() => {
                                setSettlingOrder(order);
                                setTenderedInput(order.grandTotal.toString());
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
                            >
                              Settle
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. RESTAURANT OPERATIONS FLOOR OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Floor Occupancy Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Floor Seating Utilization
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-slate-900 tabular-nums">
                {occupancyPercent}%
              </span>
              <span className="text-xs text-slate-500 font-medium">
                ({occupiedTables.length}/{tables.length} tables active)
              </span>
            </div>
            <Link href="/tables" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 pt-1">
              <span>View Floor Blueprint</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Grid className="w-6 h-6" />
          </div>
        </div>

        {/* Low Stock Ingredient Warning */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Ingredient Stock Health
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-slate-900 tabular-nums">
                {inventory.filter((i) => i.currentStock <= i.minReorderLevel).length}
              </span>
              <span className="text-xs text-rose-600 font-bold">
                Below Minimum Reorder
              </span>
            </div>
            <Link href="/inventory" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 pt-1">
              <span>View Recipe BoM</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 5. LUXURY 80MM BILL RECEIPT MODAL */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  Tax Invoice #{viewingOrder.orderNumber}
                </h3>
                <span className="text-xs text-slate-500">
                  {new Date(viewingOrder.createdAt).toLocaleString()} • {viewingOrder.orderType.toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setViewingOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Receipt Preview Container */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 font-mono text-xs">
              <div className="text-center pb-2 border-b border-dashed border-slate-300">
                <div className="font-serif font-black text-base text-slate-900">ORDRIVA</div>
                <div className="text-[10px] text-slate-600 font-sans font-bold">{currentBranch.name}</div>
                <div className="text-[9px] text-slate-400 font-sans">GSTIN: {currentBranch.gstin}</div>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 divide-y divide-slate-100">
                {viewingOrder.items.map((it, idx) => (
                  <div key={idx} className="pt-1.5 flex justify-between items-start">
                    <div>
                      <span className="font-bold">{it.quantity}x</span> {it.name}
                      {it.modifiers && it.modifiers.length > 0 && (
                        <div className="text-[10px] text-slate-500 font-sans">
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

              {/* Financial Totals */}
              <div className="pt-2 border-t border-dashed border-slate-300 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="tabular-nums font-semibold">{formatCurrency(viewingOrder.subtotal)}</span>
                </div>
                {viewingOrder.discountTotal > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Discount:</span>
                    <span className="tabular-nums">-{formatCurrency(viewingOrder.discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>CGST (2.5%):</span>
                  <span className="tabular-nums">{formatCurrency(viewingOrder.cgst)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>SGST (2.5%):</span>
                  <span className="tabular-nums">{formatCurrency(viewingOrder.sgst)}</span>
                </div>
                {viewingOrder.serviceChargeTotal > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Service Charge (5%):</span>
                    <span className="tabular-nums">{formatCurrency(viewingOrder.serviceChargeTotal)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-900 flex justify-between items-baseline font-black text-sm text-slate-900">
                  <span>GRAND TOTAL:</span>
                  <span className="tabular-nums text-blue-600 text-base">{formatCurrency(viewingOrder.grandTotal)}</span>
                </div>
              </div>

              {/* Payment Status Stamp */}
              <div className="p-2 rounded-xl bg-white border border-slate-200 text-center text-[10px] font-sans font-bold">
                {viewingOrder.paymentStatus === 'succeeded' ? (
                  <span className="text-emerald-700">
                    PAID IN FULL • {viewingOrder.paymentMethod?.toUpperCase()} • {formatCurrency(viewingOrder.grandTotal)}
                  </span>
                ) : (
                  <span className="text-amber-700">
                    UNPAID / RUNNING TAB • AWAITING CASHIER SETTLEMENT
                  </span>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => executePrintBill(viewingOrder)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all active:scale-95"
              >
                <Printer className="w-4 h-4 text-blue-400" />
                <span>Print 80mm Bill</span>
              </button>

              {viewingOrder.paymentStatus === 'pending' && (
                <button
                  onClick={() => {
                    setSettlingOrder(viewingOrder);
                    setTenderedInput(viewingOrder.grandTotal.toString());
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                >
                  <Banknote className="w-4 h-4" />
                  <span>Settle Bill</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. SETTLE BILL PAYMENT MODAL */}
      {settlingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  Settle Bill #{settlingOrder.orderNumber}
                </h3>
                <span className="text-xs text-slate-500">
                  Grand Total: <strong className="text-slate-900">{formatCurrency(settlingOrder.grandTotal)}</strong>
                </span>
              </div>
              <button
                onClick={() => setSettlingOrder(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Select Method */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                Payment Channel
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['cash', 'upi', 'card'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setSettleMethod(m)}
                    className={`py-2 rounded-xl text-xs font-bold uppercase transition-all flex flex-col items-center justify-center space-y-1 border ${
                      settleMethod === m
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m === 'cash' && <Banknote className="w-4 h-4" />}
                    {m === 'upi' && <QrCode className="w-4 h-4" />}
                    {m === 'card' && <CreditCard className="w-4 h-4" />}
                    <span>{m}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tendered Input for Cash */}
            {settleMethod === 'cash' && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">
                  Amount Received (₹)
                </label>
                <input
                  type="number"
                  value={tenderedInput}
                  onChange={(e) => setTenderedInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-black bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 tabular-nums"
                />
                {parseFloat(tenderedInput) > settlingOrder.grandTotal && (
                  <div className="text-xs text-emerald-700 font-bold mt-1">
                    Change Due: {formatCurrency(parseFloat(tenderedInput) - settlingOrder.grandTotal)}
                  </div>
                )}
              </div>
            )}

            {/* UPI QR Hint */}
            {settleMethod === 'upi' && (
              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200/60 text-center space-y-1">
                <span className="text-[11px] font-bold text-blue-900 block">
                  Dynamic UPI Payment
                </span>
                <p className="text-[10px] text-blue-700">
                  Customer can scan terminal QR code via GPay, PhonePe or Paytm.
                </p>
              </div>
            )}

            {/* Submit Action */}
            <button
              onClick={handleSettleOrder}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Confirm &amp; Complete Settlement</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
