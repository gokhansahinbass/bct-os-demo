"use client";

import { useStore } from "@/lib/useStore";

export default function StudioDelayBanner() {
  const { studioDelays, clearStudioDelay, activeRole, isRealAdmin } = useStore();

  const delays = Object.values(studioDelays || {}).filter((d) => d && d.active);

  if (delays.length === 0) return null;

  const canClear = activeRole === "reji" || activeRole === "admin" || isRealAdmin;

  return (
    <div className="mb-6 space-y-2 animate-fadeIn">
      {delays.map((d) => (
        <div
          key={d.studio}
          className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white shadow-md border border-amber-400/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[28px] text-white shrink-0 mt-0.5 animate-pulse">
              warning
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-black/25 text-white text-xs font-mono font-bold uppercase tracking-wider">
                  {d.studio}
                </span>
                <span className="text-sm font-extrabold tracking-tight">
                  ÇEKİM SARKMASI: ~{d.delayMinutes} DK GECİKME!
                </span>
                <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-medium">
                  {d.reportedAt} Bildirildi
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-1 leading-relaxed">
                Stüdyodaki çekim uzadığı için sıradaki randevulu konukların stüdyoya alımı gecikebilir.
                {d.reason ? ` Gerekçe: "${d.reason}".` : ""} Bekleme salonundaki misafirlere ve davet eden temsilcilere bilgi veriniz.
              </p>
            </div>
          </div>

          {canClear && (
            <button
              onClick={() => clearStudioDelay(d.studio)}
              className="shrink-0 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              title="Gecikmeyi sonlandır ve stüdyoyu normale döndür"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Normale Döndü ✕</span>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
