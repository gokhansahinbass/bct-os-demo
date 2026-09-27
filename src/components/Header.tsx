"use client";

import { useStore } from "@/lib/useStore";
import { resetToDefaults } from "@/lib/store";
import { useState } from "react";

export default function Header() {
  const { guests } = useStore();
  const [resetConfirm, setResetConfirm] = useState(false);

  const inStudioCount = guests.filter((g) =>
    ["in_studio", "appointment_set", "kiosk_registered"].includes(g.status)
  ).length;

  const inEditingCount = guests.filter((g) =>
    ["editing", "package_set"].includes(g.status)
  ).length;

  const inReviewCount = guests.filter((g) =>
    ["reviewing", "edit_done", "review_approved"].includes(g.status)
  ).length;

  function handleReset() {
    if (resetConfirm) {
      resetToDefaults();
      setResetConfirm(false);
    } else {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 3000);
    }
  }

  return (
    <header className="h-16 flex-shrink-0 bg-white border-b border-[#E2E8F0] px-6 lg:px-8 flex items-center justify-between z-10">
      {/* Left: Page Title & System Badge */}
      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold text-[#0F172A] tracking-tight">BCT-OS</h2>
        <span className="text-xs text-slate-400 font-mono hidden sm:inline">Stüdyo Operasyon Çekirdeği</span>
      </div>

      {/* Center: Dynamic Flat Stat Pills */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-slate-100 border border-slate-200/90 rounded-full text-xs font-medium text-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span className="hidden md:inline">Stüdyoda Aktif:</span>
          <span className="md:hidden">Stüdyo:</span>
          <span className="font-semibold text-slate-900">{inStudioCount}</span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-slate-100 border border-slate-200/90 rounded-full text-xs font-medium text-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          <span>Kurguda:</span>
          <span className="font-semibold text-slate-900">{inEditingCount}</span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-slate-100 border border-slate-200/90 rounded-full text-xs font-medium text-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          <span>Revizede:</span>
          <span className="font-semibold text-slate-900">{inReviewCount}</span>
        </div>
      </div>

      {/* Right: Quick actions & Demo Reset */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={handleReset}
          title="Demo verilerini fabrika ayarlarına döndürür"
          className={`text-xs px-2.5 py-1 rounded-md transition-all font-medium border flex items-center gap-1 cursor-pointer ${
            resetConfirm
              ? "bg-rose-50 border-rose-300 text-rose-700 font-semibold animate-pulse"
              : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800"
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">
            {resetConfirm ? "warning" : "restart_alt"}
          </span>
          <span className="hidden sm:inline">
            {resetConfirm ? "Onay için tekrar tıkla" : "Demo Sıfırla"}
          </span>
        </button>

        <span className="text-xs text-slate-400 font-mono hidden lg:inline">BCT-HQ · Canlı</span>
      </div>
    </header>
  );
}
