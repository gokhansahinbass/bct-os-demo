"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/lib/useStore";
import type { Guest } from "@/lib/store";

export default function MuhasebePage() {
  const {
    guests,
    updateGuestInvoiceStatus,
    updateGuestPayment,
    canAccessPage,
    currentUser,
  } = useStore();

  const [invoiceFilter, setInvoiceFilter] = useState<"tum" | "kesildi" | "kesilmedi" | "muaf">("tum");
  const [paymentFilter, setPaymentFilter] = useState<"tum" | "tamamlandi" | "on_odeme" | "odenmedi">("tum");
  const [onlyErrorsFilter, setOnlyErrorsFilter] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Fatura Kesme Modalı
  const [invoiceModalGuest, setInvoiceModalGuest] = useState<Guest | null>(null);
  const [invoiceNoInput, setInvoiceNoInput] = useState<string>("");
  const [invoiceDateInput, setInvoiceDateInput] = useState<string>("");

  // Tahsilat Alma Modalı
  const [paymentModalGuest, setPaymentModalGuest] = useState<Guest | null>(null);
  const [newCollectionAmount, setNewCollectionAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("havale");
  const [paymentNote, setPaymentNote] = useState<string>("");

  // Resmi Makbuz / Fatura İcmali Önizleme Modalı
  const [receiptGuest, setReceiptGuest] = useState<Guest | null>(null);

  // RBAC Kontrolü
  if (!canAccessPage("/dashboard/muhasebe")) {
    return (
      <div className="p-8 max-w-xl mx-auto mt-12 bg-white rounded-2xl shadow-sm border border-slate-200 text-center">
        <span className="text-4xl block mb-3">🔒</span>
        <h2 className="text-base font-bold text-slate-900 mb-1">Erişim Yetkisi Sınırlı</h2>
        <p className="text-xs text-slate-600 mb-4">
          Bu sayfayı görüntülemek için <strong>Muhasebe &amp; Finans Müdürü</strong> veya <strong>Süper Admin</strong> yetkisine sahip olmalısınız.
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

  // Hesaplama ve Döküm Yardımcısı (KDV %20 standardı)
  const financialRecords = useMemo(() => {
    return guests.map((g) => {
      const baseServicesTotal = (g.services || []).reduce((sum, s) => sum + (s.price || 0), 0);
      const isKdvDahil = g.kdvTipi === "dahil";
      
      // Matrah ve KDV
      let netMatrah = g.netTutar;
      let kdvTutari = g.kdvTutari;
      let toplamTutar = g.toplamTutarKdvli;

      if (!netMatrah || !toplamTutar) {
        if (isKdvDahil) {
          netMatrah = Math.round(baseServicesTotal / 1.20);
          kdvTutari = baseServicesTotal - netMatrah;
          toplamTutar = baseServicesTotal;
        } else {
          netMatrah = baseServicesTotal;
          kdvTutari = Math.round(baseServicesTotal * 0.20);
          toplamTutar = baseServicesTotal + kdvTutari;
        }
      }

      // Tahsilat & Kalan
      let collected = 0;
      if (g.paymentStatus === "tamamlandi") {
        collected = toplamTutar;
      } else if (g.paymentStatus === "on_odeme") {
        collected = g.onOdemeMiktari || 0;
      }

      const remaining = Math.max(0, toplamTutar - collected);

      // Hata / Uyarı Durumları (Zero-Error Kriterleri)
      const hasMissingTaxInfo = toplamTutar > 0 && (!g.taxNumber || !g.taxOffice);
      const isPaidButUnbilled = g.paymentStatus === "tamamlandi" && g.invoiceStatus !== "kesildi";
      const hasOpenBalance = g.paymentStatus === "on_odeme" && remaining > 0;
      const isCriticalError = isPaidButUnbilled || (g.invoiceStatus === "kesildi" && !g.invoiceNo);

      return {
        guest: g,
        baseServicesTotal,
        kdvTipi: g.kdvTipi || "dahil",
        netMatrah: netMatrah || 0,
        kdvTutari: kdvTutari || 0,
        toplamTutar: toplamTutar || 0,
        collected,
        remaining,
        hasMissingTaxInfo,
        isPaidButUnbilled,
        hasOpenBalance,
        isCriticalError,
        hasAnyWarning: hasMissingTaxInfo || isPaidButUnbilled || hasOpenBalance || isCriticalError,
      };
    });
  }, [guests]);

  // Canlı KPI Metrikleri
  const totalCiro = financialRecords.reduce((acc, r) => acc + r.toplamTutar, 0);
  const totalNetMatrah = financialRecords.reduce((acc, r) => acc + r.netMatrah, 0);
  const totalKdv = financialRecords.reduce((acc, r) => acc + r.kdvTutari, 0);
  const totalCollected = financialRecords.reduce((acc, r) => acc + r.collected, 0);
  const totalRemaining = financialRecords.reduce((acc, r) => acc + r.remaining, 0);
  const pendingInvoicesCount = financialRecords.filter((r) => r.toplamTutar > 0 && r.guest.invoiceStatus !== "kesildi").length;
  const criticalWarningsCount = financialRecords.filter((r) => r.isPaidButUnbilled || r.hasMissingTaxInfo).length;

  // Filtrelenmiş Liste
  const filteredRecords = useMemo(() => {
    return financialRecords.filter((r) => {
      const g = r.guest;
      if (invoiceFilter !== "tum") {
        const invStatus = g.invoiceStatus || "kesilmedi";
        if (invStatus !== invoiceFilter) return false;
      }
      if (paymentFilter !== "tum") {
        if (g.paymentStatus !== paymentFilter) return false;
      }
      if (onlyErrorsFilter && !r.hasAnyWarning) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const nameMatch = g.name.toLowerCase().includes(q);
        const compMatch = (g.company || "").toLowerCase().includes(q);
        const taxNumMatch = (g.taxNumber || "").toLowerCase().includes(q);
        const invNoMatch = (g.invoiceNo || "").toLowerCase().includes(q);
        const repMatch = (g.representative || "").toLowerCase().includes(q);
        if (!nameMatch && !compMatch && !taxNumMatch && !invNoMatch && !repMatch) return false;
      }
      return true;
    });
  }, [financialRecords, invoiceFilter, paymentFilter, onlyErrorsFilter, search]);

  // ── 1) EXCEL / CSV İNDİRME FONKSİYONU (Türkçe Excel Uyumlu BOM'lu UTF-8) ──
  function handleDownloadCSV() {
    const headers = [
      "Sıra",
      "Kayıt No",
      "Fatura Durumu",
      "Fatura No",
      "Fatura Tarihi",
      "Konuk Adı",
      "Firma Unvanı",
      "VKN / TCKN",
      "Vergi Dairesi",
      "Fatura E-Posta",
      "Telefon",
      "KDV Modeli",
      "Net Matrah (TL)",
      "KDV %20 (TL)",
      "Toplam Tutar (TL)",
      "Tahsilat Durumu",
      "Tahsil Edilen (TL)",
      "Kalan Bakiye (TL)",
      "Temsilci",
      "Pazarlamacı",
      "Çekim Tarihi",
    ];

    const rows = filteredRecords.map((r, idx) => {
      const g = r.guest;
      return [
        idx + 1,
        g.registrationNo || "-",
        g.invoiceStatus === "kesildi" ? "Kesildi" : g.invoiceStatus === "muaf" ? "Muaf" : "Kesilmedi / Bekliyor",
        g.invoiceNo || "-",
        g.invoiceDate || "-",
        `"${g.name.replace(/"/g, '""')}"`,
        `"${(g.taxTitle || g.company || "").replace(/"/g, '""')}"`,
        `"${g.taxNumber || "-"}"`,
        `"${g.taxOffice || "-"}"`,
        `"${g.invoiceEmail || "-"}"`,
        `"${g.phone || "-"}"`,
        r.kdvTipi === "dahil" ? "KDV Dahil" : "KDV Hariç +%20",
        r.netMatrah,
        r.kdvTutari,
        r.toplamTutar,
        g.paymentStatus === "tamamlandi" ? "Tamamı Tahsil Edildi" : g.paymentStatus === "on_odeme" ? "Ön Ödeme" : "Ödenmedi",
        r.collected,
        r.remaining,
        `"${g.representative || "-"}"`,
        `"${g.marketer || "-"}"`,
        `"${g.appointmentDate || "-"}"`,
      ].join(";");
    });

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `BCT_OS_Muhasebe_Icmali_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setFeedback("✓ Muhasebe icmal listesi Excel / CSV formatında başarıyla indirildi!");
    setTimeout(() => setFeedback(null), 4000);
  }

  // ── 2) JSON YEDEK İNDİRME ──
  function handleDownloadJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(financialRecords, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `bct_os_muhasebe_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setFeedback("✓ Muhasebe verisi JSON yedeği olarak indirildi.");
    setTimeout(() => setFeedback(null), 4000);
  }

  // ── 3) A4 YAZDIR / PDF ÇIKTISI ──
  function handlePrint() {
    window.print();
  }

  // ── Fatura Kesme İşlemini Onayla ──
  function handleSaveInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!invoiceModalGuest) return;
    if (!invoiceNoInput.trim()) {
      alert("Lütfen resmi fatura / e-arşiv numarasını giriniz.");
      return;
    }

    updateGuestInvoiceStatus(
      invoiceModalGuest.id,
      "kesildi",
      invoiceNoInput.trim().toUpperCase(),
      invoiceDateInput || new Date().toLocaleDateString("tr-TR")
    );

    setFeedback(`✓ ${invoiceModalGuest.name} için ${invoiceNoInput} nolu resmi fatura kesildi olarak kaydedildi!`);
    setInvoiceModalGuest(null);
    setInvoiceNoInput("");
    setInvoiceDateInput("");
    setTimeout(() => setFeedback(null), 4000);
  }

  // ── Tahsilat Alma İşlemini Onayla ──
  function handleSavePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentModalGuest) return;
    if (newCollectionAmount <= 0) {
      alert("Lütfen geçerli bir tahsilat miktarı giriniz.");
      return;
    }

    const currentRecord = financialRecords.find((r) => r.guest.id === paymentModalGuest.id);
    const prevCollected = currentRecord ? currentRecord.collected : 0;
    const totalDue = currentRecord ? currentRecord.toplamTutar : 0;
    const newTotalCollected = prevCollected + newCollectionAmount;

    let newStatus: "tamamlandi" | "on_odeme" = "on_odeme";
    if (newTotalCollected >= totalDue) {
      newStatus = "tamamlandi";
    }

    updateGuestPayment(
      paymentModalGuest.id,
      newStatus,
      newTotalCollected,
      `${paymentMethod.toUpperCase()} ile ₺${newCollectionAmount.toLocaleString("tr-TR")} tahsilat yapıldı.${paymentNote ? ` Not: ${paymentNote}` : ""}`
    );

    setFeedback(`✓ ₺${newCollectionAmount.toLocaleString("tr-TR")} tutarındaki tahsilat başarıyla kaydedildi!`);
    setPaymentModalGuest(null);
    setNewCollectionAmount(0);
    setPaymentNote("");
    setTimeout(() => setFeedback(null), 4000);
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* ── Üst Başlık & Hızlı İndirme Butonları ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Muhasebe &amp; Finans Yönetimi
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Mali İcmal &amp; Sıfır Hata Masası
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Tüm konukların KDV (%20) matrahları, faturalandırma durumları, tahsilat icmalleri ve resmi muhasebe raporları.
          </p>
        </div>

        {/* İndirme & Dışa Aktarma Butonları */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Excel / CSV İndir */}
          <button
            onClick={handleDownloadCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            title="Luca, Logo, Zirve ve Excel uyumlu CSV tablosu indir"
          >
            <span className="material-symbols-outlined text-[17px]">download</span>
            <span>Excel / CSV İndir</span>
          </button>

          {/* A4 Yazdır / PDF */}
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            title="A4 Resmi Mali İcmal Raporu Yazdır"
          >
            <span className="material-symbols-outlined text-[17px]">print</span>
            <span>A4 İcmal Yazdır</span>
          </button>

          {/* JSON Yedek */}
          <button
            onClick={handleDownloadJSON}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
            title="Tüm Finans Verisini JSON Olarak Yedekle"
          >
            <span className="material-symbols-outlined text-[17px]">data_object</span>
            <span>JSON</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">✕</button>
        </div>
      )}

      {/* ── SIFIR HATA (ZERO-ERROR) KRİTİK UYARI ŞERİDİ ── */}
      {criticalWarningsCount > 0 && (
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 text-2xl shrink-0 mt-0.5 animate-bounce">
              warning
            </span>
            <div>
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Mali Dikkat &amp; Hata Önleme Bildirimi ({criticalWarningsCount} Kayıt)
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Ödemesi tahsil edildiği halde henüz resmi e-arşiv faturası kesilmemiş veya vergi kimlik numarası (VKN) eksik satışlar tespit edildi.
              </p>
            </div>
          </div>
          <button
            onClick={() => setOnlyErrorsFilter(!onlyErrorsFilter)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              onlyErrorsFilter
                ? "bg-amber-800 text-white shadow-xs"
                : "bg-amber-200/80 hover:bg-amber-300 text-amber-950 border border-amber-400"
            }`}
          >
            {onlyErrorsFilter ? "Filtreyi Temizle" : "Sadece Uyarılı Kayıtları Göster →"}
          </button>
        </div>
      )}

      {/* ── KPI FİNANSAL GÖSTERGELER (Yüksek Kontrast & Kolay Okuma) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Toplam Satış Hacmi */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
            Toplam Ciro (KDV Dahil)
          </span>
          <span className="text-lg font-black text-slate-900 font-mono mt-1 block">
            ₺{totalCiro.toLocaleString("tr-TR")}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{financialRecords.length} Konuk / Hizmet</span>
        </div>

        {/* Net Matrah */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
            Net Matrah (KDV Hariç)
          </span>
          <span className="text-lg font-black text-blue-900 font-mono mt-1 block">
            ₺{totalNetMatrah.toLocaleString("tr-TR")}
          </span>
          <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">Gelir Vergisi Matrahı</span>
        </div>

        {/* Tahakkuk Eden KDV (%20) */}
        <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-blue-800 tracking-wider block">
            Tahakkuk Eden KDV (%20)
          </span>
          <span className="text-lg font-black text-blue-700 font-mono mt-1 block">
            ₺{totalKdv.toLocaleString("tr-TR")}
          </span>
          <span className="text-[10px] text-blue-600 font-medium mt-0.5 block">1 No'lu KDV Beyannamesi</span>
        </div>

        {/* Gerçekleşen Tahsilat */}
        <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
            Tahsil Edilen (Kasa/Banka)
          </span>
          <span className="text-lg font-black text-emerald-700 font-mono mt-1 block">
            ₺{totalCollected.toLocaleString("tr-TR")}
          </span>
          <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block">
            %{totalCiro > 0 ? Math.round((totalCollected / totalCiro) * 100) : 0} Gerçekleşme
          </span>
        </div>

        {/* Kalan Açık Bakiye */}
        <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
            Kalan Alacak (Bakiye)
          </span>
          <span className="text-lg font-black text-amber-800 font-mono mt-1 block">
            ₺{totalRemaining.toLocaleString("tr-TR")}
          </span>
          <span className="text-[10px] text-amber-700 font-medium mt-0.5 block">Kısmi / Bekleyen Tahsilat</span>
        </div>

        {/* Fatura Bekleyenler */}
        <div className="bg-purple-50/60 p-3.5 rounded-xl border border-purple-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-purple-800 tracking-wider block">
            Fatura Bekleyen
          </span>
          <span className="text-lg font-black text-purple-900 font-mono mt-1 block">
            {pendingInvoicesCount} <span className="text-xs font-bold text-purple-600">Adet</span>
          </span>
          <span className="text-[10px] text-purple-700 font-medium mt-0.5 block">Düzenlenecek E-Arşiv</span>
        </div>
      </div>

      {/* ── FİLTRELER & ARAMA ÇUBUĞU ── */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Fatura Durumu Sekmeleri */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Fatura:</span>
            {[
              { key: "tum", label: "Tümü" },
              { key: "kesildi", label: "Fatura Kesildi" },
              { key: "kesilmedi", label: "Fatura Bekliyor" },
              { key: "muaf", label: "Muaf / Ücretsiz" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setInvoiceFilter(tab.key as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  invoiceFilter === tab.key
                    ? "bg-emerald-700 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Arama Input */}
          <div className="relative w-full md:w-80">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Konuk, firma, VKN, fatura no veya temsilci ara..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>
        </div>

        {/* Tahsilat Durumu & Sıfır Hata Filtresi */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Tahsilat:</span>
            {[
              { key: "tum", label: "Tümü" },
              { key: "tamamlandi", label: "Tamamı Tahsil Edildi" },
              { key: "on_odeme", label: "Kısmi Ön Ödeme" },
              { key: "odenmedi", label: "Ödenmedi" },
            ].map((pTab) => (
              <button
                key={pTab.key}
                onClick={() => setPaymentFilter(pTab.key as any)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                  paymentFilter === pTab.key
                    ? "bg-slate-800 text-white font-bold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {pTab.label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-900 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200 hover:bg-amber-100 transition">
            <input
              type="checkbox"
              checked={onlyErrorsFilter}
              onChange={(e) => setOnlyErrorsFilter(e.target.checked)}
              className="text-amber-600 rounded"
            />
            <span>Yalnızca Hata / Uyarı Verenleri Göster</span>
          </label>
        </div>
      </div>

      {/* ── BÜYÜK MUHASEBE VE FATURA DEFTERİ (TABLE) ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3">Durum &amp; Fatura No</th>
                <th className="py-3 px-3">Konuk / Firma &amp; VKN</th>
                <th className="py-3 px-3">KDV Tipi</th>
                <th className="py-3 px-3 text-right">Net Matrah</th>
                <th className="py-3 px-3 text-right">KDV (%20)</th>
                <th className="py-3 px-3 text-right">Genel Toplam</th>
                <th className="py-3 px-3">Tahsilat / Kalan</th>
                <th className="py-3 px-3">Temsilci</th>
                <th className="py-3 px-3 text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Seçili filtrelere uygun finansal kayıt bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const g = r.guest;
                  const invStatus = g.invoiceStatus || "kesilmedi";

                  return (
                    <tr
                      key={g.id}
                      className={`hover:bg-slate-50/80 transition ${
                        r.isPaidButUnbilled
                          ? "bg-amber-50/40"
                          : r.hasMissingTaxInfo
                          ? "bg-orange-50/20"
                          : ""
                      }`}
                    >
                      {/* 1. Fatura Durumu ve Fatura No */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block ${
                                invStatus === "kesildi"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : invStatus === "muaf"
                                  ? "bg-slate-100 text-slate-600"
                                  : "bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
                              }`}
                            >
                              {invStatus === "kesildi" ? "✓ Fatura Kesildi" : invStatus === "muaf" ? "Muaf" : "Bekliyor"}
                            </span>
                          </div>

                          {g.invoiceNo ? (
                            <span className="font-mono text-xs font-bold text-slate-900 tracking-tight">
                              {g.invoiceNo}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No atanmadı</span>
                          )}

                          {g.invoiceDate && (
                            <span className="text-[10px] text-slate-500">{g.invoiceDate}</span>
                          )}
                        </div>
                      </td>

                      {/* 2. Konuk & Firma & VKN */}
                      <td className="py-3.5 px-3 max-w-[200px]">
                        <div>
                          <p className="font-bold text-slate-900 truncate">{g.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{g.company || "Şirketsiz"}</p>
                          
                          {/* VKN / Vergi Dairesi Kontrolü */}
                          {g.taxNumber ? (
                            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-700 mt-0.5">
                              <span className="font-semibold text-slate-400">VKN:</span>
                              <span className="font-bold">{g.taxNumber}</span>
                              {g.taxOffice && <span className="text-slate-400">({g.taxOffice})</span>}
                            </div>
                          ) : r.toplamTutar > 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.2 rounded border border-red-200 mt-1">
                              ⚠️ VKN Girilmemiş
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* 3. KDV Tipi */}
                      <td className="py-3.5 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          r.kdvTipi === "dahil"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}>
                          {r.kdvTipi === "dahil" ? "KDV Dahil" : "+%20 Hariç"}
                        </span>
                      </td>

                      {/* 4. Net Matrah */}
                      <td className="py-3.5 px-3 text-right font-mono text-xs font-semibold text-slate-700">
                        ₺{r.netMatrah.toLocaleString("tr-TR")}
                      </td>

                      {/* 5. KDV Tutarı (%20) */}
                      <td className="py-3.5 px-3 text-right font-mono text-xs font-semibold text-blue-700">
                        ₺{r.kdvTutari.toLocaleString("tr-TR")}
                      </td>

                      {/* 6. Genel Toplam */}
                      <td className="py-3.5 px-3 text-right font-mono text-xs font-bold text-slate-900">
                        ₺{r.toplamTutar.toLocaleString("tr-TR")}
                      </td>

                      {/* 7. Tahsilat / Kalan Bakiye */}
                      <td className="py-3.5 px-3">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                g.paymentStatus === "tamamlandi"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : g.paymentStatus === "on_odeme"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {g.paymentStatus === "tamamlandi"
                                ? "Tamamlandı"
                                : g.paymentStatus === "on_odeme"
                                ? "Kısmi Ön Ödeme"
                                : "Ödenmedi"}
                            </span>
                          </div>

                          <div className="text-[11px] font-mono mt-1 space-y-0.5">
                            <span className="text-emerald-700 block">
                              Alınan: <strong>₺{r.collected.toLocaleString("tr-TR")}</strong>
                            </span>
                            {r.remaining > 0 && (
                              <span className="text-amber-800 font-bold block">
                                Kalan: ₺{r.remaining.toLocaleString("tr-TR")}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 8. Temsilci */}
                      <td className="py-3.5 px-3">
                        <span className="text-xs font-medium text-slate-700">
                          {g.representative || "-"}
                        </span>
                        {g.room && (
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {g.room === "oda-1" ? "Oda 1" : g.room === "oda-2" ? "Oda 2" : "Oda 3"}
                          </span>
                        )}
                      </td>

                      {/* 9. Aksiyonlar (Hızlı İşlemler) */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Fatura Kes / Düzenle Butonu */}
                          <button
                            onClick={() => {
                              setInvoiceModalGuest(g);
                              setInvoiceNoInput(g.invoiceNo || `BCT${new Date().getFullYear()}0000${Math.floor(100 + Math.random() * 900)}`);
                              setInvoiceDateInput(g.invoiceDate || new Date().toLocaleDateString("tr-TR"));
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                              invStatus === "kesildi"
                                ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                            }`}
                            title="Resmi Fatura No Gir ve Kesildi İşaretle"
                          >
                            <span className="material-symbols-outlined text-[15px]">receipt_long</span>
                            <span>{invStatus === "kesildi" ? "Düzenle" : "Fatura Kes"}</span>
                          </button>

                          {/* Tahsilat Al Butonu */}
                          {r.remaining > 0 && (
                            <button
                              onClick={() => {
                                setPaymentModalGuest(g);
                                setNewCollectionAmount(r.remaining);
                                setPaymentMethod("havale");
                                setPaymentNote("");
                              }}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                              title="Kalan Bakiyeden Tahsilat Al"
                            >
                              <span className="material-symbols-outlined text-[15px]">add_card</span>
                              <span>Tahsilat</span>
                            </button>
                          )}

                          {/* Makbuz / İcmal Görüntüle */}
                          <button
                            onClick={() => setReceiptGuest(g)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition cursor-pointer"
                            title="Resmi Fatura / Makbuz Detayı"
                          >
                            <span className="material-symbols-outlined text-[17px]">visibility</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── FATURA KESME / DÜZENLEME MODALI ── */}
      {invoiceModalGuest && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => { if (e.target === e.currentTarget) setInvoiceModalGuest(null); }}
        >
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-emerald-50/70 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-emerald-950 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-600">receipt</span>
                  <span>Resmi Fatura Bilgisi Gir</span>
                </h3>
                <p className="text-xs text-slate-500">{invoiceModalGuest.name} ({invoiceModalGuest.company || "Şahıs"})</p>
              </div>
              <button onClick={() => setInvoiceModalGuest(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleSaveInvoice} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Resmi Fatura / E-Arşiv Numarası *
                </label>
                <input
                  type="text"
                  value={invoiceNoInput}
                  onChange={(e) => setInvoiceNoInput(e.target.value)}
                  placeholder="Örn: BCT202600000412"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fatura Kesim Tarihi
                </label>
                <input
                  type="text"
                  value={invoiceDateInput}
                  onChange={(e) => setInvoiceDateInput(e.target.value)}
                  placeholder="GG.AA.YYYY"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Fatura Unvanı:</span>
                  <span className="font-semibold text-slate-900">{invoiceModalGuest.taxTitle || invoiceModalGuest.company}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">VKN / TCKN:</span>
                  <span className="font-mono font-bold text-slate-900">{invoiceModalGuest.taxNumber || "Girilmemiş"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vergi Dairesi:</span>
                  <span className="font-semibold text-slate-900">{invoiceModalGuest.taxOffice || "Girilmemiş"}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInvoiceModalGuest(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  Faturayı Kaydet ve Bildir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TAHSİLAT ALMA MODALI ── */}
      {paymentModalGuest && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => { if (e.target === e.currentTarget) setPaymentModalGuest(null); }}
        >
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-blue-50/70 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-blue-950 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-blue-600">payments</span>
                  <span>Tahsilat Kaydı Al</span>
                </h3>
                <p className="text-xs text-slate-500">{paymentModalGuest.name} ({paymentModalGuest.company || "Şahıs"})</p>
              </div>
              <button onClick={() => setPaymentModalGuest(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleSavePayment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tahsil Edilen Miktar (TL) *
                </label>
                <input
                  type="number"
                  min={1}
                  value={newCollectionAmount}
                  onChange={(e) => setNewCollectionAmount(Number(e.target.value))}
                  className="w-full text-base p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono font-bold text-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ödeme Yöntemi
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold text-slate-800"
                >
                  <option value="havale">Banka Havalesi / EFT</option>
                  <option value="kredi_karti">Kredi Kartı / POS</option>
                  <option value="nakit">Nakit Tahsilat</option>
                  <option value="cek">Çek / Senet</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tahsilat Açıklaması / Dekont Notu
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Örn: Garanti BBVA dekont no: 849201"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalGuest(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  Tahsilatı Onayla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── RESMİ MAKBUZ / FATURA İCMALİ ÖNİZLEME MODALI ── */}
      {receiptGuest && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => { if (e.target === e.currentTarget) setReceiptGuest(null); }}
        >
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">BCT-OS MALİ İCMAL FİŞİ</span>
                <h3 className="font-bold text-base text-slate-900">{receiptGuest.name}</h3>
              </div>
              <button onClick={() => setReceiptGuest(null)} className="text-slate-400 hover:text-slate-700 font-bold p-1">✕</button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto font-sans text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Firma / Unvan</span>
                  <span className="font-semibold text-slate-800">{receiptGuest.taxTitle || receiptGuest.company}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">VKN / TCKN</span>
                  <span className="font-mono font-bold text-slate-800">{receiptGuest.taxNumber || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Vergi Dairesi</span>
                  <span className="font-semibold text-slate-800">{receiptGuest.taxOffice || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Fatura No</span>
                  <span className="font-mono font-bold text-emerald-700">{receiptGuest.invoiceNo || "Fatura Kesilmedi"}</span>
                </div>
              </div>

              {/* Hizmetler Tablosu */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase">
                    <tr>
                      <th className="p-2">Hizmet Tanımı</th>
                      <th className="p-2 text-right">Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(receiptGuest.services || []).map((s, idx) => (
                      <tr key={idx}>
                        <td className="p-2 capitalize">{s.type.replace("_", " ")}</td>
                        <td className="p-2 text-right font-mono">₺{s.price.toLocaleString("tr-TR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Matrah & KDV Özeti */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">KDV Modeli:</span>
                  <span className="font-bold text-slate-800">
                    {receiptGuest.kdvTipi === "dahil" ? "KDV Dahil (%20)" : "KDV Hariç (+%20)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Net Matrah:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    ₺{(receiptGuest.netTutar || 0).toLocaleString("tr-TR")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">KDV (%20):</span>
                  <span className="font-mono font-semibold text-blue-700">
                    ₺{(receiptGuest.kdvTutari || 0).toLocaleString("tr-TR")}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-200">
                  <span className="text-slate-900">Genel Toplam:</span>
                  <span className="font-mono text-emerald-700">
                    ₺{(receiptGuest.toplamTutarKdvli || 0).toLocaleString("tr-TR")}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setReceiptGuest(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
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
