"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/lib/useStore";
import type { RequestTargetDepartment, RequestPriority, RequestStatus } from "@/lib/store";

const DEPT_MAP: Record<RequestTargetDepartment, { label: string; color: string; icon: string }> = {
  reji: { label: "Reji & Stüdyo", color: "bg-purple-50 text-purple-700 border-purple-200", icon: "videocam" },
  kurgu: { label: "Kurgu & Montaj", color: "bg-violet-50 text-violet-700 border-violet-200", icon: "movie_edit" },
  pazarlama: { label: "Pazarlama Masası", color: "bg-blue-50 text-blue-700 border-blue-200", icon: "campaign" },
  muhasebe: { label: "Muhasebe & Finans", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "account_balance" },
  cagri_merkezi: { label: "Çağrı Merkezi", color: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: "call" },
  odalar: { label: "Oda Temsilcileri", color: "bg-amber-50 text-amber-700 border-amber-200", icon: "meeting_room" },
  dergi: { label: "Dergi Masası", color: "bg-cyan-50 text-cyan-700 border-cyan-200", icon: "menu_book" },
  ek_hizmetler: { label: "Ek Hizmetler", color: "bg-teal-50 text-teal-700 border-teal-200", icon: "checklist" },
  izleme: { label: "İzleme Masası", color: "bg-yellow-50 text-yellow-800 border-yellow-200", icon: "visibility" },
  teknik: { label: "Teknik Ekip", color: "bg-red-50 text-red-700 border-red-200", icon: "build" },
  yonetim: { label: "Üst Yönetim", color: "bg-slate-100 text-slate-800 border-slate-300", icon: "corporate_fare" },
};

export default function IletisimPage() {
  const {
    guests,
    guestRequests,
    addGuestRequest,
    updateGuestRequestStatus,
    deleteGuestRequest,
    currentUser,
    canAccessPage,
  } = useStore();

  const [statusFilter, setStatusFilter] = useState<"tum" | RequestStatus>("tum");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Yeni Talep Modalı
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGuestId, setSelectedGuestId] = useState<string>("");
  const [targetDept, setTargetDept] = useState<RequestTargetDepartment>("reji");
  const [priority, setPriority] = useState<RequestPriority>("normal");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Çözüm Notu Modalı
  const [resolvingRequestId, setResolvingRequestId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");

  // Sayfa Erişim Koruması
  if (!canAccessPage("/dashboard/iletisim")) {
    return (
      <div className="p-8 max-w-xl mx-auto mt-12 bg-white rounded-2xl shadow-sm border border-slate-200 text-center">
        <span className="text-4xl block mb-3">🔒</span>
        <h2 className="text-base font-bold text-slate-900 mb-1">Erişim Yetkisi Sınırlı</h2>
        <p className="text-xs text-slate-600 mb-4">
          Bu sayfayı görüntülemek için <strong>İletişim Koordinatörü</strong> veya <strong>Süper Admin</strong> yetkisine sahip olmalısınız.
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

  // İstatistikler
  const totalCount = guestRequests.length;
  const pendingCount = guestRequests.filter((r) => r.status === "beklemede").length;
  const inProgressCount = guestRequests.filter((r) => r.status === "islemde").length;
  const resolvedCount = guestRequests.filter((r) => r.status === "cozuldu").length;
  const urgentCount = guestRequests.filter((r) => r.priority === "acil" && r.status !== "cozuldu").length;

  // Filtrelenmiş Talepler
  const filteredRequests = useMemo(() => {
    return guestRequests.filter((r) => {
      if (statusFilter !== "tum" && r.status !== statusFilter) return false;
      if (deptFilter !== "all" && r.targetDepartment !== deptFilter) return false;
      if (priorityFilter !== "all" && r.priority !== priorityFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const guestMatch = (r.guestName || "").toLowerCase().includes(q);
        const compMatch = (r.company || "").toLowerCase().includes(q);
        const titleMatch = r.title.toLowerCase().includes(q);
        const descMatch = r.description.toLowerCase().includes(q);
        if (!guestMatch && !compMatch && !titleMatch && !descMatch) return false;
      }
      return true;
    });
  }, [guestRequests, statusFilter, deptFilter, priorityFilter, search]);

  function handleCreateRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert("Lütfen talep başlığı ve açıklama yazınız.");
      return;
    }

    const guestObj = guests.find((g) => g.id === selectedGuestId);

    addGuestRequest({
      guestId: guestObj ? guestObj.id : undefined,
      guestName: guestObj ? guestObj.name : undefined,
      company: guestObj ? guestObj.company : undefined,
      representative: guestObj ? guestObj.representative : undefined,
      targetDepartment: targetDept,
      priority,
      title: title.trim(),
      description: description.trim(),
      reportedBy: currentUser?.name || "İletişim Koordinatörü",
    });

    setIsModalOpen(false);
    setSelectedGuestId("");
    setTitle("");
    setDescription("");
    setPriority("normal");
    setTargetDept("reji");

    setFeedback(`✓ Talep başarıyla kaydedildi ve ${DEPT_MAP[targetDept].label} birimine yazılı olarak sevk edildi!`);
    setTimeout(() => setFeedback(null), 4000);
  }

  function handleOpenResolveModal(requestId: string) {
    setResolvingRequestId(requestId);
    setResolutionNote("");
  }

  function handleConfirmResolve() {
    if (!resolvingRequestId) return;
    updateGuestRequestStatus(
      resolvingRequestId,
      "cozuldu",
      resolutionNote.trim() || "Talep birim tarafından çözüldü olarak onaylandı.",
      currentUser?.name || "İletişim Masası"
    );
    setResolvingRequestId(null);
    setResolutionNote("");
    setFeedback("✓ Talep çözüldü olarak kapatıldı ve ilgili taraflara bildirim gönderildi.");
    setTimeout(() => setFeedback(null), 4000);
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ── Üst Başlık & Aksiyon ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              İletişim &amp; Talep Masası
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-orange-100 text-orange-800 border border-orange-200">
              Koordinasyon Merkezi
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Konukların sözlü olarak ilettiği talepleri, şikayetleri ve düzeltmeleri yazılı forma dökerek Reji, Kurgu, Muhasebe ve diğer birimlere anında sevk edin.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_comment</span>
            <span>Yeni Talep Oluştur</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">✕</button>
        </div>
      )}

      {/* ── KPI Sayaç Kartları ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Toplam Talep</span>
          <span className="text-xl font-black text-slate-800 font-mono mt-0.5 block">{totalCount}</span>
        </div>

        <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-800">Bekleyen</span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          </div>
          <span className="text-xl font-black text-amber-900 font-mono mt-0.5 block">{pendingCount}</span>
        </div>

        <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-blue-800">İşlemde</span>
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          </div>
          <span className="text-xl font-black text-blue-900 font-mono mt-0.5 block">{inProgressCount}</span>
        </div>

        <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-800">Çözülen</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <span className="text-xl font-black text-emerald-900 font-mono mt-0.5 block">{resolvedCount}</span>
        </div>

        <div className="bg-red-50/60 p-3.5 rounded-xl border border-red-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-red-800">Acil &amp; Kritik</span>
            {urgentCount > 0 && <span className="animate-ping w-2 h-2 rounded-full bg-red-500"></span>}
          </div>
          <span className="text-xl font-black text-red-900 font-mono mt-0.5 block">{urgentCount}</span>
        </div>
      </div>

      {/* ── Filtreler & Arama ── */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        {/* Durum Sekmeleri & Arama */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { key: "tum", label: "Tüm Talepler", count: totalCount },
              { key: "beklemede", label: "Beklemede", count: pendingCount },
              { key: "islemde", label: "İşlemde", count: inProgressCount },
              { key: "cozuldu", label: "Çözüldü", count: resolvedCount },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === tab.key
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  statusFilter === tab.key ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-600"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Arama */}
          <div className="relative w-full md:w-72">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Konuk, başlık veya talep ara..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Departman & Öncelik Filtreleri */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Birim:</span>
          <button
            onClick={() => setDeptFilter("all")}
            className={`text-xs px-2.5 py-1 rounded-md transition font-medium cursor-pointer ${
              deptFilter === "all" ? "bg-orange-100 text-orange-900 font-bold" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Tümü
          </button>
          {Object.entries(DEPT_MAP).map(([key, info]) => (
            <button
              key={key}
              onClick={() => setDeptFilter(key)}
              className={`text-xs px-2.5 py-1 rounded-md transition font-medium cursor-pointer flex items-center gap-1 ${
                deptFilter === key ? "bg-orange-100 text-orange-900 font-bold" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">{info.icon}</span>
              <span>{info.label}</span>
            </button>
          ))}

          <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>

          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Öncelik:</span>
          {["all", "acil", "yuksek", "normal"].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`text-xs px-2.5 py-1 rounded-md transition font-medium cursor-pointer uppercase text-[10px] tracking-wider ${
                priorityFilter === p ? "bg-slate-800 text-white font-bold" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {p === "all" ? "Tümü" : p}
            </button>
          ))}
        </div>
      </div>

      {/* ── Talep Listesi / Kartlar ── */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">inbox</span>
            <p className="text-xs font-semibold">Bu filtrelere uygun herhangi bir talep kaydı bulunamadı.</p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const deptInfo = DEPT_MAP[req.targetDepartment] || {
              label: req.targetDepartment,
              color: "bg-slate-100 text-slate-700 border-slate-200",
              icon: "info",
            };

            return (
              <div
                key={req.id}
                className={`bg-white rounded-xl border p-4.5 transition-all shadow-2xs hover:shadow-xs ${
                  req.priority === "acil" && req.status !== "cozuldu"
                    ? "border-l-4 border-l-red-600 border-slate-200 bg-red-50/20"
                    : req.status === "cozuldu"
                    ? "border-slate-200 opacity-80"
                    : "border-slate-200"
                }`}
              >
                {/* Kart Üst Barı: Birim, Öncelik, Durum, Zaman */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Departman Rozeti */}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${deptInfo.color}`}>
                      <span className="material-symbols-outlined text-[14px]">{deptInfo.icon}</span>
                      <span>{deptInfo.label}</span>
                    </span>

                    {/* Öncelik Rozeti */}
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider ${
                        req.priority === "acil"
                          ? "bg-red-600 text-white animate-pulse"
                          : req.priority === "yuksek"
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {req.priority === "acil" ? "⚡ ACİL" : req.priority === "yuksek" ? "▲ YÜKSEK" : "NORMAL"}
                    </span>

                    {/* Durum Rozeti */}
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        req.status === "beklemede"
                          ? "bg-amber-100 text-amber-900"
                          : req.status === "islemde"
                          ? "bg-blue-100 text-blue-900"
                          : "bg-emerald-100 text-emerald-900"
                      }`}
                    >
                      {req.status === "beklemede"
                        ? "Beklemede (İletildi)"
                        : req.status === "islemde"
                        ? "İşlemde"
                        : "✓ Çözüldü"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                    <span>İleten: <strong className="text-slate-700">{req.reportedBy}</strong></span>
                    <span>•</span>
                    <span>{new Date(req.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>

                {/* Kart Gövdesi: Konuk Bilgisi, Başlık ve Yazılı Talep */}
                <div className="mt-3 space-y-2">
                  {/* Konuk / Firma Bilgisi */}
                  {req.guestName ? (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-blue-600">person</span>
                        <span>{req.guestName}</span>
                      </span>
                      {req.company && <span className="text-slate-500 font-medium">({req.company})</span>}
                      {req.representative && (
                        <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.2 rounded-full font-semibold">
                          Temsilci: {req.representative}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <span className="material-symbols-outlined text-[15px] text-slate-400">apartment</span>
                      <span>Genel Stüdyo &amp; Ofis Talebi (Belirli bir konuğa bağlı değil)</span>
                    </div>
                  )}

                  {/* Başlık */}
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {req.title}
                  </h3>

                  {/* Yazılı Talep Metni (Textarea formatında temiz serbest yazı) */}
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 font-sans whitespace-pre-wrap leading-relaxed">
                    {req.description}
                  </div>

                  {/* Çözüm Notu (Eğer çözüldüyse) */}
                  {req.status === "cozuldu" && (
                    <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start gap-2">
                      <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0">check_circle</span>
                      <div className="min-w-0">
                        <p className="font-bold">Çözüm Notu:</p>
                        <p className="text-emerald-800 mt-0.5">{req.resolutionNote || "İşlem tamamlandı."}</p>
                        {req.resolvedAt && (
                          <span className="text-[10px] text-emerald-600 block mt-1">
                            Kapanış Zamanı: {new Date(req.resolvedAt).toLocaleString("tr-TR")}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Kart Alt Aksiyonları */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <span className="font-mono">ID: {req.id}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {req.status === "beklemede" && (
                      <button
                        onClick={() => updateGuestRequestStatus(req.id, "islemde")}
                        className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                      >
                        ⚙️ İşleme Al
                      </button>
                    )}

                    {req.status !== "cozuldu" ? (
                      <button
                        onClick={() => handleOpenResolveModal(req.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>✓</span>
                        <span>Çözüldü İşaretle</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => updateGuestRequestStatus(req.id, "beklemede")}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
                      >
                        ↩ Yeniden Aç
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (confirm("Bu talebi silmek istediğinizden emin misiniz?")) {
                          deleteGuestRequest(req.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition cursor-pointer"
                      title="Talebi Sil"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── YENİ TALEP OLUŞTURMA MODALI ── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
        >
          <div className="max-w-xl w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-orange-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-orange-600">contact_support</span>
                  <span>Yeni Talep &amp; İstek Kaydet</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Konuktan veya personelden gelen sözlü bilgiyi yazılı hale getirip ilgili birime sevk edin.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateRequest} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Konuk Seçici */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  İlgili Konuk / Müşteri
                </label>
                <select
                  value={selectedGuestId}
                  onChange={(e) => setSelectedGuestId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 font-medium text-slate-800"
                >
                  <option value="">— Genel Talep / Belirli Bir Konuk Yok —</option>
                  {guests.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.company || "Şirketsiz"}) {g.representative ? `— Temsilci: ${g.representative}` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Eğer talep belirli bir konuğa aitse seçiniz. Temsilcisine de otomatik bilgi gidecektir.
                </p>
              </div>

              {/* Hedef Departman & Öncelik */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    İlgilenecek Birim (Sevk Edilecek Departman) *
                  </label>
                  <select
                    value={targetDept}
                    onChange={(e) => setTargetDept(e.target.value as RequestTargetDepartment)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 font-bold text-slate-800"
                  >
                    <option value="reji">Reji &amp; Canlı Stüdyo Çekim</option>
                    <option value="kurgu">Kurgu &amp; Montaj Departmanı</option>
                    <option value="pazarlama">Pazarlama Masası (Paket / Sözleşme)</option>
                    <option value="muhasebe">Muhasebe &amp; Finans (Fatura / Ödeme)</option>
                    <option value="cagri_merkezi">Çağrı Merkezi / Danışma</option>
                    <option value="odalar">Satış Odaları &amp; Temsilciler</option>
                    <option value="dergi">Dergi Masası &amp; Röportaj</option>
                    <option value="ek_hizmetler">Ek Hizmetler (Haber / Sosyal Medya)</option>
                    <option value="izleme">İzleme &amp; Revize Masası</option>
                    <option value="teknik">Teknik Altyapı &amp; Donanım</option>
                    <option value="yonetim">Üst Yönetim</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Öncelik Seviyesi *
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as RequestPriority)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 font-bold text-slate-800"
                  >
                    <option value="normal">Normal Öncelik</option>
                    <option value="yuksek">▲ Yüksek Öncelik</option>
                    <option value="acil">⚡ ACİL (Flaş Bildirim Gönderir)</option>
                  </select>
                </div>
              </div>

              {/* Talep Başlığı */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Talep / Konu Başlığı *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: Yaka mikrofonu cızırtı yapıyor / Konuk e-fatura adresini güncelledi"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 font-medium"
                  required
                />
              </div>

              {/* Yazılı Talep Alanı (Textarea) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Yazılı Talep / Açıklama Metni (Detaylı) *
                </label>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Konuğun veya personelin sözlü olarak ilettiği talebi, hatayı, teknik aksaklığı veya istek notunu buraya eksiksiz olarak yazınız..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 font-sans leading-relaxed"
                  required
                ></textarea>
                <p className="text-[10px] text-slate-400 mt-1">
                  Bu metin doğrudan ilgili birimin ekranına ve bildirim kutusuna iletilecektir.
                </p>
              </div>

              {/* Butonlar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[17px]">send</span>
                  <span>Talebi Kaydet ve Birime Sevk Et</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ÇÖZÜM NOTU GİRME MODALI ── */}
      {resolvingRequestId && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => { if (e.target === e.currentTarget) setResolvingRequestId(null); }}
        >
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-emerald-50 flex items-center justify-between">
              <h3 className="font-bold text-sm text-emerald-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-600">task_alt</span>
                <span>Talebi Çözüldü Olarak İşaretle</span>
              </h3>
              <button onClick={() => setResolvingRequestId(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Çözüm Notu / Açıklaması (Opsiyonel)
                </label>
                <textarea
                  rows={3}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Yapılan müdahale, teknik onarım veya alınan aksiyon hakkında kısa bir not yazınız..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-sans"
                ></textarea>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingRequestId(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResolve}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  Çözümü Onayla ve Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
