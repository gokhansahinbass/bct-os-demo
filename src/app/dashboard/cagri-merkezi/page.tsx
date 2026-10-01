"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/lib/useStore";
import {
  addGuest,
  updateGuestStatus,
  deleteGuest,
  type GuestStatus,
  type Guest,
} from "@/lib/store";
import StudioDelayBanner from "@/components/StudioDelayBanner";
import UpdateTimeModal from "@/components/UpdateTimeModal";

export default function CagriMerkeziPage() {
  const {
    guests,
    staff,
    canAccessPage,
    isSensitiveBlurred,
    activeRoleDef,
    canManageGuest,
    studioDelays,
    sendGuestArrivalReminder,
  } = useStore();
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("+90 (532) 789 21 44");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("Genel Müdür");
  const [representative, setRepresentative] = useState("Ayşe Yılmaz");
  const [appointmentTime, setAppointmentTime] = useState("12 Ekim 17:00");
  const [studio, setStudio] = useState("Gri Stüdyo");

  // Modals
  const [selectedRep, setSelectedRep] = useState<string | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [updateTimeGuest, setUpdateTimeGuest] = useState<Guest | null>(null);

  function handleNewAppointment(e: React.FormEvent) {
    e.preventDefault();
    if (!guestName.trim()) return;

    const selectedStaff = staff.find((s) => s.name === representative);
    const repRoom = selectedStaff?.room || (representative === "Caner Kaya" ? "oda-2" : representative === "Elif Arslan" ? "oda-3" : "oda-1");
    const assignedMarketer = repRoom === "oda-2" ? "Burak Aksoy" : "Selin Karaca";

    const newGuest = addGuest({
      name: guestName.trim(),
      company: company.trim() || "Firma Belirtilmedi",
      title: title.trim() || "Yönetici",
      phone: phone.trim(),
      instagram: "",
      website: "",
      showIg: false,
      showWeb: false,
      vip: false,
      status: "appointment_set",
      representative,
      marketer: assignedMarketer,
      appointmentTime,
      shootTime: "17:00",
      shootDuration: "25 dk",
      studio,
      editor: "",
      amount: "0",
      paymentStatus: "odenmedi",
      onOdemeMiktari: 0,
      room: repRoom,
    });

    setFeedbackMsg(`✓ ${newGuest.name} randevusu (${newGuest.registrationNo}) stüdyo ekranlarına ve kiosk kuyruğuna aktarıldı.`);
    setFeedbackVisible(true);
    setTimeout(() => setFeedbackVisible(false), 5000);
    setGuestName("");
    setCompany("");
  }

  function handleAdvanceToStudio(g: Guest) {
    if (!canManageGuest(g)) {
      alert(`Yetki Kısıtlaması: Bu işlemi yalnızca konuğu çağıran temsilci (${g.representative}) veya oda lideri gerçekleştirebilir.`);
      return;
    }
    updateGuestStatus(g.id, "in_studio");
    setFeedbackMsg("✓ Konuk stüdyoya alındı ve çekim başlatıldı.");
    setFeedbackVisible(true);
    setTimeout(() => setFeedbackVisible(false), 3000);
  }

  function handleAdvanceToShootDone(g: Guest) {
    if (!canManageGuest(g)) {
      alert(`Yetki Kısıtlaması: Bu işlemi yalnızca konuğu çağıran temsilci (${g.representative}) veya oda lideri gerçekleştirebilir.`);
      return;
    }
    updateGuestStatus(g.id, "shoot_done");
    setFeedbackMsg("✓ Çekim tamamlandı, Pazarlama Masası'na iletildi.");
    setFeedbackVisible(true);
    setTimeout(() => setFeedbackVisible(false), 3000);
  }

  function handleDeleteGuest(g: Guest) {
    if (!canManageGuest(g)) {
      alert(`Yetki Kısıtlaması: Bu konuk kaydını yalnızca çağıran temsilci (${g.representative}) veya oda lideri silebilir.`);
      return;
    }
    if (confirm(`"${g.name}" adlı konuk kaydını silmek istediğinize emin misiniz?`)) {
      deleteGuest(g.id);
    }
  }

  // Calculate dynamic stats
  const totalCiro = guests.reduce((sum, g) => {
    const raw = parseInt((g.amount || "0").replace(/\D/g, ""), 10) || 0;
    return sum + raw;
  }, 0);

  const vipCount = guests.filter((g) => Boolean(g.services && g.services.length > 0 && g.services.some((s) => s.price > 0))).length;
  const totalCount = guests.length;

  const getStatusBadge = (status: GuestStatus) => {
    switch (status) {
      case "kiosk_registered":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Kiosk Girişi Yaptı
          </span>
        );
      case "appointment_set":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Randevu Bekleniyor
          </span>
        );
      case "in_studio":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
            Stüdyoda Çekimde
          </span>
        );
      case "shoot_done":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Pazarlamada (Paket Bekliyor)
          </span>
        );
      case "package_set":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            Kurgu Bekliyor
          </span>
        );
      case "editing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
            Kurguda (Montaj)
          </span>
        );
      case "edit_done":
      case "reviewing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            İzlemede (Revize)
          </span>
        );
      case "review_approved":
      case "publishing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Dijital Kart &amp; Yayında
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Arşivlendi (Bitti)
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            İptal Edildi
          </span>
        );
      default:
        return null;
    }
  };

  const callCenterStaff = useMemo(() => {
    return staff.filter((s) => s.room && (s.role === "cagri_sefi" || s.role === "cagri_temsilci" || s.role === "cagri"));
  }, [staff]);

  const representatives = useMemo(() => {
    return callCenterStaff.map((s) => {
      const repGuestList = guests.filter((g) => g.representative === s.name);
      const totalAmount = repGuestList.reduce((sum, g) => sum + (parseInt((g.amount || "0").replace(/\D/g, ""), 10) || 0), 0);
      const salesCount = repGuestList.filter((g) => g.vip || (parseInt((g.amount || "0").replace(/\D/g, ""), 10) > 0)).length;
      return {
        name: s.name,
        initials: s.avatar || s.name.split(" ").map((w) => w[0]).join("").slice(0, 2),
        role: s.isLeader ? "Oda Şefi / Yönetici" : "Çağrı Temsilcisi",
        isLeader: s.isLeader,
        room: s.room === "oda-1" ? "Oda 1" : s.room === "oda-2" ? "Oda 2" : "Oda 3",
        roomId: s.room,
        guestCount: repGuestList.length,
        totalAmount,
        salesCount,
      };
    }).sort((a, b) => {
      if (a.isLeader && !b.isLeader) return -1;
      if (!a.isLeader && b.isLeader) return 1;
      return b.totalAmount - a.totalAmount || b.guestCount - a.guestCount;
    });
  }, [callCenterStaff, guests]);

  // Selected Rep Guests
  const repGuests = useMemo(() => {
    if (!selectedRep) return [];
    return guests.filter((g) => g.representative === selectedRep);
  }, [guests, selectedRep]);

  const repTotalCiro = useMemo(() => {
    return repGuests.reduce((sum, g) => sum + (parseInt((g.amount || "0").replace(/\D/g, ""), 10) || 0), 0);
  }, [repGuests]);

  const repTotalOnOdeme = useMemo(() => {
    return repGuests.reduce((sum, g) => sum + (g.onOdemeMiktari || 0), 0);
  }, [repGuests]);

  if (!canAccessPage("/dashboard/cagri-merkezi")) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs max-w-xl mx-auto my-12 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-3xl border border-amber-200 shadow-inner">
          🔒
        </div>
        <h2 className="text-lg font-bold text-slate-900">Erişim Yetkiniz Bulunmuyor</h2>
        <p className="text-xs text-slate-500">
          Mevcut rolünüz ({activeRoleDef?.label || "Rolünüz"}) Çağrı Merkezi modülünü görüntüleme yetkisine sahip değildir.
        </p>
        <Link href="/dashboard" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition">
          Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

  const isRevBlurred = isSensitiveBlurred("revenue");
  const isContactBlurred = isSensitiveBlurred("contact");

  return (
    <div className="flex flex-col w-full pb-12">
      {/* TOP CONTEXT & HEADING ZONE */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Çağrı Merkezi Operasyonu</span>
            <span className="text-slate-400">•</span>
            <span className="text-xs font-mono text-[#2563EB] font-bold">CALL-CENTER-DISPATCH</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
            Çağrı Merkezi &amp; Randevu Masası
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Temsilcilerin getirdiği konuklar, satış performansları ve stüdyo randevu akışı. İsimlere tıklayarak detaylı satış ve konuk raporunu inceleyin.
          </p>
        </div>
        {/* Metadata Badges */}
        <div className="flex items-center flex-wrap gap-2.5">
          <Link
            href="/dashboard/odalar"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
          >
            <span>🏢</span> Odalar &amp; Konuk Takip Tablosu →
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs text-[#0F172A]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-medium">Canlı Senkronizasyon</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs font-mono font-medium text-slate-600">Bugün: {guests.length} Konuk</span>
          </div>
        </div>
      </div>

      {/* ── STÜDYO SARKMA / GECİKME UYARI BANNER'I ── */}
      <div className="mt-4">
        <StudioDelayBanner />
      </div>

      {/* TOP METRICS & LEADERBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Left Card: Room Summary */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#2563EB]/5 rounded-full pointer-events-none"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-slate-600 font-bold">ÇAĞRI MERKEZİ CANLI CİRO</span>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                Canlı Veri
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-slate-500 font-medium">Sistemdeki Toplam Satış Hacmi</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-[#0F172A] tracking-tight">
                  {isRevBlurred ? "₺***.***" : `${totalCiro.toLocaleString("tr-TR")} TL`}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">TRY / Net</span>
              </div>
            </div>
          </div>
          {/* Progress */}
          <div className="mt-5 space-y-1.5">
            <div className="flex justify-between items-center text-[11px] text-slate-500">
              <span>Hedef Gerçekleşme: %{Math.min(Math.round((totalCiro / 200000) * 100), 100)}</span>
              <span className="font-mono text-slate-400">200.000 TL Hedef</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2563EB] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(Math.round((totalCiro / 200000) * 100), 100)}%` }}
              ></div>
            </div>
          </div>
          {/* Sub-stats */}
          <div className="grid grid-cols-3 gap-3 pt-5 mt-5 border-t border-slate-100 text-[#0F172A]">
            <div>
              <span className="block text-[11px] text-slate-400 font-medium">Toplam Konuk</span>
              <span className="block text-lg font-bold mt-0.5">{totalCount}</span>
            </div>
            <div>
              <span className="block text-[11px] text-slate-400 font-medium">VIP Satış</span>
              <span className="block text-lg font-bold text-emerald-600 mt-0.5">{vipCount}</span>
            </div>
            <div>
              <span className="block text-[11px] text-slate-400 font-medium">Dönüşüm Oranı</span>
              <span className="block text-lg font-bold mt-0.5">
                %{totalCount > 0 ? Math.round((vipCount / totalCount) * 100) : 0}
              </span>
            </div>
          </div>
        </div>

        {/* Right Card: Representative Leaderboard (Interactive!) */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-600 font-bold">TEMSİLCİ LİDERLİK TABLOSU</span>
              <span className="text-xs text-slate-400 font-mono">/ Tıklayıp Detayları Görün</span>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Detay Raporu
            </span>
          </div>

          <div className="divide-y divide-slate-100 mt-2 max-h-[380px] overflow-y-auto pr-1">
            {representatives.map((rep, idx) => {
              return (
                <div
                  key={rep.name}
                  onClick={() => setSelectedRep(rep.name)}
                  className="py-3 flex items-center justify-between hover:bg-blue-50/60 rounded-xl px-2.5 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-md ${idx === 0 ? "bg-amber-100 border-amber-300 text-amber-800 font-bold" : "bg-slate-100 border-slate-200 text-slate-600"} border text-xs font-semibold flex items-center justify-center flex-shrink-0`}>
                      {idx + 1}
                    </span>
                    <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center border flex-shrink-0 ${rep.isLeader ? "bg-indigo-600 text-white border-indigo-700" : "bg-blue-100 text-blue-800 border-blue-200"}`}>
                      {rep.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-[#0F172A] group-hover:text-blue-700 transition">
                          {rep.name}
                        </span>
                        {rep.isLeader && <span title="Oda Şefi">👑</span>}
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] font-medium text-slate-600">
                          {rep.guestCount} Konuk
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                          {rep.salesCount} Satış
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {rep.role} • {rep.room}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2 flex-shrink-0">
                    <div>
                      <span className="text-xs font-bold text-[#0F172A] font-mono block">
                        ₺{rep.totalAmount.toLocaleString("tr-TR")}
                      </span>
                      <span className="text-[10px] text-blue-600 font-medium group-hover:underline">Detay →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FAST GUEST BOOKING FORM */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-4 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">Hızlı Konuk Randevusu Kaydet</h2>
            <p className="text-xs text-slate-500">Stüdyo ve kiosk terminaline anında senkronize olur</p>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Kiosk ve Stüdyo Senkron</span>
          </div>
        </div>
        <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3.5 items-end" onSubmit={handleNewAppointment}>
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-600">Konuk Ad Soyad <span className="text-red-500">*</span></label>
            <input
              className="w-full h-[38px] px-3 bg-white border border-slate-200 rounded-lg text-xs text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB]"
              placeholder="Örn: Melis Erdem"
              required
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-600">Şirket / Kurum</label>
            <input
              className="w-full h-[38px] px-3 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB]"
              placeholder="Örn: Erdem Danışmanlık"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-600">Meslek / Ünvan</label>
            <input
              className="w-full h-[38px] px-3 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB]"
              placeholder="Örn: Kurucu Ortak"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-600">Telefon Numarası <span className="text-red-500">*</span></label>
            <input
              className="w-full h-[38px] px-3 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] font-mono"
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-600">Temsilci (Kim Getirdi?) <span className="text-red-500">*</span></label>
            <select
              className="w-full h-[38px] px-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#2563EB] cursor-pointer"
              value={representative}
              onChange={(e) => setRepresentative(e.target.value)}
            >
              <optgroup label="Oda 1 (Şef: Ayşe Yılmaz)">
                {staff.filter((s) => s.room === "oda-1").map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} {s.isLeader ? "(👑 Oda Şefi)" : "(📞 Temsilci)"}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Oda 2 (Şef: Caner Kaya)">
                {staff.filter((s) => s.room === "oda-2").map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} {s.isLeader ? "(👑 Oda Şefi)" : "(📞 Temsilci)"}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Oda 3 (Şef: Elif Arslan)">
                {staff.filter((s) => s.room === "oda-3").map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} {s.isLeader ? "(👑 Oda Şefi)" : "(📞 Temsilci)"}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          <div>
            <button className="w-full h-[38px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer" type="submit">
              <span>Randevuyu Kaydet</span>
              <span>→</span>
            </button>
          </div>
        </form>

        {feedbackVisible && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between">
            <span>{feedbackMsg}</span>
            <button onClick={() => setFeedbackVisible(false)} className="text-emerald-600 hover:text-emerald-900 cursor-pointer">✕</button>
          </div>
        )}
      </div>

      {/* TODAY'S SCHEDULED GUESTS TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs mt-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-[#0F172A]">Konuk Listesi &amp; Stüdyo Akışı</h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              {guests.length} Konuk
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="text-[11px]">Konuk ismine tıklayarak detaylı hizmet ve ödeme dökümünü görebilirsiniz</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3 px-3">Konuk, Şirket &amp; Meslek</th>
                <th className="py-3 px-3">Temsilci &amp; Oda</th>
                <th className="py-3 px-3">Satın Alınan Hizmetler</th>
                <th className="py-3 px-3">Ödeme Durumu</th>
                <th className="py-3 px-3">Canlı Durum</th>
                <th className="py-3 px-3 text-right">Tutar &amp; İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {guests.map((g) => {
                const initials = g.name.split(" ").map((w) => w[0]).join("").slice(0, 2);
                return (
                  <tr key={g.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3.5 px-3">
                      <div
                        onClick={() => setSelectedGuest(g)}
                        className="flex items-center gap-2.5 cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center text-xs font-bold group-hover:bg-blue-600 group-hover:text-white transition">
                          {initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-[#0F172A] group-hover:text-blue-600 transition">
                              {g.name}
                            </p>
                            {g.services && g.services.length > 0 && g.services.some(s => s.price > 0) ? (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                VIP
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                                Standart
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">{g.company} — <strong className="text-slate-700">{g.title}</strong></p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                              ⏰ {g.appointmentTime}
                            </span>
                            {studioDelays[g.studio]?.active && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                ⚠️ +{studioDelays[g.studio].delayMinutes} dk sarktı
                              </span>
                            )}
                            {g.timeStatus === "gecikmeli" && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                ⏳ Geç Gelecek {g.timeUpdateReason ? `(${g.timeUpdateReason})` : ""}
                              </span>
                            )}
                            {g.timeStatus === "erken_geldi" && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                                ⚡ Erken Geldi
                              </span>
                            )}
                            {g.status === "appointment_set" && !g.timeStatus && g.representativeRemindedAt && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                                ⚠️ Teyit Bekleniyor
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <button
                        onClick={() => setSelectedRep(g.representative)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 hover:bg-blue-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-blue-700 transition cursor-pointer"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                        <span>{g.representative}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({g.room === "oda-2" ? "Oda 2" : g.room === "oda-3" ? "Oda 3" : "Oda 1"})</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1 max-w-[240px]">
                        {g.services && g.services.length > 0 ? (
                          g.services.map((svc, sIdx) => (
                            <span key={sIdx} className="text-[10px] font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200/60 truncate">
                              {svc.type === "dergi" ? "📖 Dergi" : svc.type === "haber_sitesi" ? `📰 ${svc.quantity || 1} Haber` : svc.type === "sosyal_medya" ? "📱 Sosyal" : "🎥 Video"}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Hizmet tanımlanmadı</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        g.paymentStatus === "tamamlandi"
                          ? "bg-emerald-100 text-emerald-800"
                          : g.paymentStatus === "on_odeme"
                          ? "bg-blue-100 text-blue-800"
                          : g.paymentStatus === "ucretsiz"
                          ? "bg-slate-100 text-slate-600"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {g.paymentStatus === "tamamlandi"
                          ? "Tahsil Edildi"
                          : g.paymentStatus === "on_odeme"
                          ? `Ön Ödeme (₺${(g.onOdemeMiktari || 0).toLocaleString("tr-TR")})`
                          : g.paymentStatus === "ucretsiz"
                          ? "Ücretsiz"
                          : "Ödeme Bekliyor"}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      {getStatusBadge(g.status)}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {g.amount && g.amount !== "0" ? (
                          <span className="text-sm font-bold text-slate-900 font-mono">
                            ₺{g.amount}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono">Ücretsiz</span>
                        )}

                        <button
                          onClick={() => setSelectedGuest(g)}
                          className="px-2 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                          title="Tüm Detayları Gör"
                        >
                          Detay
                        </button>

                        {/* Quick Action Button based on status */}
                        {(() => {
                          const canEdit = canManageGuest(g);
                          if (!canEdit) {
                            return (
                              <span
                                className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed select-none"
                                title={`Yetki Kısıtlaması: Bu kaydı yalnızca konuğu çağıran temsilci (${g.representative}) veya oda lideri yönetebilir.`}
                              >
                                🔒 Kilitli
                              </span>
                            );
                          }
                          return (
                            <>
                              {["appointment_set", "kiosk_registered"].includes(g.status) && (
                                <>
                                  <button
                                    onClick={() => setUpdateTimeGuest(g)}
                                    className="px-2 py-1 text-xs font-medium rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 cursor-pointer flex items-center gap-1"
                                    title="Konuğun randevu saatini veya gecikme beyanını güncelle"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">schedule</span>
                                    <span>Saat</span>
                                  </button>
                                  {g.status === "appointment_set" && !g.timeConfirmed && (
                                    <button
                                      onClick={() => {
                                        sendGuestArrivalReminder(g.id);
                                        setFeedbackMsg(`🔔 ${g.representative} adlı temsilciye "${g.name}" için acil teyit hatırlatması iletildi.`);
                                        setFeedbackVisible(true);
                                        setTimeout(() => setFeedbackVisible(false), 4000);
                                      }}
                                      className="px-2 py-1 text-xs font-medium rounded bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 cursor-pointer flex items-center gap-1"
                                      title="Temsilciye teyit çağrısı ilet"
                                    >
                                      <span className="material-symbols-outlined text-[13px] text-amber-600">notifications_active</span>
                                      <span>Teyit</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleAdvanceToStudio(g)}
                                    className="px-2 py-1 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer font-bold"
                                    title="Konuğu Stüdyoya Al (Yetkili: Siz)"
                                  >
                                    Stüdyoya Al
                                  </button>
                                </>
                              )}
                              {g.status === "in_studio" && (
                                <button
                                  onClick={() => handleAdvanceToShootDone(g)}
                                  className="px-2 py-1 text-xs font-medium rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                                  title="Çekimi Bitir ve Pazarlamaya Gönder (Yetkili: Siz)"
                                >
                                  Çekimi Bitir
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteGuest(g)}
                                className="p-1 text-slate-300 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                title="Kaydı Sil (Yetkili: Siz)"
                              >
                                ✕
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════ */}
      {/* MODAL 1: REPRESENTATIVE DETAIL (Ayşe Yılmaz vb.) */}
      {/* ═════════════════════════════════════════════════ */}
      {selectedRep && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedRep(null); }}
        >
          <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center">
                  {selectedRep.split(" ").map(w => w[0]).join("")}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-[#0F172A]">{selectedRep}</h3>
                    {(() => {
                      const repStaff = staff.find((s) => s.name === selectedRep);
                      const isChief = repStaff?.isLeader;
                      const roomName = repStaff?.room === "oda-2" ? "Oda 2" : repStaff?.room === "oda-3" ? "Oda 3" : "Oda 1";
                      return (
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${isChief ? "bg-indigo-100 text-indigo-800 border border-indigo-200" : "bg-blue-100 text-blue-800"}`}>
                          {isChief ? "👑 Oda Şefi / Yönetici" : "📞 Çağrı Temsilcisi"} • {roomName}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Bu temsilcinin getirdiği tüm konuklar, satın alınan paketler ve ödeme durumları
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRep(null)}
                className="text-slate-400 hover:text-slate-700 text-lg p-2 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Performance Summary Cards */}
            <div className="grid grid-cols-4 gap-4 p-6 border-b border-slate-100 bg-white">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                <span className="text-[11px] font-semibold text-slate-500 block uppercase">Toplam Satış Cirosu</span>
                <span className="text-2xl font-bold text-blue-700 font-mono">₺{repTotalCiro.toLocaleString("tr-TR")}</span>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <span className="text-[11px] font-semibold text-slate-500 block uppercase">Tahsil Edilen Ön Ödeme</span>
                <span className="text-2xl font-bold text-emerald-700 font-mono">₺{repTotalOnOdeme.toLocaleString("tr-TR")}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block uppercase">Getirdiği Konuk Sayısı</span>
                <span className="text-2xl font-bold text-slate-800">{repGuests.length} Konuk</span>
              </div>
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                <span className="text-[11px] font-semibold text-slate-500 block uppercase">VIP Satış Oranı</span>
                <span className="text-2xl font-bold text-amber-700">
                  %{repGuests.length > 0 ? Math.round((repGuests.filter(g => Boolean(g.services && g.services.length > 0 && g.services.some(s => s.price > 0))).length / repGuests.length) * 100) : 0}
                </span>
              </div>
            </div>

            {/* Guests Table for this Representative */}
            <div className="p-6 overflow-y-auto flex-1">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                {selectedRep} Tarafından Getirilen Konuklar ({repGuests.length})
              </h4>

              {repGuests.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  Bu temsilci henüz bir konuk kaydetmemiş.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                        <th className="p-3">Konuk &amp; Mesleği</th>
                        <th className="p-3">Şirket &amp; Telefon</th>
                        <th className="p-3">Satılan Hizmetler</th>
                        <th className="p-3">Satış Tutarı</th>
                        <th className="p-3">Ödeme Durumu</th>
                        <th className="p-3">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {repGuests.map((g) => (
                        <tr key={g.id} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold text-slate-900">
                            <div>{g.name}</div>
                            <div className="text-[10px] text-slate-500 font-normal">{g.title}</div>
                          </td>
                          <td className="p-3 text-slate-600">
                            <div>{g.company}</div>
                            <div className="font-mono text-[10px] text-slate-400">{g.phone}</div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {g.services.map((s, idx) => (
                                <span key={idx} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                  {s.details.map(d => d.label).join(", ") || s.type}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3 font-bold font-mono text-slate-900">
                            ₺{((g.services || []).reduce((sum, s) => sum + (s.price || 0), 0)).toLocaleString("tr-TR")}
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              g.paymentStatus === "tamamlandi"
                                ? "bg-emerald-100 text-emerald-800"
                                : g.paymentStatus === "on_odeme"
                                ? "bg-blue-100 text-blue-800"
                                : g.paymentStatus === "ucretsiz"
                                ? "bg-slate-100 text-slate-600"
                                : "bg-amber-100 text-amber-800"
                            }`}>
                              {g.paymentStatus === "tamamlandi"
                                ? "Tahsil Edildi"
                                : g.paymentStatus === "on_odeme"
                                ? `Ön Ödeme (₺${(g.onOdemeMiktari || 0).toLocaleString("tr-TR")})`
                                : g.paymentStatus === "ucretsiz"
                                ? "Ücretsiz"
                                : "Ödeme Bekliyor"}
                            </span>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => {
                                setSelectedRep(null);
                                setSelectedGuest(g);
                              }}
                              className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold cursor-pointer"
                            >
                              Detay
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">Temsilci: {selectedRep}</span>
              <button
                onClick={() => setSelectedRep(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════ */}
      {/* MODAL 2: GUEST DETAIL (Boran Şahin, Leyla vb.)  */}
      {/* ═════════════════════════════════════════════════ */}
      {selectedGuest && (() => {
        const currentGuest = guests.find((g) => g.id === selectedGuest.id) || selectedGuest;
        const actualTotal = (currentGuest.services || []).reduce((sum, s) => sum + (s.price || 0), 0);
        const isVip = Boolean(currentGuest.services && currentGuest.services.length > 0 && currentGuest.services.some((s) => (s.price || 0) > 0));
        const paidAmount = currentGuest.paymentStatus === "tamamlandi" ? actualTotal : (currentGuest.onOdemeMiktari || 0);
        const remainingAmount = Math.max(0, actualTotal - paidAmount);

        return (
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedGuest(null); }}
          >
            <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between bg-slate-50/70">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-[#0F172A]">{currentGuest.name}</h3>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                      {currentGuest.registrationNo}
                    </span>
                    {isVip ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-xs">
                        ⭐ VIP Paket Sahibi
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                        Standart (Paketsiz)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {currentGuest.company} — <strong className="text-slate-800">{currentGuest.title}</strong> • Temsilci: <strong>{currentGuest.representative}</strong> ({currentGuest.room === "oda-2" ? "Oda 2" : currentGuest.room === "oda-3" ? "Oda 3" : "Oda 1"})
                  </p>
                </div>
                <button
                  onClick={() => setSelectedGuest(null)}
                  className="text-slate-400 hover:text-slate-700 text-lg p-1.5 rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Contact & Shoot Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">İletişim &amp; Telefon</span>
                    <strong className="text-slate-900 block mt-1">{currentGuest.phone}</strong>
                    <span className="text-[11px] text-slate-500">Instagram: @{currentGuest.instagram || "yok"}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Stüdyo &amp; Çekim</span>
                    <strong className="text-slate-900 block mt-1">{currentGuest.studio}</strong>
                    <span className="text-[11px] text-slate-500">Çekim Saati: {currentGuest.shootTime}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Kurgucu &amp; Editör</span>
                    <strong className="text-slate-900 block mt-1">{currentGuest.editor || "Atanmadı"}</strong>
                    <span className="text-[11px] text-slate-500">Durum: {currentGuest.status}</span>
                  </div>
                </div>

                {/* Satın Alınan Hizmetler Dökümü */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Satın Alınan Hizmetler ve Paketler ({currentGuest.services?.length || 0})
                    </h4>
                    {actualTotal > 0 && (
                      <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Toplam: ₺{actualTotal.toLocaleString("tr-TR")}
                      </span>
                    )}
                  </div>

                  {(!currentGuest.services || currentGuest.services.length === 0) ? (
                    <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs text-slate-500 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-700">Henüz satın alınan ek paket veya hizmet bulunmuyor.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Konuk şu an sadece ücretsiz stüdyo canlı yayın hizmetinden yararlanmaktadır (Standart Statü).</p>
                      </div>
                      <Link
                        href="/dashboard/pazarlama"
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs whitespace-nowrap ml-4 transition shadow-xs"
                      >
                        + Hizmet Ekle
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {currentGuest.services.map((svc) => (
                        <div key={svc.id} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-[#0F172A]">
                                {svc.type === "dergi" ? "Basılı Dergi" : svc.type === "haber_sitesi" ? "Haber Sitesi Yayını" : svc.type === "sosyal_medya" ? "Sosyal Medya" : svc.type === "video" ? "Video Paketi" : "Ek Hizmet"}
                              </span>
                              {svc.quantity && svc.quantity > 1 && (
                                <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-700 font-bold rounded">
                                  ×{svc.quantity} Adet
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {svc.details.map((d, dIdx) => (
                                <span key={dIdx} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                                  ✓ {d.label}
                                </span>
                              ))}
                              {svc.customNote && <span className="text-[10px] italic text-slate-500">({svc.customNote})</span>}
                            </div>
                          </div>
                          <span className="font-mono text-sm font-bold text-slate-900">
                            {svc.price > 0 ? `₺${svc.price.toLocaleString("tr-TR")}` : "Ücretsiz"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Finans & Tahsilat Dökümü */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Finans &amp; Ödeme Durumu
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Toplam Tutar</span>
                      <span className="text-lg font-bold font-mono text-slate-900">
                        ₺{actualTotal.toLocaleString("tr-TR")}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Tahsilat Durumu</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded inline-block mt-0.5 ${
                        actualTotal === 0
                          ? "bg-slate-100 text-slate-600 border border-slate-200"
                          : currentGuest.paymentStatus === "tamamlandi"
                          ? "bg-emerald-100 text-emerald-800"
                          : currentGuest.paymentStatus === "on_odeme"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {actualTotal === 0
                          ? "Ücretsiz / Paketsiz"
                          : currentGuest.paymentStatus === "tamamlandi"
                          ? "Tamamı Tahsil Edildi"
                          : currentGuest.paymentStatus === "on_odeme"
                          ? "Ön Ödeme Alındı"
                          : "Ödeme Bekliyor"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Ödenen / Kalan</span>
                      <span className="text-xs font-mono font-bold text-slate-800 block mt-1">
                        Ön Ödeme: ₺{actualTotal === 0 ? "0" : (currentGuest.onOdemeMiktari || 0).toLocaleString("tr-TR")}
                      </span>
                      <span className="text-[10px] font-mono text-amber-700 block">
                        Kalan: ₺{actualTotal === 0 ? "0" : remainingAmount.toLocaleString("tr-TR")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Revize Notları if any */}
                {currentGuest.notes && currentGuest.notes.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                      Kayıtlı Revizeler ({currentGuest.notes.length})
                    </h4>
                    <div className="space-y-1.5">
                      {currentGuest.notes.map((n) => (
                        <div key={n.id} className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-xs flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">⏱ {n.time}</span>
                            <span className="text-slate-800 font-medium">{n.text}</span>
                          </div>
                          <span className={`text-[10px] font-bold ${n.resolved ? "text-emerald-700" : "text-amber-700"}`}>
                            {n.resolved ? "✓ Çözüldü" : "Açık"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <Link
                  href="/dashboard/pazarlama"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>Pazarlama Masasında Paket Düzenle →</span>
                </Link>
                <button
                  onClick={() => setSelectedGuest(null)}
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-slate-700 transition"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* SAAT / BEYAN GÜNCELLEME MODALI */}
      <UpdateTimeModal
        isOpen={Boolean(updateTimeGuest)}
        guest={updateTimeGuest}
        onClose={() => setUpdateTimeGuest(null)}
        onSuccess={(msg) => {
          setFeedbackMsg(msg);
          setFeedbackVisible(true);
          setTimeout(() => setFeedbackVisible(false), 4000);
        }}
      />
    </div>
  );
}
