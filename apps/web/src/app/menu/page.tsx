'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { usePosStore } from '@/lib/store';
import { MenuItem } from '@/types';
import { formatCurrency } from '@/lib/utils';
import {
  UtensilsCrossed,
  Search,
  Plus,
  Edit,
  Eye,
  EyeOff,
  CheckCircle,
  X,
  Sparkles,
} from 'lucide-react';

export default function MenuManagementPage() {
  const { categories, menuItems, toggleItemAvailability } = usePosStore();
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const filteredItems = menuItems.filter((i) => {
    const matchesCat = selectedCat === 'all' || i.categoryId === selectedCat;
    const matchesSearch =
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.description?.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Menu & Catalog Management
            </h1>
            <p className="text-xs text-slate-500">Categories, pricing, tax rates & stock availability</p>
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
              placeholder="Search dishes or ingredients..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedCat('all')}
          className={`px-3.5 py-1.5 rounded-full font-bold transition-all whitespace-nowrap ${
            selectedCat === 'all'
              ? 'bg-[#172554] text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          All Dishes ({menuItems.length})
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCat(c.id)}
            className={`px-3.5 py-1.5 rounded-full font-bold transition-all whitespace-nowrap ${
              selectedCat === c.id
                ? 'bg-[#0F766E] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {c.name} ({menuItems.filter((m) => m.categoryId === c.id).length})
          </button>
        ))}
      </div>

      {/* Items Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between space-y-3 transition-all ${
              item.isAvailable ? 'border-slate-200' : 'border-rose-200 bg-rose-50/20'
            }`}
          >
            <div className="flex space-x-3">
              {/* Image */}
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                    {item.name.charAt(0)}
                  </div>
                )}
                <div className="absolute top-1 left-1 bg-white/90 p-0.5 rounded shadow-xs">
                  <span
                    className={`block w-2 h-2 rounded-full ${
                      item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                  />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-slate-900 truncate">{item.name}</h3>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                  {item.description}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 capitalize">
                    {item.station}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    GST: {item.taxRate}%
                  </span>
                </div>
              </div>
            </div>

            {/* Price & Availability Control */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="font-extrabold text-base text-slate-900 tabular-nums">
                {formatCurrency(item.price)}
              </span>

              <button
                onClick={() => toggleItemAvailability(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  item.isAvailable
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                {item.isAvailable ? (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>In Stock</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Sold Out</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

