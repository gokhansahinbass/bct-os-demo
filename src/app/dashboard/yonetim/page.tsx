"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/lib/useStore";
import { addNotification } from "@/lib/store";

export default function YonetimPage() {
  const { guests, staff, rooms, canAccessPage, isSensitiveBlurred, activeRoleDef } = useStore();
  const [dispatchState, setDispatchState] = useState<"idle" | "loading" | "done">("idle");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const [showCompetitionModal, setShowCompetitionModal] = useState(false);

  function handleDispatch() {
    setDispatchState("loading");
    setTimeout(() => {
      setDispatchState("done");
      addNotification({
        to: "all",
        from: "system",
        type: "task",
        title: "Görev Dağıtımı Onaylandı",
        message: "Yarınki operasyon görev dağıtımı onaylandı. Tüm ekipler bilgilendirildi.",
        link: "/dashboard/yonetim",
      });
      setFeedback("✓ Görev dağıtımı onaylandı. İlgili ekiplere site içi bildirim gönderildi.");
      setTimeout(() => { setDispatchState("idle"); }, 5000);
    }, 900);
  }

  // Dynamic calculations
  const totalCiro = guests.reduce((sum, g) => {
    const raw = parseInt((g.amount || "0").replace(/\D/g, ""), 10) || 0;
    return sum + raw;
  }, 0);

  const inReviewCount = guests.filter((g) => ["edit_done", "reviewing"].includes(g.status)).length;
  const inEditingCount = guests.filter((g) => g.status === "editing").length;

  // ═════════════════════════════════════════════════
  // 1. ODA METRİKLERİ (Sadece Call Center Odaları)
  // ═════════════════════════════════════════════════
  function getRoomMetrics(roomId: string) {
    const roomGuests = guests.filter((g) => g.room === roomId);
    const roomStaff = staff.filter((s) => s.room === roomId);
    const ciro = roomGuests.reduce((sum, g) => sum + (parseInt((g.amount || "0").replace(/\D/g, ""), 10) || 0), 0);
    const onOdemeToplami = roomGuests.reduce((sum, g) => sum + (g.onOdemeMiktari || 0), 0);
    const successfulSales = roomGuests.filter((g) => (parseInt((g.amount || "0").replace(/\D/g, ""), 10) > 0) || (g.services && g.services.length > 0)).length;
    const failedSales = roomGuests.length - successfulSales;
    const avgBasket = successfulSales > 0 ? Math.round(ciro / successfulSales) : 0;
    const conversionRate = roomGuests.length > 0 ? Math.round((successfulSales / roomGuests.length) * 100) : 0;

    return {
      total: roomGuests.length,
      ciro,
      onOdemeToplami,
      successfulSales,
      failedSales,
      avgBasket,
      conversionRate,
      staffCount: roomStaff.length,
      staff: roomStaff,
      guests: roomGuests,
    };
  }

  const rankedRooms = rooms
    .map((room) => ({ room, metrics: getRoomMetrics(room.id) }))
    .sort((a, b) => b.metrics.ciro - a.metrics.ciro);

  // ═════════════════════════════════════════════════
  // 2. MONTAJ ODASI & KURGUCU PERFORMANS VERİLERİ (Requirement 8)
  // ═════════════════════════════════════════════════
  const editors = useMemo(() => {
    // Kurgu ekibindeki personel veya videolara atanmış editörler
    const editorNames = Array.from(new Set([
      "Gökhan",
      ...staff.filter(s => s.department?.includes("Montaj") || s.department?.includes("Kurgu") || s.role?.includes("Kurgu") || s.role?.includes("Montaj")).map(s => s.name.split(" ")[0]),
      ...guests.filter(g => g.editor).map(g => g.editor)
    ])).filter(Boolean);

    return editorNames.map((edName) => {
      const assignedGuests = guests.filter(g => g.editor === edName || (edName === "Gökhan" && (!g.editor || g.editor === "Gökhan")));
      const completedCount = assignedGuests.filter(g => ["review_approved", "publishing", "archived", "edit_done"].includes(g.status)).length;
      const inProgressCount = assignedGuests.filter(g => g.status === "editing").length;
      const revisedGuests = assignedGuests.filter(g => g.notes && g.notes.length > 0);
      const totalNotesCount = assignedGuests.reduce((sum, g) => sum + (g.notes?.length || 0), 0);
      const revisionRate = assignedGuests.length > 0 ? Math.round((revisedGuests.length / assignedGuests.length) * 100) : 0;

      return {
        name: edName,
        completedCount,
        inProgressCount,
        revisedCount: revisedGuests.length,
        totalNotesCount,
        revisionRate,
        totalAssigned: assignedGuests.length,
      };
    }).sort((a, b) => b.completedCount - a.completedCount);
  }, [guests, staff]);

  // ═════════════════════════════════════════════════
  // 3. PAZARLAMACI / SATIŞ BAŞARI ANALİTİĞİ (SADECE PAZARLAMACILAR)
  // Pazarlamacılar oda çalışanı DEĞİLDİR! Stüdyoya fiilen GELEN
  // konuklara satış yapan Pazarlama Masası uzmanlarıdır.
  // ═════════════════════════════════════════════════
  const marketers = useMemo(() => {
    // Sadece gerçek pazarlamacılar (Pazarlama Masası)
    const marketingStaff = [
      {
        id: "usr-selin",
        name: "Selin Karaca",
        title: "Kıdemli Pazarlama Uzmanı",
        department: "Pazarlama Masası",
        avatar: "SK",
      },
      {
        id: "usr-burak",
        name: "Burak Aksoy",
        title: "Pazarlama Sorumlusu",
        department: "Pazarlama Masası",
        avatar: "BA",
      },
    ];

    return marketingStaff.map((m) => {
      // Bu pazarlamacının sorumlu olduğu konuklar:
      const assignedGuests = guests.filter((g) => g.marketer === m.name);
      
      // Pazarlamacı stüdyoya fiilen GELEN konuklara satış yapar (iptal veya henüz gelmemiş randevular pazarlamaya girmez):
      const arrivedGuests = assignedGuests.filter((g) => g.status !== "cancelled" && g.status !== "appointment_set");

      // Başarılı satış: Ücretli paket / hizmet alanlar
      const successfulGuests = arrivedGuests.filter((g) => {
        const hasServices = g.services && g.services.length > 0 && g.services.some((s) => s.price > 0);
        const hasAmount = parseInt((g.amount || "0").replace(/\D/g, ""), 10) > 0;
        return hasServices || hasAmount;
      });

      // Başarısız satış: Stüdyoya gelmiş ancak hiçbir ücretli paket almamış (ücretsiz yayınla yetinmiş)
      const failedGuests = arrivedGuests.filter((g) => {
        const hasServices = g.services && g.services.length > 0 && g.services.some((s) => s.price > 0);
        const hasAmount = parseInt((g.amount || "0").replace(/\D/g, ""), 10) > 0;
        return !hasServices && !hasAmount;
      });

      // Toplam Ciro:
      const totalRevenue = successfulGuests.reduce((sum, g) => {
        const svcSum = (g.services || []).reduce((sSum, s) => sSum + (s.price || 0), 0);
        const amt = parseInt((g.amount || "0").replace(/\D/g, ""), 10) || 0;
        return sum + (svcSum > 0 ? svcSum : amt);
      }, 0);

      // Alınan Ön Ödeme:
      const onOdemeToplami = successfulGuests.reduce((sum, g) => sum + (g.onOdemeMiktari || 0), 0);

      // Tam Tahsilat:
      const tamTahsilatToplami = successfulGuests.filter((g) => g.paymentStatus === "tamamlandi").reduce((sum, g) => {
        const svcSum = (g.services || []).reduce((sSum, s) => sSum + (s.price || 0), 0);
        const amt = parseInt((g.amount || "0").replace(/\D/g, ""), 10) || 0;
        return sum + (svcSum > 0 ? svcSum : amt);
      }, 0);

      // Sepet Ortalaması (TL)
      const avgBasket = successfulGuests.length > 0 ? Math.round(totalRevenue / successfulGuests.length) : 0;

      // Satış Kapatma / Başarı Oranı: (Gelen konuklar arasında paket satma yüzdesi)
      const conversionRate = arrivedGuests.length > 0 ? Math.round((successfulGuests.length / arrivedGuests.length) * 100) : 0;

      return {
        ...m,
        totalRevenue,
        onOdemeToplami,
        tamTahsilatToplami,
        totalGuests: arrivedGuests.length,
        successfulCount: successfulGuests.length,
        failedCount: failedGuests.length,
        avgBasket,
        conversionRate,
        successfulGuests,
        failedGuests,
        allAssigned: assignedGuests,
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [guests]);

  if (!canAccessPage("/dashboard/yonetim")) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs max-w-xl mx-auto my-12 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-3xl border border-amber-200 shadow-inner">
          🔒
        </div>
        <h2 className="text-lg font-bold text-slate-900">Erişim Yetkiniz Bulunmuyor</h2>
        <p className="text-xs text-slate-500">
          Mevcut rolünüz ({activeRoleDef?.label || "Rolünüz"}) Yönetim Kokpiti modülünü görüntüleme yetkisine sahip değildir.
        </p>
        <Link href="/dashboard" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition">
          Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

  const isRevBlurred = isSensitiveBlurred("revenue");
  const isMontajBlurred = isSensitiveBlurred("montaj");

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="max-w-6xl mx-auto w-full py-4 space-y-8">
        {/* Page Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#0F172A]">Yönetim Kokpiti</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 font-mono font-bold uppercase">
                BCT-EXEC-HQ
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Stüdyo Genel Müdürlüğü — Satış, montaj analitiği ve odalar arası rekabet ligi
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCompetitionModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-bold shadow-xs cursor-pointer transition"
            >
              <span>🏆</span> Odalar Arası Rekabet Analiz Tablosu
            </button>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white shadow-xs text-xs font-semibold text-[#0F172A] border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Canlı Ciro: {isRevBlurred ? "₺***.***" : `${totalCiro.toLocaleString("tr-TR")} TL`}</span>
            </div>
          </div>
        </header>

        {feedback && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs">
            <span>{feedback}</span>
            <button onClick={() => setFeedback(null)} className="text-emerald-700 font-bold cursor-pointer">✕</button>
          </div>
        )}

        {/* ═════════════════════════════════════════════════ */}
        {/* 1. CALL CENTER ODA LİDERLİK TABLOSU (3 Satış Odası) */}
        {/* ═════════════════════════════════════════════════ */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-200 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#0F172A]">Call Center Satış Odaları Yarışı</h2>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                  Teyit &amp; Ciro Ligi
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Odalar birbirleriyle teyit ve satış cirosu konusunda yarışır. Kurgu odası bu yarışın dışındadır.
              </p>
            </div>
            <button
              onClick={() => setShowCompetitionModal(true)}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer self-start sm:self-auto"
            >
              Detaylı Karşılaştırma Matrisini Aç →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {rankedRooms.map(({ room, metrics }, idx) => {
              const rank = idx + 1;
              const isExpanded = expandedRoom === room.id;
              const goalPct = Math.min(Math.round((metrics.ciro / 100000) * 100), 150);

              return (
                <article
                  key={room.id}
                  className={`bg-white rounded-xl p-5 shadow-xs transition-all hover:shadow-md flex flex-col border cursor-pointer ${
                    isExpanded ? "border-[#2563EB] ring-2 ring-blue-100" : "border-slate-200"
                  }`}
                  onClick={() => setExpandedRoom(isExpanded ? null : room.id)}
                >
                  <div>
                    <div className="flex items-center justify-between pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: room.color }}></div>
                        <span className="font-bold text-base text-[#0F172A]">{room.name}</span>
                      </div>
                      {rank === 1 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                          🏆 1. Sırada (Şampiyon)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 font-medium">
                          {rank}. Sırada
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span className="font-semibold text-slate-700">
                        👑 Oda Şefi: {room.id === "oda-1" ? "Ayşe Yılmaz" : room.id === "oda-2" ? "Caner Kaya" : "Elif Arslan"}
                      </span>
                      <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                        {metrics.staffCount || 6} Personel
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">{room.description}</p>
                    
                    <div className="flex items-baseline justify-between mt-2">
                      <div className="text-3xl font-bold text-[#0F172A] tracking-tight">
                        {metrics.total} <span className="text-sm font-normal text-slate-500">Teyitli Konuk</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                        %{metrics.conversionRate} Başarı
                      </span>
                    </div>

                    <div className="mt-4 bg-slate-50 p-3 rounded-lg flex items-center justify-between text-xs text-[#0F172A] border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Toplam Ciro</span>
                        <strong className="font-mono text-sm font-bold text-blue-700">₺{metrics.ciro.toLocaleString("tr-TR")}</strong>
                      </div>
                      <div className="w-px h-6 bg-slate-200" />
                      <div>
                        <span className="text-slate-400 block text-[10px]">Alınan Ön Ödeme</span>
                        <strong className="font-mono text-sm font-bold text-emerald-700">₺{metrics.onOdemeToplami.toLocaleString("tr-TR")}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500">Ciro Hedefi Gerçekleşme (100.000 TL)</span>
                      <span className="font-bold text-[#0F172A] font-mono">%{goalPct}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${goalPct >= 100 ? "bg-emerald-600" : goalPct >= 60 ? "bg-[#2563EB]" : "bg-amber-500"}`}
                        style={{ width: `${Math.min(goalPct, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-3 text-right">
                    <span className="text-[11px] text-blue-600 font-semibold">
                      {isExpanded ? "Detayları Gizle ▲" : "Konuk ve Temsilcileri Gör ▼"}
                    </span>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-3" onClick={(e) => e.stopPropagation()}>
                      <div className="grid grid-cols-2 gap-2 text-center text-xs">
                        <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                          <span className="text-[10px] text-emerald-600 block">Başarılı Paket Satışı</span>
                          <strong className="text-base text-emerald-800 font-bold">{metrics.successfulSales} Konuk</strong>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-500 block">Paketsiz / Ücretsiz</span>
                          <strong className="text-base text-slate-700 font-bold">{metrics.failedSales} Konuk</strong>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Bu Odanın Konukları:</h4>
                        <div className="space-y-1">
                          {metrics.guests.map(g => (
                            <div key={g.id} className="flex items-center justify-between text-xs p-2 rounded bg-slate-50 border border-slate-200/60">
                              <div>
                                <span className="font-semibold text-slate-800 block">{g.name}</span>
                                <span className="text-[10px] text-slate-500">
                                  Konuğu Getiren Temsilci: <strong className="text-blue-700">{g.representative}</strong>
                                </span>
                              </div>
                              <span className="font-mono text-[11px] font-bold text-slate-700">
                                {g.amount !== "0" ? `₺${g.amount}` : "Ücretsiz"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {/* ═════════════════════════════════════════════════ */}
        {/* 2. MONTAJ ODASI & KURGUCU PERFORMANS KARNESİ (Requirement 8) */}
        {/* ═════════════════════════════════════════════════ */}
        <section className="bg-white rounded-xl p-6 shadow-xs border border-slate-200 space-y-4 relative overflow-hidden">
          {/* Rol Kısıtlaması: Montaj verileri kapalıysa blurla */}
          {isMontajBlurred && (
            <div className="absolute inset-0 bg-white/85 backdrop-blur-xs z-30 rounded-xl flex flex-col items-center justify-center p-6 text-center border border-slate-200 shadow-md">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mb-2.5 shadow-inner border border-amber-200">
                🔒
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">
                Montaj Odası Analitiği Rolünüze Kısıtlanmıştır
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mb-2">
                Mevcut rolünüz ({activeRoleDef?.label || "Rolünüz"}) için montaj sayıları ve kurgucu performans karnesi gizlenmiştir.
              </p>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono border border-slate-200">
                Yetki Kodu: view_montaj_stats [KAPALI]
              </span>
            </div>
          )}

          <div className={isMontajBlurred ? "filter blur-sm select-none pointer-events-none" : ""}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 font-bold flex items-center justify-center">
                <span className="material-symbols-outlined">movie_edit</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#0F172A]">Montaj Odası &amp; Kurgucu Performans Karnesi</h2>
                  <span className="px-2 py-0.5 rounded text-[11px] bg-violet-50 text-violet-800 border border-violet-200 font-semibold">
                    Teknik Operasyon
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kurgucularda en çok kurguyu kim yaptı, kim kaç video bitirdi ve kimin kaç videosu revize aldı
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/montaj"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline self-start sm:self-auto"
            >
              Montaj Panosuna Git →
            </Link>
          </div>

          {/* Editors Performance Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="p-3">Kurgucu / Editör</th>
                  <th className="p-3 text-center">Bitirdiği Video</th>
                  <th className="p-3 text-center">Kurguda Olan</th>
                  <th className="p-3 text-center">Revize Alan Video</th>
                  <th className="p-3 text-center">Toplam Revize Notu</th>
                  <th className="p-3 text-center">Revize Oranı</th>
                  <th className="p-3 text-right">Liderlik Rozeti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {editors.map((ed, idx) => (
                  <tr key={ed.name} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 font-bold flex items-center justify-center text-xs">
                        {ed.name[0]}
                      </div>
                      <div>
                        <span>{ed.name}</span>
                        <span className="text-[10px] text-slate-400 block font-normal">Kurgu Departmanı</span>
                      </div>
                    </td>
                    <td className="p-3 text-center font-bold font-mono text-emerald-700 text-sm">
                      {ed.completedCount} Video
                    </td>
                    <td className="p-3 text-center font-mono text-blue-600 font-semibold">
                      {ed.inProgressCount} Video
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {ed.revisedCount} Video
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono text-slate-700 font-medium">
                      {ed.totalNotesCount} Not
                    </td>
                    <td className="p-3 text-center font-mono">
                      %{ed.revisionRate}
                    </td>
                    <td className="p-3 text-right">
                      {idx === 0 ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          🏆 En Çok Kurgu Bitiren
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════ */}
        {/* 3. PAZARLAMACI / SATIŞ BAŞARI ANALİTİĞİ (SADECE PAZARLAMACILAR) */}
        {/* ═════════════════════════════════════════════════ */}
        <section className="bg-white rounded-xl p-6 shadow-xs border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center">
                <span className="material-symbols-outlined">payments</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#0F172A]">Pazarlama Masası &amp; Satış Başarı Analitiği</h2>
                  <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                    Finans &amp; Satış
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sadece Pazarlama Masası uzmanlarının (Selin Karaca, Burak Aksoy) stüdyoya gelen konuklara yaptığı paket satışları, ciroları ve tahsilat karnesi
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/pazarlama"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline self-start sm:self-auto"
            >
              Pazarlama Masasına Git →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="p-3">Pazarlama Uzmanı</th>
                  <th className="p-3">Departman / Masa</th>
                  <th className="p-3 text-center">Görüştüğü Konuk</th>
                  <th className="p-3 text-right">Toplam Satış Cirosu</th>
                  <th className="p-3 text-right">Alınan Ön Ödeme</th>
                  <th className="p-3 text-center">Başarılı Satış</th>
                  <th className="p-3 text-center">Başarısız (Paketsiz)</th>
                  <th className="p-3 text-right">Sepet Ortalaması</th>
                  <th className="p-3 text-center">Kapatma Oranı</th>
                  <th className="p-3 text-right">Başarı Rozeti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {marketers.map((m, idx) => (
                  <tr key={m.name} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                        {m.avatar || m.name.split(" ").map(w => w[0]).join("")}
                      </div>
                      <div>
                        <span>{m.name}</span>
                        <span className="text-[10px] text-slate-400 block font-normal">{m.title}</span>
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium">
                        {m.department}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold font-mono text-slate-800">
                      {m.totalGuests} Konuk
                    </td>
                    <td className="p-3 text-right font-bold font-mono text-slate-900 text-sm">
                      ₺{m.totalRevenue.toLocaleString("tr-TR")}
                    </td>
                    <td className="p-3 text-right font-bold font-mono text-emerald-700">
                      ₺{m.onOdemeToplami.toLocaleString("tr-TR")}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {m.successfulCount} Kişi
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                        {m.failedCount} Kişi
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold font-mono text-blue-700">
                      ₺{m.avgBasket.toLocaleString("tr-TR")}
                    </td>
                    <td className="p-3 text-center font-bold font-mono">
                      %{m.conversionRate}
                    </td>
                    <td className="p-3 text-right">
                      {idx === 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          🏆 En Yüksek Ciro
                        </span>
                      ) : m.conversionRate >= 60 ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          🎯 Yüksek Dönüşüm
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════ */}
        {/* 4. AI GÜN SONU DİSPATCH BÜLTENİ */}
        {/* ═════════════════════════════════════════════════ */}
        <section className="bg-white rounded-xl p-6 md:p-8 shadow-xs space-y-6 border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#2563EB] font-bold">
                <span className="material-symbols-outlined">smart_toy</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#0F172A]">Gün Sonu Operasyon Bülteni &amp; Görev Dağıtımı</h2>
                <p className="text-xs text-slate-500">Kuyruk durumu ve yarınki personel sevk planı</p>
              </div>
            </div>
            <button
              className={`px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-xs transition cursor-pointer ${
                dispatchState === "done" ? "bg-emerald-700" : "bg-[#2563EB] hover:bg-[#1D4ED8]"
              }`}
              onClick={handleDispatch}
              disabled={dispatchState !== "idle"}
            >
              {dispatchState === "idle" && "Görev Dağıtımını Onayla →"}
              {dispatchState === "loading" && "Dağıtılıyor..."}
              {dispatchState === "done" && "Ekiplere Bildirildi ✓"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <h4 className="font-bold text-slate-800 mb-1">Stüdyo Canlı Kapasitesi</h4>
              <p className="text-slate-500 leading-relaxed">
                Stüdyo A ve B'de bugün toplam {guests.length} misafir ağırlandı. Tüm misafirlerin canlı yayın kayıtları stüdyo kurgu havuzuna aktarılmıştır.
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <h4 className="font-bold text-slate-800 mb-1">Kurgu &amp; İzleme Akışı</h4>
              <p className="text-slate-500 leading-relaxed">
                {inEditingCount} video kurguda işleniyor, {inReviewCount} video ise izleme onay masasında revize/sevk için bekliyor.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* ═════════════════════════════════════════════════ */}
      {/* 5. ODALAR ARASI REKABET ANALİZ TABLOSU MODAL (Requirement 10) */}
      {/* ═════════════════════════════════════════════════ */}
      {showCompetitionModal && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCompetitionModal(false); }}
        >
          <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 bg-amber-50/60 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏆</span>
                  <h3 className="text-xl font-bold text-[#0F172A]">Odalar Arası Rekabet Analiz Tablosu</h3>
                </div>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  <strong>Rekabet Mantığı:</strong> Çağrı merkezindeki 3 ayrı satış odası (Oda 1, Oda 2, Oda 3) stüdyo canlı yayın teyitleri, VIP paket satışları ve ciro üretimi konusunda birbirleriyle yarışır. Kurgu / montaj odası teknik operasyon birimidir ve teyit rekabetine dahil edilmez.
                </p>
              </div>
              <button
                onClick={() => setShowCompetitionModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg p-1.5 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Side-by-Side Matrix Table */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                      <th className="p-3 w-1/4">Karşılaştırma Metriği</th>
                      <th className="p-3 text-center bg-blue-50/50">
                        <div className="font-bold text-blue-900 text-xs">Oda 1</div>
                        <div className="text-[10px] text-blue-600 font-normal">Ayşe Yılmaz</div>
                      </th>
                      <th className="p-3 text-center bg-purple-50/50">
                        <div className="font-bold text-purple-900 text-xs">Oda 2</div>
                        <div className="text-[10px] text-purple-600 font-normal">Caner Kaya</div>
                      </th>
                      <th className="p-3 text-center bg-emerald-50/50">
                        <div className="font-bold text-emerald-900 text-xs">Oda 3</div>
                        <div className="text-[10px] text-emerald-600 font-normal">Elif Arslan</div>
                      </th>
                      <th className="p-3 text-center bg-amber-50/50 font-bold text-amber-900">
                        Liderlik Rozeti
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Metrik 1: Toplam Teyit */}
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-800">
                        Toplam Alınan Teyit &amp; Konuk
                      </td>
                      <td className="p-3 text-center font-bold font-mono text-sm bg-blue-50/20">
                        {getRoomMetrics("oda-1").total} Konuk
                      </td>
                      <td className="p-3 text-center font-bold font-mono text-sm bg-purple-50/20">
                        {getRoomMetrics("oda-2").total} Konuk
                      </td>
                      <td className="p-3 text-center font-bold font-mono text-sm bg-emerald-50/20">
                        {getRoomMetrics("oda-3").total} Konuk
                      </td>
                      <td className="p-3 text-center font-bold text-amber-800 bg-amber-50/20">
                        {getRoomMetrics("oda-1").total >= getRoomMetrics("oda-2").total && getRoomMetrics("oda-1").total >= getRoomMetrics("oda-3").total ? "Oda 1 (Teyit Lideri)" : "Oda 2"}
                      </td>
                    </tr>

                    {/* Metrik 2: Başarılı Satış */}
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-800">
                        Başarılı Paket Satış Adedi (VIP)
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-700 bg-blue-50/20">
                        {getRoomMetrics("oda-1").successfulSales} Satış
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-700 bg-purple-50/20">
                        {getRoomMetrics("oda-2").successfulSales} Satış
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-700 bg-emerald-50/20">
                        {getRoomMetrics("oda-3").successfulSales} Satış
                      </td>
                      <td className="p-3 text-center font-bold text-amber-800 bg-amber-50/20">
                        {getRoomMetrics("oda-1").successfulSales >= getRoomMetrics("oda-2").successfulSales ? "Oda 1" : "Oda 2"}
                      </td>
                    </tr>

                    {/* Metrik 3: Toplam Ciro */}
                    <tr className="hover:bg-slate-50 bg-slate-50/40">
                      <td className="p-3 font-bold text-slate-900">
                        Toplam Üretilen Ciro (₺)
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-base text-blue-700 bg-blue-50/30">
                        ₺{getRoomMetrics("oda-1").ciro.toLocaleString("tr-TR")}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-base text-purple-700 bg-purple-50/30">
                        ₺{getRoomMetrics("oda-2").ciro.toLocaleString("tr-TR")}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-base text-emerald-700 bg-emerald-50/30">
                        ₺{getRoomMetrics("oda-3").ciro.toLocaleString("tr-TR")}
                      </td>
                      <td className="p-3 text-center font-bold text-amber-900 bg-amber-50/30">
                        🏆 Oda 1 (+₺{getRoomMetrics("oda-1").ciro - getRoomMetrics("oda-2").ciro} Fark)
                      </td>
                    </tr>

                    {/* Metrik 4: Alınan Ön Ödeme */}
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-800">
                        Tahsil Edilen Sıcak Ön Ödeme
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-700 bg-blue-50/20">
                        ₺{getRoomMetrics("oda-1").onOdemeToplami.toLocaleString("tr-TR")}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-700 bg-purple-50/20">
                        ₺{getRoomMetrics("oda-2").onOdemeToplami.toLocaleString("tr-TR")}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-700 bg-emerald-50/20">
                        ₺{getRoomMetrics("oda-3").onOdemeToplami.toLocaleString("tr-TR")}
                      </td>
                      <td className="p-3 text-center font-bold text-amber-800 bg-amber-50/20">
                        Oda 1
                      </td>
                    </tr>

                    {/* Metrik 5: Sepet Ortalaması */}
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-800">
                        Konuk Başına Ortalama Sepet
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-900 bg-blue-50/20">
                        ₺{getRoomMetrics("oda-1").avgBasket.toLocaleString("tr-TR")}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-900 bg-purple-50/20">
                        ₺{getRoomMetrics("oda-2").avgBasket.toLocaleString("tr-TR")}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-900 bg-emerald-50/20">
                        ₺{getRoomMetrics("oda-3").avgBasket.toLocaleString("tr-TR")}
                      </td>
                      <td className="p-3 text-center font-bold text-amber-800 bg-amber-50/20">
                        {getRoomMetrics("oda-1").avgBasket >= getRoomMetrics("oda-2").avgBasket ? "Oda 1" : "Oda 2"}
                      </td>
                    </tr>

                    {/* Metrik 6: Başarı Oranı */}
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-800">
                        Teyit / Satış Dönüşüm Oranı
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-900 bg-blue-50/20">
                        %{getRoomMetrics("oda-1").conversionRate}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-900 bg-purple-50/20">
                        %{getRoomMetrics("oda-2").conversionRate}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-900 bg-emerald-50/20">
                        %{getRoomMetrics("oda-3").conversionRate}
                      </td>
                      <td className="p-3 text-center font-bold text-amber-800 bg-amber-50/20">
                        %{Math.max(getRoomMetrics("oda-1").conversionRate, getRoomMetrics("oda-2").conversionRate)} En Yüksek
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Dynamic Narrative Summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-700 leading-relaxed">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Lig Değerlendirmesi:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Oda 1 (Ayşe Yılmaz):</strong> Toplam ₺{getRoomMetrics("oda-1").ciro.toLocaleString("tr-TR")} ciro ve {getRoomMetrics("oda-1").total} teyit ile ligin zirvesinde yer alıyor.
                  </li>
                  <li>
                    <strong>Oda 2 (Caner Kaya):</strong> ₺{getRoomMetrics("oda-2").ciro.toLocaleString("tr-TR")} ciro ve yüksek sepet ortalamasıyla Oda 1'in en yakın takipçisi konumunda.
                  </li>
                  <li>
                    <strong>Oda 3:</strong> Yeni kurulan çağrı merkezi ekibi olarak bu hafta randevu akışını stüdyoya yönlendirmeye başlamıştır.
                  </li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">Canlı Senkronize Veri</span>
              <button
                onClick={() => setShowCompetitionModal(false)}
                className="px-5 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
