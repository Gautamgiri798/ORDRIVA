'use client';

import React, { useState } from 'react';
import { usePosStore } from '@/lib/store';
import { InventoryItem, StockMovement } from '@/types';
import { formatCurrency } from '@/lib/utils';
import {
  Boxes,
  AlertTriangle,
  PlusCircle,
  TrendingDown,
  RefreshCw,
  Search,
  PackagePlus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

export default function InventoryPage() {
  const { inventory, logStockAdjustment } = usePosStore();
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [adjustModalItem, setAdjustModalItem] = useState<InventoryItem | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(10);
  const [adjustType, setAdjustType] = useState<StockMovement['movementType']>('purchase');
  const [adjustReason, setAdjustReason] = useState<string>('Fresh supplier delivery');

  const categories = Array.from(new Set(inventory.map((i) => i.category)));

  const filteredItems = inventory.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const lowStockItems = inventory.filter((i) => i.currentStock <= i.minReorderLevel);

  const handleAdjustSubmit = () => {
    if (!adjustModalItem) return;
    const delta = adjustType === 'waste' ? -Math.abs(adjustDelta) : Math.abs(adjustDelta);
    logStockAdjustment(adjustModalItem.id, delta, adjustType, adjustReason);
    setAdjustModalItem(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Inventory & Raw Ingredients
            </h1>
            <p className="text-xs text-slate-500">
              Recipe-based automatic stock deduction, minimum thresholds & waste tracking
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ingredient..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="font-bold text-amber-900 text-sm">
              {lowStockItems.length} Ingredients Below Minimum Reorder Level
            </div>
            <p className="text-amber-800">
              The following ingredients need restocking to avoid service interruption:{' '}
              <span className="font-semibold">
                {lowStockItems.map((i) => `${i.name} (${i.currentStock} ${i.unit})`).join(', ')}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 rounded-full font-bold transition-all whitespace-nowrap ${
            selectedCategory === 'all'
              ? 'bg-[#172554] text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          All Items ({inventory.length})
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCategory(c)}
            className={`px-3.5 py-1.5 rounded-full font-bold transition-all whitespace-nowrap ${
              selectedCategory === c
                ? 'bg-[#0F766E] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {c} ({inventory.filter((i) => i.category === c).length})
          </button>
        ))}
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs font-semibold text-slate-400 uppercase bg-slate-50/70 border-b border-slate-200">
                <th className="py-3 px-4">Ingredient Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Reorder Threshold</th>
                <th className="py-3 px-4">Cost / Unit</th>
                <th className="py-3 px-4">Stock Status</th>
                <th className="py-3 px-4 text-right">Stock Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const isLow = item.currentStock <= item.minReorderLevel;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{item.name}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">{item.category}</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 tabular-nums">
                      {item.currentStock} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 tabular-nums">
                      {item.minReorderLevel} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 tabular-nums">
                      {formatCurrency(item.costPerUnit)} / {item.unit}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          isLow
                            ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {isLow ? 'Low Stock' : 'Optimal'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setAdjustModalItem(item);
                          setAdjustDelta(10);
                          setAdjustType('purchase');
                          setAdjustReason('Inward Restock Delivery');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs transition-colors"
                      >
                        Adjust / Receive
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {adjustModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-5 border border-slate-200 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">
              Adjust Stock: {adjustModalItem.name}
            </h3>
            <p className="text-xs text-slate-500">
              Current: {adjustModalItem.currentStock} {adjustModalItem.unit}
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setAdjustType('purchase');
                      setAdjustReason('Supplier delivery arrival');
                    }}
                    className={`py-2 rounded-lg font-bold border transition-all ${
                      adjustType === 'purchase'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    + Inward Restock
                  </button>
                  <button
                    onClick={() => {
                      setAdjustType('waste');
                      setAdjustReason('Expired / damaged produce');
                    }}
                    className={`py-2 rounded-lg font-bold border transition-all ${
                      adjustType === 'waste'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    - Spoilage / Waste
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Quantity ({adjustModalItem.unit})
                </label>
                <input
                  type="number"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg font-bold text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason / Notes</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setAdjustModalItem(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustSubmit}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-[#0F766E] text-white"
              >
                Save Movement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
