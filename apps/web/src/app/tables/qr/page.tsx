'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
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
  Info,
  Layers,
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

  const currentTableObj = tables.find((t) => t.label === selectedTable) || tables[0];

  // Generate QR for selected table
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const targetUrl = `${origin}/order?table=${encodeURIComponent(selectedTable)}`;

    QRCode.toDataURL(
      targetUrl,
      {
        width: 400,
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
  }, [selectedTable]);

  // Pre-generate QRs for all tables for Batch Printing
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const newBatchMap: { [label: string]: string } = {};

    let completed = 0;
    tables.forEach((tbl) => {
      const targetUrl = `${origin}/order?table=${encodeURIComponent(tbl.label)}`;
      QRCode.toDataURL(
        targetUrl,
        {
          width: 320,
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
  }, [tables]);

  const handleDownloadQrPng = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = `ORDRIVA-Table-${selectedTable}-QR.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Direct, 100% Reliable Isolated Printing (prevents blank print preview)
  const executePrintStand = (theme: 'dark' | 'light' = printTheme) => {
    const isDark = theme === 'dark';
    const bg = isDark ? '#0B1120' : '#FFFFFF';
    const textMain = isDark ? '#FFFFFF' : '#0F172A';
    const textSub = isDark ? '#94A3B8' : '#64748B';
    const border = isDark ? '#1E293B' : '#CBD5E1';
    const titleColor = isDark ? '#FDE047' : '#0F172A';
    const qrFrameBorder = isDark ? '#334155' : '#E2E8F0';

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
            @page landscape {
              size: 6in 4in;
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
              padding: 20px;
            }
            .stand-card {
              width: 320px;
              background-color: ${bg} !important;
              color: ${textMain} !important;
              border-radius: 24px;
              padding: 24px;
              text-align: center;
              border: 3px solid ${border} !important;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            }
            .brand-name {
              font-family: serif;
              font-size: 20px;
              font-weight: 900;
              letter-spacing: 0.15em;
              color: ${titleColor} !important;
              margin-top: 4px;
            }
            .branch-info {
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              color: ${textSub} !important;
              font-weight: 700;
              margin-top: 2px;
            }
            .table-badge {
              display: inline-block;
              background-color: #2563EB !important;
              color: #ffffff !important;
              font-weight: 900;
              font-size: 14px;
              letter-spacing: 0.05em;
              padding: 6px 20px;
              border-radius: 9999px;
              margin: 14px 0;
            }
            .qr-box {
              background-color: #ffffff !important;
              border: 2px solid ${qrFrameBorder};
              border-radius: 16px;
              padding: 12px;
              display: inline-block;
              margin-bottom: 12px;
            }
            .qr-box img {
              display: block;
              width: 180px;
              height: 180px;
              border-radius: 8px;
            }
            .cta-title {
              font-size: 13px;
              font-weight: 900;
              letter-spacing: 0.05em;
              color: ${textMain} !important;
              margin-bottom: 4px;
            }
            .cta-desc {
              font-size: 11px;
              color: ${textSub} !important;
              line-height: 1.35;
              max-width: 260px;
              margin: 0 auto;
            }
            .footer-pills {
              margin-top: 14px;
              padding-top: 10px;
              border-top: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'};
              font-size: 10px;
              color: #2563EB !important;
              font-weight: 700;
              display: flex;
              justify-content: center;
              gap: 8px;
            }
          </style>
        </head>
        <body>
          <div class="stand-card">
            <div class="brand-name">ORDRIVA</div>
            <div class="branch-info">${currentBranch.name}</div>
            <div class="table-badge">TABLE ${selectedTable}</div>
            <div class="qr-box">
              <img src="${qrCodeDataUrl}" alt="Table ${selectedTable} QR Code" />
            </div>
            <div class="cta-title">SCAN WITH PHONE TO ORDER</div>
            <div class="cta-desc">Point your phone camera to view full menu, order food, and pay your table bill instantly</div>
            <div class="footer-pills">
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
    const border = isDark ? '#1E293B' : '#CBD5E1';
    const titleColor = isDark ? '#FDE047' : '#0F172A';
    const qrFrameBorder = isDark ? '#334155' : '#E2E8F0';

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
          <div class="brand-name">ORDRIVA</div>
          <div class="branch-info">${currentBranch.name}</div>
          <div class="table-badge">TABLE ${tbl.label}</div>
          <div class="qr-box">
            <img src="${q}" alt="QR" />
          </div>
          <div class="cta-title">SCAN WITH PHONE TO ORDER</div>
          <div class="cta-desc">Point camera to order & pay instantly</div>
          <div class="footer-pills">
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
              gap: 20px;
              justify-items: center;
            }
            .stand-card {
              width: 290px;
              background-color: ${bg} !important;
              color: ${textMain} !important;
              border-radius: 20px;
              padding: 18px;
              text-align: center;
              border: 2px solid ${border} !important;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .brand-name {
              font-family: serif;
              font-size: 17px;
              font-weight: 900;
              letter-spacing: 0.12em;
              color: ${titleColor} !important;
            }
            .branch-info {
              font-size: 9px;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: ${textSub} !important;
              font-weight: 700;
              margin-top: 2px;
            }
            .table-badge {
              display: inline-block;
              background-color: #2563EB !important;
              color: #ffffff !important;
              font-weight: 900;
              font-size: 13px;
              letter-spacing: 0.05em;
              padding: 4px 16px;
              border-radius: 9999px;
              margin: 10px 0;
            }
            .qr-box {
              background-color: #ffffff !important;
              border: 1px solid ${qrFrameBorder};
              border-radius: 12px;
              padding: 8px;
              display: inline-block;
              margin-bottom: 8px;
            }
            .qr-box img {
              display: block;
              width: 140px;
              height: 140px;
              border-radius: 6px;
            }
            .cta-title {
              font-size: 11px;
              font-weight: 900;
              letter-spacing: 0.05em;
              color: ${textMain} !important;
              margin-bottom: 2px;
            }
            .cta-desc {
              font-size: 10px;
              color: ${textSub} !important;
              line-height: 1.25;
              max-width: 220px;
              margin: 0 auto;
            }
            .footer-pills {
              margin-top: 10px;
              padding-top: 8px;
              border-top: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'};
              font-size: 9px;
              color: #2563EB !important;
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
      {/* 1. Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-3.5">
          <Link
            href="/tables"
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
            title="Back to Floor Plan"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Table QR Stands &amp; Print Studio
              </h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-[#1D4ED8] border border-blue-200">
                Admin Exclusive
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate, preview, and print 4×6&quot; acrylic table tent cards. Place on tables for contactless customer dining.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Print Style Selector */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setPrintTheme('dark')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                printTheme === 'dark'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🌙 Dark Acrylic
            </button>
            <button
              onClick={() => setPrintTheme('light')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                printTheme === 'light'
                  ? 'bg-[#3B82F6] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ☀️ Clean White
            </button>
          </div>

          <button
            onClick={() => setBatchMode(!batchMode)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all border ${
              batchMode
                ? 'bg-purple-50 text-purple-800 border-purple-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-600" />
            <span>{batchMode ? 'Switch to Single Table' : 'Batch Print All Tables'}</span>
          </button>

          <button
            onClick={() => (batchMode ? executePrintBatchStands() : executePrintStand())}
            className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>{batchMode ? 'Print All Table Stands' : `Print Stand for Table ${selectedTable}`}</span>
          </button>
        </div>
      </div>

      {/* 2. SINGLE TABLE MODE */}
      {!batchMode && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start print:block print:w-full">
          {/* Left Column: Table Selection & Details (6 cols) */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-5 print:hidden">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">1. Select Dining Table</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose which table you are printing the tent stand or QR sticker for:
              </p>
            </div>

            {/* Table Buttons Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
              {tables.map((t) => {
                const isSelected = t.label === selectedTable;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTable(t.label)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-[#3B82F6] text-white border-[#3B82F6] shadow-sm font-black'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-bold'
                    }`}
                  >
                    <span className="block text-sm">{t.label}</span>
                    <span
                      className={`block text-[10px] ${
                        isSelected ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {t.capacity} Seats
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Table Details Card */}
            {currentTableObj && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-600">Assigned Area:</span>
                  <span className="text-slate-900 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-[#3B82F6]" />
                    <span>{currentTableObj.section}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-600">Seating Capacity:</span>
                  <span className="text-slate-900 flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{currentTableObj.capacity} Guests</span>
                  </span>
                </div>
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-600">Current Occupancy:</span>
                  <span className="uppercase text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {currentTableObj.status}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleDownloadQrPng}
                className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG QR</span>
              </button>

              <button
                onClick={() => executePrintStand()}
                className="py-2.5 px-4 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Stand (Table {selectedTable})</span>
              </button>
            </div>

            {/* Instruction Callout */}
            <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold">
                <Info className="w-4 h-4 text-[#3B82F6]" />
                <span>Admin Instructions:</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Click <strong>&quot;Print Stand&quot;</strong> to print directly onto 4×6&quot; photo paper or cardstock. Fold and place into an acrylic table tent stand on Table {selectedTable}. Customers can point any smartphone camera to start ordering.
              </p>
            </div>
          </div>

          {/* Right Column: High-Res 4x6" Stand Mockup Preview (6 cols) */}
          <div className="lg:col-span-6 bg-slate-100/70 rounded-2xl border border-slate-200/80 p-6 flex flex-col items-center justify-center print:border-none print:bg-transparent print:p-0 print:m-0 print:w-full print:block">
            <div className="text-center mb-3 print:hidden">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                Live 4×6&quot; Table Tent Preview ({printTheme === 'dark' ? 'Dark Acrylic' : 'Clean White'})
              </span>
              <span className="text-[11px] text-slate-500">
                Exact printout design that customers will see at the table
              </span>
            </div>

            {/* The 4x6" Table Tent Stand Mockup */}
            <div
              id="printable-table-stand"
              className={`w-full max-w-[320px] rounded-3xl p-6 shadow-2xl text-center space-y-4 my-2 transition-all ${
                printTheme === 'dark'
                  ? 'bg-gradient-to-b from-[#0B1120] via-[#111C38] to-[#0B1120] text-white border-4 border-[#3B82F6]/40 shadow-slate-950/20'
                  : 'bg-white text-slate-900 border-4 border-slate-300 shadow-slate-300/40'
              }`}
            >
              {/* Stand Header */}
              <div className="flex flex-col items-center justify-center space-y-1">
                <OrdrivaLogo variant="mark" size={42} />
                <span
                  className={`font-serif font-black tracking-widest text-xl mt-1 ${
                    printTheme === 'dark' ? 'text-amber-200' : 'text-slate-900'
                  }`}
                >
                  ORDRIVA
                </span>
                <span
                  className={`text-[10px] uppercase tracking-wider font-bold ${
                    printTheme === 'dark' ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {currentBranch.name}
                </span>
              </div>

              {/* Table Pill */}
              <div className="inline-block px-5 py-1.5 rounded-full bg-[#3B82F6] text-white font-black text-sm shadow-md tracking-wider">
                TABLE {selectedTable}
              </div>

              {/* Framed QR Code */}
              <div
                className={`p-3 rounded-2xl inline-block my-1 border-2 ${
                  printTheme === 'dark'
                    ? 'bg-white border-white shadow-inner'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                {qrCodeDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrCodeDataUrl}
                    alt={`Table ${selectedTable} QR Code`}
                    width={200}
                    height={200}
                    className="rounded-lg mx-auto block"
                  />
                ) : (
                  <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold">
                    Generating QR...
                  </div>
                )}
              </div>

              {/* Customer Call to Action */}
              <div className="space-y-1">
                <h4
                  className={`font-black text-sm tracking-wide ${
                    printTheme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  SCAN WITH PHONE TO ORDER
                </h4>
                <p
                  className={`text-[11px] leading-tight px-2 ${
                    printTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  Point your phone camera to view full menu, order food, and pay your table bill instantly
                </p>
              </div>

              {/* Feature Badges */}
              <div
                className={`pt-2 border-t flex items-center justify-center space-x-3 text-[10px] font-bold ${
                  printTheme === 'dark'
                    ? 'border-white/10 text-[#60A5FA]'
                    : 'border-slate-200 text-[#1D4ED8]'
                }`}
              >
                <span>⚡ Instant Kitchen Dispatch</span>
                <span>•</span>
                <span>🛡️ 100% Contactless</span>
              </div>
            </div>

            <button
              onClick={() => executePrintStand()}
              className="mt-4 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center space-x-2 shadow print:hidden"
            >
              <Printer className="w-4 h-4 text-[#60A5FA]" />
              <span>Print This Stand (4×6&quot;)</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. BATCH PRINT MODE (Prints stands for ALL tables in one go) */}
      {batchMode && (
        <div className="space-y-6">
          <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200 text-xs text-purple-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
            <div>
              <span className="font-extrabold block text-sm">
                Batch Mode: Printing All {tables.length} Tables
              </span>
              <span className="text-[11px] text-purple-800">
                All table stands are rendered below in grid layout. Clicking &quot;Print All Table Stands&quot; prints the complete set.
              </span>
            </div>
            <button
              onClick={() => executePrintBatchStands()}
              className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow shrink-0"
            >
              <Printer className="w-4 h-4" />
              <span>Print All {tables.length} Stands Now</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 printable-batch-grid">
            {tables.map((tbl) => {
              const qrUrl = batchQrs[tbl.label] || qrCodeDataUrl;
              return (
                <div
                  key={tbl.id}
                  className={`rounded-3xl p-5 shadow-lg border-2 text-center space-y-3 transition-all ${
                    printTheme === 'dark'
                      ? 'bg-gradient-to-b from-[#0B1120] via-[#111C38] to-[#0B1120] text-white border-[#3B82F6]/40'
                      : 'bg-white text-slate-900 border-slate-300'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center space-y-0.5">
                    <OrdrivaLogo variant="mark" size={32} />
                    <span
                      className={`font-serif font-black tracking-widest text-base ${
                        printTheme === 'dark' ? 'text-amber-200' : 'text-slate-900'
                      }`}
                    >
                      ORDRIVA
                    </span>
                    <span
                      className={`text-[9px] uppercase tracking-wider font-semibold ${
                        printTheme === 'dark' ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {currentBranch.name}
                    </span>
                  </div>

                  <div className="inline-block px-4 py-1 rounded-full bg-[#3B82F6] text-white font-black text-xs shadow-md tracking-wider">
                    TABLE {tbl.label}
                  </div>

                  <div
                    className={`p-2.5 rounded-2xl inline-block my-1 border-2 ${
                      printTheme === 'dark' ? 'bg-white border-white shadow-inner' : 'bg-white border-slate-200'
                    }`}
                  >
                    {qrUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={qrUrl}
                        alt={`Table ${tbl.label} QR`}
                        width={160}
                        height={160}
                        className="rounded-lg mx-auto block"
                      />
                    ) : (
                      <div className="w-40 h-40 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                        Generating...
                      </div>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <h5
                      className={`font-black text-xs tracking-wide ${
                        printTheme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      SCAN WITH PHONE TO ORDER
                    </h5>
                    <p
                      className={`text-[10px] leading-tight ${
                        printTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      Browse live menu, order food, and pay your bill
                    </p>
                  </div>

                  <div
                    className={`pt-2 border-t flex items-center justify-center space-x-2 text-[9px] font-bold ${
                      printTheme === 'dark'
                        ? 'border-white/10 text-[#60A5FA]'
                        : 'border-slate-200 text-[#1D4ED8]'
                    }`}
                  >
                    <span>⚡ Instant Dispatch</span>
                    <span>•</span>
                    <span>🛡️ Contactless</span>
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

