"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/useStore";
import { type Guest, type GuestTimeStatus } from "@/lib/store";

interface UpdateTimeModalProps {
  isOpen: boolean;
  guest: Guest | null;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

export default function UpdateTimeModal({
  isOpen,
  guest,
  onClose,
  onSuccess,
}: UpdateTimeModalProps) {
  const { updateGuestAppointmentTime, confirmGuestAppointment } = useStore();

  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [timeStatus, setTimeStatus] = useState<GuestTimeStatus>("normal");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (guest) {
      // Parse time part if formatted like "12 Ekim 17:00" or "14:30"
      const match = guest.appointmentTime.match(/(\d{1,2}:\d{2})/);
      setTime(match ? match[1] : guest.appointmentTime || "14:30");
      setDate(guest.appointmentDate || "Bugün");
      setTimeStatus(guest.timeStatus || "normal");
      setReason(guest.timeUpdateReason || "");
    }
  }, [guest, isOpen]);

  if (!isOpen || !guest) return null;

  function advanceTime(minutesToAdd: number) {
    const timeMatch = time.match(/(\d{1,2}):(\d{2})/);
    if (!timeMatch) return;
    let h = parseInt(timeMatch[1], 10);
    let m = parseInt(timeMatch[2], 10);
    m += minutesToAdd;
    while (m >= 60) {
      m -= 60;
      h = (h + 1) % 24;
    }
    const newH = h.toString().padStart(2, "0");
    const newM = m.toString().padStart(2, "0");
    setTime(`${newH}:${newM}`);
    setTimeStatus("gecikmeli");
    if (!reason.trim()) {
      setReason(`Konuk ${minutesToAdd} dakika geç geleceğini beyan etti.`);
    }
  }

  function handleQuickConfirm() {
    setIsSubmitting(true);
    const ok = confirmGuestAppointment(guest!.id, reason.trim() || "Telefonla arandı, randevu saatinde geleceği teyit edildi.");
    setIsSubmitting(false);
    if (ok) {
      if (onSuccess) onSuccess(`✓ ${guest!.name} randevusu teyit edildi.`);
      onClose();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!time.trim()) return;

    setIsSubmitting(true);
    const ok = updateGuestAppointmentTime(
      guest!.id,
      time.trim(),
      date.trim() || undefined,
      timeStatus,
      reason.trim() || undefined
    );
    setIsSubmitting(false);

    if (ok) {
      const label =
        timeStatus === "gecikmeli"
          ? "gecikmeli olarak"
          : timeStatus === "erken_geldi"
          ? "erken saat olarak"
          : "yeni saatiyle";
      if (onSuccess) onSuccess(`✓ ${guest!.name} randevusu ${time} (${label}) güncellendi ve tüm birimlere bildirildi.`);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-amber-400 text-[22px]">schedule</span>
            <div>
              <h2 className="text-base font-bold tracking-tight">Konuk Saati &amp; Beyan Güncelleme</h2>
              <p className="text-xs text-slate-300">
                {guest.name} — <span className="text-amber-300 font-medium">{guest.company}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Guest Information Pill */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="text-slate-500 font-medium block">Davet Eden Temsilci:</span>
              <span className="font-bold text-slate-900">{guest.representative || "Atanmadı"} ({guest.room ? (guest.room === "oda-1" ? "Oda 1" : guest.room === "oda-2" ? "Oda 2" : "Oda 3") : "Genel"})</span>
            </div>
            <div className="text-right space-y-0.5">
              <span className="text-slate-500 font-medium block">Kayıtlı Saat:</span>
              <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                {guest.appointmentTime}
              </span>
            </div>
          </div>

          {/* Durum Seçici (Normal, Geç Gelecek, Erken Geldi) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Konuğun Geliş Durumu / Beyanı:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTimeStatus("normal")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                  timeStatus === "normal"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="text-base">🟢</span>
                <span>Vaktinde Geliyor</span>
              </button>

              <button
                type="button"
                onClick={() => setTimeStatus("gecikmeli")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                  timeStatus === "gecikmeli"
                    ? "bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20 shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="text-base">⏳</span>
                <span>Geç Gelecek</span>
              </button>

              <button
                type="button"
                onClick={() => setTimeStatus("erken_geldi")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                  timeStatus === "erken_geldi"
                    ? "bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-500/20 shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="text-base">⚡</span>
                <span>Erken Geldi / Geliyor</span>
              </button>
            </div>
          </div>

          {/* Hızlı Saat Öteleme Butonları (Gecikme İçin) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Hızlı Saat Ekle (+dk):
              </label>
              <span className="text-[11px] text-slate-400">Tek tıkla saate ilave eder</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => advanceTime(15)}
                className="py-1.5 px-2 bg-slate-100 hover:bg-amber-100 hover:border-amber-300 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:text-amber-900 transition cursor-pointer"
              >
                +15 dk
              </button>
              <button
                type="button"
                onClick={() => advanceTime(30)}
                className="py-1.5 px-2 bg-slate-100 hover:bg-amber-100 hover:border-amber-300 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:text-amber-900 transition cursor-pointer"
              >
                +30 dk
              </button>
              <button
                type="button"
                onClick={() => advanceTime(45)}
                className="py-1.5 px-2 bg-slate-100 hover:bg-amber-100 hover:border-amber-300 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:text-amber-900 transition cursor-pointer"
              >
                +45 dk
              </button>
              <button
                type="button"
                onClick={() => advanceTime(60)}
                className="py-1.5 px-2 bg-slate-100 hover:bg-amber-100 hover:border-amber-300 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:text-amber-900 transition cursor-pointer"
              >
                +60 dk
              </button>
            </div>
          </div>

          {/* Yeni Saat & Tarih Girişi */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Yeni Randevu Saati:</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl border border-slate-300 font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tarih:</label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="Örn: 12 Ekim 2026"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Gerekçe / Beyan Notu */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Gecikme / Değişiklik Gerekçesi (Not):
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Örn: Köprü trafiğinde kaldı, saat 15:30'da stüdyoda olacağını belirtti."
              className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Quick 1-Click Action for Representative Confirmation */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleQuickConfirm}
              disabled={isSubmitting}
              className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <span className="material-symbols-outlined text-[18px] text-emerald-600">verified</span>
              <span>📞 Temsilci Teyidi: Konukla Görüşüldü, Vaktinde Geliyor</span>
            </button>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>Saati Kaydet &amp; Tüm Birimlere Bildir</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
