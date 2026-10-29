'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { usePosStore } from '@/lib/store';
import { Order, PaymentMethod } from '@/types';
import { formatCurrency, formatTime } from '@/lib/utils';
import {
  Receipt,
  Search,
  Filter,
  Printer,
  RotateCcw,
  CheckCircle,
  CreditCard,
  Banknote,
  QrCode,
  X,
  Sparkles,
} from 'lucide-react';

export default function OrdersHistoryPage() {
  const { orders, currentBranch, currentUser, settlePayment, refundOrder, updateOrderStatus } = usePosStore();
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Settlement modal for pending order
  const [isSettling, setIsSettling] = useState<boolean>(false);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');

  // Refund modal
  const [isRefundOpen, setIsRefundOpen] = useState<boolean>(false);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState<string>('Customer Request');

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toString().includes(search) ||
      o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      o.tableLabel?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSettleSubmit = () => {
    if (!selectedOrder) return;
    const res = settlePayment(selectedOrder.id, payMethod, selectedOrder.grandTotal);
    if (res.success && res.order) {
      setSelectedOrder(res.order);
      setIsSettling(false);
    }
  };

  const handleRefundSubmit = () => {
    if (!selectedOrder) return;
    const ok = refundOrder(selectedOrder.id, refundAmount, refundReason);
    if (ok) {
      setIsRefundOpen(false);
      setSelectedOrder(null);
    } else {
      alert('Refund failed: Amount cannot exceed total balance.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#3B82F6]">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Orders & Tax Invoices
            </h1>
            <p className="text-xs text-slate-500">Historical orders, settlements & GST invoices</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, table or guest..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter orders by status"
            className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6] font-semibold text-slate-700 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="placed">Placed</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="served">Served</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs font-semibold text-slate-400 uppercase bg-slate-50/70 border-b border-slate-200">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Type & Table</th>
                <th className="py-3 px-4">Guest</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4">Total (₹)</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      #{order.orderNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize text-xs font-medium text-slate-700">
                        {order.orderType.replace('_', ' ')}
                      </span>
                      {order.tableLabel && (
                        <span className="ml-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800">
                          {order.tableLabel}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {order.customerName || 'Walk-in Guest'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {order.items.reduce((s, i) => s + i.quantity, 0)} items (
                      {order.items.map((i) => i.name).slice(0, 2).join(', ')}
                      {order.items.length > 2 ? `...` : ''})
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 tabular-nums">
                      {formatCurrency(order.grandTotal)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          order.paymentStatus === 'succeeded'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : order.paymentStatus === 'refunded'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          order.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : order.status === 'ready'
                            ? 'bg-blue-50 text-blue-700'
                            : order.status === 'preparing'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#3B82F6] font-bold text-xs transition-colors"
                      >
                        View Bill
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail & Receipt Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  Tax Invoice #{selectedOrder.orderNumber}
                </h3>
                <span className="text-xs text-slate-500" suppressHydrationWarning>
                  {new Date(selectedOrder.createdAt).toLocaleString()} • {selectedOrder.orderType.toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                aria-label="Close invoice modal"
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Snapshots Table */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Order Items (Snapshots)
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="p-2.5 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {it.quantity}x {it.name}
                      </div>
                      {it.modifiers.length > 0 && (
                        <div className="text-[10px] text-[#60A5FA]">
                          + {it.modifiers.map((m) => m.name).join(', ')}
                        </div>
                      )}
                    </div>
                    <span className="font-bold tabular-nums">{formatCurrency(it.itemTotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="tabular-nums font-semibold">{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              {selectedOrder.discountTotal > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Discount:</span>
                  <span className="tabular-nums">-{formatCurrency(selectedOrder.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>CGST:</span>
                <span className="tabular-nums">{formatCurrency(selectedOrder.cgst)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>SGST:</span>
                <span className="tabular-nums">{formatCurrency(selectedOrder.sgst)}</span>
              </div>
              {selectedOrder.serviceChargeTotal > 0 && (
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Service Charge:</span>
                  <span className="tabular-nums">{formatCurrency(selectedOrder.serviceChargeTotal)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-300 flex justify-between items-baseline font-bold text-base text-slate-900">
                <span>Grand Total:</span>
                <span className="tabular-nums text-[#3B82F6]">{formatCurrency(selectedOrder.grandTotal)}</span>
              </div>
            </div>

            {/* Actions: Settle / Refund / Print */}
            <div className="flex flex-wrap gap-2 pt-2">
              {selectedOrder.paymentStatus === 'pending' && (
                <button
                  onClick={() => setIsSettling(true)}
                  className="flex-1 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-blue-500/20"
                >
                  <Banknote className="w-4 h-4" />
                  <span>Settle Bill ({formatCurrency(selectedOrder.grandTotal)})</span>
                </button>
              )}

              {selectedOrder.paymentStatus === 'succeeded' && (
                <button
                  onClick={() => {
                    setRefundAmount(selectedOrder.grandTotal);
                    setIsRefundOpen(true);
                  }}
                  className="py-2.5 px-3 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 font-bold text-xs hover:bg-rose-100 flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Issue Refund</span>
                </button>
              )}

              <button
                onClick={() => window.print()}
                className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settle Modal */}
      {isSettling && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-5 border border-slate-200 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">
              Settle Payment for #{selectedOrder.orderNumber}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'upi', 'card'] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setPayMethod(m)}
                  className={`py-2 rounded-lg text-xs font-bold border uppercase transition-all ${
                    payMethod === m
                      ? 'bg-[#3B82F6] text-white border-[#3B82F6]'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsSettling(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSettleSubmit}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {isRefundOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-5 border border-slate-200 space-y-4">
            <h3 className="font-extrabold text-base text-rose-900">
              Process Order Refund
            </h3>
            <p className="text-xs text-slate-500">
              Original Paid: {formatCurrency(selectedOrder.grandTotal)}
            </p>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700">Refund Amount (₹)</label>
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg font-bold"
              />

              <label className="font-bold text-slate-700 pt-1 block">Reason for Refund</label>
              <input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsRefundOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleRefundSubmit}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 text-white"
              >
                Approve Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

