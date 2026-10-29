'use client';

import React, { useState, useEffect } from 'react';
import { usePosStore } from '@/lib/store';
import { KitchenTicket, KitchenStatus } from '@/types';
import { formatTime, formatDuration } from '@/lib/utils';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  Flame,
  Coffee,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export default function KitchenKdsPage() {
  const { kitchenTickets, updateKitchenTicketStatus } = usePosStore();
  const [selectedStation, setSelectedStation] = useState<string>('all');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [, setTicker] = useState<number>(0);

  // Re-render every 10 seconds to update live ticket elapsed timers
  useEffect(() => {
    const timer = setInterval(() => {
      setTicker((t) => t + 1);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const filteredTickets = kitchenTickets.filter((ticket) => {
    if (selectedStation === 'all') return true;
    return ticket.station === selectedStation;
  });

  const pendingTickets = filteredTickets.filter((t) => t.status === 'pending');
  const preparingTickets = filteredTickets.filter((t) => t.status === 'preparing');
  const readyTickets = filteredTickets.filter((t) => t.status === 'ready');
  const servedTickets = filteredTickets.filter((t) => t.status === 'served');

  const getAgeSeverity = (createdAt: string) => {
    const elapsedMinutes = (Date.now() - new Date(createdAt).getTime()) / 60000;
    if (elapsedMinutes > 20) return 'bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse';
    if (elapsedMinutes > 10) return 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
    return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  };

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 chime
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch {
      // AudioContext unavailable
    }
  };

  const handleStatusChange = (ticketId: string, status: KitchenStatus) => {
    playChime();
    updateKitchenTicketStatus(ticketId, status);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* KDS Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Kitchen Display System (KDS)
            </h1>
            <p className="text-xs text-slate-500">Live order queue & ticket routing</p>
          </div>
        </div>

        {/* Station Filter Pills & Sound Toggle */}
        <div className="flex items-center space-x-2">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            {[
              { id: 'all', label: 'All Stations' },
              { id: 'kitchen', label: 'Kitchen' },
              { id: 'grill', label: 'Grill & Fryer' },
              { id: 'bar', label: 'Bar & Drinks' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStation(st.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedStation === st.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            aria-label={soundEnabled ? 'Mute Kitchen Chime' : 'Enable Kitchen Chime'}
            title={soundEnabled ? 'Kitchen Chime ON' : 'Kitchen Chime MUTED'}
            className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
              soundEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 3-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* COLUMN 1: NEW / PENDING */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b-2 border-amber-500">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                New Tickets ({pendingTickets.length})
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">To Prepare</span>
          </div>

          <div className="space-y-3">
            {pendingTickets.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-slate-300 text-center text-slate-400 text-xs">
                No new tickets in this station
              </div>
            ) : (
              pendingTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white rounded-xl border-2 border-amber-300 shadow-sm p-4 space-y-3"
                >
                  {/* Ticket Header */}
                  <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                    <div>
                      <div className="text-base font-extrabold text-slate-900">
                        Order #{ticket.orderNumber}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center space-x-1.5 mt-0.5">
                        <span className="capitalize font-semibold text-slate-700">
                          {ticket.orderType.replace('_', ' ')}
                        </span>
                        {ticket.tableLabel && (
                          <span className="bg-slate-100 font-bold text-slate-800 px-1.5 py-0.2 rounded">
                            {ticket.tableLabel}
                          </span>
                        )}
                        <span className="capitalize text-teal-700 font-bold px-1.5 py-0.2 rounded bg-teal-50">
                          {ticket.station}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${getAgeSeverity(
                        ticket.createdAt
                      )}`}
                    >
                      {formatDuration(ticket.createdAt)} ago
                    </span>
                  </div>

                  {/* Items list */}
                  <div className="space-y-2">
                    {ticket.items.map((item, idx) => (
                      <div key={idx} className="text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-slate-900 text-sm">
                            {item.quantity}x
                          </span>
                          <span className="font-bold text-slate-800 text-sm">{item.name}</span>
                        </div>
                        {item.modifiers.length > 0 && (
                          <div className="text-[11px] text-teal-700 font-semibold pl-6">
                            + {item.modifiers.join(', ')}
                          </div>
                        )}
                        {item.notes && (
                          <div className="text-[11px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded mt-0.5 pl-6">
                            Note: {item.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleStatusChange(ticket.id, 'preparing')}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all active:scale-[0.98]"
                  >
                    <Flame className="w-4 h-4 text-slate-950" />
                    <span>Start Cooking</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 2: IN PREPARATION */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b-2 border-blue-500">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Cooking Now ({preparingTickets.length})
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">In Progress</span>
          </div>

          <div className="space-y-3">
            {preparingTickets.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-slate-300 text-center text-slate-400 text-xs">
                No orders currently in preparation
              </div>
            ) : (
              preparingTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white rounded-xl border border-blue-200 shadow-sm p-4 space-y-3"
                >
                  <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                    <div>
                      <div className="text-base font-extrabold text-slate-900">
                        Order #{ticket.orderNumber}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center space-x-1.5 mt-0.5">
                        <span className="capitalize font-semibold text-slate-700">
                          {ticket.orderType.replace('_', ' ')}
                        </span>
                        {ticket.tableLabel && (
                          <span className="bg-slate-100 font-bold text-slate-800 px-1.5 py-0.2 rounded">
                            {ticket.tableLabel}
                          </span>
                        )}
                        <span className="capitalize text-blue-700 font-bold px-1.5 py-0.2 rounded bg-blue-50">
                          {ticket.station}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${getAgeSeverity(
                        ticket.createdAt
                      )}`}
                    >
                      {formatDuration(ticket.createdAt)} ago
                    </span>
                  </div>

                  <div className="space-y-2">
                    {ticket.items.map((item, idx) => (
                      <div key={idx} className="text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-slate-900 text-sm">
                            {item.quantity}x
                          </span>
                          <span className="font-bold text-slate-800 text-sm">{item.name}</span>
                        </div>
                        {item.modifiers.length > 0 && (
                          <div className="text-[11px] text-teal-700 font-semibold pl-6">
                            + {item.modifiers.join(', ')}
                          </div>
                        )}
                        {item.notes && (
                          <div className="text-[11px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded mt-0.5 pl-6">
                            Note: {item.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleStatusChange(ticket.id, 'ready')}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all active:scale-[0.98]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark Dish Ready</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 3: READY FOR PICKUP */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b-2 border-emerald-500">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Ready for Pickup ({readyTickets.length})
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">Ready to Serve</span>
          </div>

          <div className="space-y-3">
            {readyTickets.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-slate-300 text-center text-slate-400 text-xs">
                No orders waiting for pickup
              </div>
            ) : (
              readyTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-emerald-50/50 rounded-xl border-2 border-emerald-400 shadow-sm p-4 space-y-3"
                >
                  <div className="flex justify-between items-start border-b border-emerald-100 pb-2">
                    <div>
                      <div className="text-base font-extrabold text-emerald-950">
                        Order #{ticket.orderNumber}
                      </div>
                      <div className="text-xs text-emerald-800 flex items-center space-x-1.5 mt-0.5">
                        <span className="capitalize font-semibold">
                          {ticket.orderType.replace('_', ' ')}
                        </span>
                        {ticket.tableLabel && (
                          <span className="bg-white font-bold text-slate-900 px-1.5 py-0.2 rounded border border-emerald-200">
                            {ticket.tableLabel}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      READY
                    </span>
                  </div>

                  <div className="space-y-1">
                    {ticket.items.map((item, idx) => (
                      <div key={idx} className="text-xs font-semibold text-slate-800">
                        {item.quantity}x {item.name}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleStatusChange(ticket.id, 'served')}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all active:scale-[0.98]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Bump / Hand to Waiter</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

