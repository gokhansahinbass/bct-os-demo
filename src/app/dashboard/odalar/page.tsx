"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/lib/useStore";
import {
  cancelGuestAppointment,
  restoreGuestAppointment,
  markGuestArrived,
  addGuest,
  type Guest,
  type GuestStatus,
  openGuestDossier,
} from "@/lib/store";
import StudioDelayBanner from "@/components/StudioDelayBanner";
import UpdateTimeModal from "@/components/UpdateTimeModal";

export default function OdalarPage() {
  const {
    guests,
    staff,
    rooms,
    currentUser,
    activeRole,
    canAccessPage,
    canAccessRoom,
    isSensitiveBlurred,
    activeRoleDef,
    hasPermission,
    canManageGuest,
    studioDelays,
    sendGuestArrivalReminder,
  } = useStore();

  const [updateTimeModalGuest, setUpdateTimeModalGuest] = useState<Guest | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  if (!canAccessPage("/dashboard/odalar")) {
    return null;
  }
  
  // Ana Sekme: Odalar (Çağrı Merkezi) vs. Pazarlama Masası (Ayrı Birim)
  const [mainTab, setMainTab] = useState<"rooms" | "marketers">("rooms");

  // Oda Sekmesi: Hangi odanın tablosu gösterilecek? ("all" = Tüm Odaların Tabloları Ayrı Ayrı, "oda-1", "oda-2", "oda-3")
  const [activeRoomTab, setActiveRoomTab] = useState<string>("oda-1");

  // Oda İçinde Görünüm Modu: "guests" (Konuk Tablosu) vs. "staff_table" (Kadro Performans Tablosu)
  const [roomViewModeByRoom, setRoomViewModeByRoom] = useState<Record<string, "guests" | "staff_table">>({});

  // Her odada seçili çalışan filtresi ("all" = Tüm Oda Kadrosu, veya çalışan adı: "Hakan Demir", "Ayşe Yılmaz" vb.)
  const [employeeFilterByRoom, setEmployeeFilterByRoom] = useState<Record<string, string>>({});

  // Arama & Durum Filtresi
  const [statusFilter, setStatusFilter] = useState<"all" | "arrived" | "upcoming" | "cancelled">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modallar
  const [cancelModalGuest, setCancelModalGuest] = useState<Guest | null>(null);
  const [cancelReasonText, setCancelReasonText] = useState("");
  const [selectedGuestModal, setSelectedGuestModal] = useState<Guest | null>(null);
  const [selectedMarketerModal, setSelectedMarketerModal] = useState<string | null>(null);
  const [showNewGuestModal, setShowNewGuestModal] = useState(false);

  // Yeni Konuk Randevu Formu
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestCompany, setNewGuestCompany] = useState("");
  const [newGuestTitle, setNewGuestTitle] = useState("Genel Müdür");
  const [newGuestPhone, setNewGuestPhone] = useState("+90 (532) ");
  const [newGuestRep, setNewGuestRep] = useState("Ayşe Yılmaz");
  const [newGuestDate, setNewGuestDate] = useState("14 Ekim 2026");
  const [newGuestTime, setNewGuestTime] = useState("14:30");
  const [newGuestStudio, setNewGuestStudio] = useState("Gri Stüdyo");

  // Helper: Geliş kategorisi (Gelen, Gelecek, İptal)
  function getGuestCategory(status: GuestStatus): "arrived" | "upcoming" | "cancelled" {
    if (status === "cancelled") return "cancelled";
    if (status === "appointment_set") return "upcoming";
    return "arrived";
  }

  // Çağrı Merkezi Odaları Listesi (Oda 1, Oda 2, Oda 3)
  const callCenterRooms = useMemo(() => {
    return [
      {
        id: "oda-1",
        name: "Oda 1",
        title: "Çağrı Merkezi — 1. Satış & Teyit Odası",
        color: "#2563EB",
        badgeBg: "bg-blue-100 text-blue-800 border-blue-200",
        leaderName: "Ayşe Yılmaz",
        leaderRole: "Oda Şefi / Yönetici",
        employees: staff.filter((s) => s.room === "oda-1"),
        defaultRep: "Ayşe Yılmaz",
      },
      {
        id: "oda-2",
        name: "Oda 2",
        title: "Çağrı Merkezi — 2. Satış & Teyit Odası",
        color: "#7C3AED",
        badgeBg: "bg-purple-100 text-purple-800 border-purple-200",
        leaderName: "Caner Kaya",
        leaderRole: "Oda Şefi / Yönetici",
        employees: staff.filter((s) => s.room === "oda-2"),
        defaultRep: "Caner Kaya",
      },
      {
        id: "oda-3",
        name: "Oda 3",
        title: "Çağrı Merkezi — 3. Satış & Teyit Odası",
        color: "#059669",
        badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200",
        leaderName: "Elif Arslan",
        leaderRole: "Oda Şefi / Yönetici",
        employees: staff.filter((s) => s.room === "oda-3"),
        defaultRep: "Elif Arslan",
      },
    ];
  }, [staff]);

  // Her Oda İçin Özel Metrik Hesaplayıcı
  function calculateRoomMetrics(roomId: string) {
    const roomGuests = guests.filter((g) => g.room === roomId);
    const total = roomGuests.length;
    const arrived = roomGuests.filter((g) => getGuestCategory(g.status) === "arrived");
    const upcoming = roomGuests.filter((g) => getGuestCategory(g.status) === "upcoming");
    const cancelled = roomGuests.filter((g) => getGuestCategory(g.status) === "cancelled");
    const arrivalRate = total > 0 ? Math.round((arrived.length / total) * 100) : 0;
    const cancelRate = total > 0 ? Math.round((cancelled.length / total) * 100) : 0;
    const totalRevenue = roomGuests.reduce((sum, g) => {
      const svcSum = (g.services || []).reduce((sSum, s) => sSum + (s.price || 0), 0);
      const amt = parseInt((g.amount || "0").replace(/\D/g, ""), 10) || 0;
      return sum + (svcSum > 0 ? svcSum : amt);
    }, 0);

    return {
      total,
      arrivedCount: arrived.length,
      upcomingCount: upcoming.length,
      cancelledCount: cancelled.length,
      arrivalRate,
      cancelRate,
      totalRevenue,
      guests: roomGuests,
    };
  }

  // Her Çalışan İçin Bireysel Metrik Hesaplayıcı
  function calculateEmployeeMetrics(empName: string) {
    const empGuests = guests.filter((g) => g.representative === empName);
    const total = empGuests.length;
    const arrived = empGuests.filter((g) => getGuestCategory(g.status) === "arrived");
    const upcoming = empGuests.filter((g) => getGuestCategory(g.status) === "upcoming");
    const cancelled = empGuests.filter((g) => getGuestCategory(g.status) === "cancelled");
    const arrivalRate = total > 0 ? Math.round((arrived.length / total) * 100) : 0;
    const totalRevenue = empGuests.reduce((sum, g) => {
      const svcSum = (g.services || []).reduce((sSum, s) => sSum + (s.price || 0), 0);
      const amt = parseInt((g.amount || "0").replace(/\D/g, ""), 10) || 0;
      return sum + (svcSum > 0 ? svcSum : amt);
    }, 0);

    return {
      total,
      arrivedCount: arrived.length,
      upcomingCount: upcoming.length,
      cancelledCount: cancelled.length,
      arrivalRate,
      totalRevenue,
      guests: empGuests,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // PAZARLAMACI BAŞARI TABLOSU HESAPLAYICISI (Ayrı Birim)
  // Pazarlamacılar oda çalışanı DEĞİLDİR! Stüdyoya fiilen GELEN
  // konuklara ek paket satarlar.
  // ═══════════════════════════════════════════════════════════════
  const marketersPerformance = useMemo(() => {
    // Pazarlama Masası Personeli
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

    return marketingStaff.map((marketer) => {
      // Bu pazarlamacının görüştüğü konuklar
      const assignedGuests = guests.filter((g) => g.marketer === marketer.name);

      // Pazarlamacı sadece stüdyoya fiilen GELEN konuklara satış yapabilir:
      const arrivedGuests = assignedGuests.filter((g) => getGuestCategory(g.status) === "arrived");

      // Gelenlerden ücretli ürün/paket satılanlar (Başarılı Satış)
      const soldGuests = arrivedGuests.filter(
        (g) => g.services && g.services.length > 0 && g.services.some((s) => s.price > 0)
      );

      // Gelen ama hiçbir paket almayanlar (Başarısız Satış / Ücretsiz Kalan)
      const unsoldGuests = arrivedGuests.filter(
        (g) => !g.services || g.services.length === 0 || !g.services.some((s) => s.price > 0)
      );

      // Toplam Satış Tutarı (₺ Ciro)
      const totalRevenue = soldGuests.reduce((sum, g) => {
        const actual = (g.services || []).reduce((sSum, s) => sSum + (s.price || 0), 0);
        return sum + actual;
      }, 0);

      // Alınan Ön Ödeme
      const totalCollected = soldGuests.reduce((sum, g) => sum + (g.onOdemeMiktari || 0), 0);

      // Başarı Yüzdesi: Gelen konuğa satış yapma oranı (%)
      const successRate = arrivedGuests.length > 0 ? Math.round((soldGuests.length / arrivedGuests.length) * 100) : 0;

      // Sepet Ortalaması (TL)
      const avgBasket = soldGuests.length > 0 ? Math.round(totalRevenue / soldGuests.length) : 0;

      return {
        ...marketer,
        arrivedGuestsCount: arrivedGuests.length,
        soldCount: soldGuests.length,
        unsoldCount: unsoldGuests.length,
        totalRevenue,
        totalCollected,
        successRate,
        avgBasket,
        allGuests: assignedGuests,
        arrivedGuests,
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [guests]);

  // Handle Cancel Submit with Strict Permission Guard
  function handleConfirmCancel(e: React.FormEvent) {
    e.preventDefault();
    if (!cancelModalGuest) return;
    const roomDef = callCenterRooms.find((r) => r.id === cancelModalGuest.room);
    if (!canManageGuest(cancelModalGuest, roomDef?.leaderName)) {
      alert(`Yetki Kısıtlaması: Bu randevuyu yalnızca konuğu çağıran temsilci (${cancelModalGuest.representative}) veya oda lideri (${roomDef?.leaderName}) iptal edebilir.`);
      setCancelModalGuest(null);
      return;
    }
    cancelGuestAppointment(cancelModalGuest.id, cancelReasonText.trim() || "Konuk randevuyu iptal etti.");
    setCancelModalGuest(null);
    setCancelReasonText("");
  }

  // Handle Mark Arrived with Permission Guard
  function handleMarkArrived(g: Guest, leaderName?: string) {
    if (!canManageGuest(g, leaderName)) {
      alert(`Yetki Kısıtlaması: Bu konuğu yalnızca çağıran temsilci (${g.representative}) veya oda lideri (${leaderName}) 'Geldi' olarak işaretleyebilir.`);
      return;
    }
    markGuestArrived(g.id);
  }

  // Handle Restore Guest with Permission Guard
  function handleRestoreGuest(g: Guest, leaderName?: string) {
    if (!canManageGuest(g, leaderName)) {
      alert(`Yetki Kısıtlaması: Bu randevuyu yalnızca konuğu çağıran temsilci (${g.representative}) veya oda lideri (${leaderName}) geri alabilir.`);
      return;
    }
    restoreGuestAppointment(g.id);
  }

  // Handle New Guest Submit
  function handleCreateGuestSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newGuestName.trim()) return;

    const selectedStaffMember = staff.find((s) => s.name === newGuestRep);
    const assignedRoom = selectedStaffMember?.room || (newGuestRep === "Caner Kaya" ? "oda-2" : newGuestRep === "Elif Arslan" ? "oda-3" : "oda-1");
    const assignedMarketer = assignedRoom === "oda-2" ? "Burak Aksoy" : "Selin Karaca";

    addGuest({
      name: newGuestName.trim(),
      company: newGuestCompany.trim() || "Firma Belirtilmedi",
      title: newGuestTitle.trim() || "Yönetici",
      phone: newGuestPhone.trim(),
      instagram: "",
      website: "",
      showIg: false,
      showWeb: false,
      vip: false,
      status: "appointment_set",
      representative: newGuestRep,
      marketer: assignedMarketer,
      appointmentDate: newGuestDate,
      appointmentTime: newGuestTime,
      shootTime: newGuestTime,
      shootDuration: "25 dk",
      studio: newGuestStudio,
      editor: "",
      amount: "0",
      paymentStatus: "odenmedi",
      onOdemeMiktari: 0,
      room: assignedRoom,
    });

    setShowNewGuestModal(false);
    setNewGuestName("");
    setNewGuestCompany("");
  }

  // Tekil Bir Odanın Tablosunu Render Eden Bileşen
  function renderRoomTable(roomDef: typeof callCenterRooms[0]) {
    const hasRoomAccess = canAccessRoom(roomDef.id);
    const isRevBlurred = isSensitiveBlurred("revenue");
    const isContactBlurred = isSensitiveBlurred("contact");

    // Rol Kısıtlaması: Bu odaya erişim yetkisi yoksa kilit ekranı göster
    if (!hasRoomAccess) {
      return (
        <div key={roomDef.id} className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mx-auto border border-amber-200 shadow-inner">
            🔒
          </div>
          <h3 className="font-bold text-base text-slate-900">{roomDef.title} — Erişim Kısıtlandı</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Mevcut rolünüz ({activeRoleDef?.label || "Rolünüz"}) bu satış odasının konuk randevu ve performans verilerini görüntüleme yetkisine sahip değildir.
          </p>
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-mono border border-slate-200">
              İzin Kodu: room_{roomDef.id.replace("-", "")} [KAPALI]
            </span>
          </div>
        </div>
      );
    }

    const metrics = calculateRoomMetrics(roomDef.id);
    const activeEmpFilter = employeeFilterByRoom[roomDef.id] || "all";
    const currentViewMode = roomViewModeByRoom[roomDef.id] || "guests";
    
    // Filtreleme (Çalışan, Durum, Arama)
    const roomFilteredGuests = metrics.guests.filter((g) => {
      // 1. Çalışan Filtresi
      if (activeEmpFilter !== "all" && g.representative !== activeEmpFilter) {
        return false;
      }
      // 2. Durum Filtresi
      const cat = getGuestCategory(g.status);
      if (statusFilter !== "all" && cat !== statusFilter) return false;
      // 3. Arama Filtresi
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = g.name.toLowerCase().includes(q);
        const matchCompany = g.company.toLowerCase().includes(q);
        const matchPhone = g.phone.toLowerCase().includes(q);
        const matchRep = g.representative.toLowerCase().includes(q);
        const matchDate = (g.appointmentDate || "").toLowerCase().includes(q);
        if (!matchName && !matchCompany && !matchPhone && !matchRep && !matchDate) return false;
      }
      return true;
    });

    return (
      <div key={roomDef.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
        {/* ── 1. ODA BAŞLIĞI, ODA ŞEFİ ROZETİ & KPI ROZETLERİ ── */}
        <div className="p-5 bg-slate-50/90 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${roomDef.badgeBg}`}>
                {roomDef.name}
              </span>
              <h2 className="text-base font-bold text-[#0F172A]">{roomDef.title}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200 flex items-center gap-1">
                <span>👑</span> Oda Şefi: <strong>{roomDef.leaderName}</strong>
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Oda Kadrosu: <strong className="text-slate-800">{roomDef.employees.length} Personel</strong> (1 Oda Şefi + {roomDef.employees.length - 1} Çağrı Merkezi Temsilcisi). Her çalışan kendi getirdiği konuk üzerinden değerlendirilir.
            </p>
          </div>

          {/* Odanın Kendi Özel Toplam Sonuçları */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Toplam Randevu</span>
              <strong className="text-sm font-bold font-mono text-slate-900">{metrics.total} Konuk</strong>
            </div>

            <div className="px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs shadow-2xs">
              <span className="text-[10px] text-emerald-700 block font-semibold uppercase">🟢 Gelen Konuk</span>
              <strong className="text-sm font-bold font-mono text-emerald-800">
                {metrics.arrivedCount} <span className="text-[10px] font-normal">(%{metrics.arrivalRate})</span>
              </strong>
            </div>

            <div className="px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-200 text-xs shadow-2xs">
              <span className="text-[10px] text-amber-700 block font-semibold uppercase">🟡 Gelecek Konuk</span>
              <strong className="text-sm font-bold font-mono text-amber-800">{metrics.upcomingCount} Konuk</strong>
            </div>

            <div className="px-3 py-1.5 bg-rose-50 rounded-xl border border-rose-200 text-xs shadow-2xs">
              <span className="text-[10px] text-rose-700 block font-semibold uppercase">🔴 İptal Olan Konuk</span>
              <strong className="text-sm font-bold font-mono text-rose-800">
                {metrics.cancelledCount} <span className="text-[10px] font-normal">(%{metrics.cancelRate})</span>
              </strong>
            </div>

            <div className="px-3 py-1.5 bg-blue-50 rounded-xl border border-blue-200 text-xs shadow-2xs">
              <span className="text-[10px] text-blue-700 block font-semibold uppercase">💰 Toplam Ciro</span>
              <strong className="text-sm font-bold font-mono text-blue-800">
                {isRevBlurred ? "₺***.***" : `₺${metrics.totalRevenue.toLocaleString("tr-TR")}`}
              </strong>
            </div>
          </div>
        </div>

        {/* ── 2. GÖRÜNÜM SEÇİCİ TABLARI (Konuk Tablosu vs. Kadro Tablosu) ── */}
        <div className="px-5 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            {/* Alt Sekmeler */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setRoomViewModeByRoom((prev) => ({ ...prev, [roomDef.id]: "guests" }))}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  currentViewMode === "guests"
                    ? "bg-white text-blue-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>📋</span> Konuk Randevu Tablosu ({roomFilteredGuests.length})
              </button>

              <button
                onClick={() => setRoomViewModeByRoom((prev) => ({ ...prev, [roomDef.id]: "staff_table" }))}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  currentViewMode === "staff_table"
                    ? "bg-white text-indigo-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>👥</span> Kadro &amp; Bireysel Performans Tablosu ({roomDef.employees.length} Kişi)
              </button>
            </div>

            {/* Hızlı Bilgi & Filtre Kaldır */}
            {activeEmpFilter !== "all" && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-blue-800 font-semibold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                  Filtre: <strong>{activeEmpFilter}</strong>
                </span>
                <button
                  onClick={() => setEmployeeFilterByRoom((prev) => ({ ...prev, [roomDef.id]: "all" }))}
                  className="text-xs text-blue-600 hover:text-blue-900 font-bold underline cursor-pointer"
                >
                  ✕ Tüm Kadroyu Göster
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── 3. GÖRÜNÜM: KADRO & BİREYSEL PERFORMANS TABLOSU (Okunaklı & Ferah Tablo) ── */}
        {currentViewMode === "staff_table" && (
          <div className="px-5 pb-5 space-y-3 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl">
              <div>
                <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <span>👥</span> {roomDef.name} Kadrosu &amp; Bireysel Performans Karnesi ({roomDef.employees.length} Kişi)
                </h3>
                <p className="text-[11px] text-indigo-800/80 mt-0.5">
                  Her çalışan kendi getirdiği konuk üzerinden ayrı değerlendirilir. Çalışanın getirdiği konukları görmek için &ldquo;Konukları Listele&rdquo; butonuna basabilirsiniz.
                </p>
              </div>

              <button
                onClick={() => setRoomViewModeByRoom((prev) => ({ ...prev, [roomDef.id]: "guests" }))}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-300 rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer self-start sm:self-auto"
              >
                ← Konuk Randevu Tablosuna Dön
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-3.5">Personel</th>
                    <th className="p-3.5">Rol &amp; Görev</th>
                    <th className="p-3.5 text-center">Toplam Randevu</th>
                    <th className="p-3.5 text-center">🟢 Geldi</th>
                    <th className="p-3.5 text-center">🟡 Gelecek</th>
                    <th className="p-3.5 text-center">🔴 İptal</th>
                    <th className="p-3.5 min-w-[150px]">Teyit Başarı Karnesi</th>
                    <th className="p-3.5 text-right">Getirdiği Ciro</th>
                    <th className="p-3.5 text-center">Aksiyon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {roomDef.employees.map((emp) => {
                    const empMetrics = calculateEmployeeMetrics(emp.name);
                    const isLeader = emp.isLeader || emp.name === roomDef.leaderName;
                    const isSelected = activeEmpFilter === emp.name;

                    return (
                      <tr
                        key={emp.id}
                        className={`transition ${isSelected ? "bg-blue-50/80 font-medium" : "hover:bg-slate-50"}`}
                      >
                        {/* Personel Avatar & İsim */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-2xs ${
                                isLeader ? "bg-indigo-600 text-white" : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {emp.avatar || emp.name.split(" ").map((w) => w[0]).join("")}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 text-xs">{emp.name}</span>
                                {isLeader && <span title="Oda Şefi">👑</span>}
                                {isSelected && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-600 text-white font-bold">
                                    Seçili
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                @{emp.username || emp.email.split("@")[0]}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Rol & Görev */}
                        <td className="p-3.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              isLeader
                                ? "bg-indigo-100 text-indigo-900 border border-indigo-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {isLeader ? "👑 Oda Şefi / Yönetici" : "📞 Çağrı Temsilcisi"}
                          </span>
                        </td>

                        {/* Toplam Randevu */}
                        <td className="p-3.5 text-center">
                          <span className="font-mono font-bold text-slate-900 text-xs px-2 py-0.5 bg-slate-100 rounded">
                            {empMetrics.total} Konuk
                          </span>
                        </td>

                        {/* Geldi */}
                        <td className="p-3.5 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            🟢 {empMetrics.arrivedCount}
                          </span>
                        </td>

                        {/* Gelecek */}
                        <td className="p-3.5 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            🟡 {empMetrics.upcomingCount}
                          </span>
                        </td>

                        {/* İptal */}
                        <td className="p-3.5 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                            🔴 {empMetrics.cancelledCount}
                          </span>
                        </td>

                        {/* Teyit Başarı Karnesi (Progress Bar) */}
                        <td className="p-3.5">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-800">%{empMetrics.arrivalRate}</span>
                              <span className={`text-[10px] font-semibold ${
                                empMetrics.arrivalRate >= 70 ? "text-emerald-700" : empMetrics.arrivalRate > 0 ? "text-blue-700" : "text-slate-400"
                              }`}>
                                {empMetrics.arrivalRate >= 80 ? "Mükemmel" : empMetrics.arrivalRate >= 50 ? "Başarılı" : empMetrics.total === 0 ? "Henüz Yok" : "Geliştirilmeli"}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  empMetrics.arrivalRate >= 70
                                    ? "bg-emerald-500"
                                    : empMetrics.arrivalRate >= 40
                                    ? "bg-blue-500"
                                    : "bg-slate-300"
                                }`}
                                style={{ width: `${empMetrics.arrivalRate}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>

                        {/* Getirdiği Ciro */}
                        <td className="p-3.5 text-right">
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            {isRevBlurred ? "₺***.***" : `₺${empMetrics.totalRevenue.toLocaleString("tr-TR")}`}
                          </span>
                        </td>

                        {/* Aksiyon */}
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => {
                              setEmployeeFilterByRoom((prev) => ({ ...prev, [roomDef.id]: emp.name }));
                              setRoomViewModeByRoom((prev) => ({ ...prev, [roomDef.id]: "guests" }));
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition cursor-pointer"
                            title={`${emp.name} tarafından getirilen konukları listele`}
                          >
                            📋 Konukları Gör ({empMetrics.total})
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Özet Toplam Satırı */}
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-xs text-slate-900 border-t-2 border-slate-300">
                    <td className="p-3.5" colSpan={2}>
                      {roomDef.name} Genel Toplam ({roomDef.employees.length} Personel)
                    </td>
                    <td className="p-3.5 text-center font-mono">{metrics.total} Konuk</td>
                    <td className="p-3.5 text-center text-emerald-800 font-mono">🟢 {metrics.arrivedCount}</td>
                    <td className="p-3.5 text-center text-amber-800 font-mono">🟡 {metrics.upcomingCount}</td>
                    <td className="p-3.5 text-center text-rose-800 font-mono">🔴 {metrics.cancelledCount}</td>
                    <td className="p-3.5">
                      <span className="text-emerald-700 font-bold">Ortalama: %{metrics.arrivalRate}</span>
                    </td>
                    <td className="p-3.5 text-right font-mono text-blue-900">
                      {isRevBlurred ? "₺***.***" : `₺${metrics.totalRevenue.toLocaleString("tr-TR")}`}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => {
                          setEmployeeFilterByRoom((prev) => ({ ...prev, [roomDef.id]: "all" }));
                          setRoomViewModeByRoom((prev) => ({ ...prev, [roomDef.id]: "guests" }));
                        }}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                      >
                        Tümünü Listele
                      </button>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ── 4. GÖRÜNÜM: ODA KONUK RANDEVU TABLOSU ── */}
        {currentViewMode === "guests" && (
          <div className="px-5 pb-5 space-y-3 animate-fade-in">
            {/* Hızlı Filtre Çubuğu */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 flex-shrink-0">
                  <span className="material-symbols-outlined text-[16px] text-blue-600">person</span>
                  Çalışan Filtresi:
                </span>
                <select
                  value={activeEmpFilter}
                  onChange={(e) => setEmployeeFilterByRoom((prev) => ({ ...prev, [roomDef.id]: e.target.value }))}
                  className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">Tüm Oda Kadrosu ({roomDef.employees.length} Personel)</option>
                  {roomDef.employees.map((emp) => {
                    const empCount = calculateEmployeeMetrics(emp.name).total;
                    const isLeader = emp.isLeader || emp.name === roomDef.leaderName;
                    return (
                      <option key={emp.id} value={emp.name}>
                        {emp.name} {isLeader ? "👑 (Oda Şefi)" : "📞"} — {empCount} Konuk
                      </option>
                    );
                  })}
                </select>

                {activeEmpFilter !== "all" && (
                  <button
                    onClick={() => setEmployeeFilterByRoom((prev) => ({ ...prev, [roomDef.id]: "all" }))}
                    className="text-xs text-blue-600 hover:text-blue-900 font-bold cursor-pointer"
                  >
                    ✕ Filtreyi Kaldır
                  </button>
                )}
              </div>

              <button
                onClick={() => setRoomViewModeByRoom((prev) => ({ ...prev, [roomDef.id]: "staff_table" }))}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
              >
                <span>👥</span> Kadro &amp; Bireysel Performans Tablosunu Aç ({roomDef.employees.length} Kişi)
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="px-2.5 py-2.5">Konuk &amp; Mesleği</th>
                    <th className="px-2.5 py-2.5">Temsilci</th>
                    <th className="px-2.5 py-2.5">Şirket &amp; İletişim</th>
                    <th className="px-2.5 py-2.5">Randevu &amp; Saat</th>
                    <th className="px-2.5 py-2.5">Geliş Durumu</th>
                    <th className="px-2.5 py-2.5">Paket &amp; Stüdyo</th>
                    <th className="px-2.5 py-2.5 text-right">İşlem &amp; Aksiyon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {roomFilteredGuests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                        Bu odaya ve seçilen personele ait konuk kaydı bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    roomFilteredGuests.map((g) => {
                      const category = getGuestCategory(g.status);
                      const isLeaderRep = g.representative === roomDef.leaderName;

                      return (
                        <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                          {/* 1. Konuk & Mesleği */}
                          <td className="px-2.5 py-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                                {g.name.split(" ").map((w) => w[0]).join("")}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openGuestDossier(g.id);
                                    }}
                                    className="font-bold text-slate-900 text-xs hover:text-blue-600 hover:underline text-left flex items-center gap-1 group/btn"
                                    title="360° Konuk Röntgeni / Dosyasını Aç"
                                  >
                                    <span>{g.name}</span>
                                    <span className="text-[11px] opacity-70 group-hover/btn:opacity-100">👁️</span>
                                  </button>
                                  {g.vip && (
                                    <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-bold rounded">
                                      VIP
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-500 block truncate max-w-[130px]">{g.title}</span>
                              </div>
                            </div>
                          </td>

                          {/* 2. Temsilci */}
                          <td className="px-2.5 py-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs block whitespace-nowrap">{g.representative}</span>
                              {isLeaderRep && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 shrink-0">
                                  👑 Şef
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 3. Şirket & İletişim */}
                          <td className="px-2.5 py-2 text-slate-700">
                            <span className="font-semibold block text-xs truncate max-w-[130px]" title={g.company}>{g.company}</span>
                            <span className="text-[10px] font-mono text-slate-400 block whitespace-nowrap">
                              {isContactBlurred ? "+90 (532) *** ** 12" : g.phone}
                            </span>
                          </td>

                          {/* 4. Randevu & Saat (Tarih ve Saat Birleşik) */}
                          <td className="px-2.5 py-2">
                            <div className="flex items-center gap-1 text-xs font-bold text-slate-900 whitespace-nowrap">
                              <span>{g.appointmentDate || "12 Ekim 2026"}</span>
                              <span className="text-slate-400 font-normal">•</span>
                              <span className="font-mono text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                ⏰ {g.appointmentTime}
                              </span>
                            </div>
                            {studioDelays[g.studio]?.active && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 block w-fit mt-0.5" title="Stüdyoda çekim sarkması var">
                                ⚠️ +{studioDelays[g.studio].delayMinutes} dk sarktı
                              </span>
                            )}
                            {g.timeStatus === "gecikmeli" && (
                              <span className="text-[9px] font-bold text-amber-800 block mt-0.5 truncate max-w-[130px]" title={g.timeUpdateReason || "Geç Gelecek"}>
                                ⏳ Geç {g.timeUpdateReason ? `(${g.timeUpdateReason})` : ""}
                              </span>
                            )}
                            {g.timeStatus === "erken_geldi" && (
                              <span className="text-[9px] font-bold text-blue-800 block mt-0.5">
                                ⚡ Erken Geldi
                              </span>
                            )}
                            {category === "upcoming" && (!g.timeStatus || g.timeStatus === "normal") && (
                              g.timeConfirmed ? (
                                <span className="text-[9px] font-semibold text-emerald-700 block mt-0.5">
                                  ✓ Vaktinde Geliyor
                                </span>
                              ) : g.representativeRemindedAt ? (
                                <span className="text-[9px] font-bold text-amber-700 block mt-0.5">
                                  ⚠️ Teyit Bekleniyor
                                </span>
                              ) : null
                            )}
                          </td>

                          {/* 5. Geliş Durumu */}
                          <td className="px-2.5 py-2 whitespace-nowrap">
                            {category === "arrived" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                GELDİ
                              </span>
                            )}
                            {category === "upcoming" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                                GELECEK
                              </span>
                            )}
                            {category === "cancelled" && (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  İPTAL OLDU
                                </span>
                                {g.cancelledReason && (
                                  <span className="text-[9px] text-rose-600 block mt-0.5 italic max-w-[110px] truncate" title={g.cancelledReason}>
                                    {g.cancelledReason}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* 6. Paket & Stüdyo (Birleşik) */}
                          <td className="px-2.5 py-2">
                            <span className="font-mono font-bold text-slate-900 text-xs block whitespace-nowrap">
                              {isRevBlurred ? (
                                <span className="text-slate-400 font-normal">🔒 ₺***.***</span>
                              ) : (
                                g.amount !== "0" && g.amount ? `₺${g.amount}` : "Ücretsiz Canlı Yayın"
                              )}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate max-w-[130px]">
                              {g.studio?.replace("Stüdyo", "St.")} • {g.editor || "Gökhan"}
                            </span>
                          </td>

                          {/* 7. İşlem & Aksiyon */}
                          <td className="px-2.5 py-2 text-right whitespace-nowrap">
                            {(() => {
                              const canEdit = canManageGuest(g, roomDef.leaderName);

                              return (
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => setSelectedGuestModal(g)}
                                    className="px-2 py-1 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition"
                                    title="Tüm Detayları Gör"
                                  >
                                    Detay
                                  </button>

                                  {canEdit ? (
                                    <>
                                      {category === "upcoming" && (
                                        <>
                                          <button
                                            onClick={() => setUpdateTimeModalGuest(g)}
                                            className="px-1.5 py-1 text-[11px] font-semibold rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 cursor-pointer transition flex items-center gap-0.5"
                                            title="Konuğun randevu saatini veya gecikme/erken geliş beyanını güncelle"
                                          >
                                            <span className="material-symbols-outlined text-[12px]">schedule</span>
                                            <span>Saat</span>
                                          </button>

                                          {!g.timeConfirmed && (
                                            <button
                                              onClick={() => {
                                                sendGuestArrivalReminder(g.id);
                                                setFeedbackToast(`🔔 ${g.representative} adlı temsilciye "${g.name}" için acil teyit hatırlatması iletildi.`);
                                                setTimeout(() => setFeedbackToast(null), 4000);
                                              }}
                                              className="px-1.5 py-1 text-[11px] font-semibold rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 cursor-pointer transition flex items-center gap-0.5"
                                              title="Davet eden temsilciye teyit hatırlatması gönder"
                                            >
                                              <span className="material-symbols-outlined text-[12px] text-amber-600">notifications_active</span>
                                              <span>Teyit</span>
                                            </button>
                                          )}

                                          <button
                                            onClick={() => handleMarkArrived(g, roomDef.leaderName)}
                                            className="px-2 py-1 text-[11px] font-bold rounded bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition shadow-2xs"
                                            title="Konuk Geldi, Çekime Al"
                                          >
                                            ✓ Geldi
                                          </button>
                                          <button
                                            onClick={() => setCancelModalGuest(g)}
                                            className="px-1.5 py-1 text-[11px] font-semibold rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer transition"
                                            title="Randevuyu İptal Et"
                                          >
                                            İptal
                                          </button>
                                        </>
                                      )}

                                      {category === "cancelled" && (
                                        <button
                                          onClick={() => handleRestoreGuest(g, roomDef.leaderName)}
                                          className="px-2 py-1 text-[11px] font-semibold rounded bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 cursor-pointer transition"
                                          title="İptali Geri Al"
                                        >
                                          ↺ Geri Al
                                        </button>
                                      )}
                                    </>
                                  ) : (
                                    (category === "upcoming" || category === "cancelled") && (
                                      <span
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed select-none"
                                        title={`Yetki Kısıtlaması: Bu randevuyu yalnızca konuğu getiren temsilci (${g.representative}) veya oda lideri (${roomDef.leaderName}) güncelleyebilir.`}
                                      >
                                        🔒 Kilitli
                                      </span>
                                    )
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="max-w-7xl mx-auto w-full py-4 space-y-6">
        
        {/* Page Header */}
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#0F172A]">Oda &amp; Pazarlama Raporlama Merkezi</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] bg-blue-100 text-blue-800 font-mono font-bold uppercase">
                BCT-ROOM-REPORT
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Odalar bazında ayrı konuk takip tabloları ve pazarlama masası satış başarı karnesi
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* ANA BİRİM SEKMELERİ (Oda Çalışanları vs. Pazarlamacı) */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setMainTab("rooms")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  mainTab === "rooms"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>🏢</span> 1. Odalar Bazında Konuk Takip Tabloları
              </button>
              <button
                onClick={() => setMainTab("marketers")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  mainTab === "marketers"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>📈</span> 2. Pazarlamacı Başarı &amp; Satış Tablosu
              </button>
            </div>

            <button
              onClick={() => setShowNewGuestModal(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <span>+</span> Yeni Konuk Randevusu Ekle
            </button>
          </div>
        </header>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* BÖLÜM 1: HER ODANIN AYRI TABLOSU (Çağrı Merkezi Odaları)   */}
        {/* ══════════════════════════════════════════════════════════ */}
        {mainTab === "rooms" && (
          <div className="space-y-6">
            {/* Feedback Toast */}
            {feedbackToast && (
              <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-xl border border-slate-700 shadow-2xl text-xs font-semibold animate-fadeIn">
                <span className="material-symbols-outlined text-amber-400 text-[20px]">notifications_active</span>
                <span>{feedbackToast}</span>
              </div>
            )}

            {/* ── STÜDYO ÇEKİM SARKMASI UYARI BANNER'I ── */}
            <StudioDelayBanner />

            {/* Bilgilendirme Notu */}
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p>
                <strong>Oda Çalışanları Birimi:</strong> Odaların görevi konukları davet etmek, randevuyu teyit etmek ve stüdyoya getirmektir. Aşağıda her odanın ayrı tablosunda <strong>Gelen</strong>, <strong>Gelecek (tarih ve saatli)</strong> ve <strong>İptal olan</strong> konuklar bağımsız olarak takip edilir.
              </p>
              <span className="font-bold text-[11px] bg-blue-100 text-blue-800 px-2 py-1 rounded whitespace-nowrap self-start sm:self-auto">
                Oda Sayısı: 3 Satış Odası
              </span>
            </div>

            {/* Randevu Değişiklik & Yetkilendirme Kuralı Bildirimi */}
            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="text-base">🛡️</span>
                <span className="text-amber-950">
                  <strong>Randevu Düzenleme Kuralı:</strong> Randevu iptali, <strong>'✓ Geldi'</strong> veya <strong>'↺ Geri Al'</strong> aksiyonları güvenlik gereği yalnızca <strong>o konuğu çağıran temsilci</strong> veya <strong>o odanın şefi / lideri</strong> tarafından yapılabilir. Diğer personeller yalnızca <strong>Detay</strong> inceleyebilir.
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-bold text-amber-800">Mevcut Oturum:</span>
                {activeRole === "admin" ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                    👑 Süper Admin (Tüm Odalarda Tam Yetkili)
                  </span>
                ) : currentUser?.isLeader ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    👑 {currentUser.name} ({currentUser.room === "oda-1" ? "Oda 1 Lideri" : currentUser.room === "oda-2" ? "Oda 2 Lideri" : "Oda 3 Lideri"})
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    👤 {currentUser?.name || "Temsilci"} (Sadece Kendi Getirdiği Konuklar)
                  </span>
                )}
              </div>
            </div>

            {/* Oda Seçim Sekmeleri (Oda 1 Tablosu, Oda 2 Tablosu, Oda 3 Tablosu, Tüm Odalar) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-700 mr-1">Oda Tablosu Seç:</span>
                <button
                  onClick={() => setActiveRoomTab("oda-1")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeRoomTab === "oda-1"
                      ? "bg-blue-600 text-white shadow-xs"
                      : canAccessRoom("oda-1")
                      ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                  }`}
                  title={!canAccessRoom("oda-1") ? "Oda 1 erişim yetkiniz sınırlandırılmıştır" : "Oda 1 Konuk Tablosu"}
                >
                  <span>{canAccessRoom("oda-1") ? "📋" : "🔒"}</span> Oda 1 (Ayşe Yılmaz)
                </button>
                <button
                  onClick={() => setActiveRoomTab("oda-2")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeRoomTab === "oda-2"
                      ? "bg-purple-600 text-white shadow-xs"
                      : canAccessRoom("oda-2")
                      ? "bg-purple-50 text-purple-700 hover:bg-purple-100"
                      : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                  }`}
                  title={!canAccessRoom("oda-2") ? "Oda 2 erişim yetkiniz sınırlandırılmıştır" : "Oda 2 Konuk Tablosu"}
                >
                  <span>{canAccessRoom("oda-2") ? "📋" : "🔒"}</span> Oda 2 (Caner Kaya)
                </button>
                <button
                  onClick={() => setActiveRoomTab("oda-3")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeRoomTab === "oda-3"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : canAccessRoom("oda-3")
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                  }`}
                  title={!canAccessRoom("oda-3") ? "Oda 3 erişim yetkiniz sınırlandırılmıştır" : "Oda 3 Konuk Tablosu"}
                >
                  <span>{canAccessRoom("oda-3") ? "📋" : "🔒"}</span> Oda 3 (Elif Arslan)
                </button>
                <button
                  onClick={() => setActiveRoomTab("all")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeRoomTab === "all"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span>🏢</span> Tüm Odaların Tablolarını Göster
                </button>
              </div>

              {/* Filtre ve Arama */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  <option value="all">Tüm Durumlar (Gelen + Gelecek + İptal)</option>
                  <option value="arrived">🟢 Sadece Gelen Konuklar</option>
                  <option value="upcoming">🟡 Sadece Gelecek Konuklar (Randevuda)</option>
                  <option value="cancelled">🔴 Sadece İptal Olan Konuklar</option>
                </select>

                <input
                  type="text"
                  placeholder="Konuk, şirket veya tarih ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 w-48 md:w-56 focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>

            {/* Seçilen Odanın / Odaların Tabloları */}
            <div className="space-y-6">
              {activeRoomTab === "all" ? (
                // Tüm Odaların Tabloları Ayrı Ayrı Alt Alta
                callCenterRooms.map((r) => renderRoomTable(r))
              ) : (
                // Tek Bir Odanın Ayrı Tablosu
                (() => {
                  const targetRoom = callCenterRooms.find((r) => r.id === activeRoomTab) || callCenterRooms[0];
                  return renderRoomTable(targetRoom);
                })()
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* BÖLÜM 2: PAZARLAMACI BAŞARI TABLOSU (Ayrı Birim)         */}
        {/* ══════════════════════════════════════════════════════════ */}
        {mainTab === "marketers" && (
          <div className="space-y-6">
            {/* Pazarlama Birimi Bilgilendirme Notu */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p>
                <strong>Pazarlama Masası Birimi (Oda Çalışanlarından Ayrı):</strong> Pazarlamacılar oda çalışanı değildir. Görevleri stüdyoya fiilen <strong>GELEN</strong> konuklara dergi, haber sitesi, reels gibi ek hizmet paketleri satmaktır. Bu tabloda pazarlamacıların gelen kaç konuğa ürün sattığı, toplam ne kadar ciro ürettiği ve satış başarı yüzdesi ölçülmektedir.
              </p>
              <span className="font-bold text-[11px] bg-emerald-100 text-emerald-800 px-2 py-1 rounded whitespace-nowrap self-start sm:self-auto">
                Bağımsız Satış Masası
              </span>
            </div>

            {/* Pazarlamacı Başarı Tablosu */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">Pazarlamacı Satış &amp; Başarı Karnesi Tablosu</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Gelen konuk sayısı, paket satılan konuk adedi, üretilen ciro ve satış kapatma başarı yüzdesi (%)
                  </p>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200">
                  Canlı Satış Performansı
                </span>
              </div>

              <div className="overflow-x-auto p-5">
                <table className="w-full text-left border-collapse text-xs border border-slate-200 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                      <th className="p-3.5">Pazarlamacı / Satış Sorumlusu</th>
                      <th className="p-3.5">Departman &amp; Görev</th>
                      <th className="p-3.5 text-center bg-blue-50/40">Gelen Konuk Sayısı</th>
                      <th className="p-3.5 text-center bg-emerald-50/60 font-bold text-emerald-900">Ürün Satılan Konuk</th>
                      <th className="p-3.5 text-center bg-slate-50">Satılamayan (Ücretsiz)</th>
                      <th className="p-3.5 text-right font-bold text-slate-900">Toplam Satış Cirosu (₺)</th>
                      <th className="p-3.5 text-right font-bold text-emerald-700">Tahsil Edilen Ön Ödeme</th>
                      <th className="p-3.5 text-center font-bold text-blue-900 bg-blue-50/60">Satış Başarı Yüzdesi</th>
                      <th className="p-3.5 text-right">Sepet Ortalaması</th>
                      <th className="p-3.5 text-center">Detay Döküm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {marketersPerformance.map((m, idx) => (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                        {/* Pazarlamacı */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                              {m.avatar}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 text-sm">{m.name}</span>
                                {idx === 0 && (
                                  <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 font-bold text-[10px] rounded border border-amber-300">
                                    🏆 1. Sırada
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 block">{m.title}</span>
                            </div>
                          </div>
                        </td>

                        {/* Departman */}
                        <td className="p-3.5">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {m.department}
                          </span>
                        </td>

                        {/* Gelen Konuk Sayısı */}
                        <td className="p-3.5 text-center font-bold font-mono text-blue-700 bg-blue-50/20 text-sm">
                          {m.arrivedGuestsCount} Konuk
                        </td>

                        {/* Ürün Satılan Konuk */}
                        <td className="p-3.5 text-center font-bold font-mono text-emerald-800 bg-emerald-50/40 text-sm">
                          {m.soldCount} Konuk
                        </td>

                        {/* Satış Yapılamayan */}
                        <td className="p-3.5 text-center font-medium font-mono text-slate-500 bg-slate-50">
                          {m.unsoldCount} Konuk
                        </td>

                        {/* Toplam Satış Tutarı */}
                        <td className="p-3.5 text-right font-bold font-mono text-slate-900 text-sm">
                          ₺{m.totalRevenue.toLocaleString("tr-TR")}
                        </td>

                        {/* Tahsil Edilen Ön Ödeme */}
                        <td className="p-3.5 text-right font-bold font-mono text-emerald-700">
                          ₺{m.totalCollected.toLocaleString("tr-TR")}
                        </td>

                        {/* Satış Başarı Yüzdesi */}
                        <td className="p-3.5 text-center bg-blue-50/30">
                          <span className="font-mono font-bold text-sm text-blue-900">
                            %{m.successRate}
                          </span>
                          <span className="text-[9px] text-slate-400 block">Kapatma Oranı</span>
                        </td>

                        {/* Sepet Ortalaması */}
                        <td className="p-3.5 text-right font-mono font-semibold text-slate-700">
                          ₺{m.avgBasket.toLocaleString("tr-TR")}
                        </td>

                        {/* Detay Döküm */}
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => setSelectedMarketerModal(m.name)}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs border border-blue-200 cursor-pointer transition shadow-2xs"
                          >
                            Konukları İncele →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pazarlamacı Başarı Karnesi Özet Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {marketersPerformance.map((m) => (
                <div key={m.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                        {m.avatar}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{m.name}</h4>
                        <span className="text-[11px] text-slate-400">{m.title}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-blue-50 text-blue-800 border border-blue-200">
                      Başarı: %{m.successRate}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100">
                      <span className="text-[10px] text-blue-600 uppercase font-semibold block">Gelen Konuk</span>
                      <strong className="text-base font-bold font-mono text-blue-900">{m.arrivedGuestsCount}</strong>
                    </div>
                    <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-emerald-600 uppercase font-semibold block">Paket Satılan</span>
                      <strong className="text-base font-bold font-mono text-emerald-900">{m.soldCount}</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Satış Olmayan</span>
                      <strong className="text-base font-bold font-mono text-slate-700">{m.unsoldCount}</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Üretilen Toplam Ciro:</span>
                    <strong className="font-mono text-base font-bold text-slate-900">
                      ₺{m.totalRevenue.toLocaleString("tr-TR")}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL 1: İPTAL ONAY & GEREKÇE MODALI                      */}
      {/* ══════════════════════════════════════════════════════════ */}
      {cancelModalGuest && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setCancelModalGuest(null); }}
        >
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-rose-50/60">
              <h3 className="text-lg font-bold text-rose-900 flex items-center gap-2">
                <span>⚠️</span> Randevuyu İptal Et
              </h3>
              <p className="text-xs text-rose-700 mt-1">
                <strong>{cancelModalGuest.name}</strong> ({cancelModalGuest.company}) adlı konuğun randevusu iptal edilecek.
              </p>
            </div>

            <form onSubmit={handleConfirmCancel} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  İptal Gerekçesi / Açıklama *
                </label>
                <textarea
                  required
                  rows={3}
                  value={cancelReasonText}
                  onChange={(e) => setCancelReasonText(e.target.value)}
                  placeholder="Örn: Konuk acil şehir dışı seyahati çıktığı için gelemeyeceğini bildirdi..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalGuest(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
                >
                  İptali Onayla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL 2: KONUK DETAY MODALI                                */}
      {/* ══════════════════════════════════════════════════════════ */}
      {selectedGuestModal && (() => {
        const currentGuest = guests.find((g) => g.id === selectedGuestModal.id) || selectedGuestModal;
        const actualTotal = (currentGuest.services || []).reduce((sum, s) => sum + (s.price || 0), 0);
        const isVip = Boolean(currentGuest.services && currentGuest.services.length > 0 && currentGuest.services.some((s) => (s.price || 0) > 0));

        return (
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedGuestModal(null); }}
          >
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
              <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between bg-slate-50/70">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-[#0F172A]">{currentGuest.name}</h3>
                    <button
                      type="button"
                      onClick={() => openGuestDossier(currentGuest.id)}
                      className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                      title="360° Konuk Süreç Röntgenini Aç"
                    >
                      <span>360° Röntgen</span>
                      <span>👁️</span>
                    </button>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                      {currentGuest.registrationNo}
                    </span>
                    {isVip ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        ⭐ VIP Paket Sahibi
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        Standart (Paketsiz)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {currentGuest.company} — <strong>{currentGuest.title}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedGuestModal(null)}
                  className="text-slate-400 hover:text-slate-700 text-lg p-1.5 rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                {/* Konuğu Getiren Personel & Oda Şefi Kartı */}
                {(() => {
                  const repStaff = staff.find((s) => s.name === currentGuest.representative);
                  const roomDef = callCenterRooms.find((r) => r.id === currentGuest.room);
                  const isChief = repStaff?.isLeader || currentGuest.representative === roomDef?.leaderName;

                  return (
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-2xs ${
                            isChief ? "bg-indigo-600 text-white" : "bg-blue-600 text-white"
                          }`}
                        >
                          {repStaff?.avatar || currentGuest.representative.split(" ").map((w) => w[0]).join("")}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <strong className="text-slate-900 text-sm">{currentGuest.representative}</strong>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                isChief ? "bg-indigo-100 text-indigo-800 border border-indigo-200" : "bg-blue-100 text-blue-800 border border-blue-200"
                              }`}
                            >
                              {isChief ? "👑 Oda Şefi / Yönetici" : "📞 Çağrı Temsilcisi"}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block">
                            Bağlı Olduğu: <strong>{roomDef ? roomDef.name : currentGuest.room}</strong> (Oda Şefi: <strong>{roomDef?.leaderName}</strong>)
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Görüşen Pazarlamacı</span>
                        <strong className="text-emerald-700 text-xs block mt-0.5">
                          {currentGuest.marketer ? `📈 ${currentGuest.marketer}` : "Henüz Atanmadı"}
                        </strong>
                      </div>
                    </div>
                  );
                })()}

                {/* Randevu & Çekim Zamanı */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Geleceği Tarih</span>
                    <strong className="text-slate-900 text-sm block mt-0.5">📅 {currentGuest.appointmentDate || "12 Ekim 2026"}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Randevu &amp; Çekim Saati</span>
                    <strong className="text-slate-900 text-sm block mt-0.5">⏰ {currentGuest.appointmentTime}</strong>
                  </div>
                </div>

                {/* İptal Bilgisi (varsa) */}
                {currentGuest.status === "cancelled" && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1">
                    <strong className="text-rose-900 font-bold block">Bu Randevu İptal Edilmiştir</strong>
                    <p className="text-rose-700"><strong>Gerekçe:</strong> {currentGuest.cancelledReason || "Belirtilmedi"}</p>
                    {currentGuest.cancelledAt && <span className="text-[10px] text-rose-500">İptal Tarihi: {currentGuest.cancelledAt}</span>}
                  </div>
                )}

                {/* Hizmetler */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Satın Alınan Hizmetler ve Paketler ({currentGuest.services?.length || 0})
                  </h4>
                  {(!currentGuest.services || currentGuest.services.length === 0) ? (
                    <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs text-slate-500">
                      Henüz satın alınan ek paket bulunmuyor. Konuk sadece ücretsiz stüdyo canlı yayın hizmetinden yararlanmaktadır.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {currentGuest.services.map((svc) => (
                        <div key={svc.id} className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-900">
                              {svc.type === "dergi" ? "Basılı Dergi" : svc.type === "haber_sitesi" ? "Haber Sitesi" : svc.type === "sosyal_medya" ? "Sosyal Medya" : "Video Paketi"}
                            </span>
                            <div className="flex gap-1 mt-0.5">
                              {svc.details.map((d, i) => (
                                <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1 rounded">✓ {d.label}</span>
                              ))}
                            </div>
                          </div>
                          <span className="font-mono font-bold text-slate-900">₺{svc.price.toLocaleString("tr-TR")}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Finans */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Toplam Ciro</span>
                    <strong className="text-base font-bold font-mono text-slate-900">₺{actualTotal.toLocaleString("tr-TR")}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Ödenen Ön Ödeme</span>
                    <strong className="text-base font-bold font-mono text-emerald-700">₺{(currentGuest.onOdemeMiktari || 0).toLocaleString("tr-TR")}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Kalan Bakiye</span>
                    <strong className="text-base font-bold font-mono text-amber-700">
                      ₺{Math.max(0, actualTotal - (currentGuest.paymentStatus === "tamamlandi" ? actualTotal : (currentGuest.onOdemeMiktari || 0))).toLocaleString("tr-TR")}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <Link
                  href={`/dashboard/pazarlama?guest=${currentGuest.id}`}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  Pazarlama Masasında Paket Düzenle →
                </Link>
                <button
                  onClick={() => setSelectedGuestModal(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL 3: PAZARLAMACI DETAY DÖKÜM MODALI                    */}
      {/* ══════════════════════════════════════════════════════════ */}
      {selectedMarketerModal && (() => {
        const marketerData = marketersPerformance.find((m) => m.name === selectedMarketerModal);
        if (!marketerData) return null;

        return (
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedMarketerModal(null); }}
          >
            <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
              <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                    {marketerData.avatar}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#0F172A]">{marketerData.name}</h3>
                    <p className="text-xs text-slate-500">
                      {marketerData.title} • Gelen Konuğa Satış Başarısı: <strong className="text-emerald-700">%{marketerData.successRate}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMarketerModal(null)}
                  className="text-slate-400 hover:text-slate-700 text-lg p-1.5 rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {marketerData.name} Tarafından Görüşülen Gelen Konuklar ({marketerData.arrivedGuests.length})
                </h4>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="p-3">Konuk</th>
                        <th className="p-3">Getiren Oda</th>
                        <th className="p-3">Satılan Paketler</th>
                        <th className="p-3 text-right">Satış Tutarı</th>
                        <th className="p-3 text-right">Ön Ödeme</th>
                        <th className="p-3 text-center">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {marketerData.arrivedGuests.map((g) => {
                        const total = (g.services || []).reduce((sum, s) => sum + (s.price || 0), 0);

                        return (
                          <tr key={g.id} className="hover:bg-slate-50">
                            <td className="p-3">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openGuestDossier(g.id);
                                }}
                                className="font-bold text-slate-900 text-left hover:text-blue-600 hover:underline flex items-center gap-1"
                                title="360° Konuk Dosyasını Aç"
                              >
                                <span>{g.name}</span>
                                <span className="text-[11px] text-blue-600">👁️</span>
                              </button>
                              <span className="text-[10px] text-slate-500 block">{g.company}</span>
                            </td>
                            <td className="p-3">
                              <span className="text-xs font-semibold text-slate-700">
                                {g.room === "oda-2" ? "Oda 2" : g.room === "oda-3" ? "Oda 3" : "Oda 1"} ({g.representative})
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`font-medium ${total > 0 ? "text-emerald-700" : "text-slate-400 italic"}`}>
                                {g.services && g.services.length > 0
                                  ? g.services.map(s => s.details.map(d => d.label).join(", ") || s.type).join(" + ")
                                  : "Paket Satılamadı (Ücretsiz Canlı Yayın)"}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900">
                              ₺{total.toLocaleString("tr-TR")}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-emerald-700">
                              ₺{(g.onOdemeMiktari || 0).toLocaleString("tr-TR")}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => {
                                  setSelectedMarketerModal(null);
                                  setSelectedGuestModal(g);
                                }}
                                className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs cursor-pointer"
                              >
                                Detay
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 text-right">
                <button
                  onClick={() => setSelectedMarketerModal(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL 4: YENİ KONUK RANDEVUSU EKLE MODALI                  */}
      {/* ══════════════════════════════════════════════════════════ */}
      {showNewGuestModal && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setShowNewGuestModal(false); }}
        >
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 bg-blue-50/60 flex items-center justify-between">
              <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                <span>📅</span> Yeni Konuk Randevusu Oluştur
              </h3>
              <button
                onClick={() => setShowNewGuestModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGuestSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Konuk Adı &amp; Soyadı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Mehmet Özkan"
                  value={newGuestName}
                  onChange={(e) => setNewGuestName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Şirket / Kurum</label>
                  <input
                    type="text"
                    placeholder="Örn: Özkan Tekstil"
                    value={newGuestCompany}
                    onChange={(e) => setNewGuestCompany(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Meslek / Unvan</label>
                  <input
                    type="text"
                    value={newGuestTitle}
                    onChange={(e) => setNewGuestTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Telefon</label>
                  <input
                    type="text"
                    value={newGuestPhone}
                    onChange={(e) => setNewGuestPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Konuğu Getiren Temsilci &amp; Oda *</label>
                  <select
                    value={newGuestRep}
                    onChange={(e) => setNewGuestRep(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                  >
                    {callCenterRooms.map((room) => (
                      <optgroup key={room.id} label={`${room.name} — Şef: ${room.leaderName}`}>
                        {room.employees.map((emp) => (
                          <option key={emp.id} value={emp.name}>
                            {emp.name} {emp.isLeader ? "(👑 Oda Şefi)" : "(📞 Temsilci)"}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Geleceği Tarih *</label>
                  <input
                    type="text"
                    required
                    placeholder="14 Ekim 2026"
                    value={newGuestDate}
                    onChange={(e) => setNewGuestDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Geleceği Saat *</label>
                  <input
                    type="text"
                    required
                    placeholder="14:30"
                    value={newGuestTime}
                    onChange={(e) => setNewGuestTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Stüdyo</label>
                  <select
                    value={newGuestStudio}
                    onChange={(e) => setNewGuestStudio(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="Gri Stüdyo">Gri Stüdyo</option>
                    <option value="Orta Stüdyo">Orta Stüdyo</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewGuestModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Randevuyu Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Konuk Randevu Saati & Beyan Güncelleme Modalı ── */}
      {updateTimeModalGuest && (
        <UpdateTimeModal
          isOpen={Boolean(updateTimeModalGuest)}
          guest={updateTimeModalGuest}
          onClose={() => setUpdateTimeModalGuest(null)}
          onSuccess={(msg) => {
            setFeedbackToast(msg);
            setTimeout(() => setFeedbackToast(null), 4000);
          }}
        />
      )}
    </div>
  );
}
