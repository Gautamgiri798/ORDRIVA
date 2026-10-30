'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePosStore } from '@/lib/store';
import { OrdrivaLogo } from '@/components/OrdrivaLogo';
import QRCode from 'qrcode';
import {
  QrCode,
  Printer,
  Download,
  Users,
  MapPin,
  ArrowLeft,
  Sparkles,
  Layers,
  Check,
  Smartphone,
  ShieldCheck,
  Zap,
  Wifi,
} from 'lucide-react';

export default function TableQrStandsAdminPage() {
  const { currentBranch, tables } = usePosStore();

  const [selectedTable, setSelectedTable] = useState<string>(
    tables.length > 0 ? tables[0].label : 'T-01'
  );
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [batchMode, setBatchMode] = useState<boolean>(false);
  const [batchQrs, setBatchQrs] = useState<{ [label: string]: string }>({});
  const [printTheme, setPrintTheme] = useState<'dark' | 'light'>('dark');
  const [customHost, setCustomHost] = useState<string>('');
  const [isLocalhost, setIsLocalhost] = useState<boolean>(false);

  const currentTableObj = tables.find((t) => t.label === selectedTable) || tables[0];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ordriva_custom_qr_host');
      if (saved) setCustomHost(saved);
      setIsLocalhost(
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '0.0.0.0'
      );
    }
  }, []);

  const handleCustomHostChange = (val: string) => {
    setCustomHost(val);
    if (typeof window !== 'undefined') {
      if (val.trim()) {
        localStorage.setItem('ordriva_custom_qr_host', val.trim());
      } else {
        localStorage.removeItem('ordriva_custom_qr_host');
      }
    }
  };

  const getBaseUrl = () => {
    if (customHost.trim()) {
      let host = customHost.trim();
      if (!host.startsWith('http://') && !host.startsWith('https://')) {
        host = `http://${host}`;
      }
      return host.replace(/\/$/, '');
    }
    return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  };

  // Generate QR for selected table
  useEffect(() => {
    const origin = getBaseUrl();
    const targetUrl = `${origin}/order?table=${encodeURIComponent(selectedTable)}`;

    QRCode.toDataURL(
      targetUrl,
      {
        width: 440,
        margin: 1,
        color: {
          dark: '#0B1120',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      },
      (err, url) => {
        if (!err && url) {
          setQrCodeDataUrl(url);
        }
      }
    );
  }, [selectedTable, customHost]);

  // Pre-generate QRs for all tables for Batch Printing
  useEffect(() => {
    const origin = getBaseUrl();
    const newBatchMap: { [label: string]: string } = {};

    let completed = 0;
    tables.forEach((tbl) => {
      const targetUrl = `${origin}/order?table=${encodeURIComponent(tbl.label)}`;
      QRCode.toDataURL(
        targetUrl,
        {
          width: 360,
          margin: 1,
          color: { dark: '#0B1120', light: '#FFFFFF' },
          errorCorrectionLevel: 'H',
        },
        (err, url) => {
          if (!err && url) {
            newBatchMap[tbl.label] = url;
          }
          completed++;
          if (completed === tables.length) {
            setBatchQrs(newBatchMap);
          }
        }
      );
    });
  }, [tables, customHost]);

  const handleDownloadQrPng = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = `ORDRIVA-Table-${selectedTable}-QR.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Direct, Isolated High-Res Printing (Prevents Blank Print Preview)
  const executePrintStand = (theme: 'dark' | 'light' = printTheme) => {
    const isDark = theme === 'dark';
    const bg = isDark ? '#0B1120' : '#FFFFFF';
    const textMain = isDark ? '#FFFFFF' : '#0F172A';
    const textSub = isDark ? '#94A3B8' : '#64748B';
    const border = isDark ? '#1E293B' : '#E2E8F0';
    const brandGold = isDark ? '#FDE047' : '#B45309';
    const badgeBg = isDark ? '#1E293B' : '#F1F5F9';
    const badgeBorder = isDark ? '#3B82F6' : '#94A3B8';
    const badgeText = isDark ? '#60A5FA' : '#0F172A';

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Table ${selectedTable} Stand - ORDRIVA</title>
          <style>
            @page {
              size: 4in 6in;
              margin: 0;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              background: #ffffff !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 16px;
            }
            .stand-card {
              width: 340px;
              background: ${isDark ? 'linear-gradient(180deg, #0B1120 0%, #0F172A 50%, #0B1120 100%)' : '#FFFFFF'} !important;
              color: ${textMain} !important;
              border-radius: 28px;
              padding: 28px 24px;
              text-align: center;
              border: 3px solid ${border} !important;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
              position: relative;
            }
            .brand-name {
              font-family: 'Cinzel', 'Playfair Display', Georgia, serif;
              font-size: 22px;
              font-weight: 900;
              letter-spacing: 0.18em;
              color: ${brandGold} !important;
              margin-top: 6px;
            }
            .branch-info {
              font-size: 9.5px;
              text-transform: uppercase;
              letter-spacing: 0.14em;
              color: ${textSub} !important;
              font-weight: 700;
              margin-top: 3px;
            }
            .table-badge-pill {
              display: inline-flex;
              align-items: center;
              background-color: ${badgeBg} !important;
              color: ${badgeText} !important;
              border: 1.5px solid ${badgeBorder} !important;
              font-weight: 900;
              font-size: 13px;
              letter-spacing: 0.08em;
              padding: 5px 20px;
              border-radius: 9999px;
              margin: 16px 0 14px 0;
            }
            .qr-wrapper {
              position: relative;
              background: #ffffff !important;
              border-radius: 20px;
              padding: 14px;
              display: inline-block;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
              border: 2px solid ${isDark ? '#334155' : '#E2E8F0'};
            }
            .qr-wrapper img {
              display: block;
              width: 190px;
              height: 190px;
              border-radius: 10px;
            }
            .cta-title {
              font-size: 13px;
              font-weight: 900;
              letter-spacing: 0.08em;
              color: ${textMain} !important;
              margin-top: 14px;
              margin-bottom: 4px;
            }
            .cta-desc {
              font-size: 11px;
              color: ${textSub} !important;
              line-height: 1.35;
              max-width: 270px;
              margin: 0 auto;
            }
            .features-ribbon {
              margin-top: 16px;
              padding-top: 12px;
              border-top: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'};
              font-size: 10px;
              color: ${isDark ? '#60A5FA' : '#2563EB'} !important;
              font-weight: 700;
              display: flex;
              justify-content: center;
              gap: 8px;
            }
          </style>
        </head>
        <body>
          <div class="stand-card">
            <div style="font-size: 26px; line-height: 1;">🛎️</div>
            <div class="brand-name">ORDRIVA</div>
            <div class="branch-info">${currentBranch.name}</div>
            <div class="table-badge-pill">TABLE ${selectedTable}</div>
            <div class="qr-wrapper">
              <img src="${qrCodeDataUrl}" alt="Table ${selectedTable} QR Code" />
            </div>
            <div class="cta-title">SCAN WITH PHONE TO ORDER</div>
            <div class="cta-desc">Point your phone camera to view full menu, order food, and pay your table bill instantly</div>
            <div class="features-ribbon">
              <span>⚡ Instant Dispatch</span>
              <span>•</span>
              <span>🛡️ 100% Contactless</span>
            </div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        iframe.remove();
      }, 2000);
    }, 250);
  };

  const executePrintBatchStands = (theme: 'dark' | 'light' = printTheme) => {
    const isDark = theme === 'dark';
    const bg = isDark ? '#0B1120' : '#FFFFFF';
    const textMain = isDark ? '#FFFFFF' : '#0F172A';
    const textSub = isDark ? '#94A3B8' : '#64748B';
    const border = isDark ? '#1E293B' : '#E2E8F0';
    const brandGold = isDark ? '#FDE047' : '#B45309';
    const badgeBg = isDark ? '#1E293B' : '#F1F5F9';
    const badgeBorder = isDark ? '#3B82F6' : '#94A3B8';
    const badgeText = isDark ? '#60A5FA' : '#0F172A';

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const cardsHtml = tables
      .map((tbl) => {
        const q = batchQrs[tbl.label] || qrCodeDataUrl;
        return `
        <div class="stand-card">
          <div style="font-size: 22px; line-height: 1;">🛎️</div>
          <div class="brand-name">ORDRIVA</div>
          <div class="branch-info">${currentBranch.name}</div>
          <div class="table-badge-pill">TABLE ${tbl.label}</div>
          <div class="qr-wrapper">
            <img src="${q}" alt="QR" />
          </div>
          <div class="cta-title">SCAN WITH PHONE TO ORDER</div>
          <div class="cta-desc">Point camera to order & pay instantly</div>
          <div class="features-ribbon">
            <span>⚡ Instant Dispatch</span>
            <span>•</span>
            <span>🛡️ Contactless</span>
          </div>
        </div>
      `;
      })
      .join('');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>All Table QR Stands - ORDRIVA</title>
          <style>
            @page {
              size: auto;
              margin: 10mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              background: #ffffff !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              padding: 10px;
            }
            .grid-container {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 24px;
              justify-items: center;
            }
            .stand-card {
              width: 300px;
              background-color: ${bg} !important;
              color: ${textMain} !important;
              border-radius: 24px;
              padding: 22px 18px;
              text-align: center;
              border: 2px solid ${border} !important;
              page-break-inside: avoid;
              break-inside: avoid;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
            }
            .brand-name {
              font-family: 'Cinzel', 'Playfair Display', Georgia, serif;
              font-size: 18px;
              font-weight: 900;
              letter-spacing: 0.15em;
              color: ${brandGold} !important;
              margin-top: 4px;
            }
            .branch-info {
              font-size: 9px;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              color: ${textSub} !important;
              font-weight: 700;
              margin-top: 2px;
            }
            .table-badge-pill {
              display: inline-block;
              background-color: ${badgeBg} !important;
              color: ${badgeText} !important;
              border: 1px solid ${badgeBorder} !important;
              font-weight: 900;
              font-size: 12px;
              letter-spacing: 0.05em;
              padding: 4px 16px;
              border-radius: 9999px;
              margin: 12px 0 10px 0;
            }
            .qr-wrapper {
              background-color: #ffffff !important;
              border: 1px solid ${isDark ? '#334155' : '#E2E8F0'};
              border-radius: 14px;
              padding: 8px;
              display: inline-block;
              margin-bottom: 8px;
            }
            .qr-wrapper img {
              display: block;
              width: 150px;
              height: 150px;
              border-radius: 8px;
            }
            .cta-title {
              font-size: 11px;
              font-weight: 900;
              letter-spacing: 0.05em;
              color: ${textMain} !important;
              margin-top: 8px;
              margin-bottom: 2px;
            }
            .cta-desc {
              font-size: 9.5px;
              color: ${textSub} !important;
              line-height: 1.25;
              max-width: 230px;
              margin: 0 auto;
            }
            .features-ribbon {
              margin-top: 10px;
              padding-top: 8px;
              border-top: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'};
              font-size: 9px;
              color: ${isDark ? '#60A5FA' : '#2563EB'} !important;
              font-weight: 700;
              display: flex;
              justify-content: center;
              gap: 6px;
            }
          </style>
        </head>
        <body>
          <div class="grid-container">
            ${cardsHtml}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        iframe.remove();
      }, 2000);
    }, 250);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* 1. Executive Studio Header */}
      <div className="bg-gradient-to-r from-white via-slate-50/60 to-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-4">
          <Link
            href="/tables"
            className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors shadow-xs"
            title="Back to Floor Plan"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Table QR Stands &amp; Print Studio
              </h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 shadow-xs">
                4×6&quot; Luxury Acrylic
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Precision print-ready acrylic table tents and QR stands for contactless guest dining
            </p>
          </div>
        </div>

        {/* Studio Controls Header */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Theme Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80 shadow-inner">
            <button
              onClick={() => setPrintTheme('dark')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                printTheme === 'dark'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🌙 Dark Acrylic</span>
            </button>
            <button
              onClick={() => setPrintTheme('light')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                printTheme === 'light'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>☀️ Clean White</span>
            </button>
          </div>

          {/* Mode Switcher */}
          <button
            onClick={() => setBatchMode(!batchMode)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
              batchMode
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-xs'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{batchMode ? 'Single Table View' : 'Batch All 10 Tables'}</span>
          </button>

          {/* Primary Action Button */}
          <button
            onClick={() => (batchMode ? executePrintBatchStands() : executePrintStand())}
            className="px-5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-2 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 active:scale-95"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            <span>{batchMode ? 'Print All 10 Stands' : `Print Stand (Table ${selectedTable})`}</span>
          </button>
        </div>
      </div>

      {/* 2. SINGLE TABLE MODE */}
      {!batchMode && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start print:block print:w-full">
          {/* Left Column: Interactive Table Selection & Controls (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6 print:hidden">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center border border-blue-200">
                  1
                </span>
                <h3 className="font-black text-base text-slate-900 tracking-tight">Select Dining Table</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 pl-8">
                Choose the dining table you want to configure and print:
              </p>
            </div>

            {/* Table Selection Grid with Enhanced Polish */}
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
              {tables.map((t) => {
                const isSelected = t.label === selectedTable;
                const isOccupied = t.status === 'occupied';

                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTable(t.label)}
                    className={`py-3 px-1 rounded-2xl border text-center transition-all duration-150 relative ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-blue-500/50'
                        : 'bg-slate-50/80 text-slate-700 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className="block text-xs font-black tracking-tight">{t.label}</span>
                    <span
                      className={`block text-[9.5px] font-medium mt-0.5 ${
                        isSelected ? 'text-slate-300' : 'text-slate-400'
                      }`}
                    >
                      {t.capacity}P
                    </span>

                    {/* Status Dot */}
                    <span
                      className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
                        isOccupied ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Table Metadata Card */}
            {currentTableObj && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/60 border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Assigned Floor Section:</span>
                  <span className="text-slate-900 font-bold flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>{currentTableObj.section}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Standard Seating Capacity:</span>
                  <span className="text-slate-900 font-bold flex items-center space-x-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>{currentTableObj.capacity} Guests</span>
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500 font-medium">Current Floor State:</span>
                  <span className="uppercase text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {currentTableObj.status}
                  </span>
                </div>
              </div>
            )}

            {/* Mobile LAN / Phone QR Testing Host Configuration */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-xs text-slate-900">Phone Scanning Host</span>
                </div>
                {isLocalhost && !customHost ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    Localhost Active
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {customHost ? 'Custom IP Configured' : 'Live Host'}
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                {isLocalhost && !customHost ? (
                  <span>
                    Your phone cannot open <code className="bg-white px-1 py-0.5 rounded text-amber-700 font-mono text-[10px]">localhost</code> directly. Enter your computer&apos;s Wi-Fi IP (e.g. <span className="font-mono font-bold text-slate-700">192.168.1.15:3000</span>) below so phone camera scans work instantly:
                  </span>
                ) : (
                  <span>
                    Target URL encoded into QR: <code className="bg-white px-1 py-0.5 rounded text-blue-600 font-mono text-[10px] break-all">{getBaseUrl()}/order?table={selectedTable}</code>
                  </span>
                )}
              </p>

              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="e.g. 192.168.1.15:3000 or tunnel URL"
                    value={customHost}
                    onChange={(e) => handleCustomHostChange(e.target.value)}
                    className="w-full text-xs font-mono bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                  />
                </div>
                {customHost && (
                  <button
                    onClick={() => handleCustomHostChange('')}
                    className="px-2.5 py-2 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors shrink-0"
                    title="Reset to default origin"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Export Actions */}
            <div className="space-y-2.5 pt-1">
              <button
                onClick={() => executePrintStand()}
                className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Print Stand for Table {selectedTable} (4×6&quot;)</span>
              </button>

              <button
                onClick={handleDownloadQrPng}
                className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center space-x-2 border border-slate-200 shadow-xs transition-colors"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Export High-Res PNG QR Code</span>
              </button>
            </div>

            {/* Manager Pro-Tips */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-bold text-xs text-slate-900">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Hospitality Deployment Tip:</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Print onto 4×6&quot; photo cardstock or matte linen paper. Slip directly into dual-sided vertical acrylic T-stands or magnetic wooden card blocks for best longevity.
              </p>
            </div>
          </div>

          {/* Right Column: Ultra-Luxury 3D Acrylic Table Stand Mockup (7 cols) */}
          <div className="lg:col-span-7 bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A] rounded-3xl border border-slate-800 p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl print:border-none print:bg-transparent print:p-0 print:m-0 print:w-full print:block">
            {/* Ambient Lighting Vignette */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center mb-6 relative z-10 print:hidden">
              <span className="text-xs font-bold uppercase tracking-widest text-[#60A5FA] block">
                Live Acrylic Stand Preview
              </span>
              <span className="text-[11px] text-slate-400">
                {printTheme === 'dark' ? 'Luxury Obsidian Theme' : 'Clean Alabaster White Theme'} • Exact customer viewing scale
              </span>
            </div>

            {/* Stand Container with Acrylic Glassmorphic Effect */}
            <div className="relative flex flex-col items-center z-10">
              {/* Top Glass Bevel Glare */}
              <div className="relative">
                {/* 4x6" Luxury Acrylic Stand Card */}
                <div
                  id="printable-table-stand"
                  className={`w-[320px] rounded-3xl p-7 text-center space-y-4 transition-all duration-300 relative overflow-hidden ${
                    printTheme === 'dark'
                      ? 'bg-gradient-to-b from-[#0B1120] via-[#0D1527] to-[#080D18] text-white border-2 border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.6)]'
                      : 'bg-white text-slate-900 border-2 border-slate-300 shadow-[0_20px_50px_rgba(0,0,0,0.25)]'
                  }`}
                >
                  {/* Acrylic Glass Sheen Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none rounded-3xl" />

                  {/* Brand Cloche & Wordmark */}
                  <div className="flex flex-col items-center justify-center space-y-1 relative z-10">
                    <OrdrivaLogo variant="mark" size={44} />
                    <span
                      className={`font-serif font-black tracking-widest text-2xl mt-1.5 ${
                        printTheme === 'dark'
                          ? 'bg-gradient-to-r from-white via-amber-200 to-amber-400 bg-clip-text text-transparent drop-shadow-sm'
                          : 'text-slate-900'
                      }`}
                    >
                      ORDRIVA
                    </span>
                    <span
                      className={`text-[9.5px] uppercase tracking-widest font-extrabold ${
                        printTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {currentBranch.name}
                    </span>
                  </div>

                  {/* Table Badge Pill (Luxury Gold or Sapphire Hairline) */}
                  <div className="relative z-10 inline-flex items-center space-x-1.5 px-5 py-1.5 rounded-full bg-blue-600/90 text-white font-black text-xs shadow-md tracking-wider border border-blue-400/50">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>TABLE {selectedTable}</span>
                  </div>

                  {/* Precision-Framed QR Code with Corner Registration Brackets */}
                  <div className="relative z-10 inline-block p-1">
                    <div
                      className={`p-3.5 rounded-2xl inline-block relative ${
                        printTheme === 'dark'
                          ? 'bg-white border-2 border-slate-200 shadow-xl'
                          : 'bg-white border-2 border-slate-200 shadow-md'
                      }`}
                    >
                      {/* Corner Registration Markers for Premium Camera Alignment */}
                      <span className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-blue-600 rounded-tl-sm pointer-events-none" />
                      <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-blue-600 rounded-tr-sm pointer-events-none" />
                      <span className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-blue-600 rounded-bl-sm pointer-events-none" />
                      <span className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-blue-600 rounded-br-sm pointer-events-none" />

                      {qrCodeDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={qrCodeDataUrl}
                          alt={`Table ${selectedTable} QR Code`}
                          width={190}
                          height={190}
                          className="rounded-lg mx-auto block"
                        />
                      ) : (
                        <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold">
                          Generating QR...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer Call to Action */}
                  <div className="space-y-1 relative z-10">
                    <h4
                      className={`font-black text-xs tracking-wider uppercase ${
                        printTheme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      Scan with Camera to Order
                    </h4>
                    <p
                      className={`text-[10.5px] leading-relaxed px-2 ${
                        printTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      Browse full menu, customize dishes &amp; settle your bill instantly with UPI
                    </p>
                  </div>

                  {/* Hospitality Feature Badges */}
                  <div
                    className={`pt-2.5 border-t flex items-center justify-center space-x-3 text-[10px] font-bold relative z-10 ${
                      printTheme === 'dark'
                        ? 'border-white/10 text-blue-400'
                        : 'border-slate-200 text-blue-600'
                    }`}
                  >
                    <span className="flex items-center space-x-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>Instant KOT</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>100% Contactless</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Realistic Acrylic Stand Base Mount (Hospitality 3D Mockup) */}
              <div className="w-48 h-3.5 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 rounded-b-xl shadow-2xl border-t border-slate-500/40 relative -mt-0.5" />
              <div className="w-56 h-1 bg-black/40 blur-xs rounded-full mt-1" />
            </div>
          </div>
        </div>
      )}

      {/* 3. BATCH PRINT MODE */}
      {batchMode && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 via-purple-100/50 to-purple-50 p-5 rounded-3xl border border-purple-200 text-xs text-purple-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
            <div>
              <span className="font-black block text-sm">
                Batch Mode: Ready to Print All {tables.length} Table Stands
              </span>
              <span className="text-[11px] text-purple-700 mt-0.5 block">
                Stands for every active dining table will be rendered together. One click triggers continuous isolated printing.
              </span>
            </div>
            <button
              onClick={() => executePrintBatchStands()}
              className="px-5 py-2.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center space-x-2 shadow-sm shrink-0 transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Complete Batch ({tables.length} Stands)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 printable-batch-grid">
            {tables.map((tbl) => {
              const qrUrl = batchQrs[tbl.label] || qrCodeDataUrl;
              return (
                <div
                  key={tbl.id}
                  className={`rounded-3xl p-6 shadow-md border text-center space-y-3.5 transition-all ${
                    printTheme === 'dark'
                      ? 'bg-gradient-to-b from-[#0B1120] via-[#0D1527] to-[#080D18] text-white border-white/20'
                      : 'bg-white text-slate-900 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <OrdrivaLogo variant="mark" size={36} />
                    <span
                      className={`font-serif font-black tracking-widest text-lg ${
                        printTheme === 'dark' ? 'text-amber-200' : 'text-slate-900'
                      }`}
                    >
                      ORDRIVA
                    </span>
                    <span
                      className={`text-[9px] uppercase tracking-wider font-bold ${
                        printTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {currentBranch.name}
                    </span>
                  </div>

                  <div className="inline-block px-4 py-1 rounded-full bg-blue-600 text-white font-black text-xs shadow-sm">
                    TABLE {tbl.label}
                  </div>

                  <div className="p-2.5 bg-white rounded-2xl inline-block border border-slate-200 shadow-sm">
                    {qrUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={qrUrl}
                        alt={`Table ${tbl.label} QR`}
                        width={150}
                        height={150}
                        className="rounded-lg mx-auto block"
                      />
                    ) : (
                      <div className="w-36 h-36 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                        QR Ready
                      </div>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <h4
                      className={`font-bold text-xs ${
                        printTheme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      Scan to Order &amp; Pay
                    </h4>
                    <p
                      className={`text-[10px] ${
                        printTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      Point camera • View menu • Instant KOT
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
