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
  Copy,
  ExternalLink,
  Check,
  Download,
  Grid,
  Users,
  MapPin,
  Sparkles,
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
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [batchMode, setBatchMode] = useState<boolean>(false);
  const [batchQrs, setBatchQrs] = useState<{ [label: string]: string }>({});

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

  const handleCopyLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const targetUrl = `${origin}/order?table=${encodeURIComponent(selectedTable)}`;
    navigator.clipboard.writeText(targetUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDownloadQrPng = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = `ORDRIVA-Table-${selectedTable}-QR.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>{batchMode ? 'Print All Table Stands' : `Print Stand for Table ${selectedTable}`}</span>
          </button>
        </div>
      </div>

      {/* 2. SINGLE TABLE MODE */}
      {!batchMode && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start print:hidden">
          {/* Left Column: Table Selection & Details (6 cols) */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-5">
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

            {/* Table Destination URL & Actions */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Destination QR Ordering Link:
              </label>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-mono text-slate-600">
                <span className="truncate pr-2">
                  {typeof window !== 'undefined'
                    ? `${window.location.origin}/order?table=${encodeURIComponent(selectedTable)}`
                    : `/order?table=${selectedTable}`}
                </span>
                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={handleCopyLink}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
                    title="Copy Link"
                  >
                    {copiedLink ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <a
                    href={`/order?table=${encodeURIComponent(selectedTable)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
                    title="Open Live Guest Menu"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

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
                onClick={() => window.print()}
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
          <div className="lg:col-span-6 bg-slate-100/70 rounded-2xl border border-slate-200/80 p-6 flex flex-col items-center justify-center">
            <div className="text-center mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                Live 4×6&quot; Acrylic Table Tent Preview
              </span>
              <span className="text-[11px] text-slate-500">
                Exact printout design that customers will see at the table
              </span>
            </div>

            {/* The 4x6" Table Tent Stand Mockup */}
            <div
              id="printable-table-stand"
              className="w-full max-w-[310px] bg-gradient-to-b from-[#0B1120] via-[#111C38] to-[#0B1120] text-white rounded-3xl p-6 shadow-2xl border-4 border-[#3B82F6]/40 text-center space-y-4 my-2"
            >
              {/* Stand Header */}
              <div className="flex flex-col items-center justify-center space-y-1">
                <OrdrivaLogo variant="mark" size={42} />
                <span className="font-serif font-black tracking-widest text-xl text-amber-200 mt-1">
                  ORDRIVA
                </span>
                <span className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">
                  {currentBranch.name}
                </span>
              </div>

              {/* Table Pill */}
              <div className="inline-block px-5 py-1.5 rounded-full bg-[#3B82F6] text-white font-black text-sm shadow-md tracking-wider">
                TABLE {selectedTable}
              </div>

              {/* Framed QR Code */}
              <div className="p-3 bg-white rounded-2xl shadow-inner inline-block my-1 border-2 border-white">
                {qrCodeDataUrl ? (
                  <Image
                    src={qrCodeDataUrl}
                    alt={`Table ${selectedTable} QR Code`}
                    width={200}
                    height={200}
                    className="rounded-lg"
                    priority
                  />
                ) : (
                  <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold">
                    Generating QR...
                  </div>
                )}
              </div>

              {/* Customer Call to Action */}
              <div className="space-y-1">
                <h4 className="font-black text-sm tracking-wide text-white">
                  SCAN WITH PHONE TO ORDER
                </h4>
                <p className="text-[11px] text-slate-300 leading-tight px-2">
                  Point your phone camera to view full menu, order food, and pay your table bill instantly
                </p>
              </div>

              {/* Feature Badges */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-center space-x-3 text-[10px] text-[#60A5FA] font-bold">
                <span>⚡ Instant Kitchen Dispatch</span>
                <span>•</span>
                <span>🛡️ 100% Contactless</span>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="mt-4 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center space-x-2 shadow"
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
              onClick={() => window.print()}
              className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow shrink-0"
            >
              <Printer className="w-4 h-4" />
              <span>Print All {tables.length} Stands Now</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables.map((tbl) => {
              const qrUrl = batchQrs[tbl.label] || qrCodeDataUrl;
              return (
                <div
                  key={tbl.id}
                  className="bg-gradient-to-b from-[#0B1120] via-[#111C38] to-[#0B1120] text-white rounded-3xl p-5 shadow-lg border-2 border-[#3B82F6]/40 text-center space-y-3 page-break-inside-avoid"
                >
                  <div className="flex flex-col items-center justify-center space-y-0.5">
                    <OrdrivaLogo variant="mark" size={32} />
                    <span className="font-serif font-black tracking-widest text-base text-amber-200">
                      ORDRIVA
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-300 font-semibold">
                      {currentBranch.name}
                    </span>
                  </div>

                  <div className="inline-block px-4 py-1 rounded-full bg-[#3B82F6] text-white font-black text-xs shadow-md tracking-wider">
                    TABLE {tbl.label}
                  </div>

                  <div className="p-2.5 bg-white rounded-2xl shadow-inner inline-block my-1 border-2 border-white">
                    {qrUrl ? (
                      <Image
                        src={qrUrl}
                        alt={`Table ${tbl.label} QR`}
                        width={160}
                        height={160}
                        className="rounded-lg"
                      />
                    ) : (
                      <div className="w-40 h-40 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                        Generating...
                      </div>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <h5 className="font-black text-xs tracking-wide text-white">
                      SCAN WITH PHONE TO ORDER
                    </h5>
                    <p className="text-[10px] text-slate-300 leading-tight">
                      Browse live menu, order food, and pay your bill
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-center space-x-2 text-[9px] text-[#60A5FA] font-bold">
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

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          header,
          aside,
          nav,
          .print\\:hidden {
            display: none !important;
          }
          #printable-table-stand {
            box-shadow: none !important;
            margin: 0 auto !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}

