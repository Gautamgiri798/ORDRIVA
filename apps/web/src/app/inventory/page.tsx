'use client';

import React, { useState } from 'react';
import { usePosStore } from '@/lib/store';
import { InventoryItem, StockMovement } from '@/types';
import { formatCurrency } from '@/lib/utils';
import {
  Boxes,
  AlertTriangle,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Search,
  PackagePlus,
  Trash2,
  CheckCircle2,
  DollarSign,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react';

export default function InventoryPage() {
  const { inventory, logStockAdjustment } = usePosStore();
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'optimal'>('all');
  const [adjustModalItem, setAdjustModalItem] = useState<InventoryItem | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(10);
  const [adjustType, setAdjustType] = useState<StockMovement['movementType']>('purchase');
  const [adjustReason, setAdjustReason] = useState<string>('Fresh supplier delivery');

  const categories = Array.from(new Set(inventory.map((i) => i.category)));

  // Analytics Metrics
  const totalItems = inventory.length;
  const lowStockItems = inventory.filter((i) => i.currentStock <= i.minReorderLevel);
  const lowStockCount = lowStockItems.length;
  const healthyStockCount = totalItems - lowStockCount;
  const healthPercentage = Math.round((healthyStockCount / (totalItems || 1)) * 100);

  const totalInventoryValuation = inventory.reduce(
    (sum, item) => sum + item.currentStock * item.costPerUnit,
    0
  );

  const filteredItems = inventory.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'low'
        ? item.currentStock <= item.minReorderLevel
        : item.currentStock > item.minReorderLevel;

    return matchesCat && matchesSearch && matchesStatus;
  });

  const handleAdjustSubmit = () => {
    if (!adjustModalItem) return;
    const delta = adjustType === 'waste' ? -Math.abs(adjustDelta) : Math.abs(adjustDelta);
    logStockAdjustment(adjustModalItem.id, delta, adjustType, adjustReason);
    setAdjustModalItem(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* 1. Executive Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-white via-slate-50/60 to-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Inventory &amp; Raw Ingredients
              </h1>
              <span className="inline-flex items-center space-x-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live BoM Ledger</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Recipe-based automatic stock deduction • Real-time reorder thresholds • Spoilage &amp; delivery tracking
            </p>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ingredient or category..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-inner"
            />
          </div>

          <button
            onClick={() => {
              if (inventory.length > 0) {
                setAdjustModalItem(inventory[0]);
                setAdjustDelta(10);
                setAdjustType('purchase');
                setAdjustReason('Bulk supplier inward delivery');
              }
            }}
            className="px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-2 shadow-sm transition-all shrink-0 active:scale-95"
          >
            <PackagePlus className="w-4 h-4 text-[#60A5FA]" />
            <span>+ Inward Restock</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Inventory Analytics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total SKUs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Raw Materials
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black text-slate-900 tabular-nums">
                {totalItems}
              </span>
              <span className="text-xs font-semibold text-slate-500">Tracked SKUs</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Across {categories.length} culinary categories
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#3B82F6] border border-blue-100 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Total Valuation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Stock Valuation
            </span>
            <div className="text-2xl font-black text-blue-700 tabular-nums">
              {formatCurrency(totalInventoryValuation)}
            </div>
            <div className="text-[11px] text-slate-500">
              Current storage ledger asset value
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Stock Health Score with Progress Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1 flex-1 pr-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Stock Readiness Health
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black text-slate-900 tabular-nums">
                {healthPercentage}%
              </span>
              <span className="text-xs font-semibold text-emerald-700">Healthy</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${healthPercentage}%` }}
              />
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Low Stock Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Restock Reorder Alerts
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span
                className={`text-2xl font-black tabular-nums ${
                  lowStockCount > 0 ? 'text-rose-600' : 'text-slate-900'
                }`}
              >
                {lowStockCount}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {lowStockCount === 1 ? 'Item Needs Restock' : 'Items Need Restock'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              {lowStockCount > 0 ? 'Below minimum threshold' : 'All safe thresholds met'}
            </div>
          </div>
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              lowStockCount > 0
                ? 'bg-rose-50 text-rose-600 border border-rose-100 animate-pulse'
                : 'bg-slate-50 text-slate-400 border border-slate-200'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. High-Priority Alert Banner (Only when items below threshold) */}
      {lowStockItems.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-50 via-amber-100/60 to-amber-50 border border-amber-300 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 text-xs">
              <div className="font-black text-amber-950 text-sm flex items-center space-x-2">
                <span>Immediate Restock Required: {lowStockItems.length} Ingredient(s)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold uppercase">
                  Service Alert
                </span>
              </div>
              <p className="text-amber-900 leading-relaxed">
                The following raw items have breached safe minimum cooking thresholds:{' '}
                <strong className="font-extrabold">
                  {lowStockItems
                    .map((i) => `${i.name} (${i.currentStock} ${i.unit} left, min: ${i.minReorderLevel} ${i.unit})`)
                    .join(' • ')}
                </strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setAdjustModalItem(lowStockItems[0]);
              setAdjustDelta(10);
              setAdjustType('purchase');
              setAdjustReason('Emergency Restock Delivery');
            }}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm shrink-0 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Restock {lowStockItems[0].name}</span>
          </button>
        </div>
      )}

      {/* 4. Category & Status Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Category Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 lg:pb-0 text-xs no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap text-xs ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            All Items ({inventory.length})
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap text-xs ${
                selectedCategory === c
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              {c} ({inventory.filter((i) => i.category === c).length})
            </button>
          ))}
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs no-scrollbar shrink-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-full font-bold transition-all text-xs border ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All ({inventory.length})
          </button>
          <button
            onClick={() => setStatusFilter('optimal')}
            className={`px-3 py-1 rounded-full font-bold transition-all text-xs border flex items-center space-x-1.5 ${
              statusFilter === 'optimal'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Optimal ({healthyStockCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('low')}
            className={`px-3 py-1 rounded-full font-bold transition-all text-xs border flex items-center space-x-1.5 ${
              statusFilter === 'low'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>Low Stock ({lowStockCount})</span>
          </button>
        </div>
      </div>

      {/* 5. Enterprise Inventory Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/80 border-b border-slate-200">
                <th className="py-3.5 px-5">Ingredient / Raw Material</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Stock Level &amp; Health</th>
                <th className="py-3.5 px-4">Current Stock</th>
                <th className="py-3.5 px-4">Reorder Min</th>
                <th className="py-3.5 px-4">Unit Cost</th>
                <th className="py-3.5 px-4">Stock Value</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const isLow = item.currentStock <= item.minReorderLevel;
                const ratio = Math.min(Math.round((item.currentStock / (item.minReorderLevel * 2)) * 100), 100);
                const stockValuation = item.currentStock * item.costPerUnit;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Item Name */}
                    <td className="py-4 px-5">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isLow
                              ? 'bg-rose-50 text-rose-600 border border-rose-200'
                              : 'bg-blue-50 text-blue-600 border border-blue-100'
                          }`}
                        >
                          {item.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block tracking-tight">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {item.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/60">
                        {item.category}
                      </span>
                    </td>

                    {/* Stock Level Gauge */}
                    <td className="py-4 px-4 min-w-[140px]">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-semibold">
                          <span className={isLow ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                            {isLow ? 'Restock Required' : 'Adequate Supply'}
                          </span>
                          <span className="text-slate-400 tabular-nums">{ratio}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isLow ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(ratio, 8)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Current Stock */}
                    <td className="py-4 px-4 font-black text-slate-900 tabular-nums">
                      <span className="text-sm">{item.currentStock}</span>{' '}
                      <span className="text-xs font-semibold text-slate-500">{item.unit}</span>
                    </td>

                    {/* Reorder Min */}
                    <td className="py-4 px-4 text-xs font-medium text-slate-500 tabular-nums">
                      {item.minReorderLevel} {item.unit}
                    </td>

                    {/* Cost / Unit */}
                    <td className="py-4 px-4 text-xs font-bold text-slate-700 tabular-nums">
                      {formatCurrency(item.costPerUnit)}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">/{item.unit}</span>
                    </td>

                    {/* Total Stock Value */}
                    <td className="py-4 px-4 font-black text-blue-700 tabular-nums text-xs">
                      {formatCurrency(stockValuation)}
                    </td>

                    {/* Status Pill */}
                    <td className="py-4 px-4">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center space-x-1.5 ${
                          isLow
                            ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isLow ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                        />
                        <span>{isLow ? 'Low Stock' : 'Optimal'}</span>
                      </span>
                    </td>

                    {/* Quick Action Button */}
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => {
                          setAdjustModalItem(item);
                          setAdjustDelta(10);
                          setAdjustType('purchase');
                          setAdjustReason('Inward Restock Delivery');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold text-xs border border-blue-200/80 hover:border-transparent transition-all shadow-2xs"
                      >
                        Adjust / Restock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Stock Movement Drawer / Modal */}
      {adjustModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-3.5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                  Stock Ledger Journal
                </span>
                <h3 className="font-black text-lg text-slate-900 mt-0.5">
                  Adjust: {adjustModalItem.name}
                </h3>
                <span className="text-xs text-slate-500">
                  Current Balance:{' '}
                  <strong className="text-slate-900 font-bold">
                    {adjustModalItem.currentStock} {adjustModalItem.unit}
                  </strong>{' '}
                  • Min Safe Level: {adjustModalItem.minReorderLevel} {adjustModalItem.unit}
                </span>
              </div>
              <button
                onClick={() => setAdjustModalItem(null)}
                aria-label="Close modal"
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-base leading-none"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-xs">
              {/* Movement Type Toggle */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Movement Category</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setAdjustType('purchase');
                      setAdjustReason('Supplier delivery arrival');
                    }}
                    className={`py-2.5 px-3 rounded-2xl font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                      adjustType === 'purchase'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Inward Restock</span>
                  </button>
                  <button
                    onClick={() => {
                      setAdjustType('waste');
                      setAdjustReason('Expired / damaged produce write-off');
                    }}
                    className={`py-2.5 px-3 rounded-2xl font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                      adjustType === 'waste'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>- Spoilage / Waste</span>
                  </button>
                </div>
              </div>

              {/* Quantity Input + Preset Quick Buttons */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700">
                    Adjustment Quantity ({adjustModalItem.unit})
                  </label>
                  <span className="text-[11px] font-bold text-slate-500">
                    Forecast Balance:{' '}
                    <span className="text-blue-700 font-extrabold">
                      {(
                        adjustModalItem.currentStock +
                        (adjustType === 'waste' ? -Math.abs(adjustDelta) : Math.abs(adjustDelta))
                      ).toFixed(1)}{' '}
                      {adjustModalItem.unit}
                    </span>
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0.1"
                    step="0.5"
                    value={adjustDelta}
                    onChange={(e) => setAdjustDelta(Math.max(0.1, Number(e.target.value)))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-2xl font-black text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                  <span className="font-bold text-slate-500 shrink-0 text-xs px-2">
                    {adjustModalItem.unit}
                  </span>
                </div>

                {/* Quick Increment Buttons */}
                <div className="flex items-center space-x-1.5 mt-2">
                  {[5, 10, 20, 50].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAdjustDelta(val)}
                      className="flex-1 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[11px] transition-colors"
                    >
                      +{val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason / Notes */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Audit Note / Supplier Reference</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Invoice #PO-941, Fresh delivery, Chef inspection"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => setAdjustModalItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustSubmit}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all active:scale-95"
              >
                Post Stock Journal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
