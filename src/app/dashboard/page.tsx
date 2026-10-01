"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/lib/useStore";
import { exportGuestsToCSV } from "@/lib/exportUtils";

export default function DashboardOverviewPage() {
  const {
    guests,
    staff,
    auditLogs,
    currentUser,
    activeRole,
    activeRoleDef,
    isSensitiveBlurred,
    notifications,
  } = useStore();

  // Finansal Hesaplamalar
  const totalCiro = useMemo(() => {
    return guests.reduce((sum, g) => {
      const raw = parseInt((g.amount || "0").replace(/\D/g, ""), 10) || 0;
      return sum + raw;
    }, 0);
  }, [guests]);

  const onOdemeToplami = useMemo(() => {
    return guests.reduce((sum, g) => sum + (g.onOdemeMiktari || 0), 0);
  }, [guests]);

  // Durum Sayaçları
  const todayGuests = useMemo(() => {
    return guests.filter((g) => g.status !== "cancelled");
  }, [guests]);

  const arrivedCount = useMemo(() => {
    return guests.filter((g) =>
      ["kiosk_registered", "in_studio", "shoot_done", "package_set", "editing", "edit_done", "review_approved", "publishing", "archived"].includes(g.status)
    ).length;
  }, [guests]);

  const inEditingCount = useMemo(() => {
    return guests.filter((g) => g.status === "editing").length;
  }, [guests]);

  const inReviewCount = useMemo(() => {
    return guests.filter((g) => ["edit_done", "reviewing"].includes(g.status)).length;
  }, [guests]);

  // Dergi Siparişleri Sayaçları
  const magazineCounts = useMemo(() => {
    let total = 0;
    let bekleyen = 0;
    let tasarimda = 0;
    let bitti = 0;

    guests.forEach((g) => {
      g.services?.forEach((s) => {
        if (s.type === "dergi") {
          total++;
          const st = s.magazineStatus || "icerik_bekleniyor";
          if (st === "icerik_bekleniyor") bekleyen++;
          else if (st === "tasarimda" || st === "icerik_geldi") tasarimda++;
          else if (st === "tamamlandi") bitti++;
        }
      });
    });

    return { total, bekleyen, tasarimda, bitti };
  }, [guests]);

  // Ek Hizmetler Sayaçları
  const extraServicesCounts = useMemo(() => {
    let total = 0;
    let completed = 0;

    guests.forEach((g) => {
      g.services?.forEach((s) => {
        if (s.type !== "dergi") {
          s.details?.forEach((d) => {
            total++;
            if (d.checked || d.status === "tamamlandi") completed++;
          });
        }
      });
    });

    return { total, completed, pending: total - completed };
  }, [guests]);

  const isBlurred = isSensitiveBlurred("revenue");

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Üst Hoş Geldiniz Başlığı & Hızlı Aksiyonlar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 rounded-2xl text-white shadow-sm border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
              BCT-OS v2.4 Prodüksiyon
            </span>
            <span className="text-xs text-slate-400">Canlı Sistem</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Hoş Geldiniz,</span>
            <span className="text-blue-400">{currentUser?.name || "Yönetici"}</span>
            <span>👋</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1">
            Mevcut Rolünüz: <strong className="text-white">{activeRoleDef?.label || activeRole}</strong> — Stüdyo operasyonlarının anlık durum özeti
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportGuestsToCSV(guests)}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <span>📥</span>
            <span>Excel'e Aktar</span>
          </button>

          {activeRole === "admin" && (
            <Link
              href="/dashboard/admin"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <span>⚙️</span>
              <span>Sistem Ayarları</span>
            </Link>
          )}

          {activeRole === "dergi_tasarimci" && (
            <Link
              href="/dashboard/dergi"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <span>📖</span>
              <span>Dergi Masası</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── 4 Ana Metrik KPI Kartı ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Finansal Ciro */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Toplam Ciro</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
              ₺
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black text-slate-900 font-mono ${isBlurred ? "blur-sm select-none" : ""}`}>
              {totalCiro.toLocaleString("tr-TR")} ₺
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Ön Ödeme: <strong className={isBlurred ? "blur-sm" : ""}>{onOdemeToplami.toLocaleString("tr-TR")} ₺</strong>
          </p>
        </div>

        {/* KPI 2: Randevu & Karşılama */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Bugünkü Konuklar</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
              👥
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-700 font-mono">
              {arrivedCount} <span className="text-base text-slate-400 font-normal">/ {todayGuests.length}</span>
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            ✓ Stüdyoya giriş yapanlar karşılandı
          </p>
        </div>

        {/* KPI 3: Dergi Masası */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Dergi Portalı</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
              📖
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-700 font-mono">
              {magazineCounts.bitti} <span className="text-base text-slate-400 font-normal">/ {magazineCounts.total}</span>
            </span>
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-1">
            ⏳ {magazineCounts.bekleyen} konuktan içerik bekleniyor
          </p>
        </div>

        {/* KPI 4: Kurgu & Revize */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Montaj &amp; Kurgu</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
              ✂️
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {inEditingCount} <span className="text-xs text-amber-600 font-bold font-sans">Kurguda</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            İzlemede onay bekleyen: <strong>{inReviewCount} video</strong>
          </p>
        </div>
      </div>

      {/* ── İki Kolonlu Alt Düzen: Hızlı Geçişler & Canlı Aktivite Günlüğü ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Kolon (2 Birim): Hızlı Modül Yönlendirmeleri & Süreç */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hızlı Erişim Kartları */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>🚀</span>
              <span>Departman &amp; Çalışma Alanı Kısayolları</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <Link
                href="/dashboard/cagri-merkezi"
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 transition group"
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="text-lg">📞</span>
                  <span className="font-bold text-xs text-slate-900 group-hover:text-blue-700">Çağrı Merkezi</span>
                </div>
                <p className="text-[11px] text-slate-500">Randevu listeleri, satış odaları ve konuk durumu.</p>
              </Link>

              <Link
                href="/dashboard/dergi"
                className="p-4 rounded-xl border border-slate-200 hover:border-purple-400 bg-slate-50/50 hover:bg-purple-50/30 transition group"
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="text-lg">📖</span>
                  <span className="font-bold text-xs text-slate-900 group-hover:text-purple-700">Dergi Masası</span>
                </div>
                <p className="text-[11px] text-slate-500">Kapak, röportaj takibi, dosya yükleme ve baskı onayı.</p>
              </Link>

              <Link
                href="/dashboard/ek-hizmetler"
                className="p-4 rounded-xl border border-slate-200 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/30 transition group"
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="text-lg">📰</span>
                  <span className="font-bold text-xs text-slate-900 group-hover:text-emerald-700">Ek Hizmetler</span>
                </div>
                <p className="text-[11px] text-slate-500">15 Haber sitesi, shorts, reels ve yayın linkleri.</p>
              </Link>

              <Link
                href="/dashboard/montaj"
                className="p-4 rounded-xl border border-slate-200 hover:border-amber-400 bg-slate-50/50 hover:bg-amber-50/30 transition group"
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="text-lg">🎬</span>
                  <span className="font-bold text-xs text-slate-900 group-hover:text-amber-700">Montaj Odası</span>
                </div>
                <p className="text-[11px] text-slate-500">Kurgu sırası, ham görüntüler ve render takibi.</p>
              </Link>

              <Link
                href="/dashboard/izleme"
                className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30 transition group"
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="text-lg">👁️</span>
                  <span className="font-bold text-xs text-slate-900 group-hover:text-indigo-700">İzleme Masası</span>
                </div>
                <p className="text-[11px] text-slate-500">Müşteri ile revize video onayı ve yayın hazırlığı.</p>
              </Link>

              <Link
                href="/dashboard/yonetim"
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 transition group"
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="text-lg">📊</span>
                  <span className="font-bold text-xs text-slate-900 group-hover:text-blue-700">Yönetim Kokpiti</span>
                </div>
                <p className="text-[11px] text-slate-500">Oda rekabeti, kurgucu performansı ve ciro raporu.</p>
              </Link>
            </div>
          </div>

          {/* Bugünkü Konuk Akışı */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🗓️</span>
                <span>Randevu ve Stüdyo Akışı ({todayGuests.slice(0, 5).length})</span>
              </h2>
              <Link href="/dashboard/cagri-merkezi" className="text-xs font-bold text-blue-600 hover:underline">
                Tümünü Gör →
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {todayGuests.slice(0, 5).map((g) => (
                <div key={g.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 font-bold text-slate-700 text-xs flex items-center justify-center shrink-0">
                      {g.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{g.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{g.company} • {g.representative}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {g.appointmentTime || "15:00"}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        g.status === "kiosk_registered"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : g.status === "cancelled"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {g.status === "kiosk_registered" ? "Stüdyoda" : g.status === "cancelled" ? "İptal" : "Randevulu"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sağ Kolon (1 Birim): Canlı Denetim İzi & Aktivite Akışı (Audit Trail) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span>📜</span>
                  <span>Denetim İzi (Audit Trail)</span>
                </h3>
                <p className="text-[11px] text-slate-500">Kim, ne zaman, ne yaptı?</p>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                CANLI
              </span>
            </div>

            <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
              {auditLogs.slice(0, 10).map((log) => {
                const badgeColor =
                  log.category === "dergi"
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : log.category === "ek_hizmet"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : log.category === "kurgu"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : log.category === "system"
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                    : "bg-blue-50 text-blue-700 border-blue-200";

                return (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-slate-900">{log.userName}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${badgeColor}`}>
                        {log.action}
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium truncate">{log.target}</p>
                    {log.details && <p className="text-[11px] text-slate-400 italic line-clamp-2">{log.details}</p>}
                    <span className="text-[10px] text-slate-400 block pt-1">
                      {new Date(log.timestamp).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
