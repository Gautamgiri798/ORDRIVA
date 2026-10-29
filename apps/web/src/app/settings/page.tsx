'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { usePosStore } from '@/lib/store';
import { Settings, Save, CheckCircle2, Printer, Building2, Percent, Sparkles, FileText } from 'lucide-react';

export default function SettingsPage() {
  const { currentBranch, updateBranchTaxSettings } = usePosStore();

  const [cgst, setCgst] = useState<number>(currentBranch.taxRates.cgst);
  const [sgst, setSgst] = useState<number>(currentBranch.taxRates.sgst);
  const [serviceCharge, setServiceCharge] = useState<number>(currentBranch.taxRates.serviceCharge);
  const [paperWidth, setPaperWidth] = useState<string>('80mm');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleSaveTaxes = (e: React.FormEvent) => {
    e.preventDefault();
    updateBranchTaxSettings(cgst, sgst, serviceCharge);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            System & Branch Settings
          </h1>
          <p className="text-xs text-slate-500">
            GST configuration, restaurant identity, thermal printer & logo branding
          </p>
        </div>
      </div>

      {/* Brand Identity & Logo Showcase */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
          <Building2 className="w-4 h-4 text-teal-600" />
          <span>Brand Identity & Logo</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-48 h-28 bg-[#172554] p-3 rounded-2xl border border-slate-300 shadow-md flex items-center justify-center overflow-hidden">
            <Image src="/ordriva-logo.png" alt="ORDRIVA Logo" fill className="object-contain p-2" priority />
          </div>

          <div className="space-y-1 text-xs text-slate-600">
            <div className="font-extrabold text-sm text-slate-900">{currentBranch.name}</div>
            <div><strong>Branch Code:</strong> {currentBranch.code}</div>
            <div><strong>Address:</strong> {currentBranch.address}</div>
            <div><strong>GSTIN Number:</strong> {currentBranch.gstin}</div>
            <div><strong>Currency:</strong> {currentBranch.currency} (₹ Indian Rupee)</div>
          </div>
        </div>
      </div>

      {/* Tax & GST Settings Form */}
      <form onSubmit={handleSaveTaxes} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
          <Percent className="w-4 h-4 text-teal-600" />
          <span>GST & Surcharge Configuration</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Central GST (CGST %)</label>
            <input
              type="number"
              step="0.1"
              value={cgst}
              onChange={(e) => setCgst(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">State GST (SGST %)</label>
            <input
              type="number"
              step="0.1"
              value={sgst}
              onChange={(e) => setSgst(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Dine-in Service Charge (%)</label>
            <input
              type="number"
              step="0.5"
              value={serviceCharge}
              onChange={(e) => setServiceCharge(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {isSaved ? (
            <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Tax rates updated successfully!</span>
            </span>
          ) : (
            <span className="text-xs text-slate-400">
              Changes apply instantly to new checkout bills.
            </span>
          )}

          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-[#0F766E] hover:bg-[#0D6861] text-white font-bold text-xs flex items-center space-x-1.5 shadow"
          >
            <Save className="w-4 h-4" />
            <span>Save Tax Settings</span>
          </button>
        </div>
      </form>

      {/* Thermal Printer Settings */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 text-xs">
        <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
          <Printer className="w-4 h-4 text-teal-600" />
          <span>Thermal Printer & Receipt Template</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Receipt Paper Size</label>
            <select
              value={paperWidth}
              onChange={(e) => setPaperWidth(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
            >
              <option value="80mm">80mm (Standard Restaurant Thermal)</option>
              <option value="58mm">58mm (Compact Mobile Thermal)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Receipt Footer Note</label>
            <input
              type="text"
              defaultValue="Thank you for dining with ORDRIVA! Visit again soon."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
