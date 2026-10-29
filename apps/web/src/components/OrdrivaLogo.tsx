'use client';

import React from 'react';

interface LogoProps {
  variant?: 'full' | 'compact' | 'mark' | 'receipt';
  className?: string;
  size?: number; // base height in px
}

export function OrdrivaLogo({ variant = 'compact', className = '', size = 36 }: LogoProps) {
  // 1. Receipt / Monochrome Variant (for thermal printer 80mm bills)
  if (variant === 'receipt') {
    return (
      <div className={`flex flex-col items-center justify-center text-center ${className}`}>
        <svg
          width={size * 1.2}
          height={size * 1.2}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 25 65 C 25 40, 42 28, 50 28 C 58 28, 75 40, 75 65 Z"
            fill="#000"
          />
          <circle cx="50" cy="22" r="5" fill="#000" />
          <rect x="20" y="65" width="60" height="5" rx="2.5" fill="#000" />
          <path d="M 15 74 L 85 74 C 80 80, 68 82, 50 82 C 32 82, 20 80, 15 74 Z" fill="#000" />
          <path d="M 40 16 C 38 12, 42 8, 40 4" stroke="#000" strokeWidth="2" strokeLinecap="round" />
          <path d="M 50 14 C 48 10, 52 7, 50 4" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 60 16 C 58 12, 62 8, 60 4" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="font-extrabold text-base tracking-widest text-black mt-1">ORDRIVA</span>
        <span className="text-[9px] tracking-wider text-black uppercase">Restaurant OS</span>
      </div>
    );
  }

  // 2. Mark Only (Icon / Avatar)
  if (variant === 'mark') {
    return (
      <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          <defs>
            <linearGradient id="markGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2DD4BF" />
              <stop offset="50%" stopColor="#0F766E" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <linearGradient id="markDome" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14B8A6" />
              <stop offset="100%" stopColor="#0F766E" />
            </linearGradient>
            <linearGradient id="markGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>

          <rect x="4" y="4" width="112" height="112" rx="30" fill="#172554" stroke="url(#markGrad)" strokeWidth="3.5" />
          <path d="M 30 74 C 30 48, 50 36, 60 36 C 70 36, 90 48, 90 74 Z" fill="url(#markDome)" />
          <circle cx="60" cy="30" r="6" fill="url(#markGold)" />
          <rect x="25" y="74" width="70" height="6" rx="3" fill="url(#markGold)" />
          <path d="M 20 85 L 100 85 C 95 92, 80 94, 60 94 C 40 94, 25 92, 20 85 Z" fill="url(#markDome)" />
          <path d="M 47 24 C 45 19, 49 14, 47 10" stroke="#2DD4BF" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 60 21 C 58 16, 62 12, 60 8" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" />
          <path d="M 73 24 C 71 19, 75 14, 73 10" stroke="#2DD4BF" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // 3. Compact Variant (Icon + ORDRIVA + POS badge)
  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-2.5 ${className}`}>
        {/* Emblem */}
        <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
          <svg
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-sm"
          >
            <defs>
              <linearGradient id="cptGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2DD4BF" />
                <stop offset="50%" stopColor="#0F766E" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
              <linearGradient id="cptDome" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14B8A6" />
                <stop offset="100%" stopColor="#0F766E" />
              </linearGradient>
              <linearGradient id="cptGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
            </defs>

            <rect x="4" y="4" width="112" height="112" rx="28" fill="#0F172A" stroke="url(#cptGrad)" strokeWidth="4" />
            <path d="M 30 74 C 30 48, 50 36, 60 36 C 70 36, 90 48, 90 74 Z" fill="url(#cptDome)" />
            <circle cx="60" cy="30" r="6" fill="url(#cptGold)" />
            <rect x="25" y="74" width="70" height="6" rx="3" fill="url(#cptGold)" />
            <path d="M 20 85 L 100 85 C 95 92, 80 94, 60 94 C 40 94, 25 92, 20 85 Z" fill="url(#cptDome)" />
            <path d="M 47 24 C 45 19, 49 14, 47 10" stroke="#2DD4BF" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 60 21 C 58 16, 62 12, 60 8" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" />
            <path d="M 73 24 C 71 19, 75 14, 73 10" stroke="#2DD4BF" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Wordmark */}
        <div className="flex items-center space-x-1.5">
          <span className="font-black tracking-wider text-lg text-white">
            ORDR<span className="text-amber-400">I</span>VA
          </span>
          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-teal-900/80 text-teal-300 border border-teal-500/30 tracking-wider">
            POS 2.0
          </span>
        </div>
      </div>
    );
  }

  // 4. Full Lockup Variant (with Tagline)
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Emblem */}
      <div className="relative shrink-0 flex items-center justify-center" style={{ width: size * 1.25, height: size * 1.25 }}>
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          <defs>
            <linearGradient id="fullGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2DD4BF" />
              <stop offset="50%" stopColor="#0F766E" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <linearGradient id="fullDome" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14B8A6" />
              <stop offset="100%" stopColor="#0F766E" />
            </linearGradient>
            <linearGradient id="fullGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>

          <rect x="4" y="4" width="112" height="112" rx="28" fill="#172554" stroke="url(#fullGrad)" strokeWidth="3.5" />
          <path d="M 30 74 C 30 48, 50 36, 60 36 C 70 36, 90 48, 90 74 Z" fill="url(#fullDome)" />
          <circle cx="60" cy="30" r="6" fill="url(#fullGold)" />
          <rect x="25" y="74" width="70" height="6" rx="3" fill="url(#fullGold)" />
          <path d="M 20 85 L 100 85 C 95 92, 80 94, 60 94 C 40 94, 25 92, 20 85 Z" fill="url(#fullDome)" />
          <path d="M 47 24 C 45 19, 49 14, 47 10" stroke="#2DD4BF" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 60 21 C 58 16, 62 12, 60 8" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" />
          <path d="M 73 24 C 71 19, 75 14, 73 10" stroke="#2DD4BF" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Typography */}
      <div className="flex flex-col">
        <div className="flex items-center space-x-2">
          <span className="font-black text-xl tracking-wider text-white">
            ORDR<span className="text-amber-400">I</span>VA
          </span>
          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40">
            PRO
          </span>
        </div>
        <span className="text-[10px] font-semibold text-teal-300 tracking-widest uppercase mt-0.5">
          Restaurant OS &amp; POS
        </span>
      </div>
    </div>
  );
}
