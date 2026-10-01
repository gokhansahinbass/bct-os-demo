"use client";

import { useState, useMemo, useRef } from "react";
import { useStore } from "@/lib/useStore";
import {
  updateMagazineStatus,
  updateMagazineNotes,
  addMagazineFile,
  deleteMagazineFile,
  type MagazineStatus,
  type MagazineFile,
  type Guest,
  type Service,
} from "@/lib/store";

const STATUS_CONFIG: Record<
  MagazineStatus,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  icerik_bekleniyor: {
    label: "İçerik Bekleniyor",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    icon: "hourglass_top",
  },
  icerik_geldi: {
    label: "İçerik Geldi",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: "cloud_download",
  },
  tasarimda: {
    label: "Tasarımda",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: "palette",
  },
  baski_bekliyor: {
    label: "Baskı Bekliyor",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: "print",
  },
  tamamlandi: {
    label: "Bitti / Tamamlandı",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: "check_circle",
  },
};

export default function DergiPage() {
  const { guests, canAccessPage, activeRoleDef, currentUser, activeRole } = useStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeUploadTarget, setActiveUploadTarget] = useState<{
    guestId: string;
    serviceId: string;
  } | null>(null);

  // Dergi hizmeti satın almış konukları listele
  const magazineOrders = useMemo(() => {
    const list: {
      guest: Guest;
      service: Service;
      status: MagazineStatus;
    }[] = [];

    guests.forEach((g) => {
      if (g.services && g.services.length > 0) {
        g.services.forEach((s) => {
          if (s.type === "dergi") {
            const currentStatus: MagazineStatus = s.magazineStatus || "icerik_bekleniyor";
            list.push({
              guest: g,
              service: s,
              status: currentStatus,
            });
          }
        });
      }
    });

    return list;
  }, [guests]);

  // Filtrelenmiş liste
  const filteredOrders = useMemo(() => {
    return magazineOrders.filter(({ guest, service, status }) => {
      const q = search.toLowerCase();
      const matchSearch =
        guest.name.toLowerCase().includes(q) ||
        guest.company.toLowerCase().includes(q) ||
        guest.representative.toLowerCase().includes(q) ||
        service.details.some((d) => d.label.toLowerCase().includes(q));

      if (!matchSearch) return false;
      if (statusFilter !== "all" && status !== statusFilter) return false;
      return true;
    });
  }, [magazineOrders, search, statusFilter]);

  // Sayaçlar
  const counts = useMemo(() => {
    let total = magazineOrders.length;
    let bekleyen = 0;
    let geldi = 0;
    let tasarimda = 0;
    let bitti = 0;

    magazineOrders.forEach((o) => {
      if (o.status === "icerik_bekleniyor") bekleyen++;
      else if (o.status === "icerik_geldi") geldi++;
      else if (o.status === "tasarimda") tasarimda++;
      else if (o.status === "tamamlandi") bitti++;
    });

    return { total, bekleyen, geldi, tasarimda, bitti };
  }, [magazineOrders]);

  // Dosya Yükleme İşlemi (Görsel veya Metin)
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeUploadTarget) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      let fileType = "other";
      if (file.type.startsWith("image/")) fileType = "image";
      else if (file.type === "application/pdf") fileType = "pdf";
      else if (
        file.type.includes("word") ||
        file.type.includes("text") ||
        file.name.endsWith(".doc") ||
        file.name.endsWith(".docx")
      ) {
        fileType = "doc";
      }

      addMagazineFile(activeUploadTarget.guestId, activeUploadTarget.serviceId, {
        name: file.name,
        size: file.size,
        type: fileType,
        dataUrl,
        uploadedBy: currentUser?.name || "Dergi Sorumlusu",
      });

      setFeedback(`✓ "${file.name}" başarıyla yüklendi.`);
      setTimeout(() => setFeedback(null), 4000);
      setActiveUploadTarget(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    reader.readAsDataURL(file);
  }

  function handleStatusChange(guestId: string, serviceId: string, newStatus: MagazineStatus) {
    updateMagazineStatus(guestId, serviceId, newStatus, currentUser?.name);
    setFeedback(`✓ Durum "${STATUS_CONFIG[newStatus].label}" olarak güncellendi.`);
    setTimeout(() => setFeedback(null), 3000);
  }

  function handleSaveNotes(guestId: string, serviceId: string) {
    const key = `${guestId}-${serviceId}`;
    const text = editingNotes[key] ?? "";
    updateMagazineNotes(guestId, serviceId, text);
    setFeedback("✓ İçerik notları kaydedildi.");
    setTimeout(() => setFeedback(null), 3000);
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  }

  return (
    <div className="space-y-6">
      {/* Gizli Dosya Seçici */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileUpload}
        accept="image/*,.pdf,.doc,.docx,.txt"
      />

      {/* Geribildirim Bildirimi */}
      {feedback && (
        <div className="fixed top-16 right-6 z-50 px-4 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>{feedback}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#0F172A]">Dergi Masası &amp; İçerik Portalı</h1>
              <p className="text-xs text-[#64748B]">
                Dergi satın alan müşteriler, satın alınan sayfalar, gönderilen içerik ve baskı onay süreçleri.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
            Sorumlu: {currentUser?.name || "Dergi Editörü"}
          </span>
        </div>
      </div>

      {/* Metrik Sayaç Kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Toplam Sipariş</span>
            <span className="text-lg">📖</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{counts.total}</p>
          <span className="text-[11px] text-slate-500">Kapak ve sayfa siparişleri</span>
        </div>

        <div className="bg-red-50/50 p-4 rounded-xl border border-red-200 shadow-2xs">
          <div className="flex items-center justify-between text-red-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">İçerik Beklenen</span>
            <span className="text-lg">⏳</span>
          </div>
          <p className="text-2xl font-bold text-red-700">{counts.bekleyen}</p>
          <span className="text-[11px] text-red-600 font-medium">Fotoğraf / Metin bekleniyor</span>
        </div>

        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Tasarımda</span>
            <span className="text-lg">🎨</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">{counts.tasarimda + counts.geldi}</p>
          <span className="text-[11px] text-amber-600 font-medium">İçeriği geldi veya çiziliyor</span>
        </div>

        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Baskıya Hazır / Bitti</span>
            <span className="text-lg">🏆</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700">{counts.bitti}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Tasarımı tamamlananlar</span>
        </div>
      </div>

      {/* Arama & Durum Filtreleri */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        {/* Arama Input */}
        <div className="relative flex-1 max-w-md">
          <svg
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Konuk adı, firma, temsilci veya dergi paketi ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
          />
        </div>

        {/* Durum Sekmeleri */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              statusFilter === "all"
                ? "bg-blue-600 text-white shadow-2xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            Tümü ({counts.total})
          </button>
          <button
            onClick={() => setStatusFilter("icerik_bekleniyor")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              statusFilter === "icerik_bekleniyor"
                ? "bg-red-600 text-white shadow-2xs"
                : "bg-red-50 text-red-700 hover:bg-red-100"
            }`}
          >
            ⏳ İçerik Beklenen ({counts.bekleyen})
          </button>
          <button
            onClick={() => setStatusFilter("icerik_geldi")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              statusFilter === "icerik_geldi"
                ? "bg-blue-600 text-white shadow-2xs"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            📥 İçerik Geldi ({counts.geldi})
          </button>
          <button
            onClick={() => setStatusFilter("tasarimda")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              statusFilter === "tasarimda"
                ? "bg-amber-600 text-white shadow-2xs"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            🎨 Tasarımda ({counts.tasarimda})
          </button>
          <button
            onClick={() => setStatusFilter("tamamlandi")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              statusFilter === "tamamlandi"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            ✓ Tamamlandı ({counts.bitti})
          </button>
        </div>
      </div>

      {/* Dergi Siparişleri Kart Listesi */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">📖</span>
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">Kayıt Bulunamadı</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search || statusFilter !== "all"
              ? "Arama kriterlerinize uygun dergi siparişi bulunamadı."
              : "Henüz dergi paketi satın alan bir konuk kaydı yok. Pazarlama Masası üzerinden dergi paketi ekleyebilirsiniz."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(({ guest, service, status }) => {
            const statusMeta = STATUS_CONFIG[status];
            const noteKey = `${guest.id}-${service.id}`;
            const currentNote =
              editingNotes[noteKey] !== undefined ? editingNotes[noteKey] : service.magazineNotes || "";
            const files = service.magazineFiles || [];

            return (
              <div
                key={service.id}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-blue-200 transition-all overflow-hidden"
              >
                {/* Üst Bar: Konuk Bilgisi & Durum */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-2xs">
                      {guest.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-slate-900">{guest.name}</h2>
                        <span className="text-[10px] font-mono text-slate-500">{guest.registrationNo}</span>
                        {guest.vip && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            VIP
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-medium">
                        {guest.company} · <span className="text-slate-500">{guest.title}</span>
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                        <span>📞 {guest.phone}</span>
                        <span>👤 Temsilci: <strong className="text-slate-700">{guest.representative}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Durum Seçici ve Hızlı Aksiyon */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Aşama:</span>
                    <select
                      value={status}
                      onChange={(e) =>
                        handleStatusChange(guest.id, service.id, e.target.value as MagazineStatus)
                      }
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border focus:outline-none cursor-pointer ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                    >
                      <option value="icerik_bekleniyor">⏳ İçerik Bekleniyor</option>
                      <option value="icerik_geldi">📥 İçerik Geldi</option>
                      <option value="tasarimda">🎨 Tasarımda</option>
                      <option value="baski_bekliyor">🖨️ Baskı Bekliyor</option>
                      <option value="tamamlandi">✓ Tamamlandı (Baskıya Girdi)</option>
                    </select>

                    {status !== "tamamlandi" ? (
                      <button
                        onClick={() => handleStatusChange(guest.id, service.id, "tamamlandi")}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition cursor-pointer flex items-center gap-1"
                        title="Tasarımı bitti olarak işaretle"
                      >
                        <span>✓</span>
                        <span className="hidden sm:inline">Bitti</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(guest.id, service.id, "tasarimda")}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
                        title="Revize için geri al"
                      >
                        Geri Al
                      </button>
                    )}
                  </div>
                </div>

                {/* Ana Gövde: Satın Alınan Paket, İçerik Notu, Yüklenen Dosyalar */}
                <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Sol Kolon: Satın Alınan Dergi Hizmetleri */}
                  <div className="lg:col-span-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span>📰</span> Satın Alınan Sayfa &amp; Kapak:
                      </span>
                      <span className="text-xs font-extrabold text-blue-700 font-mono">
                        {service.price.toLocaleString("tr-TR")} ₺
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {service.details.map((detail, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/60 border border-blue-100 text-xs font-semibold text-blue-900"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                          <span>{detail.label}</span>
                        </div>
                      ))}
                    </div>

                    {service.completedAt && (
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                        <span className="font-bold">✓ Baskı Onayı Verildi:</span> {service.completedAt}
                        {service.completedBy && <span> ({service.completedBy})</span>}
                      </div>
                    )}
                  </div>

                  {/* Orta Kolon: İçerik Notları ve Metin Takibi */}
                  <div className="lg:col-span-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span>📝</span> İçerik Notları &amp; Başlık:
                      </label>
                      <button
                        onClick={() => handleSaveNotes(guest.id, service.id)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        Kaydet
                      </button>
                    </div>

                    <textarea
                      rows={4}
                      value={currentNote}
                      onChange={(e) =>
                        setEditingNotes({
                          ...editingNotes,
                          [noteKey]: e.target.value,
                        })
                      }
                      placeholder="Konuk röportaj başlığı, vurgulanacak mesajlar veya özel sayfa istekleri..."
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition resize-none"
                    />
                  </div>

                  {/* Sağ Kolon: Dosya ve Görsel Deposu */}
                  <div className="lg:col-span-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span>📎</span> Yüklenen İçerikler ({files.length}):
                      </span>

                      <button
                        onClick={() => {
                          setActiveUploadTarget({ guestId: guest.id, serviceId: service.id });
                          fileInputRef.current?.click();
                        }}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition cursor-pointer flex items-center gap-1"
                      >
                        <span>+ Dosya Yükle</span>
                      </button>
                    </div>

                    {files.length === 0 ? (
                      <div
                        onClick={() => {
                          setActiveUploadTarget({ guestId: guest.id, serviceId: service.id });
                          fileInputRef.current?.click();
                        }}
                        className="border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 rounded-lg p-4 text-center cursor-pointer transition"
                      >
                        <svg
                          className="w-6 h-6 mx-auto text-slate-400 mb-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
                          />
                        </svg>
                        <p className="text-[11px] text-slate-600 font-semibold">Görsel veya Metin Ekle</p>
                        <p className="text-[10px] text-slate-400">JPG, PNG, PDF, Word</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {files.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs hover:bg-slate-100 transition"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm shrink-0">
                                {file.type === "image" ? "🖼️" : file.type === "pdf" ? "📕" : "📄"}
                              </span>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 truncate text-[11px]" title={file.name}>
                                  {file.name}
                                </p>
                                <p className="text-[10px] text-slate-500 font-mono">
                                  {formatBytes(file.size)} · {file.uploadedAt}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {file.dataUrl && (
                                <a
                                  href={file.dataUrl}
                                  download={file.name}
                                  className="p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-white"
                                  title="Dosyayı İndir"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                  </svg>
                                </a>
                              )}
                              <button
                                onClick={() => deleteMagazineFile(guest.id, service.id, file.id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-white cursor-pointer"
                                title="Dosyayı Sil"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
