"use client";

import { useState } from "react";
import { useStore } from "@/lib/useStore";
import { type StudioDelay } from "@/lib/store";

interface StudioDelayModalProps {
  isOpen: boolean;
  studioName: "Gri Stüdyo" | "Orta Stüdyo";
  currentDelay?: StudioDelay;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

const PRESET_REASONS = [
  "Röportaj / Çekim uzadı",
  "Konuk stüdyodan geç çıkıyor",
  "Teknik aksaklık / Tekrar çekim",
  "Makyaj & Işık hazırlığı uzadı",
];

export default function StudioDelayModal({
  isOpen,
  studioName,
  currentDelay,
  onClose,
  onSuccess,
}: StudioDelayModalProps) {
  const { sendStudioDelayAlert, clearStudioDelay } = useStore();

  const [minutes, setMinutes] = useState<number>(currentDelay?.delayMinutes || 15);
  const [reason, setReason] = useState<string>(currentDelay?.reason || PRESET_REASONS[0]);

  if (!isOpen) return null;

  function handleSendDelay(e: React.FormEvent) {
    e.preventDefault();
    if (minutes <= 0) return;

    sendStudioDelayAlert(studioName, minutes, reason.trim() || undefined);
    if (onSuccess) {
      onSuccess(`⚠️ ${studioName} için +${minutes} dk sarkma tüm birimlere ve bekleme salonuna duyuruldu.`);
    }
    onClose();
  }

  function handleClearDelay() {
    clearStudioDelay(studioName);
    if (onSuccess) {
      onSuccess(`✅ ${studioName} normale döndü bildirimi gönderildi.`);
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-white text-[24px]">timer</span>
            <div>
              <h2 className="text-base font-bold tracking-tight">Stüdyo Çekim Sarkması / Gecikme Bildirimi</h2>
              <p className="text-xs text-amber-100 font-medium">{studioName} — Canlı Prodüksiyon Uyarısı</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSendDelay} className="p-6 space-y-5">
          {/* Active delay banner if already delayed */}
          {currentDelay && currentDelay.active && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <div>
                  <strong>Mevcut Bildirilen Sarkma: +{currentDelay.delayMinutes} dk</strong>
                  <p className="text-[11px] text-amber-700 mt-0.5">{currentDelay.reason} ({currentDelay.reportedAt})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClearDelay}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs transition cursor-pointer"
              >
                Normale Döndü ✕
              </button>
            </div>
          )}

          {/* Explanation Info Box */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <span className="material-symbols-outlined text-blue-600 text-[18px]">info</span>
              <span>Bu Bildirim Neleri Etkiler?</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Çekim uzadığında bu uyarı anında Danışma, Bekleme Salonu ve Çağrı Merkezi ekranlarına kırmızı/sarı alarm olarak düşer. {studioName}&apos;ya sıradaki randevusu olan konukların temsilcilerine telefonla arayıp bilgi vermeleri için uyarı iletilir.
            </p>
          </div>

          {/* Hızlı Dakika Seçicileri */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Tahmini Gecikme / Sarkma Süresi:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[10, 15, 20, 30].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMinutes(m)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    minutes === m
                      ? "bg-amber-500 border-amber-600 text-white shadow-xs font-black"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  +{m} dk
                </button>
              ))}
            </div>

            {/* Manuel Dakika Girişi */}
            <div className="mt-2.5 flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">veya serbest dakika:</span>
              <input
                type="number"
                min="5"
                max="120"
                value={minutes}
                onChange={(e) => setMinutes(parseInt(e.target.value, 10) || 0)}
                className="w-24 h-9 px-3 rounded-lg border border-slate-300 font-mono font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-xs font-bold text-slate-700">dakika sarkma</span>
            </div>
          </div>

          {/* Gerekçe / Neden Seçimi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Gecikme Gerekçesi:
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_REASONS.map((pr) => (
                <button
                  key={pr}
                  type="button"
                  onClick={() => setReason(pr)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer border ${
                    reason === pr
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  {pr}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Gerekçe yazınız..."
              className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">campaign</span>
              <span>Gecikmeyi Tüm Sisteme Duyur</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
