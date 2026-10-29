'use client';

import React from 'react';
import Image from 'next/image';

interface LogoProps {
  variant?: 'full' | 'compact' | 'mark' | 'receipt' | 'hero';
  className?: string;
  size?: number; // base height in px
}

export function OrdrivaLogo({ variant = 'full', className = '', size = 40 }: LogoProps) {
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
          <circle cx="50" cy="18" r="5" fill="#000" />
          <path d="M 47 22 L 53 22 L 51 26 L 49 26 Z" fill="#000" />
          <path
            d="M 18 68 C 18 42, 32 26, 50 26 C 68 26, 82 42, 82 68 Z"
            fill="none"
            stroke="#000"
            strokeWidth="5"
          />
          <ellipse
            cx="47"
            cy="56"
            rx="14"
            ry="17"
            fill="none"
            stroke="#000"
            strokeWidth="4"
            transform="rotate(-12 47 56)"
          />
          <path d="M 35 64 Q 50 59, 70 36" fill="none" stroke="#000" strokeWidth="4" />
          <path d="M 70 36 L 60 37 L 66 43 Z" fill="#000" />
          <rect x="12" y="69" width="76" height="5" rx="2.5" fill="#000" />
          <rect x="16" y="77" width="68" height="4" rx="2" fill="#000" />
        </svg>
        <span className="font-extrabold text-base tracking-widest text-black mt-1 font-serif">ORDRIVA</span>
        <span className="text-[9px] tracking-wider text-black uppercase font-bold">Restaurant Management</span>
      </div>
    );
  }

  // 2. Mark Only (Precision Vector Cloche Icon)
  if (variant === 'mark') {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src="/ordriva-mark.svg"
          alt="ORDRIVA Cloche Mark"
          width={size}
          height={size}
          className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
          priority
        />
      </div>
    );
  }

  // 3. Compact Variant (Emblem + Wordmark)
  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-2.5 shrink-0 ${className}`}>
        <div
          className="relative shrink-0 flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <Image
            src="/ordriva-mark.svg"
            alt="ORDRIVA Mark"
            width={size}
            height={size}
            className="w-full h-full object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
            priority
          />
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="font-serif font-black tracking-widest text-lg text-amber-200 drop-shadow-sm">
            ORDRIVA
          </span>
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-950/90 text-[#60A5FA] border border-[#3B82F6]/50 shadow-sm tracking-wider">
            POS 2.0
          </span>
        </div>
      </div>
    );
  }

  // 4. Hero / Large Vertical Lockup Variant
  if (variant === 'hero') {
    return (
      <div className={`flex flex-col items-center justify-center text-center ${className}`}>
        <div className="relative" style={{ width: size * 3.5, height: size * 2.2 }}>
          <Image
            src="/ordriva-logo.svg"
            alt="ORDRIVA Restaurant System"
            width={size * 3.5}
            height={size * 2.2}
            className="w-full h-full object-contain filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
            priority
          />
        </div>
      </div>
    );
  }

  // 5. Full Lockup Variant (Default - Ultra-sharp Precision Vector Brand for Navbar & Headers)
  // Aspect ratio is 540 / 100 = 5.4
  const horizontalWidth = Math.round(size * 5.4);

  return (
    <div className={`flex items-center shrink-0 select-none ${className}`}>
      <div
        className="relative shrink-0 flex items-center"
        style={{ height: size, width: horizontalWidth }}
      >
        <Image
          src="/ordriva-logo.svg"
          alt="ORDRIVA - Restaurant POS"
          width={horizontalWidth}
          height={size}
          className="h-full w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
          priority
        />
      </div>
    </div>
  );
}
