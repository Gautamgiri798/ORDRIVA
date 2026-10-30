'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { usePosStore } from '@/lib/store';
import { MenuItem, SelectedModifier, PaymentMethod, Order } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { print80mmReceipt, printA4TaxInvoice } from '@/lib/receiptPrinter';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { OrdrivaLogo } from '@/components/OrdrivaLogo';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CreditCard,
  QrCode,
  Banknote,
  Split,
  CheckCircle,
  X,
  Receipt,
  Percent,
  User,
  Phone,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

function PosContent() {
  const searchParams = useSearchParams();
  const tableParam = searchParams.get('table');

  const {
    currentBranch,
    currentUser,
    categories,
    menuItems,
    tables,
    cart,
    selectedTableId,
    orderType,
    customerName,
    customerPhone,
    orderNotes,
    discountPercentage,
    setSelectedTableId,
    setOrderType,
    setCustomerName,
    setCustomerPhone,
    setOrderNotes,
    setDiscountPercentage,
    addToCart,
    updateCartItemQty,
    removeCartItem,
    clearCart,
    cartCalculations,
    createOrder,
    settlePayment,
  } = usePosStore();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [modifierModalItem, setModifierModalItem] = useState<MenuItem | null>(null);
  const [selectedMods, setSelectedMods] = useState<SelectedModifier[]>([]);
  const [itemNote, setItemNote] = useState<string>('');

  // Checkout modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [tenderedAmount, setTenderedAmount] = useState<number>(0);
  const [upiQrDataUrl, setUpiQrDataUrl] = useState<string>('');

  // Discount modal
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState<boolean>(false);

  // Success / Receipt Modal
  const [settledOrder, setSettledOrder] = useState<Order | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);

  // Mobile navigation tab ('menu' vs 'cart')
  const [mobileTab, setMobileTab] = useState<'menu' | 'cart'>('menu');

  useEffect(() => {
    if (tableParam) {
      setSelectedTableId(tableParam);
      setOrderType('dine_in');
    }
  }, [tableParam, setSelectedTableId, setOrderType]);

  // Generate UPI QR Code whenever payment modal opens or total changes
  useEffect(() => {
    if (isCheckoutOpen && paymentMethod === 'upi') {
      const upiUrl = `upi://pay?pa=ordriva@icici&pn=ORDRIVA%20Bistro&am=${cartCalculations.grandTotal}&cu=INR&tn=Order%20Bill`;
      QRCode.toDataURL(upiUrl, { width: 220, margin: 1 }, (err, url) => {
        if (!err && url) {
          setUpiQrDataUrl(url);
        }
      });
    }
  }, [isCheckoutOpen, paymentMethod, cartCalculations.grandTotal]);

  const filteredItems = menuItems.filter((item) => {
    const matchesCat = activeCategory === 'all' || item.categoryId === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleItemClick = (item: MenuItem) => {
    if (!item.isAvailable) return;
    if (item.modifierGroups && item.modifierGroups.length > 0) {
      setModifierModalItem(item);
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
      setSelectedMods(defaults);
      setItemNote('');
    } else {
      addToCart(item, 1, [], '');
    }
  };

  const handleAddWithModifiers = () => {
    if (!modifierModalItem) return;
    addToCart(modifierModalItem, 1, selectedMods, itemNote);
    setModifierModalItem(null);
    setSelectedMods([]);
    setItemNote('');
  };

  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setTenderedAmount(cartCalculations.grandTotal);
    setIsCheckoutOpen(true);
  };

  const handleSaveTab = () => {
    const created = createOrder();
    if (created) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      alert(`Order #${created.orderNumber} placed on active running tab.`);
    }
  };

  const handleCompleteSettlement = () => {
    const order = createOrder();
    if (!order) return;

    const result = settlePayment(order.id, paymentMethod, tenderedAmount);
    if (result.success && result.order) {
      setIsCheckoutOpen(false);
      setSettledOrder(result.order);
      setIsReceiptOpen(true);
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  };

  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const changeDue = Math.max(0, tenderedAmount - cartCalculations.grandTotal);
  const totalCartQty = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden bg-slate-100 relative">
      {/* Mobile View Segmented Controller */}
      <div className="lg:hidden flex items-center justify-between bg-[#0F172A] text-white px-3 py-2 border-b border-slate-800 shrink-0">
        <div className="flex items-center space-x-1 bg-slate-900 p-0.5 rounded-xl border border-slate-700/60 w-full">
          <button
            onClick={() => setMobileTab('menu')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              mobileTab === 'menu'
                ? 'bg-[#3B82F6] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Menu Catalog</span>
          </button>
          <button
            onClick={() => setMobileTab('cart')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              mobileTab === 'cart'
                ? 'bg-[#3B82F6] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Current Order</span>
            {totalCartQty > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  mobileTab === 'cart' ? 'bg-white text-blue-700' : 'bg-blue-600 text-white'
                }`}
              >
                {totalCartQty}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* LEFT: Menu Browsing & Filtering Area */}
      <div
        className={`flex-1 flex flex-col h-full overflow-hidden border-r border-slate-200 bg-white ${
          mobileTab === 'cart' ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {/* Top Control Bar: Search & Order Details */}
        <div className="p-3 border-b border-slate-200 bg-slate-50 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Order Type Selector */}
            <div className="inline-flex rounded-lg bg-slate-200 p-0.5 text-xs font-semibold">
              <button
                onClick={() => setOrderType('dine_in')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  orderType === 'dine_in' ? 'bg-[#3B82F6] text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Dine-In
              </button>
              <button
                onClick={() => setOrderType('takeaway')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  orderType === 'takeaway' ? 'bg-[#3B82F6] text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Takeaway
              </button>
              <button
                onClick={() => setOrderType('delivery')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  orderType === 'delivery' ? 'bg-[#3B82F6] text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Delivery
              </button>
            </div>

            {/* Table Selector (for Dine-In) */}
            {orderType === 'dine_in' && (
              <div className="flex items-center space-x-1.5 text-xs">
                <span className="font-semibold text-slate-500">Table:</span>
                <select
                  value={selectedTableId || ''}
                  onChange={(e) => setSelectedTableId(e.target.value || null)}
                  aria-label="Select Dining Table"
                  className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6] cursor-pointer"
                >
                  <option value="">Select Table...</option>
                  {tables.map((tbl) => (
                    <option key={tbl.id} value={tbl.id}>
                      {tbl.label} ({tbl.capacity}P) - {tbl.status}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search menu (e.g. Pizza, Truffle)..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Customer Details Ribbon */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600">
            <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-md px-2 py-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Guest Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-24 focus:outline-none text-xs"
              />
            </div>
            <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-md px-2 py-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Phone (+91)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-28 focus:outline-none text-xs"
              />
            </div>
            <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-md px-2 py-1 flex-1">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Order special requests or instructions..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full focus:outline-none text-xs"
              />
            </div>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center space-x-2 px-3 py-2 bg-slate-100/70 border-b border-slate-200 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === 'all'
                ? 'bg-[#3B82F6] text-white shadow'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            All Items ({menuItems.length})
          </button>
          {categories.map((cat) => {
            const count = menuItems.filter((i) => i.categoryId === cat.id).length;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#3B82F6] text-white shadow'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`group relative rounded-xl border p-3 flex flex-col justify-between transition-all cursor-pointer select-none ${
                  item.isAvailable
                    ? 'bg-white border-slate-200 hover:border-teal-500 hover:shadow-md active:scale-[0.98]'
                    : 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                }`}
              >
                {/* Image & Badges */}
                <div className="relative w-full h-28 rounded-lg overflow-hidden bg-slate-100 mb-2">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xl">
                      {item.name.charAt(0)}
                    </div>
                  )}

                  {/* Veg / Non-veg dot */}
                  <div className="absolute top-1.5 left-1.5 bg-white/95 p-1 rounded border border-slate-200 shadow-xs">
                    <span
                      className={`block w-2.5 h-2.5 rounded-full ${
                        item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    />
                  </div>

                  {!item.isAvailable && (
                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white text-xs font-bold uppercase tracking-wider">
                      Out of Stock
                    </div>
                  )}

                  {item.modifierGroups && item.modifierGroups.length > 0 && (
                    <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-xs text-[10px] text-white px-1.5 py-0.5 rounded font-medium">
                      Customizable
                    </div>
                  )}
                </div>

                {/* Details */}
                <div>
                  <h3 className="font-bold text-sm text-slate-900 line-clamp-1 group-hover:text-[#3B82F6]">
                    {item.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-tight">
                    {item.description}
                  </p>
                </div>

                {/* Price and Add button */}
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900 tabular-nums">
                    {formatCurrency(item.price)}
                  </span>
                  <button
                    disabled={!item.isAvailable}
                    aria-label={`Add ${item.name} to cart`}
                    className="w-7 h-7 rounded-lg bg-blue-50 group-hover:bg-[#3B82F6] text-[#3B82F6] group-hover:text-white flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Mobile Cart Trigger (Visible on small screens when cart has items) */}
        {cart.length > 0 && (
          <div className="lg:hidden p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg sticky bottom-0 z-20">
            <button
              onClick={() => setMobileTab('cart')}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white font-extrabold text-sm shadow-md flex items-center justify-between active:scale-[0.98] transition-all"
            >
              <div className="flex items-center space-x-2">
                <span className="bg-white text-[#1D4ED8] text-xs px-2 py-0.5 rounded-full font-black">
                  {totalCartQty}
                </span>
                <span>View Order Cart</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="tabular-nums font-black">{formatCurrency(cartCalculations.grandTotal)}</span>
                <span>&rarr;</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* RIGHT: Active Order Cart & Rapid Checkout Panel */}
      <div
        className={`w-full lg:w-96 bg-white flex flex-col h-full border-t lg:border-t-0 lg:border-l border-slate-200 shadow-xl shrink-0 ${
          mobileTab === 'menu' ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {/* Cart Header */}
        <div className="p-3 border-b border-[#3B82F6]/30 bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#0F172A] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setMobileTab('menu')}
              className="lg:hidden px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition-colors flex items-center space-x-1"
              aria-label="Back to menu"
            >
              <span>&larr;</span>
              <span>Menu</span>
            </button>
            <div>
              <div className="text-xs uppercase tracking-wider text-[#60A5FA] font-bold">Current Order</div>
              <div className="text-sm font-extrabold flex items-center space-x-1.5">
                <span>{orderType.toUpperCase()}</span>
                {selectedTable && (
                  <span className="bg-[#3B82F6] text-white px-2 py-0.5 rounded text-xs font-bold">
                    {selectedTable.label}
                  </span>
                )}
              </div>
            </div>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-300 hover:text-white flex items-center space-x-1 bg-white/10 px-2 py-1 rounded"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="font-semibold text-slate-600 text-sm">Cart is Empty</div>
              <p className="text-xs text-slate-400 max-w-[200px]">
                Tap items on the left to add them to this order ticket.
              </p>
            </div>
          ) : (
            cart.map((cartItem, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1.5 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div className="font-bold text-slate-900 leading-tight">
                    {cartItem.menuItem.name}
                  </div>
                  <div className="font-extrabold text-slate-900 tabular-nums">
                    {formatCurrency(cartItem.itemTotal * cartItem.quantity)}
                  </div>
                </div>

                {/* Modifiers & Notes */}
                {cartItem.selectedModifiers.length > 0 && (
                  <div className="text-[11px] text-teal-700 flex flex-wrap gap-1">
                    {cartItem.selectedModifiers.map((mod) => (
                      <span key={mod.modifierId} className="bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                        +{mod.name} ({formatCurrency(mod.priceDelta)})
                      </span>
                    ))}
                  </div>
                )}
                {cartItem.notes && (
                  <div className="text-[10px] text-slate-500 italic bg-white p-1 rounded border border-slate-200">
                    &ldquo;{cartItem.notes}&rdquo;
                  </div>
                )}

                {/* Stepper Controls */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500 tabular-nums">
                    {formatCurrency(cartItem.itemTotal)} each
                  </span>
                  <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs">
                    <button
                      onClick={() => updateCartItemQty(idx, -1)}
                      aria-label="Decrease quantity"
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold px-1 tabular-nums text-slate-900">
                      {cartItem.quantity}
                    </span>
                    <button
                      onClick={() => updateCartItemQty(idx, 1)}
                      aria-label="Increase quantity"
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeCartItem(idx)}
                      aria-label="Delete item from cart"
                      className="w-6 h-6 rounded flex items-center justify-center text-rose-500 hover:bg-rose-50 ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bill Breakdown & Totals */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="tabular-nums font-semibold">
              {formatCurrency(cartCalculations.subtotal)}
            </span>
          </div>

          {/* Discount Trigger */}
          <div className="flex justify-between items-center text-slate-600">
            <button
              onClick={() => setIsDiscountModalOpen(true)}
              className="text-teal-700 hover:text-teal-800 font-semibold flex items-center space-x-1 underline"
            >
              <Percent className="w-3 h-3" />
              <span>Discount ({discountPercentage}%)</span>
            </button>
            <span className="tabular-nums font-semibold text-rose-600">
              -{formatCurrency(cartCalculations.discountAmount)}
            </span>
          </div>

          {/* Tax Breakdown */}
          <div className="flex justify-between text-slate-500 text-[11px]">
            <span>CGST ({currentBranch.taxRates.cgst}%)</span>
            <span className="tabular-nums">{formatCurrency(cartCalculations.cgst)}</span>
          </div>
          <div className="flex justify-between text-slate-500 text-[11px]">
            <span>SGST ({currentBranch.taxRates.sgst}%)</span>
            <span className="tabular-nums">{formatCurrency(cartCalculations.sgst)}</span>
          </div>

          {orderType === 'dine_in' && currentBranch.taxRates.serviceCharge > 0 && (
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>Service Charge ({currentBranch.taxRates.serviceCharge}%)</span>
              <span className="tabular-nums">{formatCurrency(cartCalculations.serviceCharge)}</span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-300 flex justify-between items-baseline">
            <span className="font-extrabold text-sm text-slate-900">Total Payable</span>
            <span className="font-extrabold text-xl text-[#3B82F6] tabular-nums">
              {formatCurrency(cartCalculations.grandTotal)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-3 bg-white border-t border-slate-200 grid grid-cols-2 gap-2">
          <button
            onClick={handleSaveTab}
            disabled={cart.length === 0}
            className="py-3 px-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50"
          >
            <Receipt className="w-4 h-4 text-blue-600" />
            <span>Save Tab</span>
          </button>

          <button
            onClick={handleOpenCheckout}
            disabled={cart.length === 0}
            className="py-3 px-3 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-extrabold text-sm flex items-center justify-center space-x-1.5 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            <Banknote className="w-4 h-4" />
            <span>Pay {formatCurrency(cartCalculations.grandTotal)}</span>
          </button>
        </div>
      </div>

      {/* MODAL 1: Item Modifiers Customizer */}
      {modifierModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-4 bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#0F172A] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">{modifierModalItem.name}</h3>
                <span className="text-[#60A5FA] text-xs">
                  Base Price: {formatCurrency(modifierModalItem.price)}
                </span>
              </div>
              <button
                onClick={() => setModifierModalItem(null)}
                aria-label="Close customizer modal"
                className="p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {modifierModalItem.modifierGroups?.map((group) => (
                <div key={group.id} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">{group.name}</span>
                    {group.required && (
                      <span className="text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.2 rounded">
                        Required
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {group.options.map((opt) => {
                      const isSelected = selectedMods.some((m) => m.modifierId === opt.id);
                      return (
                        <div
                          key={opt.id}
                          onClick={() => {
                            if (group.maxSelections === 1) {
                              const otherGroupIds = group.options.map((o) => o.id);
                              setSelectedMods((prev) => [
                                ...prev.filter((m) => !otherGroupIds.includes(m.modifierId)),
                                { modifierId: opt.id, name: opt.name, priceDelta: opt.priceDelta },
                              ]);
                            } else {
                              setSelectedMods((prev) =>
                                isSelected
                                  ? prev.filter((m) => m.modifierId !== opt.id)
                                  : [...prev, { modifierId: opt.id, name: opt.name, priceDelta: opt.priceDelta }]
                              );
                            }
                          }}
                          className={`p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-teal-50 border-teal-500 text-teal-900 font-semibold shadow-xs'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span>{opt.name}</span>
                          <span className="text-slate-500 font-medium">
                            {opt.priceDelta > 0 ? `+${formatCurrency(opt.priceDelta)}` : 'Free'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Special Cooking Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Special Kitchen Notes</label>
                <input
                  type="text"
                  value={itemNote}
                  onChange={(e) => setItemNote(e.target.value)}
                  placeholder="e.g. Extra spicy, no onions, well-done..."
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
              <button
                onClick={() => setModifierModalItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddWithModifiers}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-md shadow-blue-500/20"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Discount Selector */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-5 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-slate-900">Apply Order Discount</h3>
              <button onClick={() => setIsDiscountModalOpen(false)} aria-label="Close discount modal">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[0, 5, 10, 15, 20, 25, 30, 50].map((pct) => (
                <button
                  key={pct}
                  onClick={() => {
                    setDiscountPercentage(pct);
                    setIsDiscountModalOpen(false);
                  }}
                  className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                    discountPercentage === pct
                      ? 'bg-[#3B82F6] text-white border-[#3B82F6]'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Checkout & Settlement */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#0F172A] text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg">Checkout & Settlement</h3>
                <p className="text-[#60A5FA] text-xs">Total: {formatCurrency(cartCalculations.grandTotal)}</p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                aria-label="Close checkout modal"
                className="p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payment Method Tabs */}
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-xl border flex flex-col items-center space-y-1 transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                  <span className="text-xs">Cash</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3 rounded-xl border flex flex-col items-center space-y-1 transition-all ${
                    paymentMethod === 'upi'
                      ? 'bg-teal-50 border-teal-500 text-teal-800 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                  <span className="text-xs">UPI QR</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border flex flex-col items-center space-y-1 transition-all ${
                    paymentMethod === 'card'
                      ? 'bg-blue-50 border-blue-500 text-blue-800 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-xs">Card</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('split')}
                  className={`p-3 rounded-xl border flex flex-col items-center space-y-1 transition-all ${
                    paymentMethod === 'split'
                      ? 'bg-purple-50 border-purple-500 text-purple-800 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <Split className="w-5 h-5" />
                  <span className="text-xs">Split</span>
                </button>
              </div>

              {/* METHOD 1: CASH INTERFACE */}
              {paymentMethod === 'cash' && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-600">Tendered Cash:</span>
                    <input
                      type="number"
                      value={tenderedAmount}
                      onChange={(e) => setTenderedAmount(Number(e.target.value))}
                      className="w-32 text-right p-1.5 font-bold text-sm bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Fast Denomination Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Exact', val: cartCalculations.grandTotal },
                      { label: '₹500', val: 500 },
                      { label: '₹1000', val: 1000 },
                      { label: '₹2000', val: 2000 },
                    ].map((btn, i) => (
                      <button
                        key={i}
                        onClick={() => setTenderedAmount(btn.val)}
                        className="px-3 py-1 rounded bg-white hover:bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-700"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {/* Change Calculation */}
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                    <span className="text-xs font-bold text-slate-600">Change Due:</span>
                    <span className="text-lg font-extrabold text-emerald-600 tabular-nums">
                      {formatCurrency(changeDue)}
                    </span>
                  </div>
                </div>
              )}

              {/* METHOD 2: DYNAMIC UPI QR */}
              {paymentMethod === 'upi' && (
                <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200 flex flex-col items-center justify-center space-y-3 text-center">
                  <span className="text-xs font-semibold text-teal-800">
                    Scan with any UPI App (GPay, PhonePe, Paytm)
                  </span>
                  {upiQrDataUrl && (
                    <div className="bg-white p-2 rounded-xl shadow-md border border-teal-100">
                      <Image src={upiQrDataUrl} alt="UPI QR" width={180} height={180} />
                    </div>
                  )}
                  <span className="text-xs font-extrabold text-teal-900 tabular-nums">
                    Amount: {formatCurrency(cartCalculations.grandTotal)}
                  </span>
                </div>
              )}

              {/* METHOD 3: CARD TERMINAL */}
              {paymentMethod === 'card' && (
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-center space-y-2">
                  <CreditCard className="w-8 h-8 text-blue-600 mx-auto" />
                  <div className="font-bold text-sm text-blue-900">EDC Machine Ready</div>
                  <p className="text-xs text-blue-700">
                    Swipe or tap card on POS terminal for {formatCurrency(cartCalculations.grandTotal)}
                  </p>
                </div>
              )}

              {/* METHOD 4: SPLIT */}
              {paymentMethod === 'split' && (
                <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span>Part 1 (Cash):</span>
                    <span className="font-bold tabular-nums">
                      {formatCurrency(Math.floor(cartCalculations.grandTotal / 2))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Part 2 (UPI/Card):</span>
                    <span className="font-bold tabular-nums">
                      {formatCurrency(Math.ceil(cartCalculations.grandTotal / 2))}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Finish */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Back
              </button>
              <button
                onClick={handleCompleteSettlement}
                className="px-6 py-2.5 rounded-xl text-sm font-extrabold bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-md shadow-blue-500/25 flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirm & Generate Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: GST Printable Receipt & Tax Invoice */}
      {isReceiptOpen && settledOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6 border border-slate-200 space-y-4">
            {/* The Printable Area for 80mm thermal receipt */}
            <div id="printable-receipt" className="space-y-3 font-mono text-xs text-slate-800">
              <div className="text-center space-y-1">
                {/* ORDRIVA Logo */}
                <div className="py-1">
                  <OrdrivaLogo variant="receipt" size={32} />
                </div>
                <div className="font-bold text-sm text-slate-900">{currentBranch.name}</div>
                <div className="text-[10px] text-slate-500">{currentBranch.address}</div>
                <div className="text-[10px] text-slate-600">GSTIN: {currentBranch.gstin}</div>
                <div className="text-[10px] text-slate-500">Ph: {currentBranch.phone}</div>
                <div className="border-b border-dashed border-slate-300 my-2"></div>
                <div className="font-bold text-xs uppercase tracking-wider">TAX INVOICE</div>
              </div>

              <div className="flex justify-between text-[11px] pt-1">
                <span>Inv: #{settledOrder.orderNumber}</span>
                <span>{new Date(settledOrder.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Type: {settledOrder.orderType.toUpperCase()}</span>
                {settledOrder.tableLabel && <span>Table: {settledOrder.tableLabel}</span>}
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Cashier: {currentUser.name}</span>
                <span>{new Date(settledOrder.createdAt).toLocaleTimeString()}</span>
              </div>

              <div className="border-b border-dashed border-slate-300 my-1"></div>

              {/* Items List */}
              <div className="space-y-1">
                {settledOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="flex-1">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="tabular-nums font-semibold">{formatCurrency(item.itemTotal)}</span>
                  </div>
                ))}
              </div>

              <div className="border-b border-dashed border-slate-300 my-1"></div>

              {/* Calculations */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="tabular-nums">{formatCurrency(settledOrder.subtotal)}</span>
                </div>
                {settledOrder.discountTotal > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span className="tabular-nums">-{formatCurrency(settledOrder.discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>CGST (2.5%):</span>
                  <span className="tabular-nums">{formatCurrency(settledOrder.cgst)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>SGST (2.5%):</span>
                  <span className="tabular-nums">{formatCurrency(settledOrder.sgst)}</span>
                </div>
                {settledOrder.serviceChargeTotal > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Service Charge (5%):</span>
                    <span className="tabular-nums">{formatCurrency(settledOrder.serviceChargeTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-300">
                  <span>GRAND TOTAL:</span>
                  <span className="tabular-nums">{formatCurrency(settledOrder.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 capitalize">
                  <span>Payment Method:</span>
                  <span>{settledOrder.paymentMethod}</span>
                </div>
              </div>

              <div className="border-b border-dashed border-slate-300 my-2"></div>

              <div className="text-center text-[10px] text-slate-500 space-y-0.5">
                <div>Thank you for dining with ORDRIVA!</div>
                <div>FSSAI Lic No: 10019011000123</div>
                <div>Please visit again soon.</div>
              </div>
            </div>

            {/* Print & Close Buttons */}
            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => print80mmReceipt(settledOrder, currentBranch, currentUser.name)}
                  className="py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center space-x-2 hover:bg-slate-800 shadow transition-transform active:scale-95"
                >
                  <Printer className="w-4 h-4 text-blue-400" />
                  <span>80mm Slip</span>
                </button>
                <button
                  onClick={() => printA4TaxInvoice(settledOrder, currentBranch, currentUser.name)}
                  className="py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center space-x-2 hover:bg-blue-500 shadow transition-transform active:scale-95"
                >
                  <Printer className="w-4 h-4 text-white" />
                  <span>A4 Invoice</span>
                </button>
              </div>
              <button
                onClick={() => {
                  setIsReceiptOpen(false);
                  setSettledOrder(null);
                }}
                className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PosPage() {
  return (
    <React.Suspense fallback={<div className="h-full flex items-center justify-center text-slate-500 font-semibold text-sm">Loading ORDRIVA POS Terminal...</div>}>
      <PosContent />
    </React.Suspense>
  );
}
