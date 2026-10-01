"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/lib/useStore";
import { updateGuest, getGuestDeadlineInfo, type Guest } from "@/lib/store";

export default function MontajPage() {
  const { guests, canAccessPage, isSensitiveBlurred, activeRoleDef } = useStore();
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // Filtered by search
  const filtered = useMemo(() => {
    if (!search.trim()) return guests;
    const q = search.toLowerCase();
    return guests.filter((g) => g.name.toLowerCase().includes(q) || g.company.toLowerCase().includes(q));
  }, [guests, search]);

  // Sözleşmeli 25 Günlük Süreye Göre Aciliyet Sıralaması (Kalan günü en az olan en üstte!)
  const sortByDeadline = (list: Guest[]) => {
    return [...list].sort((a, b) => {
      const da = getGuestDeadlineInfo(a).remainingDays;
      const db = getGuestDeadlineInfo(b).remainingDays;
      return da - db;
    });
  };

  // Column 1: Kurgu Bekleyen (Aciliyet Sıralı)
  const bekleyen = useMemo(() => {
    const list = filtered.filter((g) => ["package_set", "shoot_done", "kiosk_registered"].includes(g.status));
    return sortByDeadline(list);
  }, [filtered]);

  // Column 2: Kurguda (Aciliyet Sıralı)
  const kurguda = useMemo(() => {
    const list = filtered.filter((g) => g.status === "editing");
    return sortByDeadline(list);
  }, [filtered]);

  // Column 3: İzlemeye Gidenler / Bitenler
  const bitenler = useMemo(() => {
    return filtered.filter((g) => ["edit_done", "reviewing", "review_approved"].includes(g.status));
  }, [filtered]);

  function claimTask(guestId: string) {
    const g = guests.find((item) => item.id === guestId);
    if (!g) return;

    updateGuest(guestId, {
      status: "editing",
      editor: "Gökhan",
    });

    showToast(`${g.name} kurgusu üzerinize alındı ve kilitlendi.`);
  }

  function completeTask(guestId: string) {
    const g = guests.find((item) => item.id === guestId);
    if (!g) return;

    updateGuest(guestId, {
      status: "edit_done",
    });

    showToast(`${g.name} kurgusu tamamlandı, İzleme Masası'na aktarıldı.`);
  }

  function copyKJ(text: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    showToast(`Alt Bant (KJ) panoya kopyalandı.`);
  }

  const VipBadge = ({ card }: { card: Guest }) => {
    const isVip = Boolean(card.services && card.services.length > 0 && card.services.some((s) => s.price > 0));
    return isVip ? (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-[#DCFCE7] text-[#166534] flex-shrink-0 font-medium border border-[#BBF7D0]">
        ⭐ VIP
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-500 flex-shrink-0 font-medium">
        Ücretsiz
      </span>
    );
  };

  // ── 25 Günlük Zorunlu Sözleşme Süresi Gösterge Rozeti ──
  const DeadlineBadge = ({ card }: { card: Guest }) => {
    const info = getGuestDeadlineInfo(card);
    let colorClass = "bg-blue-50 text-blue-800 border-blue-200 font-bold";
    let icon = "schedule";
    let barColor = "bg-blue-600";

    if (info.isExpired) {
      colorClass = "bg-red-600 text-white border-red-700 font-bold animate-pulse";
      icon = "warning";
      barColor = "bg-red-600";
    } else if (info.isCritical) {
      colorClass = "bg-rose-100 text-rose-800 border-rose-300 font-bold";
      icon = "local_fire_department";
      barColor = "bg-rose-600";
    } else if (info.isWarning) {
      colorClass = "bg-amber-100 text-amber-900 border-amber-300 font-semibold";
      icon = "hourglass_top";
      barColor = "bg-amber-500";
    }

    return (
      <div className="flex flex-col gap-1.5 w-full bg-slate-50/90 p-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-600 font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-slate-400">gavel</span>
            25 Gün Yayın Sözleşmesi:
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border shadow-2xs ${colorClass}`}>
            <span className="material-symbols-outlined text-[13px]">{icon}</span>
            {info.label}
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${info.percentageElapsed}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
          <span>Stüdyo Geliş: {info.arrivalDate.toLocaleDateString("tr-TR")}</span>
          <span>Son Yayın Tarihi: {info.deadlineDate.toLocaleDateString("tr-TR")}</span>
        </div>
      </div>
    );
  };

  if (!canAccessPage("/dashboard/montaj")) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs max-w-xl mx-auto my-12 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-3xl border border-amber-200 shadow-inner">
          🔒
        </div>
        <h2 className="text-lg font-bold text-slate-900">Erişim Yetkiniz Bulunmuyor</h2>
        <p className="text-xs text-slate-500">
          Mevcut rolünüz ({activeRoleDef?.label || "Rolünüz"}) Kurgu &amp; Montaj modülünü görüntüleme yetkisine sahip değildir.
        </p>
        <Link href="/dashboard" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition">
          Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

  const isMontajBlurred = isSensitiveBlurred("montaj");

  return (
    <div className="flex flex-col w-full relative">
      {/* Rol Kısıtlaması Uyarısı / Blurlama */}
      {isMontajBlurred && (
        <div className="p-4 mb-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <span className="flex items-center gap-2">
            <span>🔒</span>
            <strong>Rol Kısıtlaması:</strong> Kurgu istatistikleri ve montaj sayıları rolünüz için kısıtlanmıştır (view_montaj_stats kapalı).
          </span>
          <span className="text-[10px] font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
            view_montaj_stats: false
          </span>
        </div>
      )}
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-white text-[#0F172A] rounded-xl border border-slate-200 shadow-xl text-sm font-medium animate-fadeIn">
          <span className="material-symbols-outlined text-[#2563EB] text-[20px]">content_paste</span>
          {toast}
        </div>
      )}

      {/* Top Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px] uppercase tracking-wider">Montaj Panosu</span>
            <span className="text-slate-400 text-[11px]">/</span>
            <span className="text-[#2563EB] text-[11px] font-semibold">Kurgu İş Akışı &amp; Kanban</span>
          </div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl font-semibold text-[#0F172A] tracking-tight">Montaj Panosu</h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse"></span>
              Aktif Editör: Gökhan
            </span>
          </div>
          <p className="text-sm text-slate-500">Stüdyo çekimi tamamlanan konukların kurgu, revize takibi, KJ aktarımı ve izleme teslim süreci.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-2.5 text-slate-400 text-[18px] pointer-events-none">search</span>
            <input
              className="h-9 pl-8 pr-3 w-56 text-sm bg-white text-[#0F172A] placeholder:text-slate-400 border border-slate-200 rounded-lg focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
              placeholder="Kart veya konuk ara..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Link
            href="/dashboard/revize"
            className="h-9 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition"
          >
            <span>⏱</span> Revize Masası
          </Link>
          <div className="h-9 px-3 bg-white border border-slate-200 text-slate-500 rounded-lg text-xs inline-flex items-center gap-1.5 shadow-xs">
            <span className="material-symbols-outlined text-[17px] text-emerald-500">sync</span>
            <span className="font-mono text-xs text-slate-700 font-medium">Toplam {guests.length} Konuk</span>
          </div>
        </div>
      </section>

      {/* 25 Gün Sözleşme Kuralı Bilgilendirme Bandı */}
      <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-amber-50/70 border border-blue-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl shadow-xs shrink-0">
            <span className="material-symbols-outlined text-[22px]">timer</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Sözleşmeli 25 Günlük Zorunlu Yayın Kuralı</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wide">Otomatik Sıralama</span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Tüm konukların (ücretli veya ücretsiz) çekimleri sözleşme gereği stüdyo tarihinden itibaren <strong>en geç 25 gün</strong> içinde yayına verilmelidir. Kurgu listeleri son güne kalan aciliyete göre otomatik sıralanmaktadır.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-white/80 px-3 py-1.5 rounded-lg border border-slate-200 shrink-0">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          <span>Kritik Eşik: &le; 5 Gün</span>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Column 1: Kurgu Bekleyen */}
        <div className="flex flex-col bg-slate-50/70 rounded-xl border border-slate-200 p-3.5 gap-3">
          <div className="flex items-center justify-between pb-1 px-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-400"></div>
              <h2 className="text-base font-semibold text-[#0F172A] tracking-tight">Kurgu Bekleyen</h2>
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                {bekleyen.length}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {bekleyen.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white">
                Kurgu bekleyen konuk yok
              </div>
            ) : (
              bekleyen.map((card) => {
                const unresNotes = card.notes?.filter(n => !n.resolved) || [];
                return (
                  <article
                    key={card.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-slate-300 hover:shadow transition-all duration-150 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-[#0F172A] truncate leading-tight">{card.name}</h3>
                        <p className="text-sm text-slate-500 truncate mt-0.5">{card.company} — {card.title}</p>
                      </div>
                      <VipBadge card={card} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 text-[#0F172A] text-xs font-mono border border-slate-200">
                        <span className="material-symbols-outlined text-[15px] text-slate-400">videocam</span>
                        {card.studio}
                      </span>
                      <span className="inline-flex items-center gap-1 text-slate-500 text-[11px]">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {card.shootTime} ({card.shootDuration})
                      </span>
                    </div>

                    {/* 25 Günlük Yayın Süresi Sayacı & İlerleme */}
                    <DeadlineBadge card={card} />

                    {/* Revize Notları Preview if any */}
                    {unresNotes.length > 0 && (
                      <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-2.5 text-xs flex flex-col gap-1.5">
                        <div className="flex items-center justify-between font-semibold text-amber-900">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px] text-amber-700">rate_review</span>
                            {unresNotes.length} Açık Revize Notu
                          </span>
                          <Link href="/dashboard/revize" className="text-[10px] text-blue-600 hover:underline">Revize Masası →</Link>
                        </div>
                        <div className="space-y-1">
                          {unresNotes.slice(0, 2).map((n) => (
                            <div key={n.id} className="text-[11px] text-slate-700 flex items-start gap-1">
                              <span className="font-mono text-[10px] font-bold text-amber-800 bg-amber-100 px-1 rounded">{n.time}</span>
                              <span className="truncate">{n.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        className="h-8 px-2.5 rounded-md text-[11px] text-[#0F172A] hover:bg-slate-50 border border-slate-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        onClick={() => copyKJ(`${card.name} — ${card.company} — ${card.title}`)}
                      >
                        <span className="material-symbols-outlined text-[15px] text-slate-400">content_copy</span>
                        Alt Bandı Kopyala
                      </button>
                      <button
                        className="h-8 px-3 rounded-lg text-[11px] font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white inline-flex items-center gap-1 transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                        onClick={() => claimTask(card.id)}
                      >
                        İşi Üzerime Al
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Kurguda */}
        <div className="flex flex-col bg-slate-50/70 rounded-xl border border-blue-200 p-3.5 gap-3 shadow-xs">
          <div className="flex items-center justify-between pb-1 px-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse"></div>
              <h2 className="text-base font-semibold text-[#0F172A] tracking-tight">Kurguda (İş Üzerimde)</h2>
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-[#2563EB]">
                {kurguda.length}
              </span>
            </div>
            <span className="text-[11px] text-[#2563EB] font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Kilitli Oturum</span>
          </div>
          <div className="flex flex-col gap-3">
            {kurguda.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-blue-200 rounded-xl bg-white">
                Şu anda kurguda aktif iş yok
              </div>
            ) : (
              kurguda.map((card) => {
                const unresNotes = card.notes?.filter(n => !n.resolved) || [];
                return (
                  <article
                    key={card.id}
                    className="bg-white rounded-xl border border-blue-200 ring-1 ring-blue-100 p-4 shadow-sm transition-all duration-150 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-[#0F172A] truncate leading-tight">{card.name}</h3>
                          <span className="inline-flex items-center w-2 h-2 rounded-full bg-emerald-500"></span>
                        </div>
                        <p className="text-sm text-slate-500 truncate mt-0.5">{card.company} — {card.title}</p>
                      </div>
                      <VipBadge card={card} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 text-[#0F172A] text-xs font-mono border border-slate-200">
                        <span className="material-symbols-outlined text-[15px] text-slate-400">videocam</span>
                        {card.studio}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-[#2563EB] text-[11px] font-medium border border-blue-100">
                        <span className="material-symbols-outlined text-[14px]">timer</span>
                        {card.shootDuration || "25 dk"}
                      </span>
                      <span className="font-mono text-xs text-slate-400">{card.registrationNo}</span>
                    </div>

                    {/* 25 Günlük Yayın Süresi Sayacı & İlerleme */}
                    <DeadlineBadge card={card} />

                    {/* Revize Notları Detail */}
                    {unresNotes.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs flex flex-col gap-1.5">
                        <div className="flex items-center justify-between font-bold text-amber-900">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px] text-amber-700">report</span>
                            {unresNotes.length} Düzeltilmesi Gereken Revize Var!
                          </span>
                          <Link href="/dashboard/revize" className="text-[10px] text-blue-600 hover:underline">Revize Masası →</Link>
                        </div>
                        <div className="space-y-1">
                          {unresNotes.map((n) => (
                            <div key={n.id} className="text-[11px] text-slate-800 bg-white/70 p-1 rounded border border-amber-100 flex items-start gap-1.5">
                              <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-200 shrink-0">⏱ {n.time}</span>
                              <span className="font-medium text-slate-900">{n.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-amber-50 text-amber-900 border border-amber-200/90 rounded-lg p-2.5 flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-amber-700 text-[18px] flex-shrink-0 mt-0.5">lock</span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-amber-900">{card.editor || "Gökhan"} Kurguluyor</span>
                        <span className="text-[11px] text-amber-700 leading-relaxed">Kurgu kilitli — diğer editörlerin işlemine kapalı</span>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        className="h-9 px-3 rounded-lg text-[11px] text-[#0F172A] hover:bg-slate-50 border border-slate-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        onClick={() => copyKJ(`${card.name} — ${card.company} — ${card.title}`)}
                      >
                        <span className="material-symbols-outlined text-[15px] text-slate-400">content_copy</span>
                        Alt Bandı Kopyala
                      </button>
                      <button
                        className="h-9 px-3.5 rounded-lg text-[11px] font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white inline-flex items-center gap-1.5 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                        onClick={() => completeTask(card.id)}
                      >
                        Kurgu Bitti -&gt; İzlemeye Gönder
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        {/* Column 3: İzlemeye Gidenler */}
        <div className="flex flex-col bg-slate-50/70 rounded-xl border border-slate-200 p-3.5 gap-3">
          <div className="flex items-center justify-between pb-1 px-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
              <h2 className="text-base font-semibold text-[#0F172A] tracking-tight">İzlemeye Gidenler / Bitenler</h2>
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                {bitenler.length}
              </span>
            </div>
            <span className="material-symbols-outlined text-[18px] text-emerald-600">task_alt</span>
          </div>
          <div className="flex flex-col gap-3">
            {bitenler.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white">
                İzlemede olan konuk yok
              </div>
            ) : (
              bitenler.map((card) => (
                <article
                  key={card.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-slate-300 hover:shadow transition-all duration-150 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-[#0F172A] truncate leading-tight">{card.name}</h3>
                      <p className="text-sm text-slate-500 truncate mt-0.5">{card.company} — {card.title}</p>
                    </div>
                    <VipBadge card={card} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 text-[#0F172A] text-xs font-mono border border-slate-200">
                      <span className="material-symbols-outlined text-[15px] text-slate-400">videocam</span>
                      {card.studio}
                    </span>
                    <span className="font-mono text-xs text-slate-400">{card.registrationNo}</span>
                  </div>

                  {/* 25 Günlük Yayın Süresi Durumu */}
                  <DeadlineBadge card={card} />
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[11px]">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                    {card.status === "review_approved" ? "Onaylandı → Dijital Kartta" : "İzleme Masasında İnceleniyor"}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 px-0.5">
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">person</span>
                      Editör: <strong className="text-[#0F172A] font-medium">{card.editor || "Gökhan"}</strong>
                    </span>
                    <span className="font-mono text-xs text-slate-400">{card.shootTime}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
