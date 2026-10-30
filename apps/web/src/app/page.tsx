'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePosStore } from '@/lib/store';
import { formatCurrency, formatTime } from '@/lib/utils';
import { print80mmReceipt, printA4TaxInvoice } from '@/lib/receiptPrinter';
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
  FileText,
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

  // Mobile View Toggles (Cards vs Table)
  const [ledgerViewMode, setLedgerViewMode] = useState<'cards' | 'table'>('cards');
  const [ordersViewMode, setOrdersViewMode] = useState<'cards' | 'table'>('cards');

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
    print80mmReceipt(order, currentBranch, currentUser.name);
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
    <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 text-slate-800">
      {/* 1. EXECUTIVE WELCOME BANNER */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#0F172A] text-white p-5 sm:p-8 shadow-xl border border-blue-500/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 backdrop-blur-md border border-blue-400/30 text-xs font-semibold text-[#60A5FA]">
              <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span>ORDRIVA Executive Management Suite</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white">
              Welcome back, {currentUser.name}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              Operating <strong className="text-white">{currentBranch.name}</strong> • GSTIN: <span className="font-mono text-blue-200">{currentBranch.gstin}</span>
            </p>
          </div>

          {/* Quick Hub Navigation */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
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
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-4 sm:p-7 shadow-sm space-y-6">
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

        {/* 2B. LUXURY DAY-BY-DAY REVENUE PROGRESSION CANVAS */}
        <div className="p-4 sm:p-7 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-white via-slate-50/50 to-slate-50/90 border border-slate-200/90 shadow-sm space-y-5 sm:space-y-6">
          {/* Header & Meta Ribbon */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/70 pb-5">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center border border-blue-600/20 shadow-xs">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Day-by-Day Revenue Progression
                </h3>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs">
                  {rangeConfig.label}
                </span>
                {peakDay && (
                  <span className="inline-flex items-center space-x-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shadow-xs">
                    <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    <span>Peak Day: <strong className="font-black">{peakDay.displayDate}</strong> ({formatCurrency(peakDay.grossRevenue)})</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Trading volume curve across {dailyBreakdown.length} days with Dual GST statutory tax pools. Hover or click a bar to inspect.
              </p>
            </div>

            {/* Quick KPI Run Rate & Legend */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="hidden sm:flex items-center space-x-3 px-3.5 py-1.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-xs">
                <div className="text-right">
                  <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">Daily Run Rate</span>
                  <span className="font-black text-slate-900 tabular-nums">
                    {formatCurrency(Math.round(periodTotals.totalRevenue / (dailyBreakdown.length || 1)))} / day
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-xs text-slate-600 px-3 py-1.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs font-semibold">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-md bg-gradient-to-t from-blue-700 to-sky-400 shadow-xs shadow-blue-500/30" />
                  <span>Standard Volume</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-md bg-gradient-to-t from-amber-600 to-yellow-300 shadow-xs shadow-amber-500/30 ring-1 ring-amber-400" />
                  <span>Peak Volume</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-md bg-gradient-to-t from-indigo-700 to-cyan-400 shadow-xs ring-1 ring-blue-500" />
                  <span>Today</span>
                </span>
              </div>
            </div>
          </div>

          {/* Luxury Chart Canvas with Benchmark Grid & Slender Columns */}
          <div className="pt-2 sm:pt-4 pb-2 px-0 sm:px-1 overflow-x-auto">
            {dailyBreakdown.length > 7 && (
              <div className="sm:hidden flex items-center justify-between text-[11px] font-bold text-blue-700 bg-blue-50/80 px-3 py-1.5 rounded-xl border border-blue-200/60 mb-2">
                <span>← Swipe horizontally to explore full {dailyBreakdown.length}-day timeline →</span>
                <span className="text-blue-600 font-extrabold uppercase">30D</span>
              </div>
            )}
            <div className={`relative ${dailyBreakdown.length > 7 ? 'min-w-[700px]' : 'min-w-0 w-full'}`}>
              {/* Benchmark Horizontal Guide Lines & Left Y-Axis */}
              {(() => {
                const maxVal = periodTotals.maxDailyRevenue || 10000;
                const step = maxVal > 20000 ? 10000 : 5000;
                const gridCeil = Math.ceil(maxVal / step) * step;
                const gridLevels = [
                  { label: `₹${Math.round(gridCeil / 1000)}k`, percent: 100 },
                  { label: `₹${Math.round((gridCeil * 0.75) / 1000)}k`, percent: 75 },
                  { label: `₹${Math.round((gridCeil * 0.5) / 1000)}k`, percent: 50 },
                  { label: `₹${Math.round((gridCeil * 0.25) / 1000)}k`, percent: 25 },
                ];

                return (
                  <div className="relative">
                    {/* Background Grid Guide Lines */}
                    <div className="absolute inset-0 left-9 sm:left-12 bottom-10 sm:bottom-12 pointer-events-none flex flex-col justify-between">
                      {gridLevels.map((lvl, idx) => (
                        <div key={idx} className="w-full border-b border-dashed border-slate-200/80 flex items-center">
                          <span className="text-[9px] font-mono text-slate-300 ml-auto pr-1"></span>
                        </div>
                      ))}
                      <div className="w-full border-b border-slate-300"></div>
                    </div>

                    {/* Chart Container: Left Y-Axis + Bars */}
                    <div className="flex items-end">
                      {/* Left Y-Axis Labels */}
                      <div className="w-9 sm:w-12 h-44 sm:h-52 flex flex-col justify-between pb-10 sm:pb-12 pr-1.5 sm:pr-2 text-right shrink-0 select-none">
                        {gridLevels.map((lvl, idx) => (
                          <span key={idx} className="text-[8.5px] sm:text-[9.5px] font-mono font-bold text-slate-400 tabular-nums">
                            {lvl.label}
                          </span>
                        ))}
                        <span className="text-[8.5px] sm:text-[9.5px] font-mono font-bold text-slate-400 tabular-nums">₹0</span>
                      </div>

                      {/* Bars Flex Strip */}
                      <div className="flex-1 flex items-end justify-between gap-1 sm:gap-4 relative z-10 pb-2">
                        {dailyBreakdown.map((day) => {
                          const heightPercent = Math.max(
                            8,
                            Math.min(100, Math.round((day.grossRevenue / gridCeil) * 100))
                          );
                          const isSelected = selectedDayKey === day.key;

                          return (
                            <div
                              key={day.key}
                              onClick={() => setSelectedDayKey(isSelected ? null : day.key)}
                              className="flex-1 flex flex-col items-center group cursor-pointer relative"
                            >
                              {/* Rich Floating Luxury Tooltip on Hover */}
                              <div className="absolute -top-32 z-30 hidden group-hover:flex flex-col pointer-events-none whitespace-nowrap bg-slate-950/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-slate-700/80 min-w-[180px] animate-in fade-in zoom-in-95 duration-150">
                                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[10px]">
                                  <span className="font-extrabold text-slate-300">{day.dayName}, {day.displayDate}</span>
                                  {day.isPeak ? (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-black text-[9px] border border-amber-500/30">PEAK</span>
                                  ) : day.isToday ? (
                                    <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-black text-[9px] border border-blue-500/30">TODAY</span>
                                  ) : (
                                    <span className="text-slate-500 text-[9px] uppercase font-bold">TRADING</span>
                                  )}
                                </div>
                                <div className="pt-1.5">
                                  <div className="text-sm font-black text-white tabular-nums tracking-tight">
                                    {formatCurrency(day.grossRevenue)}
                                  </div>
                                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9.5px] text-slate-400 pt-1 border-t border-slate-800/60 mt-1">
                                    <div>Net: <span className="text-slate-200 font-bold">{formatCurrency(day.netSales)}</span></div>
                                    <div>GST: <span className="text-slate-200 font-bold">{formatCurrency(day.tax)}</span></div>
                                    <div>Bills: <span className="text-slate-200 font-bold">{day.orderCount}</span></div>
                                    <div>AOV: <span className="text-slate-200 font-bold">{formatCurrency(day.aov)}</span></div>
                                  </div>
                                  <div className="text-[9px] text-blue-400 font-bold pt-1 text-center">
                                    Click bar to inspect in ledger
                                  </div>
                                </div>
                                <div className="w-2.5 h-2.5 bg-slate-950 border-r border-b border-slate-700 rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2" />
                              </div>

                              {/* Floating Value Pill Badge Above Bar */}
                              <div className="mb-1 sm:mb-1.5 transition-transform duration-200 group-hover:-translate-y-0.5">
                                {day.grossRevenue > 0 ? (
                                  <span
                                    className={`text-[8px] sm:text-[10px] font-black tabular-nums tracking-tight px-1 sm:px-1.5 py-0.5 rounded-md border shadow-2xs transition-colors ${
                                      day.isPeak
                                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400 shadow-amber-500/30'
                                        : day.isToday
                                        ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/30'
                                        : isSelected
                                        ? 'bg-slate-900 text-white border-slate-800'
                                        : 'bg-white/95 text-slate-700 border-slate-200 group-hover:border-blue-400 group-hover:text-blue-700'
                                    }`}
                                  >
                                    ₹{(day.grossRevenue / 1000).toFixed(0)}k
                                  </span>
                                ) : (
                                  <span className="text-[7.5px] sm:text-[9px] font-bold text-slate-300">₹0</span>
                                )}
                              </div>

                              {/* Slender Architectural Bar Column */}
                              <div
                                className={`w-7 sm:w-11 max-w-[44px] h-36 sm:h-44 bg-slate-100/70 rounded-xl sm:rounded-2xl flex items-end p-0.5 sm:p-1 relative border transition-all duration-300 group-hover:bg-slate-100 ${
                                  isSelected
                                    ? 'border-blue-500 ring-2 ring-blue-500/40 bg-blue-50/30'
                                    : 'border-slate-200/70 group-hover:border-blue-300'
                                }`}
                              >
                                <div
                                  style={{ height: `${heightPercent}%` }}
                                  className={`w-full rounded-lg sm:rounded-xl transition-all duration-500 relative overflow-hidden group-hover:brightness-105 ${
                                    day.isPeak
                                      ? 'bg-gradient-to-t from-amber-600 via-amber-500 to-yellow-300 border-t-2 border-white/70 shadow-md shadow-amber-500/30 ring-2 ring-amber-400/50'
                                      : day.isToday
                                      ? 'bg-gradient-to-t from-indigo-700 via-blue-600 to-cyan-400 border-t-2 border-white/70 shadow-md shadow-blue-500/25 ring-2 ring-blue-400/50'
                                      : 'bg-gradient-to-t from-blue-700 via-blue-600 to-sky-400 border-t-2 border-white/50 shadow-sm shadow-blue-500/20'
                                  }`}
                                >
                                  {/* Glass Shimmer Accent */}
                                  <div className="absolute inset-x-0 top-0 h-1 bg-white/40" />
                                </div>
                              </div>

                              {/* X-Axis Date Pill Container */}
                              <div className="mt-2 sm:mt-2.5 text-center transition-all duration-200">
                                <span className={`block text-[10px] sm:text-xs font-black tracking-tight ${
                                  day.isToday ? 'text-blue-700' : day.isPeak ? 'text-amber-800' : 'text-slate-800'
                                }`}>
                                  {day.dayName}
                                </span>
                                <span className="block text-[8px] sm:text-[10px] text-slate-500 font-semibold whitespace-nowrap">
                                  {day.displayDate.split(' ')[0]} {day.displayDate.split(' ')[1]}
                                </span>
                                {day.isToday && (
                                  <span className="inline-block px-1 sm:px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[7.5px] sm:text-[8.5px] font-black uppercase mt-0.5 shadow-2xs">
                                    Today
                                  </span>
                                )}
                                {day.isPeak && !day.isToday && (
                                  <span className="inline-block px-1 sm:px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[7.5px] sm:text-[8.5px] font-black uppercase mt-0.5">
                                    Peak
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Interactive Inspection Strip (When a Day is Selected) */}
          {selectedDayKey && (() => {
            const activeDay = dailyBreakdown.find((d) => d.key === selectedDayKey);
            if (!activeDay) return null;

            return (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 via-slate-900 to-[#0F172A] text-white flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg shadow-blue-950/20 border border-blue-800/40 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-sm text-white">
                        {activeDay.dayName}, {activeDay.displayDate} Deep Dive
                      </span>
                      {activeDay.isPeak && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                          Peak Revenue
                        </span>
                      )}
                      {activeDay.isToday && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500 text-white">
                          Current Day
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1">
                      <span>Gross: <strong className="text-white font-black tabular-nums">{formatCurrency(activeDay.grossRevenue)}</strong></span>
                      <span>Net: <strong className="text-slate-100 font-semibold tabular-nums">{formatCurrency(activeDay.netSales)}</strong></span>
                      <span>GST (5%): <strong className="text-emerald-400 font-semibold tabular-nums">{formatCurrency(activeDay.tax)}</strong></span>
                      <span>Bills: <strong className="text-slate-100 font-semibold tabular-nums">{activeDay.orderCount}</strong></span>
                      <span>Avg Ticket: <strong className="text-blue-300 font-semibold tabular-nums">{formatCurrency(activeDay.aov)}</strong></span>
                      <span>Preferred: <strong className="uppercase text-amber-300 font-bold">{activeDay.dominantMethod}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end md:self-auto shrink-0">
                  <button
                    onClick={() => {
                      setOrderSearch(activeDay.displayDate.split(' ')[0]);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    Filter Orders Below
                  </button>
                  <button
                    onClick={() => setSelectedDayKey(null)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Close inspection"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* 2C. DAY-BY-DAY REVENUE DETAILED HISTORICAL TABLE */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                Day-by-Day Historical Ledger
              </h3>
              <span className="text-xs text-slate-500">
                Showing {tableDailyList.length} trading days in selected period
              </span>
            </div>

            {/* Mobile View Toggle: Cards vs Table */}
            <div className="sm:hidden inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold self-start">
              <button
                onClick={() => setLedgerViewMode('cards')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  ledgerViewMode === 'cards'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Card View
              </button>
              <button
                onClick={() => setLedgerViewMode('table')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  ledgerViewMode === 'table'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Table View
              </button>
            </div>
          </div>

          {/* 1. Mobile Cards View (sm:hidden when in card mode) */}
          <div className={`${ledgerViewMode === 'cards' ? 'block' : 'hidden'} sm:hidden space-y-2.5`}>
            {tableDailyList.map((day) => (
              <div
                key={day.key}
                onClick={() => setSelectedDayKey(selectedDayKey === day.key ? null : day.key)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  day.isToday
                    ? 'bg-blue-50/40 border-blue-200 shadow-xs ring-1 ring-blue-400/30'
                    : day.isPeak
                    ? 'bg-amber-50/30 border-amber-200'
                    : 'bg-white border-slate-200/80 shadow-2xs hover:border-blue-200'
                }`}
              >
                {/* Top Row: Date, Day Badges, Orders Count */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-sm text-slate-900">{day.displayDate}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {day.dayName}
                    </span>
                    {day.isToday && (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-2xs">
                        Today
                      </span>
                    )}
                    {day.isPeak && !day.isToday && (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold">
                        Peak 🔥
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                    {day.orderCount} orders
                  </span>
                </div>

                {/* 2x2 Complete Metrics Grid: Every metric is visible with zero cutoffs */}
                <div className="grid grid-cols-2 gap-2 pt-2.5 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">
                      Gross Revenue
                    </span>
                    <span className="text-sm font-black text-slate-900 tabular-nums mt-0.5 block">
                      {formatCurrency(day.grossRevenue)}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">
                      Net Food Sales
                    </span>
                    <span className="text-sm font-extrabold text-slate-800 tabular-nums mt-0.5 block">
                      {formatCurrency(day.netSales)}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">
                      GST (5% Pool)
                    </span>
                    <span className="text-xs font-extrabold text-emerald-700 tabular-nums mt-0.5 block">
                      {formatCurrency(day.tax)}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">
                      Avg Ticket (AOV)
                    </span>
                    <span className="text-xs font-extrabold text-blue-700 tabular-nums mt-0.5 block">
                      {formatCurrency(day.aov)}
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Channel & Performance */}
                <div className="flex items-center justify-between pt-2.5 text-[11px] text-slate-500">
                  <div className="flex items-center space-x-1.5">
                    <span>Dominant:</span>
                    <span className="font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {day.dominantMethod}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 flex items-center space-x-1">
                    <span>Inspect details</span>
                    <span>→</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* 2. Full Table View (Desktop always; Mobile when in table mode) */}
          <div
            className={`${
              ledgerViewMode === 'table' ? 'block' : 'hidden sm:block'
            } border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs`}
          >
            {/* Mobile Swipe Hint */}
            <div className="sm:hidden flex items-center justify-between text-[11px] font-bold text-blue-700 bg-blue-50/80 px-3 py-1.5 border-b border-blue-100">
              <span>← Swipe table horizontally to explore all 8 columns →</span>
              <span className="text-blue-500">8 Columns</span>
            </div>

            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-20">
                  <tr className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="py-2.5 px-4 sticky left-0 bg-slate-50 z-20 shadow-xs whitespace-nowrap">
                      Date &amp; Day
                    </th>
                    <th className="py-2.5 px-4 whitespace-nowrap">Settled Bills</th>
                    <th className="py-2.5 px-4 whitespace-nowrap">Net Sales</th>
                    <th className="py-2.5 px-4 whitespace-nowrap">GST (5%)</th>
                    <th className="py-2.5 px-4 whitespace-nowrap">Gross Revenue</th>
                    <th className="py-2.5 px-4 whitespace-nowrap">Avg Ticket (AOV)</th>
                    <th className="py-2.5 px-4 whitespace-nowrap">Dominant Channel</th>
                    <th className="py-2.5 px-4 text-right whitespace-nowrap">Performance</th>
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
                      <td className="py-3 px-4 whitespace-nowrap sticky left-0 bg-white z-10 shadow-xs">
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
                      <td className="py-3 px-4 text-slate-700 font-medium tabular-nums whitespace-nowrap">
                        {day.orderCount} orders
                      </td>
                      <td className="py-3 px-4 text-slate-700 tabular-nums whitespace-nowrap">
                        {formatCurrency(day.netSales)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 tabular-nums whitespace-nowrap font-medium text-emerald-700">
                        {formatCurrency(day.tax)}
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900 tabular-nums text-sm whitespace-nowrap">
                        {formatCurrency(day.grossRevenue)}
                      </td>
                      <td className="py-3 px-4 text-slate-700 tabular-nums whitespace-nowrap">
                        {formatCurrency(day.aov)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {day.dominantMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
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
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-7 shadow-sm space-y-6">
        {/* Orders Header & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
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

        {/* Filter Pills with Horizontal Scroll on Mobile & View Switch */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {(
              [
                { key: 'all', label: 'All Orders' },
                { key: 'succeeded', label: 'Paid / Settled' },
                { key: 'pending', label: 'Unpaid Tabs' },
                { key: 'dine_in', label: 'Dine-In' },
                { key: 'takeaway', label: 'Takeaway' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setOrderTab(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  orderTab === tab.key
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Mobile Orders View Switch */}
          <div className="sm:hidden inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold self-start">
            <button
              onClick={() => setOrdersViewMode('cards')}
              className={`px-3 py-1 rounded-lg transition-all ${
                ordersViewMode === 'cards'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Card View
            </button>
            <button
              onClick={() => setOrdersViewMode('table')}
              className={`px-3 py-1 rounded-lg transition-all ${
                ordersViewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Table View
            </button>
          </div>
        </div>

        {/* 1. Mobile Orders Cards View */}
        <div className={`${ordersViewMode === 'cards' ? 'block' : 'hidden'} sm:hidden space-y-3`}>
          {filteredOrders.slice(0, 15).map((order) => {
            const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);
            const isPaid = order.paymentStatus === 'succeeded';

            return (
              <div
                key={order.id}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-sm text-slate-900">#{order.orderNumber}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {order.orderType === 'dine_in'
                        ? order.tableLabel
                          ? `Table ${order.tableLabel}`
                          : 'Dine-In'
                        : 'Takeaway'}
                    </span>
                  </div>
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
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">{order.customerName || 'Walk-in Guest'}</span>
                  <span className="text-slate-400">
                    {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 line-clamp-1">
                  {totalItems} items ({order.items.map((i) => i.name).slice(0, 2).join(', ')}
                  {order.items.length > 2 ? '...' : ''})
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Bill Total</span>
                    <span className="text-base font-black text-slate-900 tabular-nums">
                      {formatCurrency(order.grandTotal)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setViewingOrder(order)}
                      className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center space-x-1"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>View Bill</span>
                    </button>
                    <button
                      onClick={() => executePrintBill(order)}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                      title="Print 80mm Slip"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    {!isPaid && (
                      <button
                        onClick={() => {
                          setSettlingOrder(order);
                          setTenderedInput(order.grandTotal.toString());
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                      >
                        Settle
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. Full Orders Table (Desktop always; Mobile when in table mode) */}
        <div
          className={`${
            ordersViewMode === 'table' ? 'block' : 'hidden sm:block'
          } border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs`}
        >
          {/* Mobile Swipe Hint */}
          <div className="sm:hidden flex items-center justify-between text-[11px] font-bold text-blue-700 bg-blue-50/80 px-3 py-1.5 border-b border-blue-100">
            <span>← Swipe table horizontally to view all columns →</span>
            <span className="text-blue-500">8 Columns</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date &amp; Time Placed</th>
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
                        <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                          <span>
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-extrabold border border-blue-200/60">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', { weekday: 'short' })}
                          </span>
                        </div>
                        <div className="text-[10.5px] text-slate-500 font-medium flex items-center space-x-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })}
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
                      <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                        {order.customerName || 'Walk-in Guest'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        <span>
                          {totalItems} items ({order.items.map((i) => i.name).slice(0, 2).join(', ')}
                          {order.items.length > 2 ? '...' : ''})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900 tabular-nums text-sm whitespace-nowrap">
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
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
                              title="Settle Outstanding Tab"
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
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 print:hidden">
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
            <div id="printable-receipt" className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 font-mono text-xs print:bg-white print:border-none print:shadow-none print:p-2">
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
            <div className="flex items-center space-x-2 pt-2 print:hidden">
              <button
                onClick={() => executePrintBill(viewingOrder)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all active:scale-95"
              >
                <Printer className="w-4 h-4 text-blue-400" />
                <span>80mm Slip</span>
              </button>

              <button
                onClick={() => printA4TaxInvoice(viewingOrder, currentBranch, currentUser.name)}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all active:scale-95"
              >
                <FileText className="w-4 h-4 text-white" />
                <span>A4 Invoice</span>
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
