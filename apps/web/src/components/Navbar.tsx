'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePosStore } from '@/lib/store';
import { OrdrivaLogo } from '@/components/OrdrivaLogo';
import {
  MapPin,
  UserCheck,
  Wifi,
  WifiOff,
  ShoppingBag,
  Bell,
  ChefHat,
  ChevronDown,
} from 'lucide-react';

export function Navbar() {
  const {
    currentUser,
    setCurrentUser,
    availableUsers,
    currentBranch,
    setCurrentBranch,
    availableBranches,
    isOnline,
    kitchenTickets,
    cartCalculations,
    cart,
  } = usePosStore();

  const pendingTickets = kitchenTickets.filter((kt) => kt.status === 'pending' || kt.status === 'preparing');

  return (
    <header className="h-16 bg-[#172554] text-white flex items-center justify-between px-4 lg:px-6 z-30 shadow-md border-b border-slate-800">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-3">
        <Link href="/" className="flex items-center hover:opacity-95 transition-opacity">
          <OrdrivaLogo variant="full" size={32} />
        </Link>
      </div>

      {/* Middle: Branch Selector & Sync State */}
      <div className="flex items-center space-x-4">
        {/* Branch Selector */}
        <div className="hidden md:flex items-center space-x-2 bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs text-slate-200">
          <MapPin className="w-3.5 h-3.5 text-teal-400" />
          <select
            value={currentBranch.id}
            onChange={(e) => {
              const b = availableBranches.find((br) => br.id === e.target.value);
              if (b) setCurrentBranch(b);
            }}
            aria-label="Select Restaurant Branch"
            className="bg-transparent text-slate-200 focus:outline-none cursor-pointer pr-2 font-medium"
          >
            {availableBranches.map((br) => (
              <option key={br.id} value={br.id} className="bg-slate-900 text-white">
                {br.name}
              </option>
            ))}
          </select>
        </div>

        {/* Online / Offline Sync Badge */}
        <div
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            isOnline
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
              : 'bg-amber-950/60 text-amber-300 border-amber-500/30 animate-pulse'
          }`}
        >
          {isOnline ? (
            <>
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline">Online / Sync</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-amber-400" />
              <span>Offline Mode</span>
            </>
          )}
        </div>
      </div>

      {/* Right Controls: Role Switcher & Direct POS Link */}
      <div className="flex items-center space-x-3">
        {/* Live Kitchen Badge shortcut */}
        <Link
          href="/kitchen"
          className="relative p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
          title="Kitchen Display System"
        >
          <ChefHat className="w-5 h-5 text-amber-400" />
          {pendingTickets.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
              {pendingTickets.length}
            </span>
          )}
        </Link>

        {/* Quick POS Terminal Button */}
        <Link
          href="/pos"
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#0F766E] hover:bg-[#0D6861] text-white text-xs font-semibold shadow-sm transition-all"
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="hidden md:inline">Open POS</span>
          {cart.length > 0 && (
            <span className="bg-white text-teal-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
              {cart.reduce((s, c) => s + c.quantity, 0)}
            </span>
          )}
        </Link>

        {/* Role & User Switcher */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-700">
          <div className="w-8 h-8 rounded-full bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-teal-300 font-bold text-xs uppercase">
            {currentUser.name.charAt(0)}
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-white leading-tight">{currentUser.name}</div>
            <div className="text-[10px] text-teal-300 capitalize">{currentUser.role}</div>
          </div>
          <div className="relative">
            <select
              value={currentUser.id}
              onChange={(e) => {
                const u = availableUsers.find((usr) => usr.id === e.target.value);
                if (u) setCurrentUser(u);
              }}
              title="Switch Staff Role"
              aria-label="Switch Staff Role"
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
            >
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </header>
  );
}

