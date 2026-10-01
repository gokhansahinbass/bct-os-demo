"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useStore } from "@/lib/useStore";
import {
  updateGuestStatus,
  isSlotPrimeTime,
  BROADCAST_DAILY_HOURS,
  type BroadcastSlot,
  type Guest,
  type YouTubeMetadata,
} from "@/lib/store";

type YayinTab = "schedule" | "digitalCard" | "youtube";

export default function YayinPage() {
  const {
    guests,
    broadcastSchedules,
    generateSmartBroadcastSchedule,
    updateBroadcastSlot,
    updateGuestYouTube,
    isGuestPaid,
    canAccessPage,
    activeRoleDef,
  } = useStore();

  const [activeTab, setActiveTab] = useState<YayinTab>("schedule");

  // ── Bugünün Tarihi & Takvim Tarih Seçimi ──
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Otomatik Takvim Oluşturucu Modal / Durum
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [generateDays, setGenerateDays] = useState<number>(1);
  const [generating, setGenerating] = useState(false);

  // Düzenleme / Değişiklik Bildirimleri (Toast)
  const [toast, setToast] = useState<string | null>(null);
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }

  // Geçmiş Arşiv Modalı
  const [showArchiveHistoryModal, setShowArchiveHistoryModal] = useState(false);

  // ── 1. AKILLI YAYIN AKIŞI: Seçili Günün Kuşakları ──
  const daySlots = useMemo(() => {
    const list = broadcastSchedules.filter((s) => s.date === selectedDate);
    // Sıralı 11:30 -> 19:00
    return [...list].sort((a, b) => a.time.localeCompare(b.time));
  }, [broadcastSchedules, selectedDate]);

  // Seçili günün istatistikleri
  const dayStats = useMemo(() => {
    const primeCount = daySlots.filter((s) => s.isPrimeTime && s.isPaid).length;
    const freeCount = daySlots.filter((s) => !s.isPaid && !s.isRepeat).length;
    const repeatCount = daySlots.filter((s) => s.isRepeat).length;
    return {
      total: daySlots.length,
      primePaid: primeCount,
      free: freeCount,
      repeat: repeatCount,
    };
  }, [daySlots]);

  // Tüm geçmiş ve kayıtlı tarihler (Arşiv silinmez kuralı)
  const allRecordedDates = useMemo(() => {
    const set = new Set<string>();
    broadcastSchedules.forEach((s) => set.add(s.date));
    return Array.from(set).sort().reverse();
  }, [broadcastSchedules]);

  // Otomatik Takvim Oluşturma İşlemi
  function handleGenerateSmart(days: number, fromDate?: string) {
    const start = fromDate || selectedDate;
    setGenerating(true);
    setTimeout(() => {
      generateSmartBroadcastSchedule(start, days);
      setGenerating(false);
      setShowAutoModal(false);
      showToast(
        `⚡ ${days} günlük (${days * 16} Kuşak) Akıllı Yayın Takvimi başarıyla oluşturuldu! Prime Time ve arşiv dağıtımı tamamlandı.`
      );
    }, 400);
  }

  // Tekil Kuşak Güncelleme
  function handleSlotGuestChange(slotId: string, guestId: string) {
    if (guestId === "archive_repeat") {
      updateBroadcastSlot(slotId, {
        guestId: undefined,
        guestName: "BCT Arşiv Tekrar Yayını",
        company: "BCT Medya Prodüksiyon",
        title: "Özel Röportaj Arşiv Kuşağı",
        isPaid: true,
        isRepeat: true,
        customNotes: "🔄 Arşiv Tekrar Yayın (Ücretli Portföy)",
      });
      showToast("Kuşak Arşiv Tekrar Yayını olarak ayarlandı.");
      return;
    }

    if (guestId === "empty") {
      updateBroadcastSlot(slotId, {
        guestId: undefined,
        guestName: "BCT Tanıtım & Kültür Kuşağı",
        company: "BCT Medya",
        title: "Tanıtım Kuşağı",
        isPaid: false,
        isRepeat: false,
        customNotes: "Boş Kuşak / BCT Tanıtımı",
      });
      showToast("Kuşak boşaltıldı.");
      return;
    }

    const g = guests.find((item) => item.id === guestId);
    if (!g) return;

    const paid = isGuestPaid(g);
    updateBroadcastSlot(slotId, {
      guestId: g.id,
      guestName: g.name,
      company: g.company,
      title: g.title,
      isPaid: paid,
      isRepeat: false,
      customNotes: paid
        ? "⭐ VIP Ücretli Konuk (Canlı Yayın & YouTube)"
        : "📺 Canlı Yayın Kuşağı (Ücretsiz Konuk)",
    });
    showToast(`${g.name} (${g.company}) kuşağa atandı.`);
  }

  function handleSlotStatusChange(slotId: string, status: BroadcastSlot["status"]) {
    updateBroadcastSlot(slotId, { status });
    showToast(`Kuşak durumu "${status}" olarak güncellendi.`);
  }

  function handleSlotNotesChange(slotId: string, customNotes: string) {
    updateBroadcastSlot(slotId, { customNotes });
  }

  // Reji & Sunucu İçin Temiz Metin Çıktısı Kopyalama
  function handleCopyRundown() {
    if (daySlots.length === 0) {
      showToast("Kopyalanacak yayın akışı bulunmuyor.");
      return;
    }

    const dateFormatted = formatTurkishDate(selectedDate);
    let rundownText = `📺 BCT MEDYA CANLI YAYIN AKIŞI (${dateFormatted})\n`;
    rundownText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    rundownText += `Yayın Saatleri: 11:30 - 19:00 (Her 30 Dakikada Bir)\n\n`;

    daySlots.forEach((slot) => {
      const primeTag = slot.isPrimeTime ? "[🔥 PRİME TIME]" : "[STANDART]";
      const typeTag = slot.isRepeat
        ? "(Arşiv Tekrar)"
        : slot.isPaid
        ? "(⭐ Ücretli)"
        : "(Ücretsiz)";
      rundownText += `${slot.time} | ${primeTag} ${slot.guestName} — ${slot.company} ${typeTag}\n`;
      if (slot.customNotes) {
        rundownText += `       ↳ Not: ${slot.customNotes}\n`;
      }
    });

    rundownText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    rundownText += `Toplam Kuşak: ${daySlots.length} | BCT OS Yayın Masası`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(rundownText);
      showToast("📋 Reji ve KJ yayın akışı panoya kopyalandı!");
    }
  }

  // ── 2. DİJİTAL KART MASASI: YALNIZCA Ücretli Konuklar ──
  // Ücretsiz konuklara dijital kart ve youtube açıklaması hazırlanmaz kuralı!
  const paidPublishCandidates = useMemo(() => {
    return guests.filter((g) => isGuestPaid(g));
  }, [guests, isGuestPaid]);

  const [selectedCardGuestId, setSelectedCardGuestId] = useState<string | null>(null);
  const activeCardGuest = useMemo(() => {
    if (selectedCardGuestId) {
      const found = paidPublishCandidates.find((g) => g.id === selectedCardGuestId);
      if (found) return found;
    }
    return paidPublishCandidates[0] || null;
  }, [paidPublishCandidates, selectedCardGuestId]);

  const [archiveState, setArchiveState] = useState<"idle" | "loading" | "done">("idle");
  function handleArchiveGuest() {
    if (!activeCardGuest) return;
    if (
      !confirm(
        `${activeCardGuest.name} konuğunun dijital teslimat süreci tamamlanıp arşive kaldırılsın mı?`
      )
    )
      return;

    setArchiveState("loading");
    setTimeout(() => {
      updateGuestStatus(activeCardGuest.id, "archived");
      setArchiveState("done");
      showToast(`${activeCardGuest.name} başarıyla arşivlendi.`);
      setTimeout(() => setArchiveState("idle"), 2500);
    }, 600);
  }

  // ── 3. YOUTUBE YÖNETİM MASASI: YALNIZCA Ücretli Konuklar ──
  // Ücret ödeyen konuklar canlı yayından sonra YouTube'a yüklenir.
  const paidYouTubeCandidates = useMemo(() => {
    return guests.filter((g) => isGuestPaid(g));
  }, [guests, isGuestPaid]);

  const [selectedYtGuestId, setSelectedYtGuestId] = useState<string | null>(null);
  const activeYtGuest = useMemo(() => {
    if (selectedYtGuestId) {
      const found = paidYouTubeCandidates.find((g) => g.id === selectedYtGuestId);
      if (found) return found;
    }
    return paidYouTubeCandidates[0] || null;
  }, [paidYouTubeCandidates, selectedYtGuestId]);

  // YouTube Form Durumu
  const [ytUrl, setYtUrl] = useState<string>("");
  const [ytStatus, setYtStatus] = useState<YouTubeMetadata["status"]>("bekliyor");
  const [ytCustomTitle, setYtCustomTitle] = useState<string>("");
  const [ytCustomDesc, setYtCustomDesc] = useState<string>("");

  useEffect(() => {
    if (activeYtGuest) {
      const meta = activeYtGuest.youtubeMetadata;
      setYtUrl(meta?.youtubeUrl || "");
      setYtStatus(meta?.status || "bekliyor");
      setYtCustomTitle(
        meta?.customTitle ||
          `${activeYtGuest.name} ile Sektörün Geleceği ve Dönüşüm Stratejileri | BCT Röportaj Serisi ${activeYtGuest.registrationNo}`
      );
      setYtCustomDesc(
        meta?.customDescription ||
          `📌 Bu bölümde ${activeYtGuest.company} ${activeYtGuest.title} Sayın ${activeYtGuest.name} ile stüdyomuzda bir araya geldik. Kurumsal hedefler, liderlik vizyonu ve sektör gelişmelerini konuştuk.\n\n⏱️ Zaman Damgaları:\n00:00 Giriş & Tanıtım\n01:10 ${activeYtGuest.company} Vizyonu\n10:35 Gelecek Stratejileri\n21:40 Kapanış\n\n🔗 Web: ${activeYtGuest.website || "bctmedya.com"} | IG: ${activeYtGuest.instagram ? "@" + activeYtGuest.instagram : "@bctmedya"}\n#BCT #Roportaj #${activeYtGuest.name.replace(/\s+/g, "")} #${activeYtGuest.company.replace(/[^a-zA-Z0-9]/g, "")}`
      );
    }
  }, [activeYtGuest]);

  function handleSaveYouTube() {
    if (!activeYtGuest) return;
    updateGuestYouTube(activeYtGuest.id, {
      youtubeUrl: ytUrl,
      status: ytStatus,
      customTitle: ytCustomTitle,
      customDescription: ytCustomDesc,
    });
    showToast(`✅ ${activeYtGuest.name} YouTube bilgileri başarıyla kaydedildi!`);
  }

  function copyTextToClipboard(text: string, label: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(`${label} panoya kopyalandı!`);
    }
  }

  // Tarih Formatlayıcı
  function formatTurkishDate(dateStr: string) {
    try {
      const [y, m, d] = dateStr.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString("tr-TR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  }

  // Tarih Değiştirici Yardımcılar
  function shiftDate(days: number) {
    try {
      const [y, m, d] = selectedDate.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      date.setDate(date.getDate() + days);
      setSelectedDate(date.toISOString().split("T")[0]);
    } catch {}
  }

  // RBAC Kontrolü
  if (!canAccessPage("/dashboard/yayin")) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs max-w-xl mx-auto my-12 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-3xl border border-amber-200 shadow-inner">
          🔒
        </div>
        <h2 className="text-lg font-bold text-slate-900">Erişim Yetkiniz Bulunmuyor</h2>
        <p className="text-xs text-slate-500">
          Mevcut rolünüz ({activeRoleDef?.label || "Rolünüz"}) Yayın &amp; YouTube modülünü görüntüleme yetkisine sahip değildir.
        </p>
        <Link href="/dashboard" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition">
          Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-xl border border-slate-700 shadow-2xl text-sm font-medium animate-fadeIn">
          <span className="material-symbols-outlined text-blue-400 text-[20px]">info</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Top Header & Breadcrumb */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 mb-5 border-b border-slate-200">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px] uppercase tracking-wider">BCT Medya Stüdyoları</span>
            <span className="text-slate-400 text-[11px]">/</span>
            <span className="text-blue-600 text-[11px] font-semibold">Yayın &amp; YouTube Komuta Merkezi</span>
          </div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Yayın &amp; YouTube Yönetimi</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Yayın Kuşağı: 11:30 - 19:00 (30 dk)
            </span>
          </div>
          <p className="text-xs text-slate-500">
            TV Canlı Yayın akış planlaması, Prime Time dağıtımı, ücretli konuk dijital kartları ve YouTube yükleme masası.
          </p>
        </div>

        {/* Ana Sekme Butonları (3 Masalı Komuta Merkezi) */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => setActiveTab("schedule")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "schedule"
                ? "bg-white text-blue-600 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">calendar_month</span>
            <span>1. Akıllı Yayın Akışı &amp; Takvim</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-50 text-blue-700 font-mono">16 Kuşak</span>
          </button>

          <button
            onClick={() => setActiveTab("digitalCard")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "digitalCard"
                ? "bg-white text-blue-600 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">badge</span>
            <span>2. Dijital Kart Masası</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-50 text-emerald-700 font-mono">Yalnızca Ücretli</span>
          </button>

          <button
            onClick={() => setActiveTab("youtube")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "youtube"
                ? "bg-white text-red-600 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="material-symbols-outlined text-[17px] text-red-600">smart_display</span>
            <span>3. YouTube Yönetim Masası</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-50 text-red-700 font-mono">Yalnızca Ücretli</span>
          </button>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SEKME 1: AKILLI YAYIN AKIŞI & TAKVİM MASASI
          ───────────────────────────────────────────────────────────── */}
      {activeTab === "schedule" && (
        <div className="flex flex-col gap-5">
          {/* Üst Yönetim Araç Çubuğu */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Tarih Seçici & Hızlı Navigasyon */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1">
                <button
                  onClick={() => shiftDate(-1)}
                  title="Önceki Gün"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-800 transition"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <div className="px-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-[18px]">event</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                    className="text-xs font-bold text-slate-900 bg-transparent border-none focus:outline-none cursor-pointer"
                  />
                </div>
                <button
                  onClick={() => shiftDate(1)}
                  title="Sonraki Gün"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-800 transition"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedDate(todayStr)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  selectedDate === todayStr
                    ? "bg-blue-50 text-blue-700 border-blue-200 font-bold"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Bugün
              </button>

              <button
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  setSelectedDate(d.toISOString().split("T")[0]);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition"
              >
                Yarın
              </button>

              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 pl-2">
                <span className="font-semibold text-slate-800">{formatTurkishDate(selectedDate)}</span>
              </div>
            </div>

            {/* Aksiyon Butonları: Otomatik Oluşturucu, Arşiv Geçmişi, Reji Kopyala */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowArchiveHistoryModal(true)}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 flex items-center gap-1.5 transition"
              >
                <span className="material-symbols-outlined text-[17px] text-slate-500">history</span>
                <span>Geçmiş Takvim Arşivi ({allRecordedDates.length} Gün)</span>
              </button>

              <button
                onClick={handleCopyRundown}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs transition"
              >
                <span className="material-symbols-outlined text-[17px] text-slate-600">content_copy</span>
                <span>Reji Akışını Kopyala</span>
              </button>

              <button
                onClick={() => setShowAutoModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center gap-1.5 shadow-sm transition active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                <span>⚡ Otomatik Takvim Oluşturucu</span>
              </button>
            </div>
          </div>

          {/* Günlük İstatistik ve Prime Time Kural Hatırlatması */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-500 uppercase">Günlük Toplam Kuşak</span>
                <div className="text-xl font-bold text-slate-900 mt-0.5">{daySlots.length} / 16 Slot</div>
              </div>
              <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                11:30 - 19:00
              </span>
            </div>

            <div className="bg-amber-50/60 rounded-xl border border-amber-200 p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-900 uppercase flex items-center gap-1">
                  <span>🔥 Prime Time (12:00 - 16:00)</span>
                </span>
                <div className="text-xl font-bold text-amber-900 mt-0.5">
                  {dayStats.primePaid} Kuşak Ücretli
                </div>
              </div>
              <span className="text-xs bg-amber-200/70 text-amber-900 px-2 py-1 rounded font-bold">
                9 Kuşak En Popüler
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-500 uppercase">Ücretsiz Canlı Yayınlar</span>
                <div className="text-xl font-bold text-slate-900 mt-0.5">{dayStats.free} Konuk</div>
              </div>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">1 Defa Canlı Yayın</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-500 uppercase">Arşiv Tekrar Kuşakları</span>
                <div className="text-xl font-bold text-indigo-700 mt-0.5">{dayStats.repeat} Tekrar</div>
              </div>
              <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-medium">
                Portföy Doldurma
              </span>
            </div>
          </div>

          {/* Günün 16 Yayın Kuşağı Tablosu / Listesi */}
          {daySlots.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl">
                <span className="material-symbols-outlined text-[32px]">calendar_today</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {formatTurkishDate(selectedDate)} İçin Henüz Yayın Takvimi Oluşturulmamış
              </h3>
              <p className="text-xs text-slate-500 max-w-md">
                Sistemdeki hazır ücretli ve ücretsiz konuklarla 11:30 - 19:00 arası 16 kuşaklık akıllı yayın takvimini tek tıkla oluşturabilirsiniz.
              </p>
              <button
                onClick={() => handleGenerateSmart(1, selectedDate)}
                disabled={generating}
                className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                {generating ? "Takvim Oluşturuluyor..." : "Bu Gün İçin Akıllı Takvim Oluştur"}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-500 text-[18px]">tune</span>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    {formatTurkishDate(selectedDate)} — Yayın Kuşakları ve Canlı Akış
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Prime Time (12:00-16:00)
                  </span>
                  <span className="inline-flex items-center gap-1 ml-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Standart Kuşak
                  </span>
                  <button
                    onClick={() => showToast("💾 Takvim değişiklikleri otomatik kaydedildi!")}
                    className="ml-3 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">save</span>
                    💾 Takvimi Kaydet
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {daySlots.map((slot, index) => {
                  const isPrime = slot.isPrimeTime;
                  return (
                    <div
                      key={slot.id || index}
                      className={`p-4 transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
                        isPrime
                          ? "bg-amber-50/20 hover:bg-amber-50/40 border-l-4 border-l-amber-500"
                          : "hover:bg-slate-50/60 border-l-4 border-l-slate-200"
                      }`}
                    >
                      {/* Sol: Saat, Prime Time Durumu */}
                      <div className="flex items-center gap-3 min-w-[190px]">
                        <div
                          className={`w-14 h-12 rounded-xl flex flex-col items-center justify-center font-mono font-bold text-base shadow-2xs border ${
                            isPrime
                              ? "bg-amber-100 text-amber-950 border-amber-300"
                              : "bg-slate-100 text-slate-800 border-slate-200"
                          }`}
                        >
                          <span>{slot.time}</span>
                          <span className="text-[9px] font-sans font-normal text-slate-500">30 dk</span>
                        </div>
                        <div className="flex flex-col">
                          {isPrime ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
                              <span className="material-symbols-outlined text-[13px] text-amber-700">
                                local_fire_department
                              </span>
                              PRIME TIME
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                              <span className="material-symbols-outlined text-[13px] text-slate-400">schedule</span>
                              Standart Kuşak
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Kuşak #{index + 1}
                          </span>
                        </div>
                      </div>

                      {/* Orta: Atanan Konuk ve Türü */}
                      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-900 truncate">{slot.guestName}</h4>
                            {slot.isRepeat ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                <span className="material-symbols-outlined text-[12px]">replay</span>
                                Arşiv Tekrar Yayın
                              </span>
                            ) : slot.isPaid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                ⭐ VIP (Ücretli Yayın)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                📺 Ücretsiz Canlı Yayın
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {slot.company} — {slot.title}
                          </p>
                        </div>

                        {/* Manuel Atama Seçici */}
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={slot.guestId || (slot.isRepeat ? "archive_repeat" : "empty")}
                            onChange={(e) => handleSlotGuestChange(slot.id, e.target.value)}
                            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 shadow-2xs max-w-[220px]"
                          >
                            <optgroup label="Sistem Konukları">
                              {guests.map((g) => (
                                <option key={g.id} value={g.id}>
                                  {isGuestPaid(g) ? "⭐ [Ücretli] " : "📺 [Ücretsiz] "}
                                  {g.name} ({g.company})
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="Özel Kuşaklar">
                              <option value="archive_repeat">🔄 Arşiv Tekrar Kuşağı</option>
                              <option value="empty">⚪ Boş / Tanıtım Kuşağı</option>
                            </optgroup>
                          </select>
                        </div>
                      </div>

                      {/* Sağ: Kuşak Notu & Durum Seçici */}
                      <div className="flex items-center gap-3 shrink-0 w-full lg:w-auto justify-between lg:justify-end">
                        <input
                          type="text"
                          defaultValue={slot.customNotes || ""}
                          placeholder="Reji veya yayın notu..."
                          onBlur={(e) => handleSlotNotesChange(slot.id, e.target.value)}
                          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 w-44 focus:bg-white focus:outline-none focus:border-blue-500"
                        />

                        <select
                          value={slot.status}
                          onChange={(e) =>
                            handleSlotStatusChange(slot.id, e.target.value as BroadcastSlot["status"])
                          }
                          className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border shadow-2xs focus:outline-none ${
                            slot.status === "canli_yayinda"
                              ? "bg-red-50 text-red-700 border-red-300 animate-pulse"
                              : slot.status === "yayinlandi"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : slot.status === "iptal"
                              ? "bg-slate-100 text-slate-500 border-slate-200 line-through"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          <option value="planlandi">Planlandı</option>
                          <option value="canli_yayinda">🔴 Canlı Yayında</option>
                          <option value="yayinlandi">✅ Yayınlandı</option>
                          <option value="iptal">İptal</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SEKME 2: DİJİTAL KART MASASI (YALNIZCA ÜCRETLİ KONUKLAR)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === "digitalCard" && (
        <div className="flex flex-col gap-6">
          {/* Bilgilendirme Bildirimi */}
          <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 flex items-start gap-3 text-xs text-blue-950">
            <span className="material-symbols-outlined text-blue-600 text-[20px] shrink-0 mt-0.5">verified_user</span>
            <div>
              <strong className="font-bold">Önemli Yayın Kuralı:</strong> Ücretsiz konuklar için sözleşme gereği dijital kart ve YouTube açıklaması hazırlanmaz; onlar bir kez canlı yayına çıkıp silinir. Bu masada <strong>yalnızca ücret ödeyen konukların</strong> dijital kartları üretilir ve WhatsApp üzerinden teslim edilir.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
            {/* Sol Liste: Ücretli Konuklar */}
            <div className="lg:col-span-3 flex flex-col gap-3">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900">Dijital Kart Adayları (VIP)</h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700">
                    {paidPublishCandidates.length} Konuk
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">Ücretli satın alan ve montajı biten teslimat işleri</p>
              </div>

              <div className="flex flex-col gap-2.5">
                {paidPublishCandidates.map((g) => {
                  const isSelected = activeCardGuest?.id === g.id;
                  return (
                    <div
                      key={g.id}
                      onClick={() => setSelectedCardGuestId(g.id)}
                      className={`relative rounded-xl p-3.5 shadow-2xs cursor-pointer transition-all border ${
                        isSelected
                          ? "bg-blue-50/50 border-blue-600 ring-1 ring-blue-600"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">{g.name}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              ⭐ VIP
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{g.company}</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{g.amount} ₺</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                        <span>🎥 {g.studio}</span>
                        <span className="text-blue-600 font-medium">
                          {g.status === "archived" ? "Arşivlendi" : "Hazırlanıyor"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sağ Çalışma Masası */}
            {activeCardGuest ? (
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs flex flex-col gap-7">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-slate-900">{activeCardGuest.name}</h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        ⭐ Ücretli Paket: {activeCardGuest.amount} ₺
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {activeCardGuest.company} — {activeCardGuest.title} • Kayıt No:{" "}
                      <span className="font-mono text-slate-800 font-semibold">{activeCardGuest.registrationNo}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      <span className="material-symbols-outlined text-[15px]">badge</span>
                      Dijital Kart Masası
                    </span>
                  </div>
                </div>

                {/* Bölüm 1: Dijital Kart & Kapak Yükleme */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] flex items-center justify-center font-bold">
                        1
                      </span>
                      Dijital Kart &amp; Kapak Görseli Yükleme
                    </h3>
                    <span className="text-[11px] text-blue-600 font-mono">Önerilen: 1920×1080 / 1080×1350 px</span>
                  </div>

                  <div className="border-2 border-dashed border-blue-200 hover:border-blue-500 bg-blue-50/20 hover:bg-blue-50/40 rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center text-blue-600">
                      <span className="material-symbols-outlined text-xl">cloud_upload</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-900">Dijital Kart Görselini Sürükleyin (JPG/PNG)</p>
                    <p className="text-[11px] text-slate-500">veya bilgisayarınızdan dosya seçin • Maksimum 25 MB</p>
                  </div>

                  {/* Hazır Önizleme */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                        KJ
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900">
                          BCT_{activeCardGuest.name.replace(/\s+/g, "")}_DigitalCard_v1.png
                        </span>
                        <p className="text-[10px] text-slate-500">1920 × 1080 px • PNG 24-bit sRGB • 2.4 MB</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                      Hazır ✓
                    </span>
                  </div>
                </div>

                {/* Bölüm 2: WhatsApp İletimi */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] flex items-center justify-center font-bold">
                      2
                    </span>
                    Müşteri WhatsApp Bildirimi &amp; Teslimat
                  </h3>
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 text-xs text-slate-700 italic">
                    &ldquo;Sayın {activeCardGuest.name}, BCT Stüdyo çekiminiz ve dijital kartınız hazırlanmıştır. Yayın tanıtım materyalleriniz ekte yer almaktadır.&rdquo;
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-100/60 p-3 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-600">
                      Alıcı Telefon: <strong>{activeCardGuest.phone || "+90 (500) 000 00 00"}</strong>
                    </span>
                    <a
                      href={`https://wa.me/${(activeCardGuest.phone || "905328401920").replace(/\D/g, "")}?text=${encodeURIComponent(
                        `Sayın ${activeCardGuest.name}, BCT Stüdyo çekiminiz ve dijital kartınız hazırlanmıştır.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#25D366] hover:bg-[#1ebd5b] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">chat</span>
                      WhatsApp&apos;ta Aç ve Gönder
                    </a>
                  </div>
                </div>

                {/* Arşivleme Aksiyonu */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Dijital kart müşteriye teslim edildiğinde kart arşive taşınır.
                  </span>
                  <button
                    onClick={handleArchiveGuest}
                    disabled={archiveState !== "idle"}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">archive</span>
                    {archiveState === "idle" && "Süreci Tamamla ve Arşivle"}
                    {archiveState === "loading" && "Arşivleniyor..."}
                    {archiveState === "done" && "Arşivlendi ✓"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                Lütfen soldaki listeden ücretli bir konuk seçiniz.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SEKME 3: YOUTUBE YÖNETİM MASASI (YALNIZCA ÜCRETLİ KONUKLAR)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === "youtube" && (
        <div className="flex flex-col gap-6">
          {/* Üst Bilgilendirme */}
          <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 flex items-start gap-3 text-xs text-red-950">
            <span className="material-symbols-outlined text-red-600 text-[22px] shrink-0">smart_display</span>
            <div>
              <strong className="font-bold">YouTube Yayın &amp; Arşiv Kuralı:</strong> Ücretsiz konuklar televizyon canlı yayınında bir defa yayınlandıktan sonra silinir; YouTube&apos;a aktarılmaz. Bu masada <strong>yalnızca ücretli paket satın alan konukların</strong> 4K YouTube master video yüklemeleri, video başlıkları, SEO etiketleri ve linkleri yönetilir.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
            {/* Sol: Ücretli Konuklar YouTube Listesi */}
            <div className="lg:col-span-3 flex flex-col gap-3">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900">YouTube Portföyü (Ücretli)</h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700">
                    {paidYouTubeCandidates.length} Konuk
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">YouTube yükleme ve yayın takibi</p>
              </div>

              <div className="flex flex-col gap-2.5">
                {paidYouTubeCandidates.map((g) => {
                  const isSelected = activeYtGuest?.id === g.id;
                  const ytMeta = g.youtubeMetadata;
                  const status = ytMeta?.status || "bekliyor";

                  return (
                    <div
                      key={g.id}
                      onClick={() => setSelectedYtGuestId(g.id)}
                      className={`relative rounded-xl p-3.5 shadow-2xs cursor-pointer transition-all border ${
                        isSelected
                          ? "bg-red-50/40 border-red-500 ring-1 ring-red-500"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">{g.name}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              ⭐ VIP
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{g.company}</p>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            status === "yayinda"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : status === "yuklendi"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {status === "yayinda"
                            ? "Yayında"
                            : status === "yuklendi"
                            ? "Liste Dışı"
                            : "Yükleme Bekliyor"}
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>{g.registrationNo}</span>
                        <span>{ytMeta?.youtubeUrl ? "Link Kayıtlı ✓" : "Link Bekleniyor"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sağ: YouTube İşlem Masası */}
            {activeYtGuest ? (
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">{activeYtGuest.name}</h2>
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                        YouTube Masası
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {activeYtGuest.company} — {activeYtGuest.title} • Paket: {activeYtGuest.amount} ₺
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {ytUrl ? (
                      <a
                        href={ytUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                        YouTube&apos;da İzle
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 italic">URL henüz girilmedi</span>
                    )}
                  </div>
                </div>

                {/* Form 1: YouTube Durumu & Linki */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">YouTube Yayın Durumu</label>
                    <select
                      value={ytStatus}
                      onChange={(e) => setYtStatus(e.target.value as YouTubeMetadata["status"])}
                      className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2.5 font-semibold text-slate-800 focus:outline-none focus:border-red-500"
                    >
                      <option value="bekliyor">🟡 Yükleme Bekliyor (Henüz Yüklenmedi)</option>
                      <option value="yuklendi">🔵 Liste Dışı / Gizli (Yüklendi, Kontrol Ediliyor)</option>
                      <option value="yayinda">🟢 Yayında / Herkese Açık (Canlıda)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">YouTube Video URL</label>
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={ytUrl}
                      onChange={(e) => setYtUrl(e.target.value)}
                      className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 font-mono focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                {/* Form 2: Video Başlığı */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">YouTube Video Başlığı</label>
                    <button
                      onClick={() => copyTextToClipboard(ytCustomTitle, "Başlık")}
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[13px]">content_copy</span>
                      Başlığı Kopyala
                    </button>
                  </div>
                  <input
                    type="text"
                    value={ytCustomTitle}
                    onChange={(e) => setYtCustomTitle(e.target.value)}
                    className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-red-500 font-medium"
                  />
                </div>

                {/* Form 3: Açıklama ve SEO Şablonu */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      YouTube Açıklama Metni &amp; SEO Etiketleri (Otomatik Üretildi)
                    </label>
                    <button
                      onClick={() => copyTextToClipboard(ytCustomDesc, "Açıklama")}
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[13px]">content_copy</span>
                      Açıklamayı Kopyala
                    </button>
                  </div>
                  <textarea
                    rows={7}
                    value={ytCustomDesc}
                    onChange={(e) => setYtCustomDesc(e.target.value)}
                    className="text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:bg-white focus:border-red-500 leading-relaxed"
                  />
                </div>

                {/* Alt Aksiyon Butonu */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Kaydedilen bilgiler sistem denetim günlüğüne ve misafir dosyasına işlenir.
                  </span>
                  <button
                    onClick={handleSaveYouTube}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[17px]">save</span>
                    YouTube Bilgilerini Kaydet
                  </button>
                </div>
              </div>
            ) : (
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                Lütfen soldaki listeden bir konuk seçiniz.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: OTOMATİK AKILLI YAYIN TAKVİMİ OLUŞTURUCU
          ───────────────────────────────────────────────────────────── */}
      {showAutoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 flex flex-col gap-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">bolt</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Otomatik Yayın Takvimi Oluşturucu</h3>
                  <p className="text-xs text-slate-500">Prime Time optimizasyonu &amp; Arşiv Dağıtım Motoru</p>
                </div>
              </div>
              <button
                onClick={() => setShowAutoModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Çalışma Mantığı Hatırlatması */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-950 space-y-1.5">
              <div className="font-bold text-blue-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-blue-700">psychology</span>
                Sistem Nasıl Planlama Yapar?
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px] leading-relaxed">
                <li>
                  Günün en popüler <strong>Prime Time (12:00 - 16:00, 9 Kuşak)</strong> saatlerine yeni ve ücretli konuklar yerleştirilir.
                </li>
                <li>
                  Eğer ücretli konuklar 9 kuşağı aşarsa, taşan konuklar <strong>otomatik olarak ertesi günün prime kuşağına</strong> devreder.
                </li>
                <li>
                  Standart saatlere (11:30, 16:30 - 19:00) ücretsiz konuklar ve geçmiş ücretli arşiv tekrarları dağıtılır.
                </li>
                <li>
                  <strong>Geçmiş takvim kayıtları asla silinmez;</strong> yeni planlama mevcut arşivi koruyarak üzerine eklenir.
                </li>
              </ul>
            </div>

            {/* Süre Seçimi */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-800">Planlama Süresi Seçiniz:</label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setGenerateDays(1)}
                  className={`p-3 rounded-xl border text-center transition ${
                    generateDays === 1
                      ? "border-blue-600 bg-blue-50 text-blue-800 font-bold ring-1 ring-blue-600"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700 text-xs"
                  }`}
                >
                  <div className="text-base font-bold">1 Gün</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">16 Kuşak</div>
                </button>

                <button
                  type="button"
                  onClick={() => setGenerateDays(7)}
                  className={`p-3 rounded-xl border text-center transition ${
                    generateDays === 7
                      ? "border-blue-600 bg-blue-50 text-blue-800 font-bold ring-1 ring-blue-600"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700 text-xs"
                  }`}
                >
                  <div className="text-base font-bold">1 Hafta</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">112 Kuşak</div>
                </button>

                <button
                  type="button"
                  onClick={() => setGenerateDays(30)}
                  className={`p-3 rounded-xl border text-center transition ${
                    generateDays === 30
                      ? "border-blue-600 bg-blue-50 text-blue-800 font-bold ring-1 ring-blue-600"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700 text-xs"
                  }`}
                >
                  <div className="text-base font-bold">1 Ay</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">480 Kuşak</div>
                </button>
              </div>
            </div>

            {/* Başlangıç Tarihi */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-600 font-medium">Başlangıç Tarihi:</span>
              <strong className="text-slate-900 font-mono">{formatTurkishDate(selectedDate)}</strong>
            </div>

            {/* Aksiyon Butonları */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowAutoModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => handleGenerateSmart(generateDays, selectedDate)}
                disabled={generating}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                {generating ? "Oluşturuluyor..." : "Otomatik Planı Başlat & Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: GEÇMİŞ YAYIN TAKVİMİ ARŞİVİ
          ───────────────────────────────────────────────────────────── */}
      {showArchiveHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 flex flex-col gap-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[18px]">history</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Geçmiş Yayın Takvimi Arşivi</h3>
                  <p className="text-xs text-slate-500">
                    Geçmiş kayıtlar kalıcı olarak saklanmaktadır (Asla silinmez)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowArchiveHistoryModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
              {allRecordedDates.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">Kayıtlı takvim verisi yok.</div>
              ) : (
                allRecordedDates.map((date) => {
                  const slots = broadcastSchedules.filter((s) => s.date === date);
                  const isCurrent = date === selectedDate;

                  return (
                    <div
                      key={date}
                      onClick={() => {
                        setSelectedDate(date);
                        setShowArchiveHistoryModal(false);
                      }}
                      className={`p-3 flex items-center justify-between cursor-pointer rounded-lg transition ${
                        isCurrent ? "bg-blue-50 text-blue-900 font-bold" : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold">{formatTurkishDate(date)}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">
                          {slots.length} Kuşak
                        </span>
                        <span className="text-blue-600 text-xs">Görüntüle →</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowArchiveHistoryModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition"
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
