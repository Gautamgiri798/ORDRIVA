'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { usePosStore } from '@/lib/store';
import { MenuItem, SelectedModifier, OrderType, Order } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { OrdrivaLogo } from '@/components/OrdrivaLogo';
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
  Receipt,
  Printer,
  Share2,
  Copy,
  CreditCard,
  Banknote,
  ExternalLink,
  FileText,
  RefreshCw,
  AlertCircle,
  Calendar,
  ChevronRight,
  Download,
  Smartphone,
  Info,
  ShieldCheck,
} from 'lucide-react';

interface ClientCartItem {
  menuItem: MenuItem;
  quantity: number;
  selectedModifiers: SelectedModifier[];
  notes?: string;
  itemTotal: number;
}

type CustomerTab = 'menu' | 'bills' | 'qr_menu';

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

  // Navigation State
  const [activeTab, setActiveTab] = useState<CustomerTab>('menu');

  // Table & Ordering State
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

  // Modifier Customizer Modal
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [tempMods, setTempMods] = useState<SelectedModifier[]>([]);
  const [tempNotes, setTempNotes] = useState<string>('');

  // Active Placed Order (Live Tracking Banner)
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  // UPI Payment Modal State
  const [showUpiModal, setShowUpiModal] = useState<boolean>(false);
  const [tableUpiQr, setTableUpiQr] = useState<string>('');
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);

  // Invoice / Receipt Modal State
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  // Table QR Menu Generator State
  const [qrPreviewTable, setQrPreviewTable] = useState<string>(selectedTable);
  const [tableMenuQrUrl, setTableMenuQrUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [callStaffNotified, setCallStaffNotified] = useState<boolean>(false);

  // Keep selectedTable synced with URL parameter if present
  useEffect(() => {
    if (tableParam) {
      setSelectedTable(tableParam);
      setQrPreviewTable(tableParam);
    }
  }, [tableParam]);

  useEffect(() => {
    setQrPreviewTable(selectedTable);
  }, [selectedTable]);

  // Tracked order for live banner
  const trackedOrder = orders.find((o) => o.id === placedOrderId);

  // Filter all orders placed for the current table session
  const tableOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        (o.tableLabel && o.tableLabel.toLowerCase() === selectedTable.toLowerCase()) ||
        o.id === placedOrderId
    );
  }, [orders, selectedTable, placedOrderId]);

  // Aggregate Table Financials (Running Tab)
  const tableSummary = useMemo(() => {
    const subtotal = tableOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
    const taxTotal = tableOrders.reduce((sum, o) => sum + (o.taxTotal || 0), 0);
    const cgst = tableOrders.reduce((sum, o) => sum + (o.cgst || 0), 0);
    const sgst = tableOrders.reduce((sum, o) => sum + (o.sgst || 0), 0);
    const serviceChargeTotal = tableOrders.reduce((sum, o) => sum + (o.serviceChargeTotal || 0), 0);
    const grandTotal = tableOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
    const paidTotal = tableOrders
      .filter((o) => o.paymentStatus === 'succeeded')
      .reduce((sum, o) => sum + (o.grandTotal || 0), 0);
    const pendingTotal = tableOrders
      .filter((o) => o.paymentStatus !== 'succeeded')
      .reduce((sum, o) => sum + (o.grandTotal || 0), 0);
    const totalItemsCount = tableOrders.reduce(
      (sum, o) => sum + o.items.reduce((isum, item) => isum + item.quantity, 0),
      0
    );

    return {
      subtotal,
      taxTotal,
      cgst,
      sgst,
      serviceChargeTotal,
      grandTotal,
      paidTotal,
      pendingTotal,
      totalItemsCount,
      roundsCount: tableOrders.length,
      hasPending: pendingTotal > 0,
    };
  }, [tableOrders]);

  // Generate dynamic QR Code for the active Table Menu
  useEffect(() => {
    const targetTable = qrPreviewTable || selectedTable || 'T-01';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const tableOrderUrl = `${origin}/order?table=${encodeURIComponent(targetTable)}`;

    QRCode.toDataURL(
      tableOrderUrl,
      {
        width: 380,
        margin: 1,
        color: {
          dark: '#0B1120',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      },
      (err, url) => {
        if (!err && url) {
          setTableMenuQrUrl(url);
        }
      }
    );
  }, [qrPreviewTable, selectedTable]);

  // Generate UPI QR when payment modal is opened
  useEffect(() => {
    if (showUpiModal) {
      const amount = payingOrder ? payingOrder.grandTotal : tableSummary.pendingTotal || 100;
      const refName = payingOrder
        ? `Order ${payingOrder.orderNumber}`
        : `Table ${selectedTable} Full Tab`;
      const upiUrl = `upi://pay?pa=ordriva@icici&pn=ORDRIVA%20Restaurant&am=${amount}&cu=INR&tn=${encodeURIComponent(
        refName
      )}`;

      QRCode.toDataURL(upiUrl, { width: 220, margin: 1 }, (err, url) => {
        if (!err && url) {
          setTableUpiQr(url);
        }
      });
    }
  }, [showUpiModal, payingOrder, tableSummary.pendingTotal, selectedTable]);

  // Menu Items Filtering
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCat = activeCategory === 'all' || item.categoryId === activeCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesVeg = !vegOnly || item.isVeg;
      return matchesCat && matchesSearch && matchesVeg && item.isAvailable;
    });
  }, [menuItems, activeCategory, searchQuery, vegOnly]);

  // Live Cart Calculations
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

  // Add Item to Cart
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
      customerName: guestName || `Guest (${selectedTable})`,
      customerPhone: guestPhone || undefined,
      items,
      subtotal: totals.subtotal,
      discountTotal: 0,
      taxTotal: totals.taxTotal,
      cgst: totals.cgst,
      sgst: totals.sgst,
      serviceChargeTotal: totals.serviceCharge,
      grandTotal: totals.grandTotal,
      notes: guestNotes || 'Digital QR Order',
      createdBy: 'customer-qr',
      createdByName: guestName || `Guest (${selectedTable})`,
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

  // Copy QR Link to clipboard
  const handleCopyLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const targetUrl = `${origin}/order?table=${encodeURIComponent(qrPreviewTable || selectedTable)}`;
    navigator.clipboard.writeText(targetUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Share via Web Share API or WhatsApp
  const handleShare = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const targetUrl = `${origin}/order?table=${encodeURIComponent(qrPreviewTable || selectedTable)}`;
    if (navigator.share) {
      navigator.share({
        title: `ORDRIVA Digital Menu - Table ${qrPreviewTable || selectedTable}`,
        text: `View our live digital menu and order food directly from Table ${qrPreviewTable || selectedTable} at ${currentBranch.name}:`,
        url: targetUrl,
      });
    } else {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(
          `View our digital menu and order for Table ${qrPreviewTable || selectedTable}: ${targetUrl}`
        )}`,
        '_blank'
      );
    }
  };

  // Settle Payment Handler
  const handleConfirmUpiPayment = () => {
    if (payingOrder) {
      settlePayment(payingOrder.id, 'upi', payingOrder.grandTotal);
    } else {
      // Settle all pending orders for this table
      tableOrders
        .filter((o) => o.paymentStatus !== 'succeeded')
        .forEach((o) => settlePayment(o.id, 'upi', o.grandTotal));
    }
    setShowUpiModal(false);
    setPayingOrder(null);
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 } });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 text-slate-800 antialiased selection:bg-[#3B82F6]/20 selection:text-[#1D4ED8]">
      {/* 1. BRAND HERO HEADER */}
      <header className="bg-gradient-to-r from-[#0B1120] via-[#111C38] to-[#1E3A8A] text-white px-4 py-5 sm:px-8 sm:py-6 shadow-md border-b border-[#3B82F6]/20">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <OrdrivaLogo variant="mark" size={44} />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif font-black tracking-widest text-xl text-amber-200">
                  ORDRIVA
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/40">
                  Guest Dining Portal
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {currentBranch.name} • Contactless Ordering &amp; Instant E-Bill
              </p>
            </div>
          </div>

          {/* Table & Order Type Selector */}
          <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/15 flex flex-wrap items-center gap-2.5">
            <div className="flex items-center space-x-2 px-1">
              <span className="text-xs font-bold text-slate-200">Table:</span>
              <select
                value={selectedTable}
                onChange={(e) => {
                  setSelectedTable(e.target.value);
                  setQrPreviewTable(e.target.value);
                }}
                className="bg-slate-900/90 text-white font-black text-xs px-3 py-1.5 rounded-xl border border-[#3B82F6]/50 focus:outline-none focus:border-[#60A5FA] cursor-pointer"
                aria-label="Dining Table Number"
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.label}>
                    {t.label} ({t.section})
                  </option>
                ))}
              </select>
            </div>

            <div className="inline-flex rounded-xl bg-slate-950/70 p-0.5 text-xs font-semibold">
              <button
                onClick={() => setOrderType('dine_in')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  orderType === 'dine_in'
                    ? 'bg-[#3B82F6] text-white shadow font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Dine-In
              </button>
              <button
                onClick={() => setOrderType('takeaway')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  orderType === 'takeaway'
                    ? 'bg-[#3B82F6] text-white shadow font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Takeaway
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. TOP PORTAL NAVIGATION TABS (Menu | Bills & Receipts | Table QR Menu) */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between overflow-x-auto no-scrollbar gap-2 py-2">
          <div className="flex items-center space-x-2">
            {/* Tab 1: Food Menu */}
            <button
              onClick={() => setActiveTab('menu')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                activeTab === 'menu'
                  ? 'bg-[#3B82F6] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>Food &amp; Drinks Menu</span>
            </button>

            {/* Tab 2: Bills & Receipts */}
            <button
              onClick={() => setActiveTab('bills')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap relative ${
                activeTab === 'bills'
                  ? 'bg-[#3B82F6] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Table Bill &amp; Receipts</span>
              {tableOrders.length > 0 && (
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === 'bills'
                      ? 'bg-white text-[#1D4ED8]'
                      : tableSummary.hasPending
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {tableSummary.roundsCount} {tableSummary.roundsCount === 1 ? 'order' : 'orders'}
                  {tableSummary.hasPending ? ` • ₹${tableSummary.pendingTotal}` : ' • Paid'}
                </span>
              )}
            </button>

            {/* Tab 3: Table QR Menu */}
            <button
              onClick={() => setActiveTab('qr_menu')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                activeTab === 'qr_menu'
                  ? 'bg-[#3B82F6] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <QrCode className="w-4 h-4 text-[#A78BFA]" />
              <span>Table QR Menu &amp; Stand</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-[#3B82F6] border border-blue-200">
                Scan &amp; Share
              </span>
            </button>
          </div>

          {/* Quick Call Waiter Button */}
          <button
            onClick={() => {
              setCallStaffNotified(true);
              setTimeout(() => setCallStaffNotified(false), 3500);
            }}
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 whitespace-nowrap"
          >
            <Phone className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span>Call Server</span>
          </button>
        </div>
      </nav>

      {/* Staff Notified Banner Toast */}
      {callStaffNotified && (
        <div className="max-w-5xl mx-auto px-4 mt-3 animate-fadeIn">
          <div className="bg-blue-900 text-white p-3 rounded-xl shadow flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#60A5FA]" />
              <span>Server notified for Table {selectedTable}! A team member is arriving shortly.</span>
            </div>
            <button onClick={() => setCallStaffNotified(false)} className="text-slate-300 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 1: FOOD & DRINKS MENU
          ========================================================================= */}
      {activeTab === 'menu' && (
        <>
          {/* Active Live Order Tracker Banner */}
          {trackedOrder && (
            <div className="max-w-5xl mx-auto px-4 mt-4">
              <div className="bg-white rounded-2xl border-2 border-[#3B82F6] shadow-md p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                      <h2 className="font-extrabold text-base text-slate-900">
                        Active Order #{trackedOrder.orderNumber}
                      </h2>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-[#1D4ED8] font-black border border-blue-200">
                        Table {trackedOrder.tableLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Placed at{' '}
                      {new Date(trackedOrder.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      • Est. wait time: 15–20 mins
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setPayingOrder(trackedOrder);
                        setShowUpiModal(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs flex items-center space-x-1.5 shadow"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Pay Bill ({formatCurrency(trackedOrder.grandTotal)})</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedInvoiceOrder(trackedOrder);
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center space-x-1.5 border border-slate-200"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-600" />
                      <span>E-Receipt</span>
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

          {/* Search & Veg Filter Bar */}
          <div className="max-w-5xl mx-auto px-4 mt-5">
            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dishes, burgers, mocktails..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                />
              </div>

              <button
                onClick={() => setVegOnly(!vegOnly)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                  vegOnly
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span>Pure Veg Only</span>
              </button>
            </div>
          </div>

          {/* Category Tabs Carousel */}
          <div className="max-w-5xl mx-auto px-4 mt-4">
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar text-xs">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-4 py-2 rounded-full font-bold transition-all whitespace-nowrap ${
                  activeCategory === 'all'
                    ? 'bg-[#0B1120] text-white shadow'
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
                        ? 'bg-[#3B82F6] text-white shadow'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {c.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Food Menu Cards Grid */}
          <div className="max-w-5xl mx-auto px-4 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                >
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

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                        {item.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Price
                        </span>
                        <span className="font-extrabold text-base text-slate-900 tabular-nums">
                          {formatCurrency(item.price)}
                        </span>
                      </div>

                      <button
                        onClick={() => handleItemClick(item)}
                        className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-[#3B82F6] text-[#1D4ED8] hover:text-white font-extrabold text-xs flex items-center space-x-1.5 transition-all shadow-xs active:scale-95 border border-blue-200 hover:border-transparent"
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
        </>
      )}

      {/* =========================================================================
          TAB 2: TABLE BILL & RECEIPTS ("BILLS PART")
          ========================================================================= */}
      {activeTab === 'bills' && (
        <div className="max-w-5xl mx-auto px-4 mt-6 space-y-6">
          {/* Running Tab Header Statement */}
          <div className="bg-gradient-to-br from-[#0B1120] via-[#111C38] to-[#1E3A8A] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#3B82F6]/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
              <div className="space-y-1.5">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-[#60A5FA]">
                  <Receipt className="w-3.5 h-3.5 text-[#A78BFA]" />
                  <span>Table Dining Statement</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Table {selectedTable} Running Tab
                </h2>
                <p className="text-xs text-slate-300">
                  {currentBranch.name} • All rounds ordered during your dining session
                </p>
              </div>

              {/* Status Badge & Pay Action */}
              <div className="flex flex-col items-start md:items-end gap-3">
                {tableSummary.hasPending ? (
                  <div className="text-left md:text-right">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 block">
                      Outstanding Balance Due
                    </span>
                    <span className="text-3xl sm:text-4xl font-black text-amber-400 tabular-nums">
                      {formatCurrency(tableSummary.pendingTotal)}
                    </span>
                  </div>
                ) : tableOrders.length > 0 ? (
                  <div className="text-left md:text-right">
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>All Orders Fully Settled</span>
                    </span>
                    <div className="text-xl font-bold text-slate-200 mt-1 tabular-nums">
                      Total Paid: {formatCurrency(tableSummary.paidTotal)}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">No orders recorded yet</span>
                )}

                {tableSummary.hasPending && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setPayingOrder(null);
                        setShowUpiModal(true);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-black text-xs flex items-center space-x-2 shadow-lg transition-transform active:scale-95"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Pay Balance with UPI (₹{tableSummary.pendingTotal})</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Ledger Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <span className="text-slate-400 font-semibold block text-[11px]">Total Rounds</span>
                <span className="text-xl font-black text-white mt-1 block">
                  {tableSummary.roundsCount} {tableSummary.roundsCount === 1 ? 'Round' : 'Rounds'}
                </span>
                <span className="text-[10px] text-slate-400">{tableSummary.totalItemsCount} items ordered</span>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <span className="text-slate-400 font-semibold block text-[11px]">Food Subtotal</span>
                <span className="text-xl font-black text-white mt-1 block tabular-nums">
                  {formatCurrency(tableSummary.subtotal)}
                </span>
                <span className="text-[10px] text-slate-400">Before taxes</span>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <span className="text-slate-400 font-semibold block text-[11px]">Taxes &amp; Service</span>
                <span className="text-xl font-black text-white mt-1 block tabular-nums">
                  {formatCurrency(tableSummary.taxTotal + tableSummary.serviceChargeTotal)}
                </span>
                <span className="text-[10px] text-slate-400">GST 5% + Svc 5%</span>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <span className="text-slate-400 font-semibold block text-[11px]">Session Grand Total</span>
                <span className="text-xl font-black text-[#60A5FA] mt-1 block tabular-nums">
                  {formatCurrency(tableSummary.grandTotal)}
                </span>
                <span className="text-[10px] text-slate-400">Net billing amount</span>
              </div>
            </div>
          </div>

          {/* Orders / Rounds List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center space-x-2">
                <Utensils className="w-4 h-4 text-[#3B82F6]" />
                <span>Order History for Table {selectedTable}</span>
              </h3>
              <span className="text-xs text-slate-500 font-semibold">
                {tableOrders.length} {tableOrders.length === 1 ? 'Round placed' : 'Rounds placed'}
              </span>
            </div>

            {tableOrders.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 mx-auto rounded-full bg-blue-50 text-[#3B82F6] flex items-center justify-center">
                  <Receipt className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-base text-slate-900">
                    No Orders Placed for Table {selectedTable} Yet
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    You haven’t ordered any food or drinks for this table yet. Browse our menu to send your first order round to the kitchen!
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('menu')}
                  className="px-5 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs inline-flex items-center space-x-2 shadow"
                >
                  <Utensils className="w-4 h-4" />
                  <span>Browse Food &amp; Drinks Menu</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {tableOrders.map((ord, idx) => {
                  const isSettled = ord.paymentStatus === 'succeeded';
                  const roundNumber = tableOrders.length - idx;

                  return (
                    <div
                      key={ord.id}
                      className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all space-y-4"
                    >
                      {/* Round Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1D4ED8] font-black flex items-center justify-center text-xs">
                            R{roundNumber}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-extrabold text-sm text-slate-900">
                                Order #{ord.orderNumber}
                              </span>
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                                  ord.status === 'served' || ord.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : ord.status === 'ready'
                                    ? 'bg-blue-50 text-[#1D4ED8] border border-blue-200'
                                    : ord.status === 'preparing'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {ord.status}
                              </span>
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                                  isSettled
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {isSettled ? 'Paid' : 'Unpaid'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500">
                              Placed at {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {ord.items.length} dishes
                            </span>
                          </div>
                        </div>

                        {/* Round Actions */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedInvoiceOrder(ord)}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center space-x-1.5 border border-slate-200 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-600" />
                            <span>GST Tax Invoice</span>
                          </button>

                          {!isSettled && (
                            <button
                              onClick={() => {
                                setPayingOrder(ord);
                                setShowUpiModal(true);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Pay Round ({formatCurrency(ord.grandTotal)})</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Items in this round */}
                      <div className="space-y-2 text-xs divide-y divide-slate-100">
                        {ord.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="pt-2 first:pt-0 flex justify-between items-start">
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-900">
                                {item.quantity}x {item.name}
                              </span>
                              {item.modifiers && item.modifiers.length > 0 && (
                                <div className="text-[11px] text-blue-700">
                                  + {item.modifiers.map((m) => m.name).join(', ')}
                                </div>
                              )}
                              {item.notes && (
                                <div className="text-[10px] text-slate-400 italic">
                                  &ldquo;{item.notes}&rdquo;
                                </div>
                              )}
                            </div>
                            <span className="font-extrabold text-slate-900 tabular-nums">
                              {formatCurrency(item.itemTotal)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Round Subtotal & Grand Total */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="text-slate-500 text-[11px]">
                          Subtotal {formatCurrency(ord.subtotal)} + Tax {formatCurrency(ord.taxTotal)} + Svc {formatCurrency(ord.serviceChargeTotal || 0)}
                        </div>
                        <div className="font-black text-slate-900 text-sm tabular-nums">
                          Round Total: <span className="text-[#1D4ED8]">{formatCurrency(ord.grandTotal)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: TABLE QR MENU & STAND ("QR MENU PART")
          ========================================================================= */}
      {activeTab === 'qr_menu' && (
        <div className="max-w-5xl mx-auto px-4 mt-6 space-y-8">
          {/* Section 1: Hero Explainer */}
          <div className="bg-gradient-to-br from-[#0B1120] via-[#111C38] to-[#1E3A8A] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#3B82F6]/30">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-[#60A5FA]">
                <QrCode className="w-3.5 h-3.5 text-[#A78BFA]" />
                <span>Contactless QR Technology</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Digital QR Menu &amp; Table Stand
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Every dining table at <strong className="text-white font-bold">{currentBranch.name}</strong> is assigned a unique smart QR code. Dining guests can scan from any smartphone to browse our live digital menu, order food straight to the kitchen, and pay their bill.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Live Table QR Card (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">
                    Scan Menu for Table {qrPreviewTable}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Scan with any phone camera to start ordering
                  </p>
                </div>

                {/* Table Picker */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-500">Switch:</span>
                  <select
                    value={qrPreviewTable}
                    onChange={(e) => setQrPreviewTable(e.target.value)}
                    className="bg-slate-50 border border-slate-300 font-extrabold text-xs px-3 py-1.5 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  >
                    {tables.map((t) => (
                      <option key={t.id} value={t.label}>
                        Table {t.label} ({t.section})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* The Live High-Res QR Code Card */}
              <div className="flex flex-col items-center justify-center p-6 bg-slate-50/70 rounded-2xl border border-slate-200/80">
                <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-200/80 inline-block relative group">
                  {tableMenuQrUrl ? (
                    <Image
                      src={tableMenuQrUrl}
                      alt={`QR Menu for Table ${qrPreviewTable}`}
                      width={260}
                      height={260}
                      className="rounded-lg"
                      priority
                    />
                  ) : (
                    <div className="w-64 h-64 flex items-center justify-center text-slate-400 text-xs font-semibold">
                      Generating High-Res QR Code...
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-6 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="px-3 py-1 bg-slate-900/90 text-white rounded-full text-[10px] font-bold shadow">
                      Table {qrPreviewTable} • 100% Contactless
                    </span>
                  </div>
                </div>

                {/* Live URL Display Box */}
                <div className="mt-5 w-full max-w-md bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-mono text-slate-600">
                  <span className="truncate pr-2">
                    {typeof window !== 'undefined'
                      ? `${window.location.origin}/order?table=${encodeURIComponent(qrPreviewTable)}`
                      : `/order?table=${qrPreviewTable}`}
                  </span>
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={handleCopyLink}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                      title="Copy URL"
                    >
                      {copiedLink ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <a
                      href={`/order?table=${encodeURIComponent(qrPreviewTable)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                      title="Open in New Tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Action Buttons: Copy & Share */}
                <div className="grid grid-cols-2 gap-3 mt-4 w-full max-w-md">
                  <button
                    onClick={handleCopyLink}
                    className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center space-x-2 transition-all shadow-xs"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy Menu Link'}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="py-2.5 px-4 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-extrabold text-xs flex items-center justify-center space-x-2 transition-all shadow-xs"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share With Table</span>
                  </button>
                </div>
              </div>

              {/* How Guests Use the QR Code */}
              <div className="space-y-3 pt-2">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">
                  How QR Dining Works
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start space-x-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#1D4ED8] flex items-center justify-center font-black shrink-0">
                      1
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">Scan from Camera</span>
                      <span className="text-[11px] text-slate-500">
                        No app download required. Works on iOS and Android camera apps.
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start space-x-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#1D4ED8] flex items-center justify-center font-black shrink-0">
                      2
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">Order &amp; Customize</span>
                      <span className="text-[11px] text-slate-500">
                        Pick portion size, spice level, modifiers, and leave chef notes.
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start space-x-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#1D4ED8] flex items-center justify-center font-black shrink-0">
                      3
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">Direct Kitchen KDS</span>
                      <span className="text-[11px] text-slate-500">
                        Orders dispatch instantly to kitchen and grill stations.
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start space-x-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#1D4ED8] flex items-center justify-center font-black shrink-0">
                      4
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">Instant E-Bill &amp; UPI</span>
                      <span className="text-[11px] text-slate-500">
                        Inspect GST tax bill anytime and pay right from phone.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Printable Acrylic Table Stand Card (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Printable Table Tent Stand
                  </h3>
                  <p className="text-xs text-slate-500">
                    4×6&quot; table acrylic stand for Table {qrPreviewTable}
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center space-x-1.5 border border-slate-200 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Print Stand</span>
                </button>
              </div>

              {/* Table Tent Stand Mockup */}
              <div className="relative mx-auto max-w-[280px] bg-gradient-to-b from-[#0B1120] via-[#111C38] to-[#0B1120] text-white rounded-3xl p-6 shadow-2xl border-4 border-[#3B82F6]/40 text-center space-y-4">
                {/* Stand Header */}
                <div className="flex flex-col items-center justify-center space-y-1">
                  <OrdrivaLogo variant="mark" size={38} />
                  <span className="font-serif font-black tracking-widest text-lg text-amber-200">
                    ORDRIVA
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-300 font-semibold">
                    {currentBranch.name}
                  </span>
                </div>

                {/* Table Badge */}
                <div className="inline-block px-4 py-1.5 rounded-full bg-[#3B82F6] text-white font-black text-xs shadow-md tracking-wider">
                  TABLE {qrPreviewTable}
                </div>

                {/* Framed QR Code with Corner Brackets */}
                <div className="relative p-3 bg-white rounded-2xl shadow-inner inline-block my-1">
                  {tableMenuQrUrl ? (
                    <Image
                      src={tableMenuQrUrl}
                      alt="Table Stand QR"
                      width={180}
                      height={180}
                      className="rounded-lg"
                    />
                  ) : (
                    <div className="w-44 h-44 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                      Loading...
                    </div>
                  )}
                </div>

                {/* Call to Action */}
                <div className="space-y-1">
                  <h5 className="font-black text-sm tracking-wide text-white">
                    SCAN TO ORDER &amp; PAY
                  </h5>
                  <p className="text-[11px] text-slate-300 leading-tight">
                    Point your phone camera to view full menu, order food, and pay bill
                  </p>
                </div>

                {/* Stand Footer Badges */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-center space-x-3 text-[10px] text-[#60A5FA] font-bold">
                  <span>⚡ Instant Dispatch</span>
                  <span>•</span>
                  <span>🛡️ 100% Contactless</span>
                </div>
              </div>

              {/* Print Stand Description */}
              <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-100 text-xs text-blue-900 space-y-1.5">
                <div className="flex items-center space-x-1.5 font-bold">
                  <Info className="w-4 h-4 text-[#3B82F6]" />
                  <span>Restaurant Operations Tip</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Print this table tent stand on cardstock or insert into an acrylic table holder. Guests can self-serve their entire dining round without waiting for a waiter.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          FLOATING BOTTOM CART BAR (When active items exist)
          ========================================================================= */}
      {clientCart.length > 0 && activeTab === 'menu' && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-xl mx-auto animate-bounce-subtle">
          <div
            onClick={() => setIsCartOpen(true)}
            className="bg-slate-950 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between cursor-pointer border border-[#3B82F6]/50 hover:bg-slate-900 transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#3B82F6] text-white font-black flex items-center justify-center text-sm shadow">
                {totalCartCount}
              </div>
              <div>
                <div className="text-xs text-[#60A5FA] font-semibold uppercase tracking-wider">
                  Table {selectedTable} Order
                </div>
                <div className="text-base font-extrabold tabular-nums">
                  {formatCurrency(totals.grandTotal)}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-[#60A5FA] font-bold text-xs">
              <span>View Cart &amp; Place Order</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CUSTOMIZE DISH (MODIFIERS / ADDONS)
          ========================================================================= */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-4 bg-gradient-to-r from-[#0B1120] to-[#1E3A8A] text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base">{customizingItem.name}</h3>
                <span className="text-[#60A5FA] text-xs">
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
                                  : [
                                      ...prev,
                                      {
                                        modifierId: opt.id,
                                        name: opt.name,
                                        priceDelta: opt.priceDelta,
                                      },
                                    ]
                              );
                            }
                          }}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-blue-50 border-[#3B82F6] text-[#1D4ED8] font-bold shadow-xs'
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

              <div className="space-y-1 text-xs">
                <label className="font-bold text-slate-800">Special Cooking Instructions for Chef</label>
                <input
                  type="text"
                  value={tempNotes}
                  onChange={(e) => setTempNotes(e.target.value)}
                  placeholder="e.g. Less spicy, dressing on the side..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3B82F6] text-xs"
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
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CART DRAWER & ORDER CONFIRMATION
          ========================================================================= */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-gradient-to-r from-[#0B1120] to-[#1E3A8A] text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base">Your Food Order</h3>
                <span className="text-[#60A5FA] text-xs">
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
                    <div className="text-[11px] text-blue-700 font-medium">
                      + {cartItem.selectedModifiers.map((m) => m.name).join(', ')}
                    </div>
                  )}

                  {cartItem.notes && (
                    <div className="text-[11px] text-slate-500 italic bg-white p-1.5 rounded border border-slate-200">
                      &ldquo;{cartItem.notes}&rdquo;
                    </div>
                  )}

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
                  placeholder="Order notes for service staff or kitchen..."
                  className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 text-xs"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="tabular-nums font-semibold">
                    {formatCurrency(totals.subtotal)}
                  </span>
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
                  <span className="tabular-nums text-[#1D4ED8] text-lg">
                    {formatCurrency(totals.grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-200">
              <button
                onClick={handlePlaceOrder}
                className="w-full py-3 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-black text-sm flex items-center justify-center space-x-2 shadow-lg transition-transform active:scale-98"
              >
                <ChefHat className="w-5 h-5" />
                <span>Confirm &amp; Send Order to Kitchen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: UPI INSTANT PAYMENT
          ========================================================================= */}
      {showUpiModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 border border-slate-200 text-center space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-slate-900 text-base">Pay Table Bill</h3>
              <button
                onClick={() => {
                  setShowUpiModal(false);
                  setPayingOrder(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-slate-500">
                {payingOrder ? `Order #${payingOrder.orderNumber}` : `Table ${selectedTable} Total Balance`}
              </div>
              <div className="text-3xl font-black text-[#1D4ED8] tabular-nums">
                {formatCurrency(
                  payingOrder ? payingOrder.grandTotal : tableSummary.pendingTotal
                )}
              </div>
              <div className="text-[11px] text-slate-400">
                Scan with Google Pay, PhonePe, Paytm, or BHIM
              </div>
            </div>

            {tableUpiQr && (
              <div className="bg-white p-3 rounded-2xl border-2 border-slate-200 inline-block shadow-sm">
                <Image src={tableUpiQr} alt="UPI QR" width={190} height={190} />
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={handleConfirmUpiPayment}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow transition-all"
              >
                ✓ I Have Paid with UPI
              </button>
              <button
                onClick={() => {
                  setShowUpiModal(false);
                  setPayingOrder(null);
                }}
                className="w-full py-2 rounded-xl text-slate-600 font-semibold text-xs hover:bg-slate-100"
              >
                Cancel / Pay with Cash Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: DIGITAL GST TAX INVOICE & PRINTABLE RECEIPT
          ========================================================================= */}
      {selectedInvoiceOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 my-8">
            {/* Modal Header Actions */}
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between text-xs font-bold">
              <span className="flex items-center space-x-1.5">
                <Receipt className="w-4 h-4 text-[#60A5FA]" />
                <span>GST Tax Invoice #{selectedInvoiceOrder.orderNumber}</span>
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-[11px] flex items-center space-x-1"
                >
                  <Printer className="w-3 h-3" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setSelectedInvoiceOrder(null)}
                  className="p-1 rounded-full hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Thermal Invoice Body */}
            <div className="p-6 font-mono text-xs space-y-4 bg-white text-slate-900">
              {/* Receipt Logo & Header */}
              <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-4">
                <OrdrivaLogo variant="receipt" size={32} />
                <h4 className="font-extrabold text-sm tracking-wide mt-2">
                  {currentBranch.name}
                </h4>
                <p className="text-[11px] text-slate-600 leading-tight">
                  {currentBranch.address}
                </p>
                <p className="text-[10px] text-slate-500">
                  GSTIN: {currentBranch.gstin || '27AABCU9603R1ZM'} | FSSAI: {currentBranch.fssaiLicense || '10019022009876'}
                </p>
                <p className="text-[10px] text-slate-500">Phone: {currentBranch.phone}</p>
              </div>

              {/* Tax Invoice Metadata */}
              <div className="grid grid-cols-2 gap-1 text-[11px] border-b border-dashed border-slate-300 pb-3">
                <div>
                  <span className="text-slate-500 block">Invoice No:</span>
                  <span className="font-bold">INV-{selectedInvoiceOrder.orderNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Date &amp; Time:</span>
                  <span className="font-bold">
                    {new Date(selectedInvoiceOrder.createdAt).toLocaleDateString()}{' '}
                    {new Date(selectedInvoiceOrder.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-slate-500 block">Table:</span>
                  <span className="font-bold">{selectedInvoiceOrder.tableLabel || selectedTable}</span>
                </div>
                <div className="mt-1 text-right">
                  <span className="text-slate-500 block">Server / Order:</span>
                  <span className="font-bold">Digital QR Self-Service</span>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
                <div className="flex justify-between font-bold text-[11px] text-slate-500 uppercase border-b border-slate-200 pb-1">
                  <span>Item</span>
                  <div className="flex space-x-4">
                    <span>Qty</span>
                    <span>Total</span>
                  </div>
                </div>

                {selectedInvoiceOrder.items.map((it, idx) => (
                  <div key={idx} className="space-y-0.5 text-[11px]">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-900 leading-tight">
                        {it.name}
                      </span>
                      <div className="flex space-x-5 tabular-nums">
                        <span className="text-slate-500">{it.quantity}</span>
                        <span className="font-bold text-slate-900">
                          {formatCurrency(it.itemTotal)}
                        </span>
                      </div>
                    </div>
                    {it.modifiers && it.modifiers.length > 0 && (
                      <div className="text-[10px] text-slate-500">
                        + {it.modifiers.map((m) => m.name).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Tax Computation Breakdown */}
              <div className="space-y-1.5 text-[11px] border-b border-dashed border-slate-300 pb-3">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="tabular-nums font-semibold">
                    {formatCurrency(selectedInvoiceOrder.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>CGST ({currentBranch.taxRates.cgst}%):</span>
                  <span className="tabular-nums">
                    {formatCurrency(selectedInvoiceOrder.cgst)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>SGST ({currentBranch.taxRates.sgst}%):</span>
                  <span className="tabular-nums">
                    {formatCurrency(selectedInvoiceOrder.sgst)}
                  </span>
                </div>
                {(selectedInvoiceOrder.serviceChargeTotal || 0) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Service Charge ({currentBranch.taxRates.serviceCharge}%):</span>
                    <span className="tabular-nums">
                      {formatCurrency(selectedInvoiceOrder.serviceChargeTotal || 0)}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-300 flex justify-between font-black text-sm text-slate-900">
                  <span>Net Grand Total:</span>
                  <span className="tabular-nums text-base">
                    {formatCurrency(selectedInvoiceOrder.grandTotal)}
                  </span>
                </div>
              </div>

              {/* Payment Status Stamp */}
              <div className="text-center pt-1">
                {selectedInvoiceOrder.paymentStatus === 'succeeded' ? (
                  <div className="inline-block px-4 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs border border-emerald-300 uppercase tracking-widest">
                    ✓ PAID IN FULL (UPI / SETTLED)
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="inline-block px-4 py-1 rounded-full bg-amber-100 text-amber-900 font-black text-xs border border-amber-300 uppercase tracking-widest">
                      ⚠ PAYMENT PENDING
                    </div>
                    <button
                      onClick={() => {
                        setPayingOrder(selectedInvoiceOrder);
                        setSelectedInvoiceOrder(null);
                        setShowUpiModal(true);
                      }}
                      className="w-full py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-black text-xs shadow"
                    >
                      Pay Now via UPI ({formatCurrency(selectedInvoiceOrder.grandTotal)})
                    </button>
                  </div>
                )}
              </div>

              {/* Footer Note */}
              <div className="text-center text-[10px] text-slate-400 space-y-0.5 pt-2">
                <p>Thank you for dining with us at {currentBranch.name}!</p>
                <p>This is a computer-generated GST tax invoice.</p>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedInvoiceOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Tax Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClientOrderPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-slate-400 font-bold">
          Loading ORDRIVA Guest Menu...
        </div>
      }
    >
      <ClientOrderContent />
    </React.Suspense>
  );
}
