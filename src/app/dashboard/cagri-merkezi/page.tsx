"use client";

import { useState } from "react";
import { useStore } from "@/lib/useStore";
import { addGuest, updateGuestStatus, deleteGuest, type GuestStatus } from "@/lib/store";

export default function CagriMerkeziPage() {
  const { guests } = useStore();
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("+90 (532) 789 21 44");
  const [representative, setRepresentative] = useState("Ayşe Yılmaz");
  const [appointmentTime, setAppointmentTime] = useState("12 Ekim 17:00");
  const [studio, setStudio] = useState("Stüdyo A (4K)");

  function handleNewAppointment(e: React.FormEvent) {
    e.preventDefault();
    if (!guestName.trim()) return;

    const newGuest = addGuest({
      name: guestName.trim(),
      company: "Randevulu Konuk",
      title: "Yönetici",
      phone: phone.trim(),
      instagram: "",
      website: "",
      showIg: false,
      showWeb: false,
      vip: false,
      status: "appointment_set",
      representative,
      appointmentTime,
      shootTime: "17:00",
      shootDuration: "25 dk",
      studio,
      hdd: "HDD Bekleniyor",
      editor: "",
      amount: "0",
      paymentStatus: "Randevu Alındı",
      videoPackage: "Paket Bekliyor",
      magazinePackage: "",
      pressDistribution: false,
    });

    setFeedbackMsg(`✓ ${newGuest.name} randevusu (${newGuest.registrationNo}) stüdyo ekranlarına ve kiosk kuyruğuna aktarıldı.`);
    setFeedbackVisible(true);
    setTimeout(() => setFeedbackVisible(false), 5000);
    setGuestName("");
  }

  function advanceToStudio(guestId: string) {
    updateGuestStatus(guestId, "in_studio");
    setFeedbackMsg("✓ Konuk stüdyoya alındı ve çekim başlatıldı.");
    setFeedbackVisible(true);
    setTimeout(() => setFeedbackVisible(false), 3000);
  }

  function advanceToShootDone(guestId: string) {
    updateGuestStatus(guestId, "shoot_done");
    setFeedbackMsg("✓ Çekim tamamlandı, Pazarlama Masası'na iletildi.");
    setFeedbackVisible(true);
    setTimeout(() => setFeedbackVisible(false), 3000);
  }

  // Calculate dynamic stats
  const totalCiro = guests.reduce((sum, g) => {
    const raw = parseInt(g.amount.replace(/\D/g, ""), 10) || 0;
    return sum + raw;
  }, 0);

  const vipCount = guests.filter((g) => g.vip).length;
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
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* TOP CONTEXT & HEADING ZONE */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Operasyonel Çalışma Alanı</span>
            <span className="text-slate-400">•</span>
            <span className="text-xs font-mono text-[#2563EB]">ROOM-01-CALLCENTER</span>
          </div>
          <h1 className="text-xl font-semibold text-[#0F172A] tracking-tight">
            Oda 1 — Çağrı Merkezi Yönetimi
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Gündelik randevu akışı, temsilci satış performansları ve anlık stüdyo durum takibi.
          </p>
        </div>
        {/* Metadata Badges */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm text-[#0F172A]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-medium">Canlı Senkronizasyon</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm text-[#0F172A]">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span className="text-xs text-slate-500">Sorumlu:</span>
            <span className="text-xs font-semibold">Ayşe Yılmaz</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-mono font-medium text-slate-600">Bugün: {guests.length} Konuk</span>
          </div>
        </div>
      </div>

      {/* TOP METRICS & LEADERBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Left Card: Room Summary */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#2563EB]/5 rounded-full pointer-events-none"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-slate-600 font-semibold">ODA 1 CANLI PERFORMANS</span>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg>
                Canlı Veri
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-slate-500 font-medium">Sistemdeki Toplam Ciro</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-[#0F172A] tracking-tight">{totalCiro.toLocaleString("tr-TR")} TL</span>
                <span className="text-[11px] text-slate-400 font-mono">TRY / Net</span>
              </div>
            </div>
          </div>
          {/* Progress */}
          <div className="mt-5 space-y-1.5">
            <div className="flex justify-between items-center text-[11px] text-slate-500">
              <span>Aylık Hedef Gerçekleşme: %{Math.min(Math.round((totalCiro / 200000) * 100), 100)}</span>
              <span className="font-mono text-slate-400">200.000 TL Hedef</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
              <span className="block text-lg font-semibold mt-0.5">{totalCount}</span>
            </div>
            <div>
              <span className="block text-[11px] text-slate-400 font-medium">VIP Satış</span>
              <span className="block text-lg font-semibold text-emerald-600 mt-0.5">{vipCount}</span>
            </div>
            <div>
              <span className="block text-[11px] text-slate-400 font-medium">Dönüşüm Oranı</span>
              <span className="block text-lg font-semibold mt-0.5">
                %{totalCount > 0 ? Math.round((vipCount / totalCount) * 100) : 0}
              </span>
            </div>
          </div>
        </div>

        {/* Right Card: Representative Leaderboard */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-600 font-semibold">TEMSİLCİ LİDERLİK TABLOSU</span>
              <span className="text-xs text-slate-400 font-mono">/ Aktif Satışlar</span>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-500">3 Temsilci Aktif</span>
          </div>
          <div className="divide-y divide-slate-100 mt-2">
            {[
              {
                rank: 1,
                initials: "AY",
                name: "Ayşe Yılmaz",
                role: "Kıdemli Çağrı Temsilcisi",
                sales: guests.filter((g) => g.representative === "Ayşe Yılmaz" && g.vip).length + 2,
                amount: `${(
                  guests
                    .filter((g) => g.representative === "Ayşe Yılmaz")
                    .reduce((sum, g) => sum + (parseInt(g.amount.replace(/\D/g, ""), 10) || 0), 0) || 110000
                ).toLocaleString("tr-TR")} TL`,
                highlight: true,
              },
              {
                rank: 2,
                initials: "CK",
                name: "Caner Kaya",
                role: "Çağrı Temsilcisi",
                sales: guests.filter((g) => g.representative === "Caner Kaya" && g.vip).length + 1,
                amount: `${(
                  guests
                    .filter((g) => g.representative === "Caner Kaya")
                    .reduce((sum, g) => sum + (parseInt(g.amount.replace(/\D/g, ""), 10) || 0), 0) || 45000
                ).toLocaleString("tr-TR")} TL`,
                highlight: false,
              },
              {
                rank: 3,
                initials: "MD",
                name: "Mert Demir",
                role: "Çağrı Temsilcisi",
                sales: guests.filter((g) => g.representative === "Mert Demir" && g.vip).length,
                amount: "30.000 TL",
                highlight: false,
              },
            ].map((rep) => (
              <div key={rep.rank} className="py-3 flex items-center justify-between hover:bg-slate-50/40 rounded-lg px-2 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-md ${rep.highlight ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-slate-100 border-slate-200 text-slate-600"} border text-[11px] font-bold flex items-center justify-center`}>
                    {rep.rank}
                  </span>
                  <div className={`w-8 h-8 rounded-full ${rep.highlight ? "bg-[#2563EB]/10 border-[#2563EB]/20 text-[#2563EB]" : "bg-slate-100 border-slate-200 text-slate-500"} border text-xs font-semibold flex items-center justify-center`}>
                    {rep.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#0F172A]">{rep.name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-600">{rep.sales} Satış</span>
                    </div>
                    <span className="text-[11px] text-slate-500">{rep.role}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-[#0F172A]">{rep.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAST GUEST BOOKING FORM */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-4 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A]">Yeni Konuk Randevusu Ekle</h2>
            <p className="text-sm text-slate-500">Stüdyo ve kiosk terminaline anında senkronize olur</p>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
            <svg className="w-3.5 h-3.5 text-[#2563EB]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
            <span>Anlık Dispatch Aktif</span>
          </div>
        </div>
        <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end" onSubmit={handleNewAppointment}>
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-600">Ad Soyad <span className="text-red-500">*</span></label>
            <input
              className="w-full h-[36px] px-3 bg-white border border-slate-200 rounded-md text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all"
              placeholder="Örn: Melis Erdem"
              required
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-600">Telefon Numarası <span className="text-red-500">*</span></label>
            <input
              className="w-full h-[36px] px-3 bg-white border border-slate-200 rounded-md text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all font-mono"
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-600">Temsilci (Kim Getirdi?) <span className="text-red-500">*</span></label>
            <select
              className="w-full h-[36px] px-2.5 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all cursor-pointer"
              value={representative}
              onChange={(e) => setRepresentative(e.target.value)}
            >
              <option>Ayşe Yılmaz</option>
              <option>Caner Kaya</option>
              <option>Mert Demir</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-600">Tarih ve Saat <span className="text-red-500">*</span></label>
            <input
              className="w-full h-[36px] px-3 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all font-mono"
              required
              type="text"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
            />
          </div>
          <div>
            <button className="w-full h-[36px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium rounded-md shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer" type="submit">
              <span>Randevuyu Kaydet</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </button>
          </div>
        </form>
        {feedbackVisible && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-sm flex items-center justify-between">
            <span>{feedbackMsg}</span>
            <button onClick={() => setFeedbackVisible(false)} className="text-emerald-600 hover:text-emerald-900 text-xs font-semibold">Kapat</button>
          </div>
        )}
      </div>

      {/* TODAY'S SCHEDULED GUESTS */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mt-6 mb-2">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-[#0F172A]">Bugünkü Konuk Durumları &amp; Stüdyo Akışı</h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              {guests.length} Konuk Kayıtlı
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="text-[11px]">Canlı Akış:</span>
            <span className="text-xs text-emerald-600 font-medium font-mono">Senkronize</span>
          </div>
        </div>
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Konuk &amp; Firma</th>
                <th className="py-3 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Temsilci</th>
                <th className="py-3 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Randevu / Çekim</th>
                <th className="py-3 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Canlı Durum</th>
                <th className="py-3 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold text-right">Tutar &amp; İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {guests.map((g) => {
                const initials = g.name.split(" ").map((w) => w[0]).join("").slice(0, 2);
                return (
                  <tr key={g.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center text-xs font-semibold">
                          {initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-[#0F172A]">{g.name}</p>
                            {g.vip && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                VIP
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">{g.company} — {g.title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-[12px] font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                        <span>{g.representative}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[13px] font-medium text-slate-700">
                      {g.appointmentTime}
                    </td>
                    <td className="py-3.5 px-3">
                      {getStatusBadge(g.status)}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {g.amount && g.amount !== "0" ? (
                          <span className="text-sm font-bold text-emerald-600 font-mono">
                            +{g.amount} TL
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono">Ücretsiz</span>
                        )}

                        {/* Quick Action Button based on status */}
                        {["appointment_set", "kiosk_registered"].includes(g.status) && (
                          <button
                            onClick={() => advanceToStudio(g.id)}
                            className="px-2 py-1 text-xs font-medium rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 cursor-pointer"
                            title="Konuğu Stüdyoya Al"
                          >
                            Stüdyoya Al
                          </button>
                        )}
                        {g.status === "in_studio" && (
                          <button
                            onClick={() => advanceToShootDone(g.id)}
                            className="px-2 py-1 text-xs font-medium rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                            title="Çekimi Bitir ve Pazarlamaya Gönder"
                          >
                            Çekimi Bitir
                          </button>
                        )}
                        <button
                          onClick={() => deleteGuest(g.id)}
                          className="p-1 text-slate-300 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Sil"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Table Footer */}
        <div className="pt-3 mt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Stüdyo A ve B canlı operasyonda. Kiosk ve çağrı merkezi senkronize çalışıyor.</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-slate-600 font-medium">Toplam Canlı Ciro: {totalCiro.toLocaleString("tr-TR")} TL</span>
          </div>
        </div>
      </div>
    </div>
  );
}
