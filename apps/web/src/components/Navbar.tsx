'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePosStore } from '@/lib/store';
import { OrdrivaLogo } from '@/components/OrdrivaLogo';
import { UserRole } from '@/types';
import {
  MapPin,
  Wifi,
  WifiOff,
  ShoppingBag,
  ChefHat,
  ChevronDown,
  QrCode,
  Check,
  Shield,
  ShieldCheck,
  Settings,
  BarChart3,
  Store,
  Sparkles,
} from 'lucide-react';

const getRoleBadgeStyle = (role: UserRole) => {
  switch (role) {
    case 'admin':
      return {
        badge: 'bg-purple-950/80 text-[#A78BFA] border-purple-500/40',
        avatarBg: 'bg-gradient-to-br from-purple-500 to-indigo-700 text-white shadow-purple-500/30',
        label: 'Administrator',
      };
    case 'manager':
      return {
        badge: 'bg-blue-950/80 text-[#60A5FA] border-[#3B82F6]/50',
        avatarBg: 'bg-gradient-to-br from-[#3B82F6] to-blue-700 text-white shadow-blue-500/30',
        label: 'Branch Manager',
      };
    case 'cashier':
      return {
        badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
        avatarBg: 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-emerald-500/30',
        label: 'Cashier / Billing',
      };
    case 'waiter':
      return {
        badge: 'bg-sky-950/80 text-sky-300 border-sky-500/40',
        avatarBg: 'bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-sky-500/30',
        label: 'Captain / Waiter',
      };
    case 'kitchen':
      return {
        badge: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
        avatarBg: 'bg-gradient-to-br from-amber-500 to-orange-700 text-white shadow-amber-500/30',
        label: 'Chef / KDS',
      };
    case 'inventory':
      return {
        badge: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40',
        avatarBg: 'bg-gradient-to-br from-indigo-500 to-purple-700 text-white shadow-indigo-500/30',
        label: 'Stock & Inventory',
      };
  }
};

export function Navbar() {
  const pathname = usePathname();
  const {
    currentUser,
    setCurrentUser,
    availableUsers,
    currentBranch,
    setCurrentBranch,
    availableBranches,
    isOnline,
    kitchenTickets,
    cart,
  } = usePosStore();

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const branchDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserDropdownOpen(false);
      }
      if (
        branchDropdownRef.current &&
        !branchDropdownRef.current.contains(event.target as Node)
      ) {
        setIsBranchDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isCustomerPage = pathname?.startsWith('/order');

  // Customer Dine-In Header
  if (isCustomerPage) {
    return (
      <header className="h-16 bg-[#0B1120] text-white flex items-center justify-between px-4 lg:px-8 z-30 shadow-md border-b border-slate-800">
        {/* Brand & Customer Tag */}
        <div className="flex items-center space-x-3">
          <Link href="/order" className="flex items-center hover:opacity-95 transition-opacity">
            <OrdrivaLogo variant="full" size={42} />
          </Link>
          <span className="hidden sm:inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-950/80 text-[#60A5FA] border border-[#3B82F6]/40">
            <Sparkles className="w-3 h-3 text-[#A78BFA]" />
            <span>Digital Dining Menu</span>
          </span>
        </div>

        {/* Middle: Restaurant Branch Info */}
        <div className="text-center hidden md:block">
          <div className="text-xs font-bold text-slate-100">{currentBranch.name}</div>
          <div className="text-[10px] text-[#60A5FA] font-medium tracking-wide">
            Contactless Table Ordering • Instant KOT Dispatch
          </div>
        </div>

        {/* Right: Switch to Staff / Admin POS */}
        <div className="flex items-center space-x-3">
          <Link
            href="/"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700 transition-all"
          >
            <span>Staff Portal</span>
            <span className="text-[#60A5FA] font-bold">&rarr;</span>
          </Link>
        </div>
      </header>
    );
  }

  const pendingTickets = kitchenTickets.filter(
    (kt) => kt.status === 'pending' || kt.status === 'preparing'
  );
  const currentRoleStyle = getRoleBadgeStyle(currentUser.role);

  return (
    <header className="h-16 bg-gradient-to-r from-[#0B1120] via-[#0F172A] to-[#0B1120] text-white flex items-center justify-between px-4 lg:px-6 z-30 shadow-lg border-b border-[#3B82F6]/30 select-none">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-3">
        <Link href="/" className="flex items-center hover:opacity-95 transition-opacity">
          <OrdrivaLogo variant="full" size={42} />
        </Link>
      </div>

      {/* Middle: Custom Branch Selector & Sync State */}
      <div className="flex items-center space-x-3">
        {/* Custom Branch Selector */}
        <div className="relative hidden md:block" ref={branchDropdownRef}>
          <button
            onClick={() => {
              setIsBranchDropdownOpen(!isBranchDropdownOpen);
              setIsUserDropdownOpen(false);
            }}
            className={`flex items-center space-x-2 bg-slate-900/90 hover:bg-slate-800 border transition-all rounded-xl px-3 py-1.5 text-xs text-slate-200 shadow-sm ${
              isBranchDropdownOpen
                ? 'border-[#3B82F6] ring-2 ring-[#3B82F6]/20'
                : 'border-[#3B82F6]/30 hover:border-[#60A5FA]/60'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span className="font-semibold text-slate-100 max-w-[200px] truncate">
              {currentBranch.name}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isBranchDropdownOpen ? 'rotate-180 text-[#60A5FA]' : ''
              }`}
            />
          </button>

          {/* Branch Dropdown Popover */}
          {isBranchDropdownOpen && (
            <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-[#0F172A] border border-[#3B82F6]/40 shadow-2xl backdrop-blur-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase border-b border-slate-800">
                Operating Branch
              </div>
              <div className="py-1 space-y-1">
                {availableBranches.map((br) => {
                  const isSelected = br.id === currentBranch.id;
                  return (
                    <button
                      key={br.id}
                      onClick={() => {
                        setCurrentBranch(br);
                        setIsBranchDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'bg-[#3B82F6]/20 border border-[#3B82F6]/50 text-white'
                          : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isSelected
                              ? 'bg-[#3B82F6] text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <Store className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold leading-tight">{br.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{br.address}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#60A5FA]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Online / Offline Sync Badge */}
        <div
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
            isOnline
              ? 'bg-blue-950/60 text-[#60A5FA] border-[#3B82F6]/40 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
              : 'bg-amber-950/60 text-amber-300 border-amber-500/40 animate-pulse'
          }`}
        >
          {isOnline ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden sm:inline text-[11px] font-bold">Online / Sync</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-amber-400" />
              <span className="text-[11px] font-bold">Offline Mode</span>
            </>
          )}
        </div>
      </div>

      {/* Right Controls: Staff Switcher & Quick Actions */}
      <div className="flex items-center space-x-2.5">
        {/* Live Kitchen Badge shortcut */}
        <Link
          href="/kitchen"
          className="relative p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white transition-all border border-slate-700/60"
          title="Kitchen Display System (KDS)"
        >
          <ChefHat className="w-4 h-4 text-[#A78BFA]" />
          {pendingTickets.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-sm">
              {pendingTickets.length}
            </span>
          )}
        </Link>

        {/* Customer Menu Link */}
        <Link
          href="/order"
          target="_blank"
          className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-[#60A5FA] hover:text-white text-xs font-bold border border-[#3B82F6]/30 hover:border-[#60A5FA]/60 transition-all"
          title="Open Customer QR Ordering Menu in New Tab"
        >
          <QrCode className="w-3.5 h-3.5 text-[#60A5FA]" />
          <span>QR Menu</span>
        </Link>

        {/* Quick POS Terminal Button */}
        <Link
          href="/pos"
          className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white text-xs font-extrabold shadow-[0_0_15px_rgba(59,130,246,0.35)] transition-all transform active:scale-95"
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="hidden md:inline">Open POS</span>
          {cart.length > 0 && (
            <span className="bg-white text-[#1D4ED8] text-[10px] px-1.5 py-0.2 rounded-full font-black ml-1 shadow-xs">
              {cart.reduce((s, c) => s + c.quantity, 0)}
            </span>
          )}
        </Link>

        {/* Dedicated Admin Account Profile */}
        <div className="relative pl-1 border-l border-slate-800" ref={userDropdownRef}>
          <button
            onClick={() => {
              setIsUserDropdownOpen(!isUserDropdownOpen);
              setIsBranchDropdownOpen(false);
            }}
            className={`flex items-center space-x-2.5 p-1.5 pr-2.5 rounded-xl transition-all ${
              isUserDropdownOpen
                ? 'bg-slate-800/90 ring-2 ring-[#A78BFA]/40 shadow-sm'
                : 'hover:bg-slate-800/60'
            }`}
            aria-label="Admin account menu"
          >
            {/* Admin Avatar */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-md uppercase bg-gradient-to-br from-[#A78BFA] via-purple-600 to-indigo-800 text-white">
              V
            </div>

            {/* Admin Info Label */}
            <div className="hidden lg:block text-left leading-tight">
              <div className="text-xs font-bold text-white tracking-tight flex items-center space-x-1">
                <span>Vikram Malhotra</span>
                <Shield className="w-3 h-3 text-[#A78BFA]" />
              </div>
              <div className="text-[10px] font-extrabold text-[#A78BFA] tracking-wide uppercase">
                Administrator
              </div>
            </div>

            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isUserDropdownOpen ? 'rotate-180 text-[#A78BFA]' : ''
              }`}
            />
          </button>

          {/* Admin Dedicated Console Popover */}
          {isUserDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#0F172A] border border-[#A78BFA]/40 shadow-2xl backdrop-blur-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Admin Profile Header */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-900 border border-[#A78BFA]/30 mb-3 shadow-inner">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-base uppercase bg-gradient-to-br from-[#A78BFA] via-purple-600 to-indigo-800 text-white shadow-lg shadow-purple-500/25">
                    V
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-extrabold text-white truncate flex items-center space-x-1.5">
                      <span>Vikram Malhotra</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">admin@ordriva.com</div>
                    <div className="mt-1.5 inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-purple-950/90 text-[#A78BFA] border border-[#A78BFA]/40 tracking-wider">
                      <ShieldCheck className="w-3 h-3 text-[#A78BFA]" />
                      <span>Root Administrator</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Privileges Notice */}
              <div className="px-2 pb-2 text-[11px] text-slate-400 leading-snug">
                Operating with <strong className="text-white font-bold">Full Admin Privileges</strong>. Full access to restaurant operations, KDS, POS, GST configuration, and financial reports.
              </div>

              {/* Admin Quick Action Shortcuts */}
              <div className="space-y-1 pt-1.5 border-t border-slate-800">
                <div className="px-2 py-1 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                  Admin System Controls
                </div>

                <Link
                  href="/tables/qr"
                  onClick={() => setIsUserDropdownOpen(false)}
                  className="flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all group"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#60A5FA] group-hover:bg-[#3B82F6] group-hover:text-white transition-colors">
                      <QrCode className="w-3.5 h-3.5" />
                    </div>
                    <span>Print Table QR Stands</span>
                  </div>
                  <span className="text-[10px] text-slate-500 group-hover:text-[#60A5FA]">&rarr;</span>
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setIsUserDropdownOpen(false)}
                  className="flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all group"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#3B82F6] group-hover:bg-[#3B82F6] group-hover:text-white transition-colors">
                      <Settings className="w-3.5 h-3.5" />
                    </div>
                    <span>Branch &amp; GST Configuration</span>
                  </div>
                  <span className="text-[10px] text-slate-500 group-hover:text-[#60A5FA]">&rarr;</span>
                </Link>

                <Link
                  href="/audit"
                  onClick={() => setIsUserDropdownOpen(false)}
                  className="flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all group"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[#A78BFA] group-hover:bg-[#A78BFA] group-hover:text-slate-950 transition-colors">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <span>Security &amp; Audit Trail</span>
                  </div>
                  <span className="text-[10px] text-slate-500 group-hover:text-[#60A5FA]">&rarr;</span>
                </Link>

                <Link
                  href="/reports"
                  onClick={() => setIsUserDropdownOpen(false)}
                  className="flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all group"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                      <BarChart3 className="w-3.5 h-3.5" />
                    </div>
                    <span>Financials &amp; Tax Ledgers</span>
                  </div>
                  <span className="text-[10px] text-slate-500 group-hover:text-[#60A5FA]">&rarr;</span>
                </Link>
              </div>

              {/* Security Footer */}
              <div className="mt-2.5 pt-2 border-t border-slate-800 px-2 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center space-x-1">
                  <Shield className="w-3 h-3 text-[#A78BFA]" />
                  <span>Admin Console</span>
                </span>
                <span className="text-emerald-400 font-bold">Secure Root Access</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
