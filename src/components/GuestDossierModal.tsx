"use client";

import { useState, useEffect, useMemo } from "react";
import { useStore } from "@/lib/useStore";
import type { Guest, RevisionNote } from "@/lib/store";

export default function GuestDossierModal() {
  const { guests, guestRequests, getGuestDeadlineInfo } = useStore();
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"genel" | "pazarlama" | "montaj" | "revize" | "yayin" | "talepler">("genel");

  // Global event dinleyicisi: Herhangi bir sayfadan openGuestDossier çağrıldığında tetiklenir
  useEffect(() => {
    function handleOpen(e: any) {
      const id = e.detail?.guestId;
      if (id) {
        setSelectedGuestId(id);
        setIsOpen(true);
        setActiveTab("genel");
      }
    }
    window.addEventListener("bct-open-guest-dossier", handleOpen);
    return () => window.removeEventListener("bct-open-guest-dossier", handleOpen);
  }, []);

  // ESC tuşu ile kapatma
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const guest = useMemo(() => {
    if (!selectedGuestId) return null;
    return guests.find((g) => g.id === selectedGuestId) || null;
  }, [guests, selectedGuestId]);

  if (!isOpen || !guest) return null;

  // 25 Günlük Zorunlu Yayın Süresi
  const deadline = getGuestDeadlineInfo(guest);

  // Bu konuğa ait iletişim talepleri
  const relatedRequests = guestRequests.filter(
    (r) => r.guestId === guest.id || (r.guestName && r.guestName.toLowerCase() === guest.name.toLowerCase())
  );

  // Yaşam Döngüsü Aşaması Hesaplama (Stepper)
  const isKioskDone = guest.status !== "appointment_set";
  const isShootDone = ["shoot_done", "package_set", "review_approved", "ready_for_broadcast", "broadcasted"].includes(guest.status);
  const isPackageSet = Boolean(guest.services && guest.services.length > 0) || ["package_set", "review_approved", "ready_for_broadcast", "broadcasted"].includes(guest.status);
  const isMontajDone = ["review_approved", "ready_for_broadcast", "broadcasted"].includes(guest.status);
  const hasRevisions = guest.notes && guest.notes.length > 0;
  const allRevisionsResolved = hasRevisions && guest.notes.every((n) => n.resolved);
  const isBroadcastReady = ["ready_for_broadcast", "broadcasted"].includes(guest.status);
  const isYouTubePublished = guest.youtubeMetadata?.status === "yayinda";

  // Finansal Özet
  const baseServicesTotal = (guest.services || []).reduce((sum, s) => sum + (s.price || 0), 0);
  const isKdvDahil = guest.kdvTipi ? guest.kdvTipi === "dahil" : true;
  let totalAmount = guest.toplamTutarKdvli || baseServicesTotal || parseInt(String(guest.amount || "0").replace(/\D/g, "")) || 0;
  let collectedAmount = 0;
  if (guest.paymentStatus === "tamamlandi") {
    collectedAmount = totalAmount;
  } else if (guest.paymentStatus === "on_odeme") {
    collectedAmount = guest.onOdemeMiktari || 0;
  }
  const remainingAmount = Math.max(0, totalAmount - collectedAmount);

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-5 md:p-6 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
    >
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp">
        {/* ── ÜST BAŞLIK (HEADER) ── */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex items-center justify-between shrink-0 border-b border-slate-700">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-lg flex items-center justify-center shadow-lg shrink-0 border border-blue-400/40">
              {guest.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold truncate text-white leading-tight">
                  {guest.name}
                </h2>
                {Boolean(guest.vip || (guest.services && guest.services.some((s) => s.price > 0))) && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-amber-950 shadow-xs uppercase tracking-wider">
                    ★ VIP MÜŞTERİ
                  </span>
                )}
                <span className="text-[11px] font-mono text-slate-300 bg-white/10 px-2 py-0.5 rounded-md">
                  {guest.registrationNo || "#BCT-KONUK"}
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate mt-0.5">
                {guest.company || "Bireysel"} • {guest.title || "Konuk"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* 25 Günlük Zorunlu Yayın Rozeti */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border shadow-xs ${
                deadline.isCritical
                  ? "bg-red-500/20 text-red-200 border-red-400 animate-pulse"
                  : deadline.isWarning
                  ? "bg-amber-500/20 text-amber-200 border-amber-400"
                  : "bg-emerald-500/20 text-emerald-200 border-emerald-400"
              }`}
              title={`25 Günlük Sözleşme Süresi: Son yayın tarihi ${deadline.deadlineDate.toLocaleDateString("tr-TR")}`}
            >
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              <span>{deadline.remainingDays} Gün Kaldı</span>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer font-bold text-sm"
              title="Kapat (ESC)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── 8 ADIMLI YAŞAM DÖNGÜSÜ TÜNELİ (PROCESS PIPELINE) ── */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-3 shrink-0 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[720px] gap-2">
            {[
              { label: "1. Çağrı / Randevu", done: true, current: !isKioskDone, desc: guest.appointmentTime },
              { label: "2. Kiosk Giriş", done: isKioskDone, current: isKioskDone && !isShootDone, desc: isKioskDone ? "Stüdyoda" : "Bekliyor" },
              { label: "3. Reji & Çekim", done: isShootDone, current: isShootDone && !isPackageSet, desc: guest.studio || "Gri Stüdyo" },
              { label: "4. Satış Paketi", done: isPackageSet, current: isPackageSet && !isMontajDone, desc: `₺${totalAmount.toLocaleString("tr-TR")}` },
              { label: "5. Kurgu / Montaj", done: isMontajDone, current: isMontajDone && !allRevisionsResolved && hasRevisions, desc: guest.editor || "Montajda" },
              { label: "6. İzleme & Revize", done: allRevisionsResolved || (!hasRevisions && isMontajDone), current: hasRevisions && !allRevisionsResolved, desc: hasRevisions ? `${guest.notes.length} Revize` : "Onaylandı" },
              { label: "7. Dijital Kart / Yayın", done: isBroadcastReady, current: isBroadcastReady && !isYouTubePublished, desc: "Canlı Yayın" },
              { label: "8. YouTube", done: isYouTubePublished, current: false, desc: isYouTubePublished ? "Yayında" : guest.vip ? "Sırada" : "Muaf" },
            ].map((step, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center text-center relative group">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-2xs mb-1 ${
                    step.done
                      ? "bg-emerald-600 text-white ring-2 ring-emerald-200"
                      : step.current
                      ? "bg-blue-600 text-white ring-2 ring-blue-300 animate-pulse"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {step.done ? "✓" : idx + 1}
                </div>
                <span className={`text-[10px] font-bold truncate max-w-[85px] block ${step.done ? "text-slate-800" : step.current ? "text-blue-700 font-extrabold" : "text-slate-400"}`}>
                  {step.label}
                </span>
                <span className="text-[9px] text-slate-400 truncate max-w-[85px] block">
                  {step.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── SEKMELER (TABS) ── */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-2 overflow-x-auto shrink-0 pt-2">
          {[
            { key: "genel", label: "Çağrı & İletişim", icon: "call" },
            { key: "pazarlama", label: "Pazarlama & Muhasebe", icon: "payments" },
            { key: "montaj", label: "Kurgu & Montaj", icon: "movie_edit" },
            { key: "revize", label: `Revizeler (${guest.notes?.length || 0})`, icon: "rate_review" },
            { key: "yayin", label: "Canlı Yayın & YouTube", icon: "live_tv" },
            { key: "talepler", label: `Talepler (${relatedRequests.length})`, icon: "support_agent" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-lg"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── İÇERİK ALANI (TAB BODY) ── */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* SEKME 1: ÇAĞRI MERKEZİ & İLETİŞİM */}
          {activeTab === "genel" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Çağıran Temsilci</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">{guest.representative || "Atanmadı"}</span>
                  <span className="text-[11px] text-blue-600 font-semibold mt-1 block">
                    {guest.room === "oda-1" ? "Oda 1: Satış & Teyit" : guest.room === "oda-2" ? "Oda 2: VIP Portföy" : "Oda 3: Hızlı Randevu"}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Randevu & Saat</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">{guest.appointmentTime || "Belirtilmedi"}</span>
                  <span className="text-[11px] text-slate-500 block">{guest.appointmentDate || "Bugün"}</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">İletişim Telefonu</span>
                  <span className="text-sm font-mono font-bold text-slate-900 mt-0.5 block">{guest.phone || "Telefon Yok"}</span>
                  {guest.phone && (
                    <a href={`tel:${guest.phone}`} className="text-[11px] text-emerald-600 font-bold hover:underline block mt-1">
                      📞 Doğrudan Ara
                    </a>
                  )}
                </div>
              </div>

              {/* Randevu Saat Durumu & Teyit */}
              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-blue-600 text-2xl">event_available</span>
                  <div>
                    <h4 className="text-xs font-bold text-blue-950">Geliş Durumu &amp; Saat Teyidi</h4>
                    <p className="text-xs text-blue-800 mt-0.5">
                      {guest.timeConfirmed ? "✓ Temsilci tarafından vaktinde geleceği teyit edildi." : "Henüz teyit araması yapılmadı veya bekleniyor."}
                      {guest.timeStatus === "gecikmeli" && ` (⚠️ Gecikme Bildirildi: ${guest.timeUpdateReason || "Trafik"})`}
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-white text-blue-900 border border-blue-200 shadow-2xs shrink-0">
                  {guest.timeStatus === "gecikmeli" ? "Gecikmeli" : guest.timeStatus === "erken_geldi" ? "Erken Geldi" : "Normal Vaktinde"}
                </span>
              </div>

              {/* Alt Bant (KJ) Sosyal Medya Seçimleri */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Alt Bantta (KJ) Gösterilecek Bilgiler
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {guest.socialMedia?.instagram && (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-mono">
                      <span className="text-[10px] text-slate-400 block font-sans">Instagram</span>
                      <strong className="text-slate-800">@{guest.socialMedia.instagram}</strong>
                    </div>
                  )}
                  {guest.socialMedia?.website && (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-mono">
                      <span className="text-[10px] text-slate-400 block font-sans">Web Sitesi</span>
                      <strong className="text-slate-800">{guest.socialMedia.website}</strong>
                    </div>
                  )}
                  {guest.socialMedia?.phone && (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-mono">
                      <span className="text-[10px] text-slate-400 block font-sans">Telefon</span>
                      <strong className="text-slate-800">{guest.socialMedia.phone}</strong>
                    </div>
                  )}
                  {guest.socialMedia?.linkedin && (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-mono">
                      <span className="text-[10px] text-slate-400 block font-sans">LinkedIn</span>
                      <strong className="text-slate-800">{guest.socialMedia.linkedin}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SEKME 2: PAZARLAMA & MUHASEBE */}
          {activeTab === "pazarlama" && (
            <div className="space-y-4 animate-fadeIn">
              {/* Mali Kartlar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Toplam Anlaşma</span>
                  <span className="text-lg font-black font-mono text-slate-900 mt-1 block">₺{totalAmount.toLocaleString("tr-TR")}</span>
                  <span className="text-[10px] text-slate-500 font-semibold">{isKdvDahil ? "KDV Dahil (%20)" : "+%20 KDV Hariç"}</span>
                </div>

                <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Alınan Nakit</span>
                  <span className="text-lg font-black font-mono text-emerald-700 mt-1 block">₺{collectedAmount.toLocaleString("tr-TR")}</span>
                  <span className="text-[10px] text-emerald-600 font-bold">{guest.paymentStatus === "tamamlandi" ? "Tamamı Alındı" : "Ön Ödeme"}</span>
                </div>

                <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200">
                  <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">Kalan Bakiye</span>
                  <span className="text-lg font-black font-mono text-amber-800 mt-1 block">₺{remainingAmount.toLocaleString("tr-TR")}</span>
                  <span className="text-[10px] text-amber-700 font-semibold">{remainingAmount > 0 ? "Tahsilat Bekliyor" : "✓ Kalan Yok"}</span>
                </div>

                <div className="p-3.5 bg-purple-50/70 rounded-2xl border border-purple-200">
                  <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block">Fatura Durumu</span>
                  <span className="text-sm font-bold text-purple-950 mt-1 block">
                    {guest.invoiceStatus === "kesildi" ? "✓ Fatura Kesildi" : "Fatura Bekliyor"}
                  </span>
                  <span className="text-[10px] font-mono text-purple-700">{guest.invoiceNo || "No atanmadı"}</span>
                </div>
              </div>

              {/* Hizmet Paketleri Tablosu */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Tanımlanan Hizmet Paketleri ({(guest.services || []).length} Adet)
                  </h4>
                  {guest.marketer && (
                    <span className="text-xs text-slate-500">
                      Pazarlamacı: <strong className="text-slate-800">{guest.marketer}</strong>
                    </span>
                  )}
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="py-2 px-3">Hizmet Türü</th>
                      <th className="py-2 px-3">Detaylar</th>
                      <th className="py-2 px-3 text-right">Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(guest.services || []).length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-slate-400">
                          Henüz ücretli hizmet paketi tanımlanmadı (Ücretsiz Canlı Yayın).
                        </td>
                      </tr>
                    ) : (
                      guest.services.map((svc, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-semibold text-slate-800 capitalize">
                            {svc.type.replace("_", " ")}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {(svc.details || []).map((d) => d.label).join(", ") || svc.customNote || "-"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            ₺{svc.price.toLocaleString("tr-TR")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SEKME 3: KURGU & MONTAJ */}
          {activeTab === "montaj" && (
            <div className="space-y-4 animate-fadeIn">
              {/* 25 Günlük Zorunlu Yayın Kuralı Göstergesi */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-blue-600 text-sm">assignment</span>
                      <span>25 Günlük Zorunlu Yayın Sözleşmesi</span>
                    </h4>
                    <p className="text-xs text-blue-800 mt-1">
                      Sözleşme Kuralı: İster ücretli ister ücretsiz olsun, her konuğun videosu en geç 25 gün içinde canlı yayına alınmalıdır.
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-2xl font-black font-mono text-blue-900 block">{deadline.remainingDays} Gün</span>
                    <span className="text-[10px] text-blue-600 font-semibold block">Bitiş: {deadline.deadlineDate.toLocaleDateString("tr-TR")}</span>
                  </div>
                </div>

                {/* İlerleme Çubuğu */}
                <div className="w-full bg-blue-200/70 h-2 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      deadline.isCritical ? "bg-red-600" : deadline.isWarning ? "bg-amber-500" : "bg-blue-600"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, deadline.percentageElapsed))}%` }}
                  ></div>
                </div>
              </div>

              {/* Kurgu Detayları */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Çekildiği Stüdyo</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">{guest.studio || "Gri Stüdyo"}</span>
                  <span className="text-[11px] text-slate-500 block">Çekim Saati: {guest.shootTime || "-"}</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sorumlu Kurgucu</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">{guest.editor || "Henüz atanmadı"}</span>
                  <span className="text-[11px] text-slate-500 block">Montaj Ekibi</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kurgu Durumu</span>
                  <span className="text-sm font-bold text-blue-700 mt-0.5 block">
                    {isMontajDone ? "✓ Montaj Tamamlandı" : isShootDone ? "Kurgu Masasında" : "Ham Kayıt Bekleniyor"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SEKME 4: İZLEME MASASI & REVİZE NOTLARI */}
          {activeTab === "revize" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Gelen Revize Notları ve Düzeltmeler ({(guest.notes || []).length})
                </h4>
                <span className="text-xs text-slate-500">
                  Kalite Kontrol: <strong className="text-emerald-700">{allRevisionsResolved ? "Tüm Revizeler Çözüldü" : hasRevisions ? "Revize Bekliyor" : "Temiz / Revizesiz"}</strong>
                </span>
              </div>

              {(guest.notes || []).length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400">
                  <span className="material-symbols-outlined text-3xl text-emerald-500 block mb-1">verified</span>
                  <p className="text-xs font-semibold text-slate-700">Bu konuk için herhangi bir revize talebi girilmemiş.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Video ilk kurgusuyla onaylanmış veya izleme sırasındadır.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {guest.notes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        note.resolved
                          ? "bg-emerald-50/40 border-emerald-200"
                          : "bg-amber-50/40 border-amber-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                            ⏱ {note.time}
                          </span>
                          <span className="text-xs font-semibold text-slate-700">
                            Yazan: {note.author} ({note.authorType === "client" ? "Müşteri / Konuk" : "İzleme Sorumlusu"})
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            note.resolved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800 animate-pulse"
                          }`}
                        >
                          {note.resolved ? "✓ Çözüldü" : "⏳ Çözüm Bekliyor"}
                        </span>
                      </div>

                      <p className="text-xs text-slate-800 mt-2 font-sans leading-relaxed">
                        {note.text}
                      </p>

                      <span className="text-[10px] text-slate-400 block mt-2">
                        Kayıt Zamanı: {new Date(note.createdAt).toLocaleString("tr-TR")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SEKME 5: CANLI YAYIN & YOUTUBE */}
          {activeTab === "yayin" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Canlı Yayın Kutusu */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Canlı Yayın Durumu</span>
                  <span className="text-sm font-bold text-slate-900 mt-1 block">
                    {isBroadcastReady ? "✓ Yayına Hazır" : "Kurgu / İzleme Bekliyor"}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    Yayınlar her gün 11:30 - 19:00 arası 30 dakikada bir otomatik sırayla verilmektedir.
                  </p>
                </div>

                {/* YouTube Durumu */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">YouTube Arşivi</span>
                  {guest.vip || (guest.services && guest.services.some((s) => s.price > 0)) ? (
                    <div>
                      <span className="text-sm font-bold text-red-600 mt-1 block">
                        {guest.youtubeMetadata?.status === "yayinda" ? "✓ YouTube'da Yayında" : "YouTube Yüklemesi Bekleniyor"}
                      </span>
                      {guest.youtubeMetadata?.youtubeUrl && (
                        <a
                          href={guest.youtubeMetadata.youtubeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 font-bold hover:underline block mt-1"
                        >
                          🔗 Videoyu YouTube&apos;da Aç
                        </a>
                      )}
                    </div>
                  ) : (
                    <div>
                      <span className="text-sm font-bold text-slate-600 mt-1 block">Ücretsiz Canlı Yayın Konuğu</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Ücret ödemeyen konuklar yalnızca canlı yayına alınır; YouTube arşivine yüklenmez.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* YouTube Başlık ve Açıklaması (Varsa) */}
              {guest.youtubeMetadata && (
                <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-800">YouTube Video Metadata</h4>
                  <div className="p-2.5 bg-slate-50 rounded-xl font-mono text-slate-700">
                    <span className="text-[10px] text-slate-400 block font-sans">Video Başlığı</span>
                    <strong>{guest.youtubeMetadata.customTitle || `${guest.name} — BCT Stüdyo Röportajı`}</strong>
                  </div>
                  {guest.youtubeMetadata.customDescription && (
                    <div className="p-2.5 bg-slate-50 rounded-xl text-slate-700 whitespace-pre-wrap">
                      <span className="text-[10px] text-slate-400 block font-sans">Açıklama Metni</span>
                      {guest.youtubeMetadata.customDescription}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SEKME 6: İLETİŞİM & TALEP MASASI KAYITLARI */}
          {activeTab === "talepler" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Bu Konuk İçin Açılmış Yazılı Talepler ({relatedRequests.length})
                </h4>
              </div>

              {relatedRequests.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400">
                  <span className="material-symbols-outlined text-3xl text-slate-300 block mb-1">chat</span>
                  <p className="text-xs font-semibold text-slate-700">Bu konuk için açılmış herhangi bir özel talep bulunmuyor.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {relatedRequests.map((req) => (
                    <div key={req.id} className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-900">
                            {req.targetDepartment}
                          </span>
                          <h5 className="text-xs font-bold text-slate-900">{req.title}</h5>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            req.status === "cozuldu" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {req.status === "cozuldu" ? "✓ Çözüldü" : "Beklemede"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-sans">{req.description}</p>
                      {req.resolutionNote && (
                        <div className="p-2 bg-emerald-50 text-emerald-900 rounded-lg text-xs font-medium">
                          Çözüm Notu: {req.resolutionNote}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── MODAL ALTI (FOOTER) ── */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 font-medium">
            <span>BCT-OS 360° Konuk Röntgeni</span>
            <span className="mx-1.5">•</span>
            <span>Konuk ID: <strong className="font-mono text-slate-700">{guest.id}</strong></span>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
          >
            Pencereyi Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
