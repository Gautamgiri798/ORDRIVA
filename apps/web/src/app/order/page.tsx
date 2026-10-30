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
  LayoutGrid,
  Users,
  Mail,
  MessageCircle,
} from 'lucide-react';

interface ClientCartItem {
  menuItem: MenuItem;
  quantity: number;
  selectedModifiers: SelectedModifier[];
  notes?: string;
  itemTotal: number;
}

type CustomerTab = 'menu' | 'bills' | 'tables';

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

  // Customer Cart & Details
  const [clientCart, setClientCart] = useState<ClientCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [guestName, setGuestName] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [guestNotes, setGuestNotes] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'upi' | 'cash' | 'card' | 'tab'>('upi');
  const [billToast, setBillToast] = useState<string | null>(null);
  const [copiedBillId, setCopiedBillId] = useState<string | null>(null);

  // Modifier Customizer Modal
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [tempMods, setTempMods] = useState<SelectedModifier[]>([]);
  const [tempNotes, setTempNotes] = useState<string>('');
  const [tempQty, setTempQty] = useState<number>(1);

  // Active Placed Order (Live Tracking Banner)
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  // UPI Payment Modal State
  const [showUpiModal, setShowUpiModal] = useState<boolean>(false);
  const [tableUpiQr, setTableUpiQr] = useState<string>('');
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);

  // Invoice / Receipt Modal State
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  const [callStaffNotified, setCallStaffNotified] = useState<boolean>(false);

  // Live Tables Seating Filter State
  const [tableSectionFilter, setTableSectionFilter] = useState<string>('all');
  const [tableStatusFilter, setTableStatusFilter] = useState<'all' | 'vacant' | 'occupied' | 'reserved'>('all');
  const [tableCapacityFilter, setTableCapacityFilter] = useState<string>('all');
  const [tableSwitchedToast, setTableSwitchedToast] = useState<string | null>(null);

  // Keep selectedTable synced with URL parameter if present
  useEffect(() => {
    if (tableParam) {
      setSelectedTable(tableParam);
    }
  }, [tableParam]);

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

  // Live Tables Floor Calculations
  const vacantTablesCount = useMemo(() => tables.filter((t) => t.status === 'available').length, [tables]);
  const occupiedTablesCount = useMemo(() => tables.filter((t) => t.status === 'occupied').length, [tables]);
  const reservedTablesCount = useMemo(
    () => tables.filter((t) => t.status === 'reserved' || t.status === 'billed').length,
    [tables]
  );

  const uniqueSections = useMemo(() => {
    return Array.from(new Set(tables.map((t) => t.section))).filter(Boolean);
  }, [tables]);

  const filteredSeatingTables = useMemo(() => {
    return tables.filter((t) => {
      const isVacant = t.status === 'available';
      const isOccupied = t.status === 'occupied';
      const isReserved = t.status === 'reserved' || t.status === 'billed';

      const matchesSection = tableSectionFilter === 'all' || t.section === tableSectionFilter;

      let matchesStatus = true;
      if (tableStatusFilter === 'vacant') matchesStatus = isVacant;
      else if (tableStatusFilter === 'occupied') matchesStatus = isOccupied;
      else if (tableStatusFilter === 'reserved') matchesStatus = isReserved;

      let matchesCap = true;
      if (tableCapacityFilter === '2') matchesCap = t.capacity <= 2;
      else if (tableCapacityFilter === '4') matchesCap = t.capacity === 4;
      else if (tableCapacityFilter === '6+') matchesCap = t.capacity >= 6;

      return matchesSection && matchesStatus && matchesCap;
    });
  }, [tables, tableSectionFilter, tableStatusFilter, tableCapacityFilter]);

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

  // Helper to query quantity of an item currently in client cart
  const getItemCartQuantity = (itemId: string) => {
    return clientCart
      .filter((ci) => ci.menuItem.id === itemId)
      .reduce((sum, ci) => sum + ci.quantity, 0);
  };

  // Add Item to Cart
  const handleItemClick = (item: MenuItem) => {
    if (item.modifierGroups && item.modifierGroups.length > 0) {
      setCustomizingItem(item);
      setTempQty(1);
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

  const handleQuickRemove = (itemId: string) => {
    setClientCart((prev) => {
      const idx = prev.map((ci) => ci.menuItem.id).lastIndexOf(itemId);
      if (idx === -1) return prev;

      const next = [...prev];
      if (next[idx].quantity > 1) {
        next[idx] = {
          ...next[idx],
          quantity: next[idx].quantity - 1,
        };
        return next;
      }
      return next.filter((_, i) => i !== idx);
    });
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
    addDirectToCart(customizingItem, tempQty, tempMods, tempNotes);
    setCustomizingItem(null);
    setTempMods([]);
    setTempNotes('');
    setTempQty(1);
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
      customerEmail: guestEmail || undefined,
      items,
      subtotal: totals.subtotal,
      discountTotal: 0,
      taxTotal: totals.taxTotal,
      cgst: totals.cgst,
      sgst: totals.sgst,
      serviceChargeTotal: totals.serviceCharge,
      grandTotal: totals.grandTotal,
      notes: guestNotes
        ? `${guestNotes} • Payment: ${selectedPaymentMethod.toUpperCase()}`
        : `Digital QR Order • Payment: ${selectedPaymentMethod.toUpperCase()}`,
      createdBy: 'customer-qr',
      createdByName: guestName || `Guest (${selectedTable})`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentMethod: selectedPaymentMethod === 'tab' ? 'cash' : selectedPaymentMethod,
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

    if (selectedPaymentMethod === 'upi') {
      setPayingOrder(newOrder);
      setShowUpiModal(true);
    } else if (selectedPaymentMethod === 'cash') {
      setBillToast(`Order #${nextOrderNum} confirmed! Please pay ₹${newOrder.grandTotal} in cash to your server when served.`);
      setTimeout(() => setBillToast(null), 5000);
    } else if (selectedPaymentMethod === 'card') {
      setBillToast(`Order #${nextOrderNum} confirmed! Our server will bring the wireless card terminal to Table ${selectedTable}.`);
      setTimeout(() => setBillToast(null), 5000);
    } else {
      setBillToast(`Order #${nextOrderNum} confirmed! Added ₹${newOrder.grandTotal} to Table ${selectedTable} running tab.`);
      setTimeout(() => setBillToast(null), 5000);
    }
  };

  // Helper: Format formatted text receipt for downloading & copying
  const formatOrderBillText = (order: Order) => {
    const line = '========================================';
    const sep = '----------------------------------------';
    const now = new Date(order.createdAt);
    const itemsText = order.items
      .map((item) => {
        const modStr =
          item.modifiers && item.modifiers.length > 0
            ? `\n   + ${item.modifiers.map((m) => m.name).join(', ')}`
            : '';
        const notesStr = item.notes ? `\n   Note: "${item.notes}"` : '';
        return `${item.quantity}x ${item.name.padEnd(24)} ₹${item.itemTotal.toFixed(2)}${modStr}${notesStr}`;
      })
      .join('\n');

    return `${line}
            ${currentBranch.name.toUpperCase()}
       ${currentBranch.address}
Phone: ${currentBranch.phone || '+91 98765 43210'} | GSTIN: ${currentBranch.gstin || '27AABCU9603R1ZM'}
${line}
TAX INVOICE & ORDER RECEIPT
Invoice No : INV-${order.orderNumber}
Order Ref  : #${order.orderNumber}
Table      : ${order.tableLabel || 'Direct Order'}
Date & Time: ${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
Customer   : ${order.customerName || 'Dining Guest'}
Phone      : ${order.customerPhone || 'N/A'}
Service    : Digital QR Self-Service
${sep}
ITEM                     QTY      AMOUNT
${sep}
${itemsText}
${sep}
Food Subtotal                    ₹${order.subtotal.toFixed(2)}
CGST (${currentBranch.taxRates.cgst}%)                         ₹${(order.cgst || 0).toFixed(2)}
SGST (${currentBranch.taxRates.sgst}%)                         ₹${(order.sgst || 0).toFixed(2)}
Service Charge (${currentBranch.taxRates.serviceCharge}%)               ₹${(order.serviceChargeTotal || 0).toFixed(2)}
${line}
TOTAL PAYABLE                    ₹${order.grandTotal.toFixed(2)}
${line}
Payment Method : ${(order.paymentMethod || 'upi').toUpperCase()}
Payment Status : ${order.paymentStatus === 'succeeded' ? 'PAID IN FULL (UPI/CARD)' : 'PAYMENT PENDING AT TABLE'}
${line}
Thank you for dining with us at ${currentBranch.name}!
Visit again soon!
${line}`;
  };

  const formatTableTabBillText = () => {
    const line = '========================================';
    const sep = '----------------------------------------';
    const now = new Date();

    const roundsText = tableOrders
      .map((ord, idx) => {
        const rNum = tableOrders.length - idx;
        const itemsList = ord.items
          .map((it) => `   ${it.quantity}x ${it.name} (₹${it.itemTotal})`)
          .join('\n');
        return `ROUND ${rNum} - Order #${ord.orderNumber} (${ord.paymentStatus === 'succeeded' ? 'PAID' : 'UNPAID'}):
${itemsList}
   Round Subtotal: ₹${ord.subtotal} | Round Total: ₹${ord.grandTotal}`;
      })
      .join('\n\n');

    return `${line}
            ${currentBranch.name.toUpperCase()}
       ${currentBranch.address}
Phone: ${currentBranch.phone || '+91 98765 43210'} | GSTIN: ${currentBranch.gstin || '27AABCU9603R1ZM'}
${line}
COMPLETE TABLE DINING STATEMENT
Table      : Table ${selectedTable}
Rounds     : ${tableSummary.roundsCount} Rounds Placed
Total Items: ${tableSummary.totalItemsCount} Dishes
Generated  : ${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
${sep}
ORDER ROUNDS BREAKDOWN:
${roundsText}
${sep}
Session Food Subtotal            ₹${tableSummary.subtotal.toFixed(2)}
Total Taxes (CGST + SGST)        ₹${tableSummary.taxTotal.toFixed(2)}
Service Charge Total             ₹${tableSummary.serviceChargeTotal.toFixed(2)}
${line}
SESSION NET GRAND TOTAL          ₹${tableSummary.grandTotal.toFixed(2)}
Total Settled (Paid)             ₹${tableSummary.paidTotal.toFixed(2)}
Outstanding Balance Due          ₹${tableSummary.pendingTotal.toFixed(2)}
${line}
Payment Status : ${tableSummary.hasPending ? 'BALANCE PENDING' : 'ALL ROUNDS FULLY SETTLED'}
Thank you for dining at ${currentBranch.name}!
${line}`;
  };

  const downloadTextFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadOrderBill = (order: Order) => {
    const text = formatOrderBillText(order);
    downloadTextFile(`ORDRIVA-Bill-Table-${order.tableLabel || 'Direct'}-Order-${order.orderNumber}.txt`, text);
    setBillToast(`Downloaded receipt for Order #${order.orderNumber}!`);
    setTimeout(() => setBillToast(null), 3500);
  };

  const handleDownloadTableTab = () => {
    const text = formatTableTabBillText();
    downloadTextFile(`ORDRIVA-Statement-Table-${selectedTable}.txt`, text);
    setBillToast(`Downloaded full session statement for Table ${selectedTable}!`);
    setTimeout(() => setBillToast(null), 3500);
  };

  const handleShareWhatsAppOrder = (order: Order) => {
    const itemsList = order.items.map((i) => `• ${i.quantity}x ${i.name} - ₹${i.itemTotal}`).join('%0A');
    const isPaid = order.paymentStatus === 'succeeded';
    const waText = `🍽️ *${encodeURIComponent(currentBranch.name)}*%0A` +
      `🧾 *Bill for Table ${order.tableLabel || 'Guest'} - Order %23${order.orderNumber}*%0A` +
      `📅 *Date:* ${encodeURIComponent(new Date(order.createdAt).toLocaleString())}%0A` +
      `👤 *Customer:* ${encodeURIComponent(order.customerName || 'Dining Guest')}%0A` +
      `----------------------------------------%0A` +
      `*Dishes Ordered:*%0A${itemsList}%0A` +
      `----------------------------------------%0A` +
      `*Subtotal:* ₹${order.subtotal}%0A` +
      `*Taxes & Charges:* ₹${((order.taxTotal || 0) + (order.serviceChargeTotal || 0)).toFixed(2)}%0A` +
      `*Net Total:* ₹${order.grandTotal}%0A` +
      `*Status:* ${isPaid ? '✅ PAID IN FULL' : '⏳ PAYMENT PENDING AT TABLE'}%0A%0A` +
      `Thank you for dining with us!`;

    window.open(`https://wa.me/?text=${waText}`, '_blank');
  };

  const handleShareWhatsAppTab = () => {
    const isPaid = !tableSummary.hasPending && tableOrders.length > 0;
    const roundsList = tableOrders
      .map((o, idx) => `Round ${tableOrders.length - idx} (Order %23${o.orderNumber}): ₹${o.grandTotal}`)
      .join('%0A');
    const waText = `🍽️ *${encodeURIComponent(currentBranch.name)}*%0A` +
      `🧾 *Table ${selectedTable} - Dining Statement*%0A` +
      `Total Rounds: ${tableSummary.roundsCount} | Dishes: ${tableSummary.totalItemsCount}%0A` +
      `----------------------------------------%0A` +
      `${roundsList}%0A` +
      `----------------------------------------%0A` +
      `*Food Subtotal:* ₹${tableSummary.subtotal}%0A` +
      `*Taxes & Svc:* ₹${(tableSummary.taxTotal + tableSummary.serviceChargeTotal).toFixed(2)}%0A` +
      `*Session Grand Total:* ₹${tableSummary.grandTotal}%0A` +
      `*Outstanding Balance:* ₹${tableSummary.pendingTotal}%0A` +
      `*Status:* ${isPaid ? '✅ ALL ROUNDS PAID' : '⏳ BALANCE DUE'}%0A%0A` +
      `Thank you for dining at ${encodeURIComponent(currentBranch.name)}!`;

    window.open(`https://wa.me/?text=${waText}`, '_blank');
  };

  const handleCopyOrderBill = (order: Order) => {
    const text = formatOrderBillText(order);
    navigator.clipboard.writeText(text);
    setCopiedBillId(order.id);
    setBillToast(`Copied receipt for Order #${order.orderNumber} to clipboard!`);
    setTimeout(() => {
      setCopiedBillId(null);
      setBillToast(null);
    }, 3000);
  };

  const handleCopyTableTab = () => {
    const text = formatTableTabBillText();
    navigator.clipboard.writeText(text);
    setCopiedBillId('table-tab');
    setBillToast(`Copied Table ${selectedTable} statement to clipboard!`);
    setTimeout(() => {
      setCopiedBillId(null);
      setBillToast(null);
    }, 3000);
  };

  const handleShareNativeOrder = (order: Order) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    if (navigator.share) {
      navigator
        .share({
          title: `ORDRIVA Bill - Table ${order.tableLabel} (Order #${order.orderNumber})`,
          text: `Bill of ₹${order.grandTotal} for Table ${order.tableLabel} at ${currentBranch.name}. Status: ${
            order.paymentStatus === 'succeeded' ? 'Paid' : 'Pending'
          }.`,
          url: `${origin}/order?table=${encodeURIComponent(order.tableLabel || selectedTable)}`,
        })
        .catch(() => {});
    } else {
      handleShareWhatsAppOrder(order);
    }
  };

  const totalCartCount = clientCart.reduce((sum, ci) => sum + ci.quantity, 0);

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

            {/* Tab 3: Live Tables & Seating */}
            <button
              onClick={() => setActiveTab('tables')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap relative ${
                activeTab === 'tables'
                  ? 'bg-[#3B82F6] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutGrid className="w-4 h-4 text-[#A78BFA]" />
              <span>Live Tables &amp; Seating</span>
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'tables'
                    ? 'bg-white text-[#1D4ED8]'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                {vacantTablesCount} Vacant
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

      {/* Universal Floating Bill Toast */}
      {billToast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2.5 border border-slate-700 animate-fadeIn max-w-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold leading-snug">{billToast}</span>
        </div>
      )}

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

      {/* Table Switched Banner Toast */}
      {tableSwitchedToast && (
        <div className="max-w-5xl mx-auto px-4 mt-3 animate-fadeIn">
          <div className="bg-emerald-900 text-white p-3 rounded-xl shadow flex items-center justify-between text-xs font-semibold border border-emerald-700">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>{tableSwitchedToast}</span>
            </div>
            <button onClick={() => setTableSwitchedToast(null)} className="text-slate-300 hover:text-white">
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
          {/* 1. SCANNED TABLE QR CONNECTED BANNER */}
          <div className="max-w-5xl mx-auto px-4 mt-4">
            <div className="bg-gradient-to-r from-[#0B1120] via-[#111C38] to-[#1E3A8A] text-white p-4 sm:p-5 rounded-3xl border border-[#3B82F6]/30 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      ● Table QR Connected
                    </span>
                    <h2 className="font-extrabold text-base sm:text-lg text-white">
                      Table {selectedTable}
                    </h2>
                    <span className="text-xs text-slate-300">
                      ({tables.find((t) => t.label === selectedTable)?.section || 'Main Dining'}, {tables.find((t) => t.label === selectedTable)?.capacity || 4} Guests)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Welcome! QR verified. Add dishes to cart, enter your details to order, and view, download, or share your bill anytime.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => setActiveTab('tables')}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center space-x-1.5"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-[#60A5FA]" />
                  <span>Switch Table</span>
                </button>
                <button
                  onClick={() => setActiveTab('bills')}
                  className="px-3.5 py-1.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs shadow transition-all flex items-center space-x-1.5"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>View Table Bill</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. ACTIVE LIVE ORDER TRACKER & BILL CARD */}
          {trackedOrder && (
            <div className="max-w-5xl mx-auto px-4 mt-4">
              <div className="bg-white rounded-3xl border-2 border-[#3B82F6] shadow-xl p-5 sm:p-6 space-y-5 animate-fadeIn">
                {/* Order Top Banner */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                      <h2 className="font-black text-base sm:text-lg text-slate-900">
                        Active Order #{trackedOrder.orderNumber}
                      </h2>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1D4ED8] font-black border border-blue-200">
                        Table {trackedOrder.tableLabel}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                          trackedOrder.paymentStatus === 'succeeded'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {trackedOrder.paymentStatus === 'succeeded' ? '✓ Paid' : 'Payment Pending'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Placed by <strong className="text-slate-800 font-bold">{trackedOrder.customerName}</strong> at{' '}
                      {new Date(trackedOrder.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      • Est. kitchen wait time: 15–20 mins
                    </p>
                  </div>

                  {/* Immediate Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {trackedOrder.paymentStatus !== 'succeeded' && (
                      <button
                        onClick={() => {
                          setPayingOrder(trackedOrder);
                          setShowUpiModal(true);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-extrabold text-xs flex items-center space-x-1.5 shadow transition-all active:scale-95"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay Bill ({formatCurrency(trackedOrder.grandTotal)})</span>
                      </button>
                    )}

                    {/* Download Bill Button */}
                    <button
                      onClick={() => handleDownloadOrderBill(trackedOrder)}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center space-x-1.5 border border-slate-200 transition-colors"
                      title="Download Formatted Receipt (.txt)"
                    >
                      <Download className="w-3.5 h-3.5 text-[#3B82F6]" />
                      <span>Download Bill</span>
                    </button>

                    {/* Share on WhatsApp */}
                    <button
                      onClick={() => handleShareWhatsAppOrder(trackedOrder)}
                      className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center space-x-1.5 border border-emerald-200 transition-colors"
                      title="Share Bill on WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Share</span>
                    </button>

                    {/* Copy Bill Summary */}
                    <button
                      onClick={() => handleCopyOrderBill(trackedOrder)}
                      className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center space-x-1 border border-slate-200 transition-colors"
                      title="Copy Bill to Clipboard"
                    >
                      {copiedBillId === trackedOrder.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </button>

                    {/* Full GST Tax Invoice Modal */}
                    <button
                      onClick={() => setSelectedInvoiceOrder(trackedOrder)}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-1.5 shadow transition-colors"
                      title="View Official GST Invoice"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#60A5FA]" />
                      <span>Tax Invoice</span>
                    </button>
                  </div>
                </div>

                {/* Step Progress Tracker */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                  <div className="space-y-1">
                    <div className="w-7 h-7 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                      ✓
                    </div>
                    <div className="font-bold text-slate-900 text-[11px]">Received</div>
                  </div>
                  <div className="space-y-1">
                    <div className="w-7 h-7 mx-auto rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs animate-pulse">
                      <Flame className="w-3.5 h-3.5" />
                    </div>
                    <div className="font-bold text-amber-700 text-[11px]">In Kitchen</div>
                  </div>
                  <div className="space-y-1">
                    <div className="w-7 h-7 mx-auto rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <div className="text-slate-400 text-[11px]">Ready</div>
                  </div>
                  <div className="space-y-1">
                    <div className="w-7 h-7 mx-auto rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs">
                      4
                    </div>
                    <div className="text-slate-400 text-[11px]">Served</div>
                  </div>
                </div>

                {/* Itemized Live Bill Summary */}
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/90 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-extrabold text-xs text-slate-800 flex items-center space-x-1.5">
                      <Receipt className="w-3.5 h-3.5 text-[#3B82F6]" />
                      <span>Itemized Bill Summary</span>
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {trackedOrder.items.reduce((s, i) => s + i.quantity, 0)} items ordered
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {trackedOrder.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-start text-xs">
                        <div>
                          <span className="font-bold text-slate-800">
                            {it.quantity}x {it.name}
                          </span>
                          {it.modifiers && it.modifiers.length > 0 && (
                            <span className="text-[10px] text-blue-700 block">
                              + {it.modifiers.map((m) => m.name).join(', ')}
                            </span>
                          )}
                          {it.notes && (
                            <span className="text-[10px] text-slate-400 italic block">
                              &ldquo;{it.notes}&rdquo;
                            </span>
                          )}
                        </div>
                        <span className="font-extrabold text-slate-900 tabular-nums">
                          {formatCurrency(it.itemTotal)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Financial Breakdown */}
                  <div className="pt-2.5 border-t border-slate-200/90 flex flex-wrap items-center justify-between text-xs gap-2">
                    <div className="text-slate-500 text-[11px]">
                      Subtotal {formatCurrency(trackedOrder.subtotal)} + GST (5%) {formatCurrency(trackedOrder.taxTotal)} + Svc (5%) {formatCurrency(trackedOrder.serviceChargeTotal || 0)}
                    </div>
                    <div className="font-black text-slate-900 text-sm">
                      Total Bill:{' '}
                      <span className="text-[#1D4ED8] tabular-nums">
                        {formatCurrency(trackedOrder.grandTotal)}
                      </span>
                    </div>
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

                      {/* Interactive Add / Multiple Quantity Controls */}
                      {getItemCartQuantity(item.id) > 0 ? (
                        <div className="flex items-center space-x-1.5 bg-blue-50 border border-blue-200 rounded-xl p-1 shadow-xs">
                          <button
                            onClick={() => handleQuickRemove(item.id)}
                            className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold shadow-xs active:scale-95 transition-all"
                            aria-label={`Decrease ${item.name}`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <span className="font-black text-xs text-[#1D4ED8] px-2 tabular-nums">
                            {getItemCartQuantity(item.id)}
                          </span>

                          <button
                            onClick={() => handleItemClick(item)}
                            className="w-7 h-7 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white flex items-center justify-center font-bold shadow-xs active:scale-95 transition-all"
                            aria-label={`Add more ${item.name}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleItemClick(item)}
                          className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-[#3B82F6] text-[#1D4ED8] hover:text-white font-extrabold text-xs flex items-center space-x-1.5 transition-all shadow-xs active:scale-95 border border-blue-200 hover:border-transparent"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Order</span>
                        </button>
                      )}
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

                <div className="flex flex-wrap items-center gap-2">
                  {tableSummary.hasPending && (
                    <button
                      onClick={() => {
                        setPayingOrder(null);
                        setShowUpiModal(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-black text-xs flex items-center space-x-2 shadow-lg transition-transform active:scale-95"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Pay Balance with UPI (₹{tableSummary.pendingTotal})</span>
                    </button>
                  )}

                  {tableOrders.length > 0 && (
                    <>
                      <button
                        onClick={handleDownloadTableTab}
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center space-x-1.5 border border-white/20 transition-all"
                        title="Download Statement (.txt)"
                      >
                        <Download className="w-3.5 h-3.5 text-[#60A5FA]" />
                        <span>Download Statement</span>
                      </button>

                      <button
                        onClick={handleShareWhatsAppTab}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center space-x-1.5 border border-emerald-500/40 transition-all"
                        title="Share Statement on WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Share on WhatsApp</span>
                      </button>

                      <button
                        onClick={handleCopyTableTab}
                        className="px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center space-x-1 border border-white/20 transition-all"
                        title="Copy Statement to Clipboard"
                      >
                        {copiedBillId === 'table-tab' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-300" />
                        )}
                      </button>
                    </>
                  )}
                </div>
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
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Download Bill */}
                          <button
                            onClick={() => handleDownloadOrderBill(ord)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center space-x-1 border border-slate-200 transition-colors"
                            title="Download Receipt"
                          >
                            <Download className="w-3.5 h-3.5 text-[#3B82F6]" />
                            <span className="hidden sm:inline">Download</span>
                          </button>

                          {/* Share on WhatsApp */}
                          <button
                            onClick={() => handleShareWhatsAppOrder(ord)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center space-x-1 border border-emerald-200 transition-colors"
                            title="Share on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="hidden sm:inline">Share</span>
                          </button>

                          {/* Copy Receipt */}
                          <button
                            onClick={() => handleCopyOrderBill(ord)}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors"
                            title="Copy Receipt"
                          >
                            {copiedBillId === ord.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* GST Tax Invoice */}
                          <button
                            onClick={() => setSelectedInvoiceOrder(ord)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center space-x-1.5 border border-slate-200 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-600" />
                            <span>Tax Invoice</span>
                          </button>

                          {!isSettled && (
                            <button
                              onClick={() => {
                                setPayingOrder(ord);
                                setShowUpiModal(true);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all active:scale-95"
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
          TAB 4: LIVE TABLES & SEATING AVAILABILITY ("TABLES PART")
          ========================================================================= */}
      {activeTab === 'tables' && (
        <div className="max-w-5xl mx-auto px-4 mt-6 space-y-8">
          {/* Header Summary Banner */}
          <div className="bg-gradient-to-br from-[#0B1120] via-[#111C38] to-[#1E3A8A] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#3B82F6]/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
              <div className="space-y-1.5 max-w-xl">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-[#60A5FA]">
                  <LayoutGrid className="w-3.5 h-3.5 text-[#A78BFA]" />
                  <span>Live Restaurant Floor Status</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Dining Tables &amp; Seating Map
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  View real-time table availability at <strong className="text-white font-bold">{currentBranch.name}</strong>. Select any vacant table to start dining and place orders directly to the kitchen.
                </p>
              </div>

              {/* Current Active Table Indicator */}
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 flex flex-col items-start md:items-end text-left md:text-right">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Your Current Table
                </span>
                <span className="text-2xl font-black text-amber-300">
                  Table {selectedTable}
                </span>
                <span className="text-[11px] text-[#60A5FA] font-medium mt-0.5">
                  Ordering &amp; Billing Linked
                </span>
              </div>
            </div>

            {/* Stat Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-slate-300 font-bold text-xs uppercase tracking-wider">
                    Vacant
                  </span>
                </div>
                <span className="text-2xl font-black text-emerald-400 mt-1 block">
                  {vacantTablesCount} Tables
                </span>
                <span className="text-[11px] text-slate-300">Available for seating</span>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="text-slate-300 font-bold text-xs uppercase tracking-wider">
                    Occupied
                  </span>
                </div>
                <span className="text-2xl font-black text-rose-400 mt-1 block">
                  {occupiedTablesCount} Tables
                </span>
                <span className="text-[11px] text-slate-300">Guests currently dining</span>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                  <span className="text-slate-300 font-bold text-xs uppercase tracking-wider">
                    Reserved
                  </span>
                </div>
                <span className="text-2xl font-black text-purple-300 mt-1 block">
                  {reservedTablesCount} Tables
                </span>
                <span className="text-[11px] text-slate-300">Pre-booked &amp; billing</span>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#60A5FA]"></span>
                  <span className="text-slate-300 font-bold text-xs uppercase tracking-wider">
                    Total Tables
                  </span>
                </div>
                <span className="text-2xl font-black text-[#60A5FA] mt-1 block">
                  {tables.length} Total
                </span>
                <span className="text-[11px] text-slate-300">Across all dining areas</span>
              </div>
            </div>
          </div>

          {/* Filter Bar: Status, Section, and Capacity */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Status Filter Chips */}
              <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1 text-xs font-bold">
                <button
                  onClick={() => setTableStatusFilter('all')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                    tableStatusFilter === 'all'
                      ? 'bg-[#0B1120] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Tables ({tables.length})
                </button>

                <button
                  onClick={() => setTableStatusFilter('vacant')}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap border ${
                    tableStatusFilter === 'vacant'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Vacant Only ({vacantTablesCount})</span>
                </button>

                <button
                  onClick={() => setTableStatusFilter('occupied')}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap border ${
                    tableStatusFilter === 'occupied'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  <span>Occupied Only ({occupiedTablesCount})</span>
                </button>

                <button
                  onClick={() => setTableStatusFilter('reserved')}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap border ${
                    tableStatusFilter === 'reserved'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  <span>Reserved ({reservedTablesCount})</span>
                </button>
              </div>

              {/* Section & Capacity Dropdowns */}
              <div className="flex items-center space-x-2">
                <select
                  value={tableSectionFilter}
                  onChange={(e) => setTableSectionFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-xs font-bold px-3 py-1.5 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  aria-label="Filter by Dining Section"
                >
                  <option value="all">All Sections</option>
                  {uniqueSections.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>

                <select
                  value={tableCapacityFilter}
                  onChange={(e) => setTableCapacityFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-xs font-bold px-3 py-1.5 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  aria-label="Filter by Table Capacity"
                >
                  <option value="all">Any Capacity</option>
                  <option value="2">2 Guests (Couples)</option>
                  <option value="4">4 Guests (Standard)</option>
                  <option value="6+">6+ Guests (Family / Group)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tables Seating Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center space-x-2">
                <LayoutGrid className="w-4 h-4 text-[#3B82F6]" />
                <span>Available Floor Seating ({filteredSeatingTables.length} tables shown)</span>
              </h3>
              <div className="flex items-center space-x-3 text-xs text-slate-500">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Vacant</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>Occupied</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span>Reserved</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredSeatingTables.map((tbl) => {
                const isSelected = tbl.label.toLowerCase() === selectedTable.toLowerCase();
                const isVacant = tbl.status === 'available';
                const isOccupied = tbl.status === 'occupied';
                const isReserved = tbl.status === 'reserved';

                return (
                  <div
                    key={tbl.id}
                    className={`bg-white rounded-3xl border transition-all p-5 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md relative overflow-hidden ${
                      isSelected
                        ? 'border-[#3B82F6] ring-2 ring-[#3B82F6]/30 bg-blue-50/20'
                        : isVacant
                        ? 'border-emerald-200/90 hover:border-emerald-400'
                        : isOccupied
                        ? 'border-rose-200/80 bg-rose-50/10'
                        : 'border-slate-200'
                    }`}
                  >
                    {/* Top Status Banner & Current Table Marker */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-serif font-black text-xl text-slate-900 tracking-wide">
                          Table {tbl.label}
                        </span>

                        {isSelected ? (
                          <span className="px-2.5 py-1 rounded-full bg-[#3B82F6] text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                            Your Table
                          </span>
                        ) : isVacant ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-black uppercase tracking-wider">
                            <span className="relative flex h-2 w-2 mr-0.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span>Vacant</span>
                          </span>
                        ) : isOccupied ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-black uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-0.5"></span>
                            <span>Occupied</span>
                          </span>
                        ) : isReserved ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-black uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-0.5"></span>
                            <span>Reserved</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-0.5"></span>
                            <span>Billing</span>
                          </span>
                        )}
                      </div>

                      {/* Section & Capacity Metadata */}
                      <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-3.5 h-3.5 text-[#3B82F6]" />
                          <span className="font-semibold text-slate-800">{tbl.section}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-slate-600">
                            Capacity: <strong className="font-bold text-slate-900">{tbl.capacity} Guests</strong>
                          </span>
                        </div>
                      </div>

                      {/* Live Table Narrative */}
                      <div className="mt-3 pt-3 border-t border-slate-100 text-[11px]">
                        {isVacant ? (
                          <p className="text-emerald-700 font-medium">
                            ✓ Sanitized &amp; ready for immediate seating
                          </p>
                        ) : isOccupied ? (
                          <p className="text-rose-700 font-medium">
                            Guests dining • Placed round active
                          </p>
                        ) : isReserved ? (
                          <p className="text-purple-700 font-medium">
                            Booked for reserved party
                          </p>
                        ) : (
                          <p className="text-amber-700 font-medium">
                            Bill settling • Expected free soon
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Table Interactive Actions */}
                    <div className="pt-2">
                      {isVacant ? (
                        <button
                          onClick={() => {
                            setSelectedTable(tbl.label);
                            setActiveTab('menu');
                            setTableSwitchedToast(
                              `You have selected Table ${tbl.label}! Browse our menu to send food to the kitchen.`
                            );
                            setTimeout(() => setTableSwitchedToast(null), 4000);
                          }}
                          className="w-full py-2.5 px-3 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-black text-xs flex items-center justify-center space-x-1.5 shadow transition-all active:scale-95"
                        >
                          <Utensils className="w-3.5 h-3.5" />
                          <span>Sit at Table &amp; Order</span>
                        </button>
                      ) : isSelected ? (
                        <button
                          onClick={() => setActiveTab('bills')}
                          className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow"
                        >
                          <Receipt className="w-3.5 h-3.5 text-[#60A5FA]" />
                          <span>View Your Table Bill</span>
                        </button>
                      ) : (
                        <div className="w-full py-2 px-3 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs text-center border border-slate-200">
                          {isOccupied ? 'Currently Seated' : isReserved ? 'Reserved' : 'Clearing Soon'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredSeatingTables.length === 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                  <LayoutGrid className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-800">
                  No tables match the selected filters
                </h4>
                <p className="text-xs text-slate-500">
                  Try clearing your section or capacity filters to view all restaurant tables.
                </p>
                <button
                  onClick={() => {
                    setTableStatusFilter('all');
                    setTableSectionFilter('all');
                    setTableCapacityFilter('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                >
                  Reset Table Filters
                </button>
              </div>
            )}
          </div>

          {/* Help & Walk-in Seating Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/70 rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-blue-900 font-extrabold text-sm">
                <Users className="w-4 h-4 text-[#3B82F6]" />
                <span>Large Group or Special Seating Request?</span>
              </div>
              <p className="text-xs text-blue-800/90 leading-relaxed max-w-xl">
                Need a private dining room, high chair, or table combination for 8+ people? Our host team is happy to accommodate your party right away.
              </p>
            </div>

            <button
              onClick={() => {
                setCallStaffNotified(true);
                setTimeout(() => setCallStaffNotified(false), 3500);
              }}
              className="px-5 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-extrabold text-xs shadow-sm flex items-center justify-center space-x-2 shrink-0 transition-transform active:scale-95"
            >
              <Phone className="w-4 h-4" />
              <span>Call Host for Table</span>
            </button>
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

              {/* Quantity Selector: Customer can add multiple items at once */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="font-extrabold text-xs text-slate-900 block">
                    Quantity
                  </span>
                  <span className="text-[10px] text-slate-500">
                    How many items of this dish would you like?
                  </span>
                </div>
                <div className="flex items-center space-x-2.5 bg-white border border-slate-300 rounded-xl p-1 shadow-xs">
                  <button
                    onClick={() => setTempQty(Math.max(1, tempQty - 1))}
                    disabled={tempQty <= 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-black text-sm text-slate-900 w-6 text-center tabular-nums">
                    {tempQty}
                  </span>
                  <button
                    onClick={() => setTempQty(tempQty + 1)}
                    className="w-8 h-8 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white flex items-center justify-center font-bold shadow-xs transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

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

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Total for {tempQty} {tempQty === 1 ? 'item' : 'items'}
                </span>
                <span className="font-black text-base text-slate-900 tabular-nums">
                  {formatCurrency(
                    ((customizingItem.price || 0) +
                      tempMods.reduce((s, m) => s + m.priceDelta, 0)) *
                      tempQty
                  )}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCustomizingItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmCustomization}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow flex items-center space-x-1.5 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    Add {tempQty > 1 ? `${tempQty} to Cart` : 'to Cart'}
                  </span>
                </button>
              </div>
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

              {/* Guest Information & Payment Details Form */}
              <div className="pt-3 border-t border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-xs flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-[#3B82F6]" />
                    <span>Guest Details &amp; E-Bill Delivery</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Step 3: Details &amp; Payment</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="e.g. Gautam / Guest"
                        className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl bg-slate-50 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Mobile (WhatsApp E-Bill) *
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="tel"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl bg-slate-50 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Email Address (For Tax Invoice Copy)
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="guest@example.com (optional)"
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl bg-slate-50 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Special Cooking / Chef Instructions
                  </label>
                  <input
                    type="text"
                    value={guestNotes}
                    onChange={(e) => setGuestNotes(e.target.value)}
                    placeholder="e.g. Less spicy, dressing on side, bring extra napkins..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 text-xs focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                  />
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-1.5 pt-1">
                  <label className="font-extrabold text-slate-900 text-xs flex items-center space-x-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-[#3B82F6]" />
                    <span>Select Payment Option:</span>
                  </label>

                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('upi')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        selectedPaymentMethod === 'upi'
                          ? 'bg-blue-50 border-[#3B82F6] ring-1 ring-[#3B82F6] text-[#1D4ED8]'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 font-bold text-xs">
                        <QrCode className="w-3.5 h-3.5 text-[#3B82F6]" />
                        <span>⚡ Instant UPI</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">GPay, PhonePe, Paytm QR</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('cash')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        selectedPaymentMethod === 'cash'
                          ? 'bg-blue-50 border-[#3B82F6] ring-1 ring-[#3B82F6] text-[#1D4ED8]'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 font-bold text-xs">
                        <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                        <span>💵 Cash at Table</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">Pay waiter when served</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('card')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        selectedPaymentMethod === 'card'
                          ? 'bg-blue-50 border-[#3B82F6] ring-1 ring-[#3B82F6] text-[#1D4ED8]'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 font-bold text-xs">
                        <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                        <span>💳 Card at Table</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">Wireless machine at table</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('tab')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        selectedPaymentMethod === 'tab'
                          ? 'bg-blue-50 border-[#3B82F6] ring-1 ring-[#3B82F6] text-[#1D4ED8]'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 font-bold text-xs">
                        <Receipt className="w-3.5 h-3.5 text-amber-600" />
                        <span>🧾 Table Tab</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">Settle all before leaving</p>
                    </button>
                  </div>
                </div>
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
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => handleDownloadOrderBill(selectedInvoiceOrder)}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center space-x-1 transition-colors"
                  title="Download File (.txt)"
                >
                  <Download className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => handleShareWhatsAppOrder(selectedInvoiceOrder)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs flex items-center space-x-1 transition-colors"
                  title="Share on WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Share</span>
                </button>
                <button
                  onClick={() => handleCopyOrderBill(selectedInvoiceOrder)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs flex items-center space-x-1 transition-colors"
                  title="Copy Text"
                >
                  {copiedBillId === selectedInvoiceOrder.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedInvoiceOrder(null)}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Tax Invoice</span>
                </button>
              </div>
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
