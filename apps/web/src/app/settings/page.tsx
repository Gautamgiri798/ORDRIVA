'use client';

import React, { useState, useEffect } from 'react';
import { usePosStore } from '@/lib/store';
import { OrdrivaLogo } from '@/components/OrdrivaLogo';
import {
  Settings,
  Save,
  CheckCircle2,
  Printer,
  Building2,
  Percent,
  Sparkles,
  Receipt,
} from 'lucide-react';

export default function SettingsPage() {
  const { currentBranch, updateBranchTaxSettings } = usePosStore();

  // Controlled string inputs for smooth numerical typing & backspacing
  const [cgstInput, setCgstInput] = useState<string>(
    currentBranch?.taxRates?.cgst !== undefined ? currentBranch.taxRates.cgst.toString() : '2.5'
  );
  const [sgstInput, setSgstInput] = useState<string>(
    currentBranch?.taxRates?.sgst !== undefined ? currentBranch.taxRates.sgst.toString() : '2.5'
  );
  const [serviceChargeInput, setServiceChargeInput] = useState<string>(
    currentBranch?.taxRates?.serviceCharge !== undefined
      ? currentBranch.taxRates.serviceCharge.toString()
      : '5.0'
  );

  const [paperWidth, setPaperWidth] = useState<string>('80mm');
  const [footerNote, setFooterNote] = useState<string>(
    'Thank you for dining with ORDRIVA! Visit again soon.'
  );
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [savedSummary, setSavedSummary] = useState<string>('');

  // Sync inputs whenever currentBranch changes or is hydrated from localStorage
  useEffect(() => {
    if (currentBranch?.taxRates) {
      setCgstInput(currentBranch.taxRates.cgst.toString());
      setSgstInput(currentBranch.taxRates.sgst.toString());
      setServiceChargeInput(currentBranch.taxRates.serviceCharge.toString());
    }
  }, [currentBranch]);

  // Load printer settings from localStorage
  useEffect(() => {
    try {
      const savedPaper = localStorage.getItem('ordriva_printer_paper_width');
      const savedFooter = localStorage.getItem('ordriva_receipt_footer_note');
      if (savedPaper) setPaperWidth(savedPaper);
      if (savedFooter) setFooterNote(savedFooter);
    } catch {
      // Ignored
    }
  }, []);

  const handleSaveTaxes = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const parsedCgst = Math.max(0, parseFloat(cgstInput) || 0);
    const parsedSgst = Math.max(0, parseFloat(sgstInput) || 0);
    const parsedService = Math.max(0, parseFloat(serviceChargeInput) || 0);

    // Update in global state and persist to localStorage
    updateBranchTaxSettings(parsedCgst, parsedSgst, parsedService);

    // Save printer settings
    try {
      localStorage.setItem('ordriva_printer_paper_width', paperWidth);
      localStorage.setItem('ordriva_receipt_footer_note', footerNote);
    } catch {
      // Ignored
    }

    setSavedSummary(`CGST: ${parsedCgst}% • SGST: ${parsedSgst}% • Service Charge: ${parsedService}%`);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 4000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 text-slate-800">
      {/* Header */}
      <div className="flex items-center space-x-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#3B82F6]">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            System &amp; Branch Settings
          </h1>
          <p className="text-xs text-slate-500">
            GST dual-tax configuration, restaurant identity, thermal printer &amp; logo branding
          </p>
        </div>
      </div>

      {/* Brand Identity & Logo Showcase */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
          <Building2 className="w-4 h-4 text-[#3B82F6]" />
          <span>Brand Identity &amp; Operating Branch</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#0F172A] px-6 py-5 rounded-2xl border border-[#3B82F6]/30 shadow-md flex items-center justify-center">
            <OrdrivaLogo variant="full" size={48} />
          </div>

          <div className="space-y-1 text-xs text-slate-600">
            <div className="font-extrabold text-sm text-slate-900">{currentBranch.name}</div>
            <div><strong>Branch Code:</strong> {currentBranch.code}</div>
            <div><strong>Address:</strong> {currentBranch.address}</div>
            <div><strong>GSTIN Number:</strong> <span className="font-mono text-blue-600 font-bold">{currentBranch.gstin}</span></div>
            <div><strong>Currency:</strong> {currentBranch.currency} (₹ Indian Rupee)</div>
          </div>
        </div>
      </div>

      {/* Tax & GST Settings Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-900">
            <Percent className="w-4 h-4 text-[#3B82F6]" />
            <span>GST Dual-Tax &amp; Surcharge Configuration</span>
          </div>
          <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            Active: CGST {currentBranch.taxRates.cgst}% + SGST {currentBranch.taxRates.sgst}%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Central GST (CGST %)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="28"
              value={cgstInput}
              onChange={(e) => setCgstInput(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 2.5"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Default: 2.5% on food &amp; dining</span>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              State GST (SGST %)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="28"
              value={sgstInput}
              onChange={(e) => setSgstInput(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 2.5"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Default: 2.5% on food &amp; dining</span>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Dine-in Service Charge (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="20"
              value={serviceChargeInput}
              onChange={(e) => setServiceChargeInput(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 5.0"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Optional service charge for dine-in</span>
          </div>
        </div>

        {/* Live Bill Sample Preview with Current Rates */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-slate-500" />
            <span>
              Sample ₹1,000 Order Bill:{' '}
              <strong className="text-slate-900 font-bold">
                ₹
                {(
                  1000 +
                  (1000 * (parseFloat(cgstInput) || 0)) / 100 +
                  (1000 * (parseFloat(sgstInput) || 0)) / 100 +
                  (1000 * (parseFloat(serviceChargeInput) || 0)) / 100
                ).toFixed(2)}
              </strong>
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            (Total Tax: {((parseFloat(cgstInput) || 0) + (parseFloat(sgstInput) || 0)).toFixed(1)}%)
          </span>
        </div>

        <div className="flex items-center justify-between pt-2">
          {isSaved ? (
            <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Tax rates saved permanently! ({savedSummary})</span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">
              Rates persist automatically to POS cart calculations &amp; tax receipts.
            </span>
          )}

          <button
            type="button"
            onClick={handleSaveTaxes}
            className="px-5 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs flex items-center space-x-2 shadow-md shadow-blue-500/20 transition-transform active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save Tax Settings</span>
          </button>
        </div>
      </div>

      {/* Thermal Printer Settings */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-900">
            <Printer className="w-4 h-4 text-[#3B82F6]" />
            <span>Thermal Printer &amp; Receipt Template</span>
          </div>
          <span className="text-[11px] text-slate-400">Auto-saved</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Receipt Paper Size</label>
            <select
              value={paperWidth}
              onChange={(e) => {
                setPaperWidth(e.target.value);
                try {
                  localStorage.setItem('ordriva_printer_paper_width', e.target.value);
                } catch {}
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="80mm">80mm (Standard Restaurant Thermal Slip)</option>
              <option value="58mm">58mm (Compact Mobile EDC Thermal)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Receipt Footer Note</label>
            <input
              type="text"
              value={footerNote}
              onChange={(e) => {
                setFooterNote(e.target.value);
                try {
                  localStorage.setItem('ordriva_receipt_footer_note', e.target.value);
                } catch {}
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. Thank you for dining with us! Visit again."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
