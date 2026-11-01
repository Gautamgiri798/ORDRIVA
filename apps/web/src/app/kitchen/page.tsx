'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePosStore } from '@/lib/store';
import { KitchenTicket, KitchenStatus } from '@/types';
import { playChimeSound } from '@/lib/soundAlert';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Coffee,
  Utensils,
  Filter,
  Check,
  ArrowRight,
} from 'lucide-react';

export default function KitchenPage() {
  const { kitchenTickets, updateKitchenTicketStatus, isSocketConnected } = usePosStore();

  const [activeStation, setActiveStation] = useState<'all' | 'kitchen' | 'grill' | 'bar'>('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState<'active' | 'ready' | 'all'>('active');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [now, setNow] = useState<number>(Date.now());

  // Dynamic seconds counter for kitchen elapsed timers
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return kitchenTickets.filter((ticket) => {
      const matchStation = activeStation === 'all' || ticket.station === activeStation;

      let matchStatus = true;
      if (activeStatusFilter === 'active') {
        matchStatus = ticket.status === 'pending' || ticket.status === 'preparing';
      } else if (activeStatusFilter === 'ready') {
        matchStatus = ticket.status === 'ready';
      }

      return matchStation && matchStatus;
    });
  }, [kitchenTickets, activeStation, activeStatusFilter]);

  // Status counts for KDS header
  const counts = useMemo(() => {
    const pending = kitchenTickets.filter((t) => t.status === 'pending').length;
    const preparing = kitchenTickets.filter((t) => t.status === 'preparing').length;
    const ready = kitchenTickets.filter((t) => t.status === 'ready').length;
    const served = kitchenTickets.filter((t) => t.status === 'served').length;
    return { pending, preparing, ready, served, totalActive: pending + preparing };
  }, [kitchenTickets]);

  const handleStatusChange = (ticketId: string, nextStatus: KitchenStatus) => {
    updateKitchenTicketStatus(ticketId, nextStatus);
    if (soundEnabled && nextStatus === 'ready') {
      playChimeSound('kitchen_ready');
    }
  };

  const getElapsedTimeInfo = (createdAt: string) => {
    const createdTime = new Date(createdAt).getTime();
    const elapsedSeconds = Math.max(0, Math.floor((now - createdTime) / 1000));
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    if (mins >= 15) {
      return {
        formatted: timeFormatted,
        isCritical: true,
        isWarning: false,
        bgClass: 'bg-rose-500 text-white border-rose-600 animate-pulse',
        tag: 'CRITICAL DELAY',
      };
    } else if (mins >= 10) {
      return {
        formatted: timeFormatted,
        isCritical: false,
        isWarning: true,
        bgClass: 'bg-amber-500 text-slate-950 font-black border-amber-600',
        tag: 'RUSH ORDER',
      };
    }
    return {
      formatted: timeFormatted,
      isCritical: false,
      isWarning: false,
      bgClass: 'bg-slate-800 text-slate-300 border-slate-700',
      tag: 'ON TIME',
    };
  };

  return (
    <div className="min-h-full bg-[#0B1120] text-slate-100 flex flex-col font-sans select-none">
      {/* KDS Header Bar */}
      <header className="bg-[#0F172A] border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20 shadow-lg">
        {/* Left: Branding & Status */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 shadow-md shadow-orange-500/20 font-black">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-black tracking-wide text-white uppercase">
                Kitchen Display System (KDS)
              </h1>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                  isSocketConnected
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60'
                    : 'bg-amber-950/80 text-amber-400 border-amber-700/60'
                }`}
              >
                {isSocketConnected ? '● LIVE SYNC' : '● LOCAL QUEUE'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Bump Bar & Real-time Course Dispatch
            </p>
          </div>
        </div>

        {/* Center: Station Filters */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveStation('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeStation === 'all'
                ? 'bg-[#3B82F6] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Stations ({counts.totalActive})
          </button>
          <button
            onClick={() => setActiveStation('kitchen')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
              activeStation === 'kitchen'
                ? 'bg-[#3B82F6] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Kitchen</span>
          </button>
          <button
            onClick={() => setActiveStation('grill')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
              activeStation === 'grill'
                ? 'bg-[#3B82F6] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>Grill</span>
          </button>
          <button
            onClick={() => setActiveStation('bar')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
              activeStation === 'bar'
                ? 'bg-[#3B82F6] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Coffee className="w-3.5 h-3.5 text-sky-400" />
            <span>Bar</span>
          </button>
        </div>

        {/* Right: Sound Alert & Filter Controls */}
        <div className="flex items-center space-x-2">
          {/* Status View Mode */}
          <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveStatusFilter('active')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeStatusFilter === 'active'
                  ? 'bg-amber-500/20 text-amber-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cooking ({counts.totalActive})
            </button>
            <button
              onClick={() => setActiveStatusFilter('ready')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeStatusFilter === 'ready'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ready ({counts.ready})
            </button>
            <button
              onClick={() => setActiveStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeStatusFilter === 'all'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute Kitchen Chimes' : 'Enable Kitchen Chimes'}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center space-x-1 transition-all ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-rose-950/60 border-rose-800/80 text-rose-300'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>
        </div>
      </header>

      {/* Main KDS Cards Flow Area */}
      <main className="flex-1 p-4 overflow-y-auto">
        {filteredTickets.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-300">All Orders Clear!</h2>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                No active kitchen tickets for{' '}
                <span className="font-semibold text-slate-400">{activeStation.toUpperCase()}</span>.
                New QR and POS orders will appear here automatically with audible chimes.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5">
            {filteredTickets.map((ticket) => {
              const timerInfo = getElapsedTimeInfo(ticket.createdAt);
              const isPreparing = ticket.status === 'preparing';
              const isReady = ticket.status === 'ready';

              return (
                <div
                  key={ticket.id}
                  className={`flex flex-col justify-between rounded-2xl border transition-all shadow-md overflow-hidden ${
                    isReady
                      ? 'bg-emerald-950/20 border-emerald-600/60 shadow-emerald-950/20'
                      : isPreparing
                      ? 'bg-[#131E35] border-blue-500/50 shadow-blue-950/30'
                      : 'bg-[#111C34] border-slate-800 shadow-black/40'
                  }`}
                >
                  {/* Ticket Header */}
                  <div
                    className={`p-3 border-b flex items-center justify-between ${
                      isReady
                        ? 'bg-emerald-900/30 border-emerald-700/50'
                        : isPreparing
                        ? 'bg-blue-950/40 border-blue-800/40'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black px-2 py-0.5 rounded-md bg-white/10 text-white tracking-wider">
                        #{ticket.orderNumber}
                      </span>
                      <span className="text-sm font-black text-amber-300">
                        {ticket.tableLabel || (ticket.orderType === 'takeaway' ? 'Takeaway' : 'Order')}
                      </span>
                    </div>

                    {/* Live Timer Pill */}
                    <div
                      className={`px-2 py-0.5 rounded-lg text-xs font-mono font-black flex items-center space-x-1 border ${timerInfo.bgClass}`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{timerInfo.formatted}</span>
                    </div>
                  </div>

                  {/* Station & Status Badge Subheader */}
                  <div className="px-3 py-1.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between text-[11px]">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-slate-400 capitalize">{ticket.station} Station</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400 capitalize">{ticket.orderType.replace('_', ' ')}</span>
                    </div>
                    <span
                      className={`font-black uppercase text-[10px] px-1.5 py-0.2 rounded ${
                        isReady
                          ? 'bg-emerald-500 text-slate-950'
                          : isPreparing
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="p-3.5 space-y-2.5 flex-1 min-h-[140px] max-h-[320px] overflow-y-auto">
                    {ticket.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start space-x-2.5 border-b border-slate-800/60 pb-2 last:border-b-0 last:pb-0"
                      >
                        <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center text-xs font-black shrink-0">
                          {item.quantity}×
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white leading-snug">{item.name}</p>
                          {item.modifiers && item.modifiers.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.modifiers.map((mod, mi) => (
                                <span
                                  key={mi}
                                  className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700"
                                >
                                  +{mod}
                                </span>
                              ))}
                            </div>
                          )}
                          {item.notes && (
                            <p className="text-[11px] font-bold text-amber-400 mt-1 bg-amber-950/40 border border-amber-800/40 rounded px-1.5 py-0.5 inline-block">
                              ⚡ Note: {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}

                    {ticket.orderNotes && (
                      <div className="mt-2 p-2 rounded-lg bg-orange-950/30 border border-orange-800/40 text-[11px] text-orange-200">
                        <span className="font-bold">Order Note:</span> {ticket.orderNotes}
                      </div>
                    )}
                  </div>

                  {/* Bump Bar Action Buttons */}
                  <div className="p-3 bg-slate-900/90 border-t border-slate-800/80 grid grid-cols-1 gap-2">
                    {ticket.status === 'pending' && (
                      <button
                        onClick={() => handleStatusChange(ticket.id, 'preparing')}
                        className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-blue-600/30 active:scale-98 transition-all"
                      >
                        <ChefHat className="w-4 h-4" />
                        <span>Start Cooking</span>
                      </button>
                    )}

                    {ticket.status === 'preparing' && (
                      <button
                        onClick={() => handleStatusChange(ticket.id, 'ready')}
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/30 active:scale-98 transition-all"
                      >
                        <Check className="w-4 h-4" />
                        <span>Bump • Ready to Serve</span>
                      </button>
                    )}

                    {ticket.status === 'ready' && (
                      <button
                        onClick={() => handleStatusChange(ticket.id, 'served')}
                        className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center space-x-1.5 border border-slate-700 active:scale-98 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Mark Served & Clear</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
