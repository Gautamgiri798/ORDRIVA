'use client';

import React from 'react';
import Image from 'next/image';

interface LogoProps {
  variant?: 'full' | 'compact' | 'mark' | 'receipt' | 'hero';
  className?: string;
  size?: number; // base height in px
}

export function OrdrivaLogo({ variant = 'full', className = '', size = 36 }: LogoProps) {
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
        <span className="font-extrabold text-base tracking-widest text-black mt-1 font-serif">ORDRIVA</span>
        <span className="text-[9px] tracking-wider text-black uppercase">Restaurant OS</span>
      </div>
    );
  }

  // 2. Mark Only (Cloche Icon)
  if (variant === 'mark') {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src="/ordriva-mark-transparent.png"
          alt="ORDRIVA Cloche Mark"
          width={size}
          height={size}
          className="w-full h-full object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
          unoptimized
          priority
        />
      </div>
    );
  }

  // 3. Compact Variant (Emblem + Text)
  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-2 shrink-0 ${className}`}>
        <div
          className="relative shrink-0 flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <Image
            src="/ordriva-mark-transparent.png"
            alt="ORDRIVA Mark"
            width={size}
            height={size}
            className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
            unoptimized
            priority
          />
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="font-serif font-black tracking-widest text-lg text-amber-200">
            ORDRIVA
          </span>
          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-950/80 text-[#A78BFA] border border-[#A78BFA]/40 tracking-wider">
            POS 2.0
          </span>
        </div>
      </div>
    );
  }

  // 4. Hero / Vertical Lockup Variant
  if (variant === 'hero') {
    return (
      <div className={`flex flex-col items-center justify-center text-center ${className}`}>
        <div className="relative" style={{ width: size * 3, height: size * 2 }}>
          <Image
            src="/ordriva-logo-transparent.png"
            alt="ORDRIVA Restaurant System"
            width={size * 3}
            height={size * 2}
            className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
            unoptimized
            priority
          />
        </div>
      </div>
    );
  }

  // 5. Full Lockup Variant (Default - Seamless horizontal brand for Navbar & Headers)
  // Aspect ratio of the horizontal transparent logo is 1407 / 300 = 4.69
  const horizontalWidth = Math.round(size * 4.69);

  return (
    <div className={`flex items-center space-x-2 shrink-0 select-none ${className}`}>
      {/* Authentic Gold Cloche Emblem + Luxury ORDRIVA Typography */}
      <div
        className="relative shrink-0 flex items-center"
        style={{ height: size, width: horizontalWidth }}
      >
        <Image
          src="/ordriva-horizontal-transparent.png"
          alt="ORDRIVA - Restaurant POS"
          width={horizontalWidth}
          height={size}
          className="h-full w-auto object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
          unoptimized
          priority
        />
      </div>

      {/* Modern POS 2.0 Badge */}
      <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-blue-950/90 text-[#60A5FA] border border-[#3B82F6]/50 shadow-sm">
        POS 2.0
      </span>
    </div>
  );
}
