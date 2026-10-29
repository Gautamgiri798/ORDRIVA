'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { usePosStore } from '@/lib/store';
import { MenuItem, SelectedModifier, OrderType, Order } from '@/types';
import { formatCurrency } from '@/lib/utils';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ChefHat,
  Clock,
  Sparkles,
  CheckCircle2,
  X,
  Utensils,
  QrCode,
  MapPin,
  Flame,
  ArrowRight,
  Phone,
  User,
  Check,
} from 'lucide-react';

interface ClientCartItem {
  menuItem: MenuItem;
  quantity: number;
  selectedModifiers: SelectedModifier[];
  notes?: string;
  itemTotal: number;
}

function ClientOrderContent() {
  const searchParams = useSearchParams();
  const tableParam = searchParams.get('table');

  const {
    currentBranch,
    categories,
    menuItems,
    tables,
    orders,
    kitchenTickets,
    updateTableStatus,
    settlePayment,
  } = usePosStore();

  // State
  const [selectedTable, setSelectedTable] = useState<string>(tableParam || 'T-01');
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [vegOnly, setVegOnly] = useState<boolean>(false);

  // Customer Cart
  const [clientCart, setClientCart] = useState<ClientCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [guestName, setGuestName] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [guestNotes, setGuestNotes] = useState<string>('');

  // Modifier Customizer
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [tempMods, setTempMods] = useState<SelectedModifier[]>([]);
  const [tempNotes, setTempNotes] = useState<string>('');

  // Active Placed Order (Tracking Screen)
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [showUpiModal, setShowUpiModal] = useState<boolean>(false);
  const [tableUpiQr, setTableUpiQr] = useState<string>('');

  useEffect(() => {
    if (tableParam) {
      setSelectedTable(tableParam);
    }
  }, [tableParam]);

  // Find placed order details if tracking
  const trackedOrder = orders.find((o) => o.id === placedOrderId);

  // Generate UPI QR for table payment
  useEffect(() => {
    if (showUpiModal && trackedOrder) {
      const upiUrl = `upi://pay?pa=ordriva@icici&pn=ORDRIVA%20Bistro&am=${trackedOrder.grandTotal}&cu=INR&tn=Table%20${trackedOrder.tableLabel}%20Bill`;
      QRCode.toDataURL(upiUrl, { width: 220, margin: 1 }, (err, url) => {
        if (!err && url) {
          setTableUpiQr(url);
        }
      });
    }
  }, [showUpiModal, trackedOrder]);

  // Filtering
  const filteredItems = menuItems.filter((item) => {
    const matchesCat = activeCategory === 'all' || item.categoryId === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVeg = !vegOnly || item.isVeg;
    return matchesCat && matchesSearch && matchesVeg && item.isAvailable;
  });

  // Cart Calculations
  const calculateTotals = () => {
    const subtotal = clientCart.reduce((sum, ci) => sum + ci.itemTotal * ci.quantity, 0);
    const cgst = Math.round(((subtotal * currentBranch.taxRates.cgst) / 100) * 100) / 100;
    const sgst = Math.round(((subtotal * currentBranch.taxRates.sgst) / 100) * 100) / 100;
    const serviceCharge =
      orderType === 'dine_in'
        ? Math.round(((subtotal * currentBranch.taxRates.serviceCharge) / 100) * 100) / 100
        : 0;
    const grandTotal = Math.round((subtotal + cgst + sgst + serviceCharge) * 100) / 100;

    return { subtotal, cgst, sgst, taxTotal: cgst + sgst, serviceCharge, grandTotal };
  };

  const totals = calculateTotals();

  // Add Item Click
  const handleItemClick = (item: MenuItem) => {
    if (item.modifierGroups && item.modifierGroups.length > 0) {
      setCustomizingItem(item);
      const defaults: SelectedModifier[] = [];
      item.modifierGroups.forEach((grp) => {
        if (grp.required && grp.options.length > 0) {
          defaults.push({
            modifierId: grp.options[0].id,
            name: grp.options[0].name,
            priceDelta: grp.options[0].priceDelta,
          });
        }
      });
      setTempMods(defaults);
      setTempNotes('');
    } else {
      addDirectToCart(item, 1, [], '');
    }
  };

  const addDirectToCart = (
    item: MenuItem,
    qty = 1,
    mods: SelectedModifier[] = [],
    notes = ''
  ) => {
    const modTotal = mods.reduce((sum, m) => sum + m.priceDelta, 0);
    const unitPrice = item.price + modTotal;

    setClientCart((prev) => {
      const idx = prev.findIndex(
        (ci) =>
          ci.menuItem.id === item.id &&
          JSON.stringify(ci.selectedModifiers) === JSON.stringify(mods) &&
          ci.notes === notes
      );

      if (idx > -1) {
        const next = [...prev];
        next[idx].quantity += qty;
        return next;
      }

      return [
        ...prev,
        {
          menuItem: item,
          quantity: qty,
          selectedModifiers: mods,
          notes,
          itemTotal: unitPrice,
        },
      ];
    });
  };

  const confirmCustomization = () => {
    if (!customizingItem) return;
    addDirectToCart(customizingItem, 1, tempMods, tempNotes);
    setCustomizingItem(null);
    setTempMods([]);
    setTempNotes('');
  };

  const updateCartQty = (idx: number, delta: number) => {
    setClientCart((prev) => {
      const next = [...prev];
      const newQty = next[idx].quantity + delta;
      if (newQty <= 0) {
        return next.filter((_, i) => i !== idx);
      }
      next[idx].quantity = newQty;
      return next;
    });
  };

  // Place Customer Order
  const handlePlaceOrder = () => {
    if (clientCart.length === 0) return;

    const matchedTable = tables.find(
      (t) => t.label.toLowerCase() === selectedTable.toLowerCase()
    );

    const nextOrderNum =
      orders.length > 0 ? Math.max(...orders.map((o) => o.orderNumber)) + 1 : 1001;
    const orderId = `ord-${nextOrderNum}`;

    const items = clientCart.map((ci, idx) => ({
      id: `oi-${orderId}-${idx + 1}`,
      menuItemId: ci.menuItem.id,
      name: ci.menuItem.name,
      basePrice: ci.menuItem.price,
      quantity: ci.quantity,
      taxRate: ci.menuItem.taxRate,
      modifiers: ci.selectedModifiers,
      itemTotal: ci.itemTotal * ci.quantity,
      taxTotal: Math.round(((ci.itemTotal * ci.quantity * ci.menuItem.taxRate) / 100) * 100) / 100,
      notes: ci.notes,
    }));

    const newOrder: Order = {
      id: orderId,
      branchId: currentBranch.id,
      orderNumber: nextOrderNum,
      orderType,
      status: 'placed',
      tableId: matchedTable ? matchedTable.id : undefined,
      tableLabel: orderType === 'dine_in' ? selectedTable : undefined,
      customerName: guestName || 'Table Guest',
      customerPhone: guestPhone || undefined,
      items,
      subtotal: totals.subtotal,
      discountTotal: 0,
      taxTotal: totals.taxTotal,
      cgst: totals.cgst,
      sgst: totals.sgst,
      serviceChargeTotal: totals.serviceCharge,
      grandTotal: totals.grandTotal,
      notes: guestNotes || 'Online QR Order',
      createdBy: 'customer-qr',
      createdByName: guestName || 'Table Guest',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentStatus: 'pending',
    };

    // Auto update table occupancy
    if (matchedTable) {
      updateTableStatus(matchedTable.id, 'occupied', orderId);
    }

    // Push into store orders
    orders.unshift(newOrder);

    // Auto-create KDS tickets for kitchen
    const kitchenItems = clientCart.filter(
      (ci) => ci.menuItem.station === 'kitchen' || !ci.menuItem.station
    );
    const grillItems = clientCart.filter((ci) => ci.menuItem.station === 'grill');
    const barItems = clientCart.filter((ci) => ci.menuItem.station === 'bar');

    if (kitchenItems.length > 0) {
      kitchenTickets.unshift({
        id: `kt-${Date.now()}-1`,
        orderId,
        orderNumber: nextOrderNum,
        tableLabel: orderType === 'dine_in' ? selectedTable : 'Takeaway',
        orderType,
        station: 'kitchen',
        status: 'pending',
        items: kitchenItems.map((ki) => ({
          name: ki.menuItem.name,
          quantity: ki.quantity,
          notes: ki.notes,
          modifiers: ki.selectedModifiers.map((m) => m.name),
        })),
        orderNotes: guestNotes,
        createdAt: new Date().toISOString(),
      });
    }

    if (grillItems.length > 0) {
      kitchenTickets.unshift({
        id: `kt-${Date.now()}-2`,
        orderId,
        orderNumber: nextOrderNum,
        tableLabel: orderType === 'dine_in' ? selectedTable : 'Takeaway',
        orderType,
        station: 'grill',
        status: 'pending',
        items: grillItems.map((gi) => ({
          name: gi.menuItem.name,
          quantity: gi.quantity,
          notes: gi.notes,
          modifiers: gi.selectedModifiers.map((m) => m.name),
        })),
        orderNotes: guestNotes,
        createdAt: new Date().toISOString(),
      });
    }

    if (barItems.length > 0) {
      kitchenTickets.unshift({
        id: `kt-${Date.now()}-3`,
        orderId,
        orderNumber: nextOrderNum,
        tableLabel: orderType === 'dine_in' ? selectedTable : 'Takeaway',
        orderType,
        station: 'bar',
        status: 'pending',
        items: barItems.map((bi) => ({
          name: bi.menuItem.name,
          quantity: bi.quantity,
          notes: bi.notes,
          modifiers: bi.selectedModifiers.map((m) => m.name),
        })),
        orderNotes: guestNotes,
        createdAt: new Date().toISOString(),
      });
    }

    setPlacedOrderId(orderId);
    setClientCart([]);
    setIsCartOpen(false);
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
  };

  const totalCartCount = clientCart.reduce((sum, ci) => sum + ci.quantity, 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28">
      {/* 1. Hero Dining Banner */}
      <div className="bg-gradient-to-r from-[#0B1120] via-[#1E3A8A] to-[#3B82F6] text-white px-4 py-6 sm:px-8 sm:py-8 shadow-md">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-[#60A5FA]">
              <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span>Contactless Table Dining</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Order Food &amp; Drinks
            </h1>
            <p className="text-xs sm:text-sm text-slate-200">
              Welcome to <strong className="text-white font-bold">{currentBranch.name}</strong>. Your food is prepared fresh upon ordering.
            </p>
          </div>

          {/* Table & Order Type Selector */}
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-200">Table:</span>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="bg-slate-900 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl border border-[#3B82F6]/50 focus:outline-none focus:border-[#60A5FA] cursor-pointer"
                aria-label="Dining Table Number"
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.label}>
                    {t.label} ({t.section})
                  </option>
                ))}
              </select>
            </div>

            <div className="inline-flex rounded-xl bg-slate-900/60 p-0.5 text-xs font-semibold">
              <button
                onClick={() => setOrderType('dine_in')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  orderType === 'dine_in'
                    ? 'bg-[#3B82F6] text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Dine-In
              </button>
              <button
                onClick={() => setOrderType('takeaway')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  orderType === 'takeaway'
                    ? 'bg-[#3B82F6] text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Takeaway
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. LIVE ORDER TRACKER BANNER (If an order was recently placed) */}
      {trackedOrder && (
        <div className="max-w-5xl mx-auto px-4 mt-4">
          <div className="bg-white rounded-2xl border-2 border-teal-500 shadow-lg p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <h2 className="font-extrabold text-base text-slate-900">
                    Active Order #{trackedOrder.orderNumber}
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 font-bold border border-teal-200">
                    Table {trackedOrder.tableLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Placed at {new Date(trackedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Est. wait time: 15–20 mins
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowUpiModal(true)}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Pay Bill (₹{trackedOrder.grandTotal})</span>
                </button>
              </div>
            </div>

            {/* Step Progress Tracker */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="space-y-1">
                <div className="w-8 h-8 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
                  ✓
                </div>
                <div className="font-bold text-slate-900 text-[11px]">Received</div>
              </div>
              <div className="space-y-1">
                <div className="w-8 h-8 mx-auto rounded-full bg-amber-500 text-white flex items-center justify-center font-bold animate-pulse">
                  <Flame className="w-4 h-4" />
                </div>
                <div className="font-bold text-amber-700 text-[11px]">In Kitchen</div>
              </div>
              <div className="space-y-1">
                <div className="w-8 h-8 mx-auto rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold">
                  3
                </div>
                <div className="text-slate-400 text-[11px]">Ready</div>
              </div>
              <div className="space-y-1">
                <div className="w-8 h-8 mx-auto rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold">
                  4
                </div>
                <div className="text-slate-400 text-[11px]">Served</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Search & Veg Toggle Filter Bar */}
      <div className="max-w-5xl mx-auto px-4 mt-6">
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, burgers, mocktails..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Veg Only Toggle */}
          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
              vegOnly
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span>Pure Vegetarian Only</span>
          </button>
        </div>
      </div>

      {/* 4. Category Tabs Carousel */}
      <div className="max-w-5xl mx-auto px-4 mt-4">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-full font-bold transition-all whitespace-nowrap ${
              activeCategory === 'all'
                ? 'bg-[#172554] text-white shadow-md'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Items ({menuItems.filter((i) => i.isAvailable).length})
          </button>
          {categories.map((c) => {
            const count = menuItems.filter(
              (i) => i.categoryId === c.id && i.isAvailable
            ).length;
            const isSelected = activeCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`px-4 py-2 rounded-full font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#0F766E] text-white shadow-md'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {c.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Food Menu Cards Grid */}
      <div className="max-w-5xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              {/* Photo & Badges */}
              <div className="relative w-full h-44 bg-slate-100 overflow-hidden">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-extrabold text-slate-400 text-3xl">
                    {item.name.charAt(0)}
                  </div>
                )}

                {/* Veg/Non-Veg Badge */}
                <div className="absolute top-2.5 left-2.5 bg-white/95 p-1 rounded-md shadow-xs border border-slate-200">
                  <span
                    className={`block w-2.5 h-2.5 rounded-full ${
                      item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                  />
                </div>

                {item.modifierGroups && item.modifierGroups.length > 0 && (
                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-[10px] text-white px-2 py-0.5 rounded-md font-semibold">
                    Customizable
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Price and Add Button */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Price</span>
                    <span className="font-extrabold text-base text-slate-900 tabular-nums">
                      {formatCurrency(item.price)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleItemClick(item)}
                    className="px-4 py-2 rounded-xl bg-teal-50 hover:bg-[#0F766E] text-[#0F766E] hover:text-white font-extrabold text-xs flex items-center space-x-1.5 transition-all shadow-xs active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Order</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. FLOATING BOTTOM CART BAR (Appears when items are in cart) */}
      {clientCart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-xl mx-auto animate-bounce-subtle">
          <div
            onClick={() => setIsCartOpen(true)}
            className="bg-slate-950 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between cursor-pointer border border-teal-500/40 hover:bg-slate-900 transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500 text-slate-950 font-black flex items-center justify-center text-sm shadow">
                {totalCartCount}
              </div>
              <div>
                <div className="text-xs text-teal-300 font-semibold uppercase tracking-wider">
                  Your Table Order
                </div>
                <div className="text-base font-extrabold tabular-nums">
                  {formatCurrency(totals.grandTotal)}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-teal-400 font-bold text-xs">
              <span>View Cart &amp; Order</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* 7. CUSTOMIZER MODAL (Modifiers, Crust, Addons) */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-4 bg-[#172554] text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base">{customizingItem.name}</h3>
                <span className="text-teal-300 text-xs">
                  Base Price: {formatCurrency(customizingItem.price)}
                </span>
              </div>
              <button
                onClick={() => setCustomizingItem(null)}
                className="p-1 rounded-full hover:bg-white/10"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {customizingItem.modifierGroups?.map((group) => (
                <div key={group.id} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-900">{group.name}</span>
                    {group.required && (
                      <span className="text-amber-700 bg-amber-50 font-bold px-2 py-0.5 rounded text-[10px]">
                        Required
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {group.options.map((opt) => {
                      const isSelected = tempMods.some((m) => m.modifierId === opt.id);
                      return (
                        <div
                          key={opt.id}
                          onClick={() => {
                            if (group.maxSelections === 1) {
                              const otherGroupIds = group.options.map((o) => o.id);
                              setTempMods((prev) => [
                                ...prev.filter((m) => !otherGroupIds.includes(m.modifierId)),
                                { modifierId: opt.id, name: opt.name, priceDelta: opt.priceDelta },
                              ]);
                            } else {
                              setTempMods((prev) =>
                                isSelected
                                  ? prev.filter((m) => m.modifierId !== opt.id)
                                  : [...prev, { modifierId: opt.id, name: opt.name, priceDelta: opt.priceDelta }]
                              );
                            }
                          }}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold shadow-xs'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span>{opt.name}</span>
                          <span className="text-slate-600 font-semibold">
                            {opt.priceDelta > 0 ? `+${formatCurrency(opt.priceDelta)}` : 'Included'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Cooking Instructions */}
              <div className="space-y-1 text-xs">
                <label className="font-bold text-slate-800">Special Cooking Instructions for Chef</label>
                <input
                  type="text"
                  value={tempNotes}
                  onChange={(e) => setTempNotes(e.target.value)}
                  placeholder="e.g. Less spicy, dressing on the side..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
              <button
                onClick={() => setCustomizingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmCustomization}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#0F766E] hover:bg-[#0D6861] text-white shadow"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. CART DRAWER & CONFIRMATION MODAL */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-[#172554] text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base">Your Food Order</h3>
                <span className="text-teal-300 text-xs">
                  {orderType === 'dine_in' ? `Dine-in at Table ${selectedTable}` : 'Takeaway Order'}
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 rounded-full hover:bg-white/10"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {clientCart.map((cartItem, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-extrabold text-slate-900 text-sm">
                      {cartItem.menuItem.name}
                    </span>
                    <span className="font-extrabold text-slate-900 tabular-nums text-sm">
                      {formatCurrency(cartItem.itemTotal * cartItem.quantity)}
                    </span>
                  </div>

                  {cartItem.selectedModifiers.length > 0 && (
                    <div className="text-[11px] text-teal-700 font-medium">
                      + {cartItem.selectedModifiers.map((m) => m.name).join(', ')}
                    </div>
                  )}

                  {cartItem.notes && (
                    <div className="text-[11px] text-slate-500 italic bg-white p-1.5 rounded border border-slate-200">
                      &ldquo;{cartItem.notes}&rdquo;
                    </div>
                  )}

                  {/* Quantity Stepper */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      {formatCurrency(cartItem.itemTotal)} each
                    </span>
                    <div className="flex items-center space-x-2 bg-white border border-slate-300 rounded-lg p-0.5">
                      <button
                        onClick={() => updateCartQty(idx, -1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100"
                        aria-label="Decrease"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bold px-1 tabular-nums text-slate-900">
                        {cartItem.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQty(idx, 1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100"
                        aria-label="Increase"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Guest Information */}
              <div className="pt-2 border-t border-slate-200 space-y-2 text-xs">
                <span className="font-bold text-slate-800">Guest Information (Optional)</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Your Name"
                    className="p-2 border border-slate-300 rounded-lg bg-slate-50 text-xs"
                  />
                  <input
                    type="text"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="Mobile Number"
                    className="p-2 border border-slate-300 rounded-lg bg-slate-50 text-xs"
                  />
                </div>
                <input
                  type="text"
                  value={guestNotes}
                  onChange={(e) => setGuestNotes(e.target.value)}
                  placeholder="Order notes for service staff..."
                  className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 text-xs"
                />
              </div>

              {/* Price Breakdown */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="tabular-nums font-semibold">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>CGST ({currentBranch.taxRates.cgst}%):</span>
                  <span className="tabular-nums">{formatCurrency(totals.cgst)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>SGST ({currentBranch.taxRates.sgst}%):</span>
                  <span className="tabular-nums">{formatCurrency(totals.sgst)}</span>
                </div>
                {orderType === 'dine_in' && currentBranch.taxRates.serviceCharge > 0 && (
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Service Charge ({currentBranch.taxRates.serviceCharge}%):</span>
                    <span className="tabular-nums">{formatCurrency(totals.serviceCharge)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-300 flex justify-between items-baseline font-extrabold text-base text-slate-900">
                  <span>Total Payable:</span>
                  <span className="tabular-nums text-[#0F766E] text-lg">
                    {formatCurrency(totals.grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Confirm Button */}
            <div className="p-4 bg-white border-t border-slate-200">
              <button
                onClick={handlePlaceOrder}
                className="w-full py-3 rounded-xl bg-[#0F766E] hover:bg-[#0D6861] text-white font-black text-sm flex items-center justify-center space-x-2 shadow-lg transition-transform active:scale-98"
              >
                <ChefHat className="w-5 h-5" />
                <span>Confirm &amp; Send Order to Kitchen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. TABLE UPI PAYMENT MODAL */}
      {showUpiModal && trackedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6 border border-slate-200 text-center space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-slate-900 text-base">Pay Table Bill</h3>
              <button onClick={() => setShowUpiModal(false)} className="text-slate-400">✕</button>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-slate-500">Scan to Pay via GPay / PhonePe / Paytm</div>
              <div className="text-2xl font-black text-teal-700 tabular-nums">
                {formatCurrency(trackedOrder.grandTotal)}
              </div>
            </div>

            {tableUpiQr && (
              <div className="bg-white p-2 rounded-xl border border-slate-200 inline-block shadow-sm">
                <Image src={tableUpiQr} alt="UPI QR" width={180} height={180} />
              </div>
            )}

            <button
              onClick={() => {
                settlePayment(trackedOrder.id, 'upi', trackedOrder.grandTotal);
                setShowUpiModal(false);
                alert('Payment Confirmed! Receipt generated.');
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow"
            >
              I Have Paid with UPI
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClientOrderPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400 font-bold">Loading ORDRIVA Menu...</div>}>
      <ClientOrderContent />
    </React.Suspense>
  );
}

