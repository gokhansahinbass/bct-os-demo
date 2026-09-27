"use client";

import { useState } from "react";
import { useStore } from "@/lib/useStore";

export default function YonetimPage() {
  const { guests } = useStore();
  const [dispatchState, setDispatchState] = useState<"idle" | "loading" | "done">("idle");
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleDispatch() {
    setDispatchState("loading");
    setTimeout(() => {
      setDispatchState("done");
      setFeedback("✓ Görev dağıtımı onaylandı. İlgili ekiplere ve stajyer terminallerine operasyon bildirimleri gönderildi.");
      setTimeout(() => {
        setDispatchState("idle");
      }, 5000);
    }, 900);
  }

  // Dynamic calculations from guests
  const totalCiro = guests.reduce((sum, g) => {
    const raw = parseInt(g.amount.replace(/\D/g, ""), 10) || 0;
    return sum + raw;
  }, 0);

  const vipCount = guests.filter((g) => g.vip).length;
  const inReviewCount = guests.filter((g) => ["edit_done", "reviewing"].includes(g.status)).length;
  const inEditingCount = guests.filter((g) => g.status === "editing").length;

  return (
    <div className="flex flex-col w-full">
      <div className="max-w-6xl mx-auto w-full py-4 space-y-8">
        {/* Page Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-[#0F172A]">Yönetim Kokpiti</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-600 font-mono uppercase tracking-wider">
                BCT-EXEC-HQ
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Stüdyo Genel Müdürlüğü — Çağrı merkezi oda liderlik tablosu ve yapay zeka operasyon bülteni
            </p>
          </div>
          <div className="inline-flex items-center gap-2 self-start md:self-auto px-3 py-1.5 rounded-full bg-white shadow-sm text-sm text-[#0F172A] border border-slate-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="font-medium text-slate-500">Canlı Sistem</span>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-[11px] text-[#0F172A]">Aktif Konuk: {guests.length}</span>
          </div>
        </header>

        {feedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center justify-between shadow-xs">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-base">task_alt</span>
              {feedback}
            </span>
            <button onClick={() => setFeedback(null)} className="text-emerald-700 hover:text-emerald-950 font-semibold text-xs">
              Kapat
            </button>
          </div>
        )}

        {/* Call Center Leaderboard */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#0F172A]">Günlük Çağrı &amp; Satış Liderliği</h2>
            <span className="text-[11px] text-slate-500">Hedef: Oda Başına 10 Çekim / Gün</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Room 1 */}
            <article className="bg-white rounded-xl p-5 shadow-sm transition hover:shadow-md flex flex-col justify-between border border-slate-200">
              <div>
                <div className="flex items-center justify-between pb-3">
                  <span className="text-sm font-semibold text-[#0F172A]">Oda 1 Performansı</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-amber-50 text-amber-900 shadow-sm font-semibold">
                    🏆 1. Sırada
                  </span>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <div className="text-3xl font-bold text-[#0F172A] tracking-tight">
                    {Math.max(guests.length, 12)} <span className="text-base font-normal text-slate-500">Çekim</span>
                  </div>
                  <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-medium font-mono">+40% Delta</span>
                </div>
                <div className="mt-4 bg-slate-50 p-3 rounded-lg flex items-center justify-between text-sm text-[#0F172A]">
                  <span className="font-medium">{vipCount + 4} VIP Satış</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-mono font-semibold text-[#2563EB]">
                    {(totalCiro + 120000).toLocaleString("tr-TR")} TL
                  </span>
                </div>
              </div>
              <div className="mt-5 pt-3">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="text-slate-500">Hedef Gerçekleşme</span>
                  <span className="font-semibold text-emerald-800 font-mono">%140</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: "100%" }}></div>
                </div>
              </div>
            </article>

            {/* Room 2 */}
            <article className="bg-white rounded-xl p-5 shadow-sm transition hover:shadow-md flex flex-col justify-between border border-slate-200">
              <div>
                <div className="flex items-center justify-between pb-3">
                  <span className="text-sm font-semibold text-[#0F172A]">Oda 2 Performansı</span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] bg-slate-100 text-slate-500 font-medium">3. Sırada</span>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <div className="text-3xl font-bold text-[#0F172A] tracking-tight">
                    7 <span className="text-base font-normal text-slate-500">Çekim</span>
                  </div>
                  <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-medium font-mono">-30% Delta</span>
                </div>
                <div className="mt-4 bg-slate-50 p-3 rounded-lg flex items-center justify-between text-sm text-[#0F172A]">
                  <span className="font-medium">2 VIP Satış</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-mono font-semibold text-slate-500">80.000 TL</span>
                </div>
              </div>
              <div className="mt-5 pt-3">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="text-slate-500">Hedef Gerçekleşme</span>
                  <span className="font-semibold text-amber-800 font-mono">%70</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: "70%" }}></div>
                </div>
              </div>
            </article>

            {/* Room 3 */}
            <article className="bg-white rounded-xl p-5 shadow-sm transition hover:shadow-md flex flex-col justify-between border border-slate-200">
              <div>
                <div className="flex items-center justify-between pb-3">
                  <span className="text-sm font-semibold text-[#0F172A]">Oda 3 Performansı</span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] bg-blue-50 text-[#2563EB] font-medium">2. Sırada</span>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <div className="text-3xl font-bold text-[#0F172A] tracking-tight">
                    11 <span className="text-base font-normal text-slate-500">Çekim</span>
                  </div>
                  <span className="text-[11px] text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded font-medium font-mono">+10% Delta</span>
                </div>
                <div className="mt-4 bg-slate-50 p-3 rounded-lg flex items-center justify-between text-sm text-[#0F172A]">
                  <span className="font-medium">5 VIP Satış</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-mono font-semibold text-[#2563EB]">190.000 TL</span>
                </div>
              </div>
              <div className="mt-5 pt-3">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="text-slate-500">Hedef Gerçekleşme</span>
                  <span className="font-semibold text-[#2563EB] font-mono">%110</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#2563EB] h-1.5 rounded-full" style={{ width: "100%" }}></div>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* AI Operations Report */}
        <section className="bg-white rounded-xl p-6 md:p-8 shadow-sm space-y-6 border border-slate-200">
          {/* Report Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#2563EB] font-bold shadow-sm">
                <span className="material-symbols-outlined">smart_toy</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#0F172A]">Gün Sonu Operasyon ve Görev Dağıtım Bülteni</h2>
                <p className="text-sm text-slate-500">İzleme, revize kuyrukları ve yarınki stajyer operasyonel yük dağıtımı</p>
              </div>
            </div>
            <div className="self-start md:self-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] bg-slate-100 text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                Yapay Zeka Analiz Modülü v4.2 • Canlı Durum
              </span>
            </div>
          </div>

          {/* Bottleneck Alert */}
          <div className="bg-amber-50 rounded-xl p-5 text-amber-900 shadow-sm border border-amber-200">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-700 mt-0.5">warning</span>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-amber-900">Anlık Darboğaz Analizi</h3>
                <p className="text-sm text-amber-950 leading-relaxed font-medium">
                  {inReviewCount > 0
                    ? `Kurgusu biten ${inReviewCount} video izleme masasında onay bekliyor.`
                    : "İzleme masasında bekleyen kritik darboğaz yok."}{" "}
                  {inEditingCount > 0 ? `Montajda kurguda ${inEditingCount} video işlem görüyor.` : ""}
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-100 text-amber-950 font-semibold font-mono">
                    Canlı Durum
                  </span>
                  <span className="text-amber-900">
                    Dijital teslimat sırası için kapasite dengesi korunuyor.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Intern Assignments */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#0F172A]">Yarınki Personel &amp; Stajyer Görev Dağıtımı</h3>
              <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-1 rounded">
                Toplam: 8 Operatör Aktif
              </span>
            </div>
            <p className="text-sm text-slate-500">Yarın ofiste 8 operatör ve stajyer olacak. Yapay zeka kapasite planlaması:</p>
            <div className="space-y-3">
              {/* Item 1 */}
              <div className="bg-slate-50 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border border-slate-200/60 hover:bg-slate-100/60 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] bg-slate-200 text-slate-600 font-medium">Giriş &amp; Karşılama</span>
                    <h4 className="text-sm font-semibold text-[#0F172A]">Caner &amp; Melisa → Kiosk Karşılama</h4>
                  </div>
                  <p className="text-sm text-slate-500">Stüdyo giriş terminalinde misafir yönlendirmesi ve alt bant (KJ) onay desteği.</p>
                </div>
                <span className="font-mono text-[11px] text-slate-500 bg-white px-2 py-1 rounded shadow-sm border border-slate-200">08:30 - 18:00</span>
              </div>

              {/* Item 2: Critical */}
              <div className="bg-red-50 rounded-lg p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 border border-red-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] bg-red-600 text-white font-semibold uppercase tracking-wider">Acil / Darboğaz Çözümü</span>
                    <h4 className="text-sm font-semibold text-red-900">Mert &amp; Berk → Biriken videoların acil izlenmesi ve revize kontrolü</h4>
                  </div>
                  <p className="text-sm text-red-800">İzleme masasında onay bekleyen işlerin tamamlanıp yayına aktarılması (09:00 - 11:30).</p>
                </div>
                <span className="font-mono text-[11px] text-red-800 bg-white/80 px-2 py-1 rounded font-semibold border border-red-200">
                  Kuyruk: {inReviewCount} Dosya
                </span>
              </div>

              {/* Item 3 */}
              <div className="bg-slate-50 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border border-slate-200/60 hover:bg-slate-100/60 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] bg-blue-100 text-[#2563EB] font-medium">Yayın &amp; Otomasyon</span>
                    <h4 className="text-sm font-semibold text-[#0F172A]">Selin → YouTube başlık ve açıklamalarının kontrolü</h4>
                  </div>
                  <p className="text-sm text-slate-500">Otomatik üretilen metinlerin SEO ve etiket denetimi, dijital kart eşleştirmesi.</p>
                </div>
                <span className="font-mono text-[11px] text-slate-500 bg-white px-2 py-1 rounded shadow-sm border border-slate-200">11:00 - 16:30</span>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <footer className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <span className="material-symbols-outlined text-emerald-600">notifications_active</span>
              <span>Tüm ekipler Slack ve SMS entegrasyonu üzerinden bilgilendirilecektir</span>
            </div>
            <button
              className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white text-sm font-semibold shadow-sm transition active:scale-[0.99] cursor-pointer ${
                dispatchState === "done" ? "bg-emerald-700" : "bg-[#2563EB] hover:bg-[#1D4ED8]"
              }`}
              onClick={handleDispatch}
              disabled={dispatchState !== "idle"}
            >
              {dispatchState === "idle" && (
                <>
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  Görev Dağıtımını Onayla ve Ekiplere Bildir
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </>
              )}
              {dispatchState === "loading" && (
                <>
                  <span className="material-symbols-outlined animate-spin text-base">sync</span>
                  Görevler Dağıtılıyor...
                </>
              )}
              {dispatchState === "done" && (
                <>
                  <span className="material-symbols-outlined text-base">check</span>
                  Ekiplere Bildirildi &amp; Yayında
                </>
              )}
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
}
