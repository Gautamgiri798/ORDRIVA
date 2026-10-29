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
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  Sparkles,
  AlertCircle,
  Image as ImageIcon,
  Flame,
  ChefHat,
  Coffee,
  Check,
} from 'lucide-react';

const PRESET_IMAGES = [
  { name: 'Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60' },
  { name: 'Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60' },
  { name: 'Fries', url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=60' },
  { name: 'Salmon', url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&auto=format&fit=crop&q=60' },
  { name: 'Pasta', url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?w=500&auto=format&fit=crop&q=60' },
  { name: 'Crostini', url: 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=500&auto=format&fit=crop&q=60' },
  { name: 'Mocktail', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60' },
  { name: 'Cold Brew', url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=60' },
  { name: 'Cake', url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=60' },
  { name: 'Tiramisu', url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&auto=format&fit=crop&q=60' },
];

export default function MenuManagementPage() {
  const {
    categories,
    menuItems,
    toggleItemAvailability,
    addMenuItem,
    deleteMenuItem,
    updateMenuItem,
  } = usePosStore();

  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    categoryId: 'cat-starters',
    description: '',
    price: 320,
    taxRate: 5,
    isVeg: true,
    isAvailable: true,
    imageUrl: PRESET_IMAGES[0].url,
    station: 'kitchen' as 'kitchen' | 'grill' | 'bar',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const openAddModal = () => {
    setFormData({
      name: '',
      categoryId: categories[0]?.id || 'cat-starters',
      description: '',
      price: 290,
      taxRate: 5,
      isVeg: true,
      isAvailable: true,
      imageUrl: PRESET_IMAGES[0].url,
      station: 'kitchen',
    });
    setEditingItem(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      categoryId: item.categoryId,
      description: item.description || '',
      price: item.price,
      taxRate: item.taxRate || 5,
      isVeg: item.isVeg,
      isAvailable: item.isAvailable,
      imageUrl: item.imageUrl || PRESET_IMAGES[0].url,
      station: item.station || 'kitchen',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingItem) {
      updateMenuItem(editingItem.id, {
        name: formData.name.trim(),
        categoryId: formData.categoryId,
        description: formData.description.trim(),
        price: Number(formData.price) || 0,
        taxRate: Number(formData.taxRate) || 5,
        isVeg: formData.isVeg,
        isAvailable: formData.isAvailable,
        imageUrl: formData.imageUrl.trim(),
        station: formData.station,
      });
      showToast(`Updated "${formData.name.trim()}" successfully!`);
    } else {
      addMenuItem({
        name: formData.name.trim(),
        categoryId: formData.categoryId,
        description: formData.description.trim(),
        price: Number(formData.price) || 0,
        taxRate: Number(formData.taxRate) || 5,
        isVeg: formData.isVeg,
        isAvailable: formData.isAvailable,
        imageUrl: formData.imageUrl.trim(),
        station: formData.station,
      });
      showToast(`Added "${formData.name.trim()}" to menu catalog!`);
    }

    setIsAddModalOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (item: MenuItem) => {
    deleteMenuItem(item.id);
    setItemToDelete(null);
    showToast(`Removed "${item.name}" from catalog.`);
  };

  const filteredItems = menuItems.filter((i) => {
    const matchesCat = selectedCat === 'all' || i.categoryId === selectedCat;
    const matchesSearch =
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.description?.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 border border-slate-700 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#3B82F6]">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Menu &amp; Catalog Management
            </h1>
            <p className="text-xs text-slate-500">
              Categories, pricing, tax rates &amp; stock availability
            </p>
          </div>
        </div>

        {/* Action Bar: Search & Add Item Button */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes or ingredients..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-black shadow-md transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Dish</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <button
          onClick={() => setSelectedCat('all')}
          className={`px-3.5 py-1.5 rounded-full font-bold transition-all whitespace-nowrap ${
            selectedCat === 'all'
              ? 'bg-[#3B82F6] text-white shadow-sm'
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
                ? 'bg-[#3B82F6] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {c.name} ({menuItems.filter((m) => m.categoryId === c.id).length})
          </button>
        ))}
      </div>

      {/* Items Table / Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between space-y-3 transition-all hover:shadow-md ${
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
                  <h3 className="font-extrabold text-sm text-slate-900 truncate" title={item.name}>
                    {item.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                  {item.description}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 capitalize">
                    {item.station}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    GST: {item.taxRate}%
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    {item.isVeg ? 'Pure Veg' : 'Non-Veg'}
                  </span>
                </div>
              </div>
            </div>

            {/* Price & Action Buttons */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="font-extrabold text-base text-slate-900 tabular-nums">
                {formatCurrency(item.price)}
              </span>

              <div className="flex items-center space-x-1.5">
                {/* Stock Toggle */}
                <button
                  onClick={() => toggleItemAvailability(item.id)}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                    item.isAvailable
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  }`}
                  title={item.isAvailable ? 'Mark as Out of Stock' : 'Mark as In Stock'}
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

                {/* Edit Item */}
                <button
                  onClick={() => openEditModal(item)}
                  className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors border border-slate-200"
                  title="Edit Dish Details"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {/* Delete Item */}
                <button
                  onClick={() => setItemToDelete(item)}
                  className="p-1.5 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors border border-rose-200"
                  title="Remove Dish from Catalog"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm text-slate-800">No dishes found</h3>
            <p className="text-xs text-slate-500">
              No items match your filter criteria or search keyword.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-[#3B82F6] text-white text-xs font-bold inline-flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add a New Dish</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD / EDIT DISH
          ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-fadeIn">
            <div className="p-4 bg-gradient-to-r from-[#0B1120] to-[#1E3A8A] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UtensilsCrossed className="w-5 h-5 text-[#60A5FA]" />
                <h3 className="font-extrabold text-base">
                  {editingItem ? 'Edit Dish Details' : 'Add New Dish to Catalog'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 space-y-4 text-xs">
              {/* Dish Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Dish Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Truffle Mushroom Risotto"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3B82F6] text-xs font-semibold"
                />
              </div>

              {/* Category & Kitchen Station */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Menu Category *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3B82F6] text-xs font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Prep Station *</label>
                  <select
                    value={formData.station}
                    onChange={(e) => setFormData({ ...formData, station: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3B82F6] text-xs font-semibold capitalize"
                  >
                    <option value="kitchen">Main Kitchen</option>
                    <option value="grill">Grill Station</option>
                    <option value="bar">Bar / Mocktails</option>
                  </select>
                </div>
              </div>

              {/* Price, Tax Rate, and Dietary Tag */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={1}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3B82F6] text-xs font-bold tabular-nums"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">GST Tax %</label>
                  <select
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3B82F6] text-xs font-semibold"
                  >
                    <option value={5}>5% (Restaurant)</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Dietary Type</label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isVeg: !formData.isVeg })}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                      formData.isVeg
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        formData.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    />
                    <span>{formData.isVeg ? 'Pure Veg' : 'Non-Veg'}</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Dish Description &amp; Ingredients</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Fresh ingredients, cooking style, served with sauce..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3B82F6] text-xs"
                />
              </div>

              {/* Image URL & Quick Preset Photos */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800">Photo URL</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3B82F6] text-xs font-mono"
                  />
                  {formData.imageUrl && (
                    <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                      <Image src={formData.imageUrl} alt="Preview" fill className="object-cover" />
                    </div>
                  )}
                </div>

                {/* Quick Presets */}
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold block">
                    Or select a photo preset:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_IMAGES.map((preset) => (
                      <button
                        type="button"
                        key={preset.name}
                        onClick={() => setFormData({ ...formData, imageUrl: preset.url })}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${
                          formData.imageUrl === preset.url
                            ? 'bg-[#3B82F6] text-white border-[#3B82F6]'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Initial Availability Toggle */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-700">Initial Stock Status</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isAvailable: !formData.isAvailable })}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                    formData.isAvailable
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}
                >
                  {formData.isAvailable ? '✓ In Stock' : '✕ Out of Stock'}
                </button>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-md transition-transform active:scale-95 flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingItem ? 'Save Changes' : 'Add Dish to Catalog'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CONFIRM DELETE DISH
          ========================================================================= */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 border border-slate-200 space-y-4 text-center animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-slate-900">
                Remove &ldquo;{itemToDelete.name}&rdquo;?
              </h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to remove this dish from the menu catalog? It will no longer be available for customer QR orders.
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteItem(itemToDelete)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-sm transition-all"
              >
                Delete Dish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
