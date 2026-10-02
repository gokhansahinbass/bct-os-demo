"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useStore } from "@/lib/useStore";
import type { Guest } from "@/lib/store";

export default function MuhasebePage() {
  const {
    guests,
    updateGuestPayment,
    batchUpdateGuestPayments,
    canAccessPage,
  } = useStore();

  const [tabFilter, setTabFilter] = useState<"tum" | "bekleyen" | "tamamlanan">("tum");
  const [search, setSearch] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Satır İçi Hızlı Miktar Düzenleme
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [editingAmount, setEditingAmount] = useState<number>(0);

  // Excel Dosya Seçici Referansı
  const fileInputRef = useRef<HTMLInputElement>(null);

  // RBAC Sayfa Koruması
  if (!canAccessPage("/dashboard/muhasebe")) {
    return (
      <div className="p-8 max-w-xl mx-auto mt-12 bg-white rounded-2xl shadow-sm border border-slate-200 text-center">
        <span className="text-4xl block mb-3">🔒</span>
        <h2 className="text-base font-bold text-slate-900 mb-1">Erişim Yetkisi Sınırlı</h2>
        <p className="text-xs text-slate-600 mb-4">
          Bu sayfayı görüntülemek için <strong>Muhasebe</strong> veya <strong>Süper Admin</strong> yetkisine sahip olmalısınız.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

  // Hesaplama Yardımcısı
  const guestFinancials = useMemo(() => {
    return guests.map((g) => {
      const baseServicesTotal = (g.services || []).reduce((sum, s) => sum + (s.price || 0), 0);
      const isKdvDahil = g.kdvTipi ? g.kdvTipi === "dahil" : true;

      // Anlaşma / Toplam Fiyat
      let totalAmount = g.toplamTutarKdvli;
      if (!totalAmount || totalAmount === 0) {
        if (!isKdvDahil && baseServicesTotal > 0) {
          totalAmount = Math.round(baseServicesTotal * 1.20);
        } else if (baseServicesTotal > 0) {
          totalAmount = baseServicesTotal;
        } else {
          totalAmount = parseInt(String(g.amount || "0").replace(/\D/g, "")) || 0;
        }
      }

      // Alınan Nakit
      let collectedAmount = 0;
      if (g.paymentStatus === "tamamlandi") {
        collectedAmount = totalAmount;
      } else if (g.paymentStatus === "on_odeme") {
        collectedAmount = g.onOdemeMiktari || 0;
      }

      // Tahsilat Bekleyen / Kalan Miktar
      const remainingAmount = Math.max(0, totalAmount - collectedAmount);

      return {
        guest: g,
        isKdvDahil,
        totalAmount,
        collectedAmount,
        remainingAmount,
        isCompleted: g.paymentStatus === "tamamlandi" || remainingAmount === 0,
        hasPending: remainingAmount > 0,
      };
    });
  }, [guests]);

  // Üst Sayaçlar
  const totalCiro = guestFinancials.reduce((acc, item) => acc + item.totalAmount, 0);
  const totalCollected = guestFinancials.reduce((acc, item) => acc + item.collectedAmount, 0);
  const totalRemaining = guestFinancials.reduce((acc, item) => acc + item.remainingAmount, 0);
  const pendingCount = guestFinancials.filter((item) => item.hasPending).length;

  // Filtrelenmiş Liste
  const filteredGuests = useMemo(() => {
    return guestFinancials.filter((item) => {
      if (tabFilter === "bekleyen" && !item.hasPending) return false;
      if (tabFilter === "tamamlanan" && !item.isCompleted) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const nameMatch = item.guest.name.toLowerCase().includes(q);
        const compMatch = (item.guest.company || "").toLowerCase().includes(q);
        const repMatch = (item.guest.representative || "").toLowerCase().includes(q);
        if (!nameMatch && !compMatch && !repMatch) return false;
      }
      return true;
    });
  }, [guestFinancials, tabFilter, search]);

  // ── "ÖDEME TAMAMLANDI" BUTONU ──
  function handleMarkCompleted(item: typeof guestFinancials[0]) {
    updateGuestPayment(
      item.guest.id,
      "tamamlandi",
      item.totalAmount,
      "Tüm tahsilat muhasebe tarafından tamamlandı olarak işaretlendi."
    );
    setFeedback(`✓ ${item.guest.name} için tüm ödeme tamamlandı olarak işaretlendi!`);
    setTimeout(() => setFeedback(null), 3500);
  }

  // ── ÖDEMEYİ YENİDEN AÇ / DÜZELT ──
  function handleReopenPayment(item: typeof guestFinancials[0]) {
    updateGuestPayment(
      item.guest.id,
      "on_odeme",
      0,
      "Ödeme durumu muhasebe tarafından yeniden açıldı."
    );
    setFeedback(`ℹ️ ${item.guest.name} ödemesi düzenleme için yeniden açıldı.`);
    setTimeout(() => setFeedback(null), 3500);
  }

  // ── SATIR İÇİ MİKTAR KAYDETME ──
  function handleSaveInlineAmount(guestId: string, totalAmount: number) {
    let newStatus: "tamamlandi" | "on_odeme" | "odenmedi" = "on_odeme";
    if (editingAmount >= totalAmount && totalAmount > 0) {
      newStatus = "tamamlandi";
    } else if (editingAmount <= 0) {
      newStatus = "odenmedi";
    }

    updateGuestPayment(guestId, newStatus, editingAmount, "Muhasebe doğrudan alınan miktarı güncelledi.");
    setEditingGuestId(null);
    setFeedback("✓ Alınan ödeme miktarı güncellendi.");
    setTimeout(() => setFeedback(null), 3000);
  }

  // ── 1) EXCEL / CSV İNDİR ──
  function handleExportExcel() {
    const headers = [
      "Konuk ID",
      "Konuk Adi",
      "Firma",
      "KDV Modeli",
      "Toplam Tutar (TL)",
      "Alinan Tutar (TL)",
      "Kalan Tutar (TL)",
      "Odeme Durumu",
      "Temsilci",
    ];

    const rows = guestFinancials.map((item) => {
      const g = item.guest;
      return [
        g.id,
        `"${g.name.replace(/"/g, '""')}"`,
        `"${(g.company || "").replace(/"/g, '""')}"`,
        item.isKdvDahil ? "KDV Dahil" : "KDV Haric",
        item.totalAmount,
        item.collectedAmount,
        item.remainingAmount,
        item.isCompleted ? "Tamamlandi" : g.paymentStatus === "on_odeme" ? "On Odeme" : "Odenmedi",
        `"${g.representative || ""}"`,
      ].join(";");
    });

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `BCT_Muhasebe_Odemeler_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setFeedback("✓ Excel / CSV dosyası indirildi. Excel'de 'Alınan Tutar' kolonunu düzenleyip geri yükleyebilirsiniz.");
    setTimeout(() => setFeedback(null), 5000);
  }

  // ── 2) EXCEL'DEN YÜKLE / İÇE AKTAR (CSV UPLOAD) ──
  function handleImportExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          alert("Dosya boş veya geçersiz formatta.");
          return;
        }

        // Başlık satırı
        const headerLine = lines[0].toLowerCase();
        const delimiter = headerLine.includes(";") ? ";" : ",";
        const headers = lines[0].split(delimiter).map((h) => h.replace(/"/g, "").trim().toLowerCase());

        let idIndex = headers.findIndex((h) => h.includes("id") || h.includes("konuk id"));
        let nameIndex = headers.findIndex((h) => h.includes("ad") || h.includes("konuk"));
        let collectedIndex = headers.findIndex((h) => h.includes("alinan") || h.includes("ödenen") || h.includes("tahsil"));

        // Fallback sütun indeksleri
        if (idIndex === -1) idIndex = 0;
        if (collectedIndex === -1) collectedIndex = 5;

        const updates: Array<{
          guestId: string;
          onOdemeMiktari: number;
          paymentStatus: "odenmedi" | "on_odeme" | "tamamlandi" | "ucretsiz";
        }> = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(delimiter).map((c) => c.replace(/"/g, "").trim());
          if (cols.length <= 1) continue;

          const rowId = cols[idIndex];
          const rowName = nameIndex !== -1 ? cols[nameIndex] : "";
          const rawAmount = cols[collectedIndex] || "0";
          const parsedAmount = parseInt(rawAmount.replace(/\D/g, "")) || 0;

          // Konuğu ID veya İsme göre eşleştir
          const matchedGuest = guests.find(
            (g) => g.id === rowId || (rowName && g.name.toLowerCase() === rowName.toLowerCase())
          );

          if (matchedGuest) {
            const baseServices = (matchedGuest.services || []).reduce((s, x) => s + (x.price || 0), 0);
            const totalDue = matchedGuest.toplamTutarKdvli || baseServices || 0;

            let newStatus: "tamamlandi" | "on_odeme" | "odenmedi" = "on_odeme";
            if (parsedAmount >= totalDue && totalDue > 0) {
              newStatus = "tamamlandi";
            } else if (parsedAmount <= 0) {
              newStatus = "odenmedi";
            }

            updates.push({
              guestId: matchedGuest.id,
              onOdemeMiktari: parsedAmount,
              paymentStatus: newStatus,
            });
          }
        }

        if (updates.length > 0) {
          const count = batchUpdateGuestPayments(updates);
          setFeedback(`✓ Excel dosyasından ${count} konuğun ödenen miktarı başarıyla güncellendi!`);
        } else {
          alert("Eşleşen konuk kaydı bulunamadı. Lütfen indirilen şablonu kullandığınızdan emin olun.");
        }
      } catch (err) {
        alert("Excel dosyası okunurken hata oluştu. Lütfen geçerli bir CSV formatı yükleyin.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
        setTimeout(() => setFeedback(null), 5000);
      }
    };

    reader.readAsText(file, "UTF-8");
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-16 max-w-7xl mx-auto">
      {/* ── Üst Başlık & Excel Aksiyonları ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Muhasebe &amp; Finans Takibi
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Konuk ödemeleri, KDV durumu, alınan nakit ve bekleyen tahsilatların sade takibi.
          </p>
        </div>

        {/* Excel İndir / Yükle Butonları */}
        <div className="flex items-center gap-2">
          {/* Gizli Dosya Girişi */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={handleImportExcel}
            className="hidden"
          />

          {/* Excel'den Yükle */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-300 shadow-2xs"
            title="Excel'de düzenlediğiniz CSV dosyasını seçip miktarları tek tıkla güncelleyin"
          >
            <span className="material-symbols-outlined text-[17px] text-blue-600">upload_file</span>
            <span>Excel'den Yükle / Düzenle</span>
          </button>

          {/* Excel İndir */}
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            title="Tüm konuk ödemelerini Excel formatında indirin"
          >
            <span className="material-symbols-outlined text-[17px]">download</span>
            <span>Excel İndir</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">✕</button>
        </div>
      )}

      {/* ── 3 SADE VE BÜYÜK SAYAÇ KARTI ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. Alınan Nakit */}
        <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl shadow-2xs">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
            Alınan Nakit (Tahsilat)
          </span>
          <span className="text-2xl font-black text-emerald-700 font-mono mt-1 block">
            ₺{totalCollected.toLocaleString("tr-TR")}
          </span>
          <span className="text-[11px] text-emerald-600 mt-1 block">
            Kasaya giren kesinleşmiş tutar
          </span>
        </div>

        {/* 2. Tahsilat Bekleyen */}
        <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Tahsilat Bekleyen Miktar
            </span>
            {pendingCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-mono">
                {pendingCount} Konuk
              </span>
            )}
          </div>
          <span className="text-2xl font-black text-amber-800 font-mono mt-1 block">
            ₺{totalRemaining.toLocaleString("tr-TR")}
          </span>
          <span className="text-[11px] text-amber-700 mt-1 block">
            Ön ödeme alınıp kalanı beklenen tutar
          </span>
        </div>

        {/* 3. Toplam Anlaşma */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Toplam Anlaşma Hacmi
          </span>
          <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
            ₺{totalCiro.toLocaleString("tr-TR")}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Toplam {guests.length} konuk paketi
          </span>
        </div>
      </div>

      {/* ── FİLTRE VE ARAMA ÇUBUĞU ── */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Sekmeler */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setTabFilter("tum")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              tabFilter === "tum"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Tümü ({guestFinancials.length})
          </button>

          <button
            onClick={() => setTabFilter("bekleyen")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              tabFilter === "bekleyen"
                ? "bg-amber-800 text-white shadow-2xs"
                : "text-amber-800 hover:bg-amber-50"
            }`}
          >
            <span>Tahsilat Bekleyenler</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-amber-200 text-amber-950 font-black">
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setTabFilter("tamamlanan")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              tabFilter === "tamamlanan"
                ? "bg-emerald-700 text-white shadow-2xs"
                : "text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            Ödemesi Tamamlananlar
          </button>
        </div>

        {/* Arama */}
        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Konuk veya firma ara..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium"
          />
        </div>
      </div>

      {/* ── BASİT VE OKUNAKLI TABLO ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Konuk &amp; Firma</th>
                <th className="py-3.5 px-4">KDV Durumu</th>
                <th className="py-3.5 px-4 text-right">Toplam Tutar</th>
                <th className="py-3.5 px-4 text-right">Alınan Nakit</th>
                <th className="py-3.5 px-4 text-right">Tahsilat Bekleyen</th>
                <th className="py-3.5 px-4 text-center">Ödeme Durumu</th>
                <th className="py-3.5 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Seçili kritere uygun konuk bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredGuests.map((item) => {
                  const g = item.guest;
                  const isEditing = editingGuestId === g.id;

                  return (
                    <tr
                      key={g.id}
                      className={`hover:bg-slate-50/70 transition ${
                        item.hasPending ? "bg-amber-50/20" : ""
                      }`}
                    >
                      {/* 1. Konuk & Firma */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{g.name}</p>
                          <p className="text-xs text-slate-500">{g.company || "Şirketsiz"}</p>
                          {g.representative && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Temsilci: <strong className="text-slate-600">{g.representative}</strong>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. KDV Durumu (Net Rozet) */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-md inline-block ${
                            item.isKdvDahil
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          }`}
                        >
                          {item.isKdvDahil ? "KDV Dahil" : "+%20 KDV Hariç"}
                        </span>
                      </td>

                      {/* 3. Toplam Tutar */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono text-sm font-bold text-slate-900">
                          ₺{item.totalAmount.toLocaleString("tr-TR")}
                        </span>
                      </td>

                      {/* 4. Alınan Nakit (Düzenlenebilir) */}
                      <td className="py-3.5 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <input
                              type="number"
                              min={0}
                              value={editingAmount}
                              onChange={(e) => setEditingAmount(Number(e.target.value))}
                              className="w-24 p-1 text-xs font-mono font-bold text-emerald-800 border-2 border-emerald-500 rounded bg-white text-right focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveInlineAmount(g.id, item.totalAmount)}
                              className="px-2 py-1 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700"
                              title="Kaydet"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingGuestId(null)}
                              className="px-1.5 py-1 text-slate-400 hover:text-slate-600 text-xs"
                              title="İptal"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            <span className="font-mono text-sm font-bold text-emerald-700">
                              ₺{item.collectedAmount.toLocaleString("tr-TR")}
                            </span>
                            <button
                              onClick={() => {
                                setEditingGuestId(g.id);
                                setEditingAmount(item.collectedAmount);
                              }}
                              className="text-slate-400 hover:text-slate-700 p-0.5 rounded hover:bg-slate-100 transition cursor-pointer"
                              title="Alınan Miktarı Doğrudan Değiştir"
                            >
                              <span className="material-symbols-outlined text-[14px]">edit</span>
                            </button>
                          </div>
                        )}
                      </td>

                      {/* 5. Tahsilat Bekleyen (Kalan Miktar) */}
                      <td className="py-3.5 px-4 text-right">
                        {item.remainingAmount > 0 ? (
                          <div className="inline-block">
                            <span className="font-mono text-sm font-black text-amber-800 block">
                              ₺{item.remainingAmount.toLocaleString("tr-TR")}
                            </span>
                            <span className="text-[10px] text-amber-700 font-semibold block">
                              Bekliyor
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span>✓</span>
                            <span>Kalan Yok</span>
                          </span>
                        )}
                      </td>

                      {/* 6. Ödeme Durumu Rozeti */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full inline-block ${
                            item.isCompleted
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : g.paymentStatus === "on_odeme"
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {item.isCompleted
                            ? "Ödeme Tamamlandı"
                            : g.paymentStatus === "on_odeme"
                            ? "Ön Ödeme Alındı"
                            : "Ödeme Alınmadı"}
                        </span>
                      </td>

                      {/* 7. İŞLEM: Sadece "ÖDEME TAMAMLANDI" BUTONU */}
                      <td className="py-3.5 px-4 text-right">
                        {!item.isCompleted ? (
                          <button
                            onClick={() => handleMarkCompleted(item)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-2xs transition flex items-center gap-1.5 ml-auto cursor-pointer"
                            title="Tüm bakiyenin tahsil edildiğini onaylar ve kalan miktarı sıfırlar"
                          >
                            <span className="material-symbols-outlined text-[15px]">check_circle</span>
                            <span>Ödeme Tamamlandı</span>
                          </button>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px]">done_all</span>
                              <span>Tahsil Edildi</span>
                            </span>
                            <button
                              onClick={() => handleReopenPayment(item)}
                              className="text-[10px] text-slate-400 hover:text-slate-700 underline cursor-pointer ml-1"
                              title="Ödeme durumunu düzenlemek için yeniden aç"
                            >
                              Düzelt
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ALT BİLGİ VE KULLANIM REHBERİ ── */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400 text-lg">help_outline</span>
          <span>
            <strong>Nasıl Çalışır?</strong> Pazarlamacı ön ödeme girdiğinde kalan tutar burada otomatik olarak <em>"Tahsilat Bekleyen"</em> hanesine düşer. Kişi kalan parayı ödediğinde <strong>"Ödeme Tamamlandı"</strong> butonuna basmanız yeterlidir. Dilerseniz tüm listeyi Excel olarak indirip miktarları oradan da yükleyebilirsiniz.
          </span>
        </div>
      </div>
    </div>
  );
}
