"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/lib/useStore";
import {
  updateGuest,
  addServiceToGuest,
  removeServiceFromGuest,
  addNotification,
  type ServiceType,
  type ServiceDetail,
  type Service,
} from "@/lib/store";
import StudioDelayBanner from "@/components/StudioDelayBanner";

const SERVICE_TEMPLATES: {
  type: ServiceType;
  label: string;
  icon: string;
  color: string;
  detailOptions: string[];
}[] = [
  {
    type: "dergi",
    label: "Basılı Dergi",
    icon: "menu_book",
    color: "blue",
    detailOptions: [
      "Ön Kapak",
      "Arka Kapak",
      "İç Kapak",
      "1 Sayfa Röportaj",
      "2 Sayfa Röportaj",
      "4 Sayfa Röportaj",
      "6 Sayfa Röportaj",
      "Özel Dosya Eki",
    ],
  },
  {
    type: "haber_sitesi",
    label: "Haber Sitesi Yayını",
    icon: "newspaper",
    color: "emerald",
    detailOptions: [
      "Ulusal Basın Dağıtım",
      "Google News İndeksleme",
      "Ekonomi & İş Dünyası Portalları",
      "Bölgesel Basın Ağı",
    ],
  },
  {
    type: "sosyal_medya",
    label: "Sosyal Medya",
    icon: "share",
    color: "violet",
    detailOptions: [
      "Instagram Reels",
      "YouTube Shorts",
      "TikTok Videosu",
      "LinkedIn Kesit & Post",
      "Fotoğraf & Grafik Tasarım",
    ],
  },
  {
    type: "video",
    label: "Video & Arşiv",
    icon: "videocam",
    color: "amber",
    detailOptions: [
      "VIP Kalıcı Video",
      "4K YouTube Master Arşiv",
      "Sosyal Medya Yayın Hakları",
      "Kısa Tanıtım Teaser'ı",
    ],
  },
  {
    type: "ek_hizmet",
    label: "Özel Ek Hizmet",
    icon: "add_circle",
    color: "slate",
    detailOptions: [],
  },
];

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; badgeBg: string }> = {
  blue: { bg: "bg-blue-50/40", border: "border-blue-200", text: "text-blue-700", badgeBg: "bg-blue-100" },
  emerald: { bg: "bg-emerald-50/40", border: "border-emerald-200", text: "text-emerald-700", badgeBg: "bg-emerald-100" },
  violet: { bg: "bg-violet-50/40", border: "border-violet-200", text: "text-violet-700", badgeBg: "bg-violet-100" },
  amber: { bg: "bg-amber-50/40", border: "border-amber-200", text: "text-amber-700", badgeBg: "bg-amber-100" },
  slate: { bg: "bg-slate-50/40", border: "border-slate-200", text: "text-slate-700", badgeBg: "bg-slate-100" },
};

export default function PazarlamaPage() {
  const { guests, canAccessPage, isSensitiveBlurred, activeRoleDef, hasPermission } = useStore();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Hizmet Ekleme Modal Durumu
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [newServiceType, setNewServiceType] = useState<ServiceType>("dergi");
  const [newServiceDetails, setNewServiceDetails] = useState<ServiceDetail[]>([]);
  const [newServiceQuantity, setNewServiceQuantity] = useState(1);
  const [newServicePrice, setNewServicePrice] = useState(15000);
  const [newServiceNote, setNewServiceNote] = useState("");
  const [customPageCount, setCustomPageCount] = useState("");

  // Finans & KDV Durumu
  const [paymentStatus, setPaymentStatus] = useState<"odenmedi" | "on_odeme" | "tamamlandi" | "ucretsiz">("odenmedi");
  const [onOdemeMiktari, setOnOdemeMiktari] = useState<number>(0);
  const [kdvTipi, setKdvTipi] = useState<"dahil" | "haric">("dahil");
  const [invoiceType, setInvoiceType] = useState<"kurumsal" | "bireysel">("kurumsal");
  const [taxTitle, setTaxTitle] = useState("");
  const [taxOffice, setTaxOffice] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [invoiceEmail, setInvoiceEmail] = useState("");
  const [invoiceAddress, setInvoiceAddress] = useState("");
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);

  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const q = search.toLowerCase();
      const match = g.name.toLowerCase().includes(q) || g.company.toLowerCase().includes(q);
      return match && g.status !== "archived";
    });
  }, [guests, search]);

  const activeGuest = useMemo(() => {
    if (selectedId) {
      const found = guests.find((g) => g.id === selectedId);
      if (found) return found;
    }
    return filteredGuests[0] || guests[0] || null;
  }, [guests, selectedId, filteredGuests]);

  function handleSelectGuest(id: string) {
    setSelectedId(id);
    const g = guests.find((item) => item.id === id);
    if (g) {
      setPaymentStatus(g.paymentStatus || "odenmedi");
      setOnOdemeMiktari(g.onOdemeMiktari || 0);
      setKdvTipi(g.kdvTipi || "dahil");
      setInvoiceType(g.invoiceType || "kurumsal");
      setTaxTitle(g.taxTitle || g.company || "");
      setTaxOffice(g.taxOffice || "");
      setTaxNumber(g.taxNumber || "");
      setInvoiceEmail(g.invoiceEmail || "");
      setInvoiceAddress(g.invoiceAddress || "");
    }
  }

  function openServiceModal() {
    setNewServiceType("dergi");
    const tmpl = SERVICE_TEMPLATES.find((t) => t.type === "dergi");
    setNewServiceDetails(tmpl?.detailOptions.map((d) => ({ label: d, checked: false })) || []);
    setNewServiceQuantity(1);
    setNewServicePrice(15000);
    setNewServiceNote("");
    setCustomPageCount("");
    setShowServiceModal(true);
  }

  function handleAddService() {
    if (!activeGuest) return;

    let finalDetails = newServiceDetails.filter((d) => d.checked);

    // Dergi için özel sayfa sayısı girildiyse
    if (newServiceType === "dergi" && customPageCount.trim()) {
      finalDetails.push({ label: `${customPageCount.trim()} Sayfa Röportaj`, checked: true });
    }

    // Ek hizmet serbest metin
    if (newServiceType === "ek_hizmet" && newServiceNote.trim()) {
      finalDetails = [{ label: newServiceNote.trim(), checked: true }];
    }

    addServiceToGuest(activeGuest.id, {
      type: newServiceType,
      details: finalDetails,
      quantity: newServiceQuantity,
      price: newServicePrice,
      customNote: newServiceNote || undefined,
    });

    setShowServiceModal(false);
    setFeedback(`✓ ${activeGuest.name} için yeni hizmet eklendi.`);
    setTimeout(() => setFeedback(null), 3000);
  }

  function handleRemoveService(serviceId: string) {
    if (!activeGuest) return;
    removeServiceFromGuest(activeGuest.id, serviceId);
  }

  function handleSaveAndSendToEdit() {
    if (!activeGuest) return;

    const basePrice = activeGuest.services.reduce((sum, s) => sum + s.price, 0);

    let finalNetMatrah = basePrice;
    let finalKdvTutari = 0;
    let finalToplamKdvli = basePrice;

    if (kdvTipi === "dahil") {
      finalNetMatrah = Math.round(basePrice / 1.20);
      finalKdvTutari = basePrice - finalNetMatrah;
      finalToplamKdvli = basePrice;
    } else {
      finalNetMatrah = basePrice;
      finalKdvTutari = Math.round(basePrice * 0.20);
      finalToplamKdvli = basePrice + finalKdvTutari;
    }

    updateGuest(activeGuest.id, {
      amount: finalToplamKdvli.toLocaleString("tr-TR"),
      paymentStatus,
      onOdemeMiktari: paymentStatus === "on_odeme" ? onOdemeMiktari : 0,
      vip: finalToplamKdvli > 0,
      status: "package_set",
      kdvTipi,
      kdvOrani: 20,
      netTutar: finalNetMatrah,
      kdvTutari: finalKdvTutari,
      toplamTutarKdvli: finalToplamKdvli,
      invoiceType,
      taxTitle: taxTitle.trim() || activeGuest.company,
      taxOffice: taxOffice.trim(),
      taxNumber: taxNumber.trim(),
      invoiceEmail: invoiceEmail.trim(),
      invoiceAddress: invoiceAddress.trim(),
      invoiceStatus: activeGuest.invoiceStatus || "kesilmedi",
    });

    // 1) Kurgu / Montaj Ekibine Bildirim
    addNotification({
      to: "kurgu",
      from: "pazarlama",
      type: "task",
      title: `🎬 Paket Tanımlandı: ${activeGuest.name}`,
      message: `${activeGuest.name} (${activeGuest.company}) için ${activeGuest.services.length} adet hizmet tanımlandı (${finalToplamKdvli.toLocaleString("tr-TR")} TL). Montaj kuyruğunda kurguya hazır.`,
      link: "/dashboard/montaj",
    });

    // 2) Temsilciye Satış Başarısı Bildirimi
    if (activeGuest.representative) {
      addNotification({
        to: activeGuest.representative,
        from: "pazarlama",
        type: "success",
        title: `🎉 Tebrikler! Satış Kaydedildi: ${activeGuest.name}`,
        message: `Davet ettiğiniz konuğunuz ${activeGuest.name} için ${finalToplamKdvli.toLocaleString("tr-TR")} TL değerinde paket satışı tamamlandı.`,
        link: "/dashboard/odalar",
      });
    }

    // 3) Basılı Dergi Ekibine Bildirim (Eğer dergi hizmeti varsa)
    const hasDergi = activeGuest.services.some((s) => s.type === "dergi");
    if (hasDergi) {
      addNotification({
        to: "dergi_tasarimci",
        from: "pazarlama",
        type: "task",
        title: `📖 Dergi Sayfa Siparişi: ${activeGuest.name}`,
        message: `${activeGuest.name} (${activeGuest.company}) için basılı dergi röportaj sayfası siparişi oluşturuldu.`,
        link: "/dashboard/yonetim",
      });
    }

    // 4) Ek Hizmetler / Basın Dağıtım Ekibine Bildirim
    const hasEkHizmet = activeGuest.services.some((s) => s.type === "haber_sitesi" || s.type === "sosyal_medya");
    if (hasEkHizmet) {
      addNotification({
        to: "ek_hizmetler",
        from: "pazarlama",
        type: "task",
        title: `🌐 Dijital Dağıtım Siparişi: ${activeGuest.name}`,
        message: `${activeGuest.name} için haber sitesi / sosyal medya dijital dağıtım kaydı işleme alındı.`,
        link: "/dashboard/yonetim",
      });
    }

    // 5) Muhasebe ve Finans Departmanına Bildirim (KDV Dahil / Hariç detayıyla)
    addNotification({
      to: "muhasebe",
      from: "pazarlama",
      type: "info",
      title: `🧾 Yeni Fatura & Satış Talebi: ${activeGuest.name}`,
      message: `${activeGuest.company} - ${finalToplamKdvli.toLocaleString("tr-TR")} TL (${kdvTipi === "dahil" ? "KDV Dahil" : "KDV Hariç +%20"}). Matrah: ${finalNetMatrah.toLocaleString("tr-TR")} TL, KDV: ${finalKdvTutari.toLocaleString("tr-TR")} TL.`,
      link: "/dashboard/muhasebe",
    });

    // 6) Yönetim ve Genel Sistem
    addNotification({
      to: "yonetim",
      from: "pazarlama",
      type: "info",
      title: `💼 Yeni Satış Sözleşmesi: ${activeGuest.name}`,
      message: `${activeGuest.company} - ${finalToplamKdvli.toLocaleString("tr-TR")} TL (${paymentStatus === "on_odeme" ? `Ön Ödeme: ${onOdemeMiktari.toLocaleString("tr-TR")} TL` : paymentStatus}) onaylandı.`,
      link: "/dashboard/yonetim",
    });

    setFeedback(`✓ ${activeGuest.name} paketi, KDV modeli (${kdvTipi === "dahil" ? "KDV Dahil" : "KDV Hariç"}) ve fatura bilgisi kaydedildi!`);
    setTimeout(() => setFeedback(null), 4000);
  }

  function getServiceTemplate(type: ServiceType) {
    return SERVICE_TEMPLATES.find((t) => t.type === type) || SERVICE_TEMPLATES[0];
  }

  const selectedTemplate = getServiceTemplate(newServiceType);
  const baseServiceTotal = activeGuest ? activeGuest.services.reduce((sum, s) => sum + s.price, 0) : 0;
  const netMatrah = kdvTipi === "dahil" ? Math.round(baseServiceTotal / 1.20) : baseServiceTotal;
  const kdvTutari = kdvTipi === "dahil" ? baseServiceTotal - netMatrah : Math.round(baseServiceTotal * 0.20);
  const totalBill = kdvTipi === "dahil" ? baseServiceTotal : baseServiceTotal + kdvTutari;
  const remainingBill = Math.max(0, totalBill - (paymentStatus === "on_odeme" ? onOdemeMiktari : paymentStatus === "tamamlandi" ? totalBill : 0));

  if (!canAccessPage("/dashboard/pazarlama")) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs max-w-xl mx-auto my-12 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-3xl border border-amber-200 shadow-inner">
          🔒
        </div>
        <h2 className="text-lg font-bold text-slate-900">Erişim Yetkiniz Bulunmuyor</h2>
        <p className="text-xs text-slate-500">
          Mevcut rolünüz ({activeRoleDef?.label || "Rolünüz"}) Pazarlama Masası modülünü görüntüleme yetkisine sahip değildir.
        </p>
        <Link href="/dashboard" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition">
          Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full max-w-[1560px] mx-auto pb-12">
      {/* Top Context Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span>
            <h1 className="text-xl font-bold text-[#0F172A]">Pazarlama Masası</h1>
          </div>
          <span className="text-slate-400 text-sm">/</span>
          <p className="text-sm text-slate-600">Esnek hizmet tanımlama, ön ödeme ve satış sözleşmesi</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/odalar"
            className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition flex items-center gap-1.5"
          >
            <span>📊</span> Pazarlamacı Başarı &amp; Satış Tablosu →
          </Link>
          <span className="text-xs text-slate-500 font-medium bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
            ★ Canlı Yayın Tüm Konuklar İçin Ücretsizdir
          </span>
        </div>
      </div>

      {/* ── STÜDYO SARKMA / GECİKME UYARI BANNER'I ── */}
      <div className="mt-4">
        <StudioDelayBanner />
      </div>

      {feedback && (
        <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fade-in">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">✕</button>
        </div>
      )}

      {/* Main Grid: Left List (35%), Right Workstation (65%) */}
      <div className="grid grid-cols-12 gap-6 mt-6 items-start">
        {/* LEFT: Guest Queue */}
        <section className="col-span-12 lg:col-span-4 bg-white rounded-xl shadow-xs border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Konuk Sırası ({filteredGuests.length})
              </span>
              <span className="text-xs text-blue-600 font-medium">Tüm Odalar</span>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                search
              </span>
              <input
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB]"
                placeholder="Konuk veya firma ara..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
            {filteredGuests.map((g) => {
              const isSelected = activeGuest?.id === g.id;
              const serviceCount = g.services.length;

              return (
                <article
                  key={g.id}
                  onClick={() => handleSelectGuest(g.id)}
                  className={`p-3.5 cursor-pointer transition-all ${
                    isSelected
                      ? "bg-blue-50/70 border-l-4 border-l-[#2563EB]"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#0F172A] truncate">{g.name}</span>
                        {Boolean(g.services && g.services.length > 0 && g.services.some(s => s.price > 0)) && (
                          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                            VIP
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {g.company} • {g.title}
                      </p>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-[#0F172A]">
                      ₺{((g.services || []).reduce((sum, s) => sum + (s.price || 0), 0)).toLocaleString("tr-TR")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <span>{g.shootTime}</span>
                      <span>•</span>
                      <span className="text-blue-600 font-medium">{serviceCount} Hizmet</span>
                      {g.kdvTipi && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          g.kdvTipi === "dahil" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}>
                          {g.kdvTipi === "dahil" ? "KDV Dahil" : "+%20 KDV"}
                        </span>
                      )}
                    </div>

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
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* RIGHT: Hizmet Tanımlama Masası */}
        {activeGuest ? (
          <main className="col-span-12 lg:col-span-8 bg-white rounded-xl shadow-xs p-6 flex flex-col border border-slate-200 gap-6">
            <header className="pb-4 border-b border-slate-200">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-[#0F172A]">{activeGuest.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {activeGuest.room === "oda-1" ? "Oda 1 (Ayşe Yılmaz)" : activeGuest.room === "oda-2" ? "Oda 2 (Caner Kaya)" : "Oda 3"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    {activeGuest.company} — {activeGuest.title} • Çekim: {activeGuest.shootTime} • Kayıt No: <strong className="font-mono text-slate-800">{activeGuest.registrationNo}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={openServiceModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs cursor-pointer"
                  >
                    <span className="text-sm font-bold">+</span> Hizmet Ekle
                  </button>
                </div>
              </div>
            </header>

            {/* Tanımlı Hizmetler Listesi */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">
                  Tanımlanan Hizmetler ({activeGuest.services.length})
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  Toplam Satış: <strong className="text-base text-slate-900 font-bold">₺{totalBill.toLocaleString("tr-TR")}</strong>
                </span>
              </div>

              {activeGuest.services.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <p className="text-xs text-slate-400 font-medium">Bu konuk için henüz hizmet tanımlanmadı. Sabit paket yok, "Hizmet Ekle" ile dilediğiniz dergi, haber sitesi veya ek hizmeti ekleyin.</p>
                  <button
                    onClick={openServiceModal}
                    className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  >
                    + Şimdi Hizmet Ekle
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeGuest.services.map((svc) => {
                    const template = getServiceTemplate(svc.type);
                    const colors = COLOR_MAP[template.color] || COLOR_MAP.slate;

                    return (
                      <div
                        key={svc.id}
                        className={`p-4 rounded-xl border ${colors.border} ${colors.bg} flex items-start justify-between gap-3 transition-all hover:shadow-xs`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-lg ${colors.badgeBg} ${colors.text} flex items-center justify-center shrink-0`}>
                            <span className="material-symbols-outlined text-lg">{template.icon}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-[#0F172A]">{template.label}</span>
                              {svc.quantity && svc.quantity > 1 && (
                                <span className={`text-[11px] px-2 py-0.5 rounded ${colors.badgeBg} ${colors.text} font-bold`}>
                                  ×{svc.quantity} Adet
                                </span>
                              )}
                              <span className="text-sm font-bold text-slate-900 font-mono ml-auto">
                                {svc.price > 0 ? `₺${svc.price.toLocaleString("tr-TR")}` : "Ücretsiz"}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {svc.details.filter((d) => d.checked).map((d, i) => (
                                <span key={i} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-medium">
                                  <span className="text-emerald-500 font-bold">✓</span>
                                  {d.label}
                                </span>
                              ))}
                              {svc.customNote && (
                                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 italic">
                                  {svc.customNote}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveService(svc.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition cursor-pointer shrink-0"
                          title="Hizmeti Kaldır"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Finans, KDV & Fatura Yönetimi */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[17px] text-blue-600">receipt_long</span>
                    Fiyat, KDV &amp; Fatura Yönetimi
                  </h4>
                  <p className="text-xs text-slate-500">KDV modelini belirleyin, muhasebe için fatura bilgilerini eksiksiz kaydedin</p>
                </div>

                {/* KDV Dahil / Hariç Menüsü */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setKdvTipi("dahil")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      kdvTipi === "dahil"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    KDV Dahil (%20)
                  </button>
                  <button
                    type="button"
                    onClick={() => setKdvTipi("haric")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      kdvTipi === "haric"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    KDV Hariç (+%20)
                  </button>
                </div>
              </div>

              {/* Live KDV Breakdown Bar */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs font-mono text-center">
                <div className="border-r border-slate-100 pr-2">
                  <span className="text-[10px] uppercase font-sans text-slate-400 font-semibold block">Net Matrah</span>
                  <span className="text-xs font-bold text-slate-700">₺{netMatrah.toLocaleString("tr-TR")}</span>
                </div>
                <div className="border-r border-slate-100 px-2">
                  <span className="text-[10px] uppercase font-sans text-slate-400 font-semibold block">KDV (%20)</span>
                  <span className="text-xs font-bold text-blue-600">₺{kdvTutari.toLocaleString("tr-TR")}</span>
                </div>
                <div className="pl-2">
                  <span className="text-[10px] uppercase font-sans text-slate-400 font-semibold block">Genel Toplam</span>
                  <span className="text-sm font-bold text-emerald-700">₺{totalBill.toLocaleString("tr-TR")}</span>
                </div>
              </div>

              {/* Tahsilat Durumu & Ön Ödeme */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tahsilat Modeli
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="odenmedi">Ödeme Alınmadı / Beklemede</option>
                    <option value="on_odeme">Ön Ödeme Alındı (Kısmi)</option>
                    <option value="tamamlandi">Tamamı Tahsil Edildi</option>
                    <option value="ucretsiz">Ücretsiz / Sponsorluk</option>
                  </select>
                </div>

                {paymentStatus === "on_odeme" ? (
                  <div>
                    <label className="block text-xs font-semibold text-blue-700 mb-1.5">
                      Alınan Ön Ödeme Tutarı (₺)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">₺</span>
                      <input
                        type="number"
                        min={0}
                        step={500}
                        placeholder="Örn: 20000"
                        value={onOdemeMiktari || ""}
                        onChange={(e) => setOnOdemeMiktari(parseInt(e.target.value) || 0)}
                        className="w-full pl-8 pr-3 py-2 text-xs bg-white border-2 border-blue-400 rounded-lg font-bold font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Kalan Tahsilat: <strong className="text-amber-700 font-mono">₺{remainingBill.toLocaleString("tr-TR")}</strong>
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center text-xs text-slate-500 pt-5">
                    {paymentStatus === "tamamlandi" && <span className="text-emerald-600 font-semibold">✓ Tutarın tamamı tahsil edilmiştir.</span>}
                    {paymentStatus === "ucretsiz" && <span className="text-slate-500">Konuk çekim ve yayını ücretsiz olarak tanımlanmıştır.</span>}
                    {paymentStatus === "odenmedi" && <span className="text-amber-700 font-semibold">⚠️ Henüz herhangi bir ödeme alınmamıştır.</span>}
                  </div>
                )}
              </div>

              {/* Kurumsal / Bireysel Fatura Bilgileri (Muhasebecinin işini sıfır hataya indiren bölüm) */}
              <div className="pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowInvoiceDetails(!showInvoiceDetails)}
                  className="flex items-center justify-between w-full py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">domain</span>
                    <span>Resmi Fatura &amp; VKN / TC Bilgileri</span>
                    {taxTitle && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold font-mono">
                        Dolu
                      </span>
                    )}
                  </span>
                  <span className="material-symbols-outlined text-[18px]">
                    {showInvoiceDetails ? "expand_less" : "expand_more"}
                  </span>
                </button>

                {showInvoiceDetails && (
                  <div className="mt-3 p-3.5 bg-white border border-slate-200 rounded-xl space-y-3 animate-fadeIn">
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-700">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="invType"
                          checked={invoiceType === "kurumsal"}
                          onChange={() => setInvoiceType("kurumsal")}
                          className="text-blue-600"
                        />
                        <span>Kurumsal (Firma / Şirket)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="invType"
                          checked={invoiceType === "bireysel"}
                          onChange={() => setInvoiceType("bireysel")}
                          className="text-blue-600"
                        />
                        <span>Bireysel (Şahıs / TC)</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          {invoiceType === "kurumsal" ? "Fatura Unvanı" : "Ad Soyad"}
                        </label>
                        <input
                          type="text"
                          value={taxTitle}
                          onChange={(e) => setTaxTitle(e.target.value)}
                          placeholder={activeGuest.company || "Firma veya Şahıs Unvanı"}
                          className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          {invoiceType === "kurumsal" ? "Vergi Kimlik No (VKN)" : "T.C. Kimlik No"}
                        </label>
                        <input
                          type="text"
                          value={taxNumber}
                          onChange={(e) => setTaxNumber(e.target.value)}
                          placeholder={invoiceType === "kurumsal" ? "10 haneli VKN" : "11 haneli TCKN"}
                          className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Vergi Dairesi</label>
                        <input
                          type="text"
                          value={taxOffice}
                          onChange={(e) => setTaxOffice(e.target.value)}
                          placeholder="Örn: Maslak V.D."
                          className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Fatura E-Postası (E-Arşiv / E-Fatura)</label>
                        <input
                          type="email"
                          value={invoiceEmail}
                          onChange={(e) => setInvoiceEmail(e.target.value)}
                          placeholder="muhasebe@firma.com"
                          className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2">
              <button
                onClick={handleSaveAndSendToEdit}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
              >
                <span>Hizmet Paketini Kaydet ve Kurguya Sevk Et</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </main>
        ) : (
          <div className="col-span-12 lg:col-span-8 bg-white rounded-xl shadow-xs p-12 text-center text-slate-400 border border-slate-200">
            Lütfen sol listeden bir misafir seçiniz.
          </div>
        )}
      </div>

      {/* Serbest Hizmet Ekleme Modalı */}
      {showServiceModal && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setShowServiceModal(false); }}
        >
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#0F172A]">Hizmet Tanımla</h3>
                <p className="text-xs text-slate-500">{activeGuest?.name} için esnek hizmet ve fiyat</p>
              </div>
              <button
                onClick={() => setShowServiceModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Hizmet Tipi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Hizmet Türü</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SERVICE_TEMPLATES.map((tmpl) => {
                    const colors = COLOR_MAP[tmpl.color] || COLOR_MAP.slate;
                    const isSelected = newServiceType === tmpl.type;

                    return (
                      <button
                        key={tmpl.type}
                        type="button"
                        onClick={() => {
                          setNewServiceType(tmpl.type);
                          setNewServiceDetails(tmpl.detailOptions.map((d) => ({ label: d, checked: false })));
                          setNewServiceNote("");
                          setCustomPageCount("");
                          if (tmpl.type === "dergi") setNewServicePrice(15000);
                          else if (tmpl.type === "haber_sitesi") setNewServicePrice(10000);
                          else if (tmpl.type === "sosyal_medya") setNewServicePrice(10000);
                          else if (tmpl.type === "video") setNewServicePrice(25000);
                          else setNewServicePrice(5000);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? `${colors.bg} ${colors.border} ring-2 ring-blue-500 font-bold`
                            : "bg-white border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span className="block text-xs font-semibold text-slate-800">{tmpl.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dergiye Özel Sayfa Sayısı & Seçenekler */}
              {newServiceType === "dergi" && (
                <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-blue-900 mb-1">Kapak & Sayfa Seçenekleri</label>
                    <div className="grid grid-cols-2 gap-2">
                      {newServiceDetails.map((detail, idx) => (
                        <label key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-400 cursor-pointer text-xs">
                          <input
                            type="checkbox"
                            checked={detail.checked}
                            onChange={() => {
                              setNewServiceDetails((prev) =>
                                prev.map((d, i) => (i === idx ? { ...d, checked: !d.checked } : d))
                              );
                            }}
                            className="rounded text-blue-600 cursor-pointer"
                          />
                          <span className="text-slate-800 font-medium">{detail.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-blue-900 mb-1">
                      Özel Sayfa Sayısı (Örn: 3 sayfa, 8 sayfa vb.)
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: 8"
                      value={customPageCount}
                      onChange={(e) => setCustomPageCount(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Haber Sitesi Detayları */}
              {newServiceType === "haber_sitesi" && (
                <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-emerald-900 mb-1.5">
                      Kaç Adet Haber Sitesi Yayınlanacak?
                    </label>
                    <div className="flex items-center gap-2">
                      {[5, 10, 15, 25, 50].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => {
                            setNewServiceQuantity(count);
                            setNewServicePrice(count * 800);
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                            newServiceQuantity === count
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {count} Site
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-slate-600">Özel Adet:</span>
                      <input
                        type="number"
                        min={1}
                        value={newServiceQuantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setNewServiceQuantity(val);
                          setNewServicePrice(val * 800);
                        }}
                        className="w-24 text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-900 font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {newServiceDetails.map((detail, idx) => (
                      <label key={idx} className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={detail.checked}
                          onChange={() => {
                            setNewServiceDetails((prev) =>
                              prev.map((d, i) => (i === idx ? { ...d, checked: !d.checked } : d))
                            );
                          }}
                          className="rounded text-emerald-600 cursor-pointer"
                        />
                        <span className="text-slate-800">{detail.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Sosyal Medya & Video Detayları */}
              {(newServiceType === "sosyal_medya" || newServiceType === "video") && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">İçerik Seçimi</label>
                  <div className="space-y-1.5">
                    {newServiceDetails.map((detail, idx) => (
                      <label key={idx} className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={detail.checked}
                          onChange={() => {
                            setNewServiceDetails((prev) =>
                              prev.map((d, i) => (i === idx ? { ...d, checked: !d.checked } : d))
                            );
                          }}
                          className="rounded text-blue-600 cursor-pointer"
                        />
                        <span className="text-slate-800 font-medium">{detail.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Ek Hizmet Metni */}
              {newServiceType === "ek_hizmet" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hizmet Tanımı</label>
                  <input
                    type="text"
                    placeholder="Örn: Özel Drone Çekimi veya VIP Karşılama Paketi"
                    value={newServiceNote}
                    onChange={(e) => setNewServiceNote(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {/* Fiyat Girişi (Serbestçe yazılabilir) */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Anlaşılan Hizmet Fiyatı (TL)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₺</span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(parseInt(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 text-sm font-bold font-mono text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setShowServiceModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer transition"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleAddService}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition"
              >
                Hizmeti Ekle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
