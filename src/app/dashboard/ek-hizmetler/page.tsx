"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/useStore";
import {
  toggleExtraServiceStatus,
  updateExtraServiceItem,
  type Guest,
  type Service,
  type ServiceDetail,
  type ServiceType,
} from "@/lib/store";

interface ExtraTask {
  id: string;
  guestId: string;
  guestName: string;
  company: string;
  representative: string;
  room: string;
  phone: string;
  serviceId: string;
  serviceType: ServiceType;
  label: string;
  status: "bekliyor" | "yapiliyor" | "tamamlandi";
  completedAt?: string;
  completedBy?: string;
  link?: string;
  note?: string;
}

export default function EkHizmetlerPage() {
  const { guests, currentUser, activeRoleDef } = useStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Link / Not Düzenleme Modalı
  const [editModal, setEditModal] = useState<{
    open: boolean;
    guestId: string;
    serviceId: string;
    label: string;
    link: string;
    note: string;
  }>({
    open: false,
    guestId: "",
    serviceId: "",
    label: "",
    link: "",
    note: "",
  });

  // Konukların tüm ek hizmet kalemlerini ayrıştır
  const allTasks = useMemo(() => {
    const list: ExtraTask[] = [];

    guests.forEach((g) => {
      if (g.services && g.services.length > 0) {
        g.services.forEach((s) => {
          // Dergi dışındaki tüm operasyonel ek hizmetler (haber sitesi, sosyal medya, video, ek_hizmet)
          if (s.type !== "dergi") {
            s.details.forEach((detail, idx) => {
              list.push({
                id: `${g.id}-${s.id}-${idx}`,
                guestId: g.id,
                guestName: g.name,
                company: g.company,
                representative: g.representative,
                room: g.room,
                phone: g.phone,
                serviceId: s.id,
                serviceType: s.type,
                label: detail.label,
                status: detail.status || "bekliyor",
                completedAt: detail.completedAt,
                completedBy: detail.completedBy,
                link: detail.link,
                note: detail.note,
              });
            });
          }
        });
      }
    });

    return list;
  }, [guests]);

  // Filtreleme
  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      const q = search.toLowerCase();
      const matchSearch =
        task.guestName.toLowerCase().includes(q) ||
        task.company.toLowerCase().includes(q) ||
        task.label.toLowerCase().includes(q) ||
        task.representative.toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (statusFilter !== "all" && task.status !== statusFilter) return false;
      if (typeFilter !== "all" && task.serviceType !== typeFilter) return false;
      return true;
    });
  }, [allTasks, search, statusFilter, typeFilter]);

  // İstatistik sayaçları
  const stats = useMemo(() => {
    let total = allTasks.length;
    let bekleyen = 0;
    let yapiliyor = 0;
    let tamamlandi = 0;

    allTasks.forEach((t) => {
      if (t.status === "tamamlandi") tamamlandi++;
      else if (t.status === "yapiliyor") yapiliyor++;
      else bekleyen++;
    });

    return { total, bekleyen, yapiliyor, tamamlandi };
  }, [allTasks]);

  function handleToggle(task: ExtraTask) {
    toggleExtraServiceStatus(task.guestId, task.serviceId, task.label, currentUser?.name);
    setFeedback(
      task.status === "tamamlandi"
        ? `"${task.label}" durumu 'Bekliyor' olarak geri alındı.`
        : `✓ "${task.label}" yapıldı olarak işaretlendi.`
    );
    setTimeout(() => setFeedback(null), 3500);
  }

  function handleSaveModal(e: React.FormEvent) {
    e.preventDefault();
    if (!editModal.guestId || !editModal.serviceId) return;

    updateExtraServiceItem(editModal.guestId, editModal.serviceId, editModal.label, {
      link: editModal.link.trim(),
      note: editModal.note.trim(),
    });

    setFeedback(`✓ "${editModal.label}" bağlantı ve notları güncellendi.`);
    setTimeout(() => setFeedback(null), 3500);
    setEditModal({ open: false, guestId: "", serviceId: "", label: "", link: "", note: "" });
  }

  function getServiceBadge(type: ServiceType) {
    switch (type) {
      case "haber_sitesi":
        return { label: "Haber Sitesi", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: "📰" };
      case "sosyal_medya":
        return { label: "Sosyal Medya", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", icon: "📱" };
      case "video":
        return { label: "Video & Arşiv", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: "🎬" };
      default:
        return { label: "Ek Hizmet", bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", icon: "⭐" };
    }
  }

  return (
    <div className="space-y-6">
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
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#0F172A]">Ek Hizmetler Takip Panosu</h1>
              <p className="text-xs text-[#64748B]">
                Haber sitesi yayınları, Instagram Reels, YouTube Shorts ve sosyal medya teslimatlarının anlık takibi.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
            Kullanıcı: {currentUser?.name || "Operasyon"}
          </span>
        </div>
      </div>

      {/* Sayaçlar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Toplam Görev</span>
            <span className="text-lg">📋</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          <span className="text-[11px] text-slate-500">Tüm ek teslimat kalemleri</span>
        </div>

        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Bekleyenler</span>
            <span className="text-lg">⏳</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">{stats.bekleyen}</p>
          <span className="text-[11px] text-amber-600 font-medium">İşleme alınmayı bekliyor</span>
        </div>

        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 shadow-2xs">
          <div className="flex items-center justify-between text-blue-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Hazırlanıyor</span>
            <span className="text-lg">🔄</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">{stats.yapiliyor}</p>
          <span className="text-[11px] text-blue-600 font-medium">Dağıtımda / Kurguda</span>
        </div>

        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Tamamlananlar</span>
            <span className="text-lg">✅</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700">{stats.tamamlandi}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Yayına alınan ve teslim edilen</span>
        </div>
      </div>

      {/* Arama & Filtreleme */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
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
            placeholder="Konuk, firma, reels veya haber sitesi ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
          />
        </div>

        {/* Kategori ve Durum Filtreleri */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">Tüm Kategoriler</option>
            <option value="haber_sitesi">📰 Haber Siteleri</option>
            <option value="sosyal_medya">📱 Sosyal Medya (Reels/Shorts)</option>
            <option value="video">🎬 Video &amp; Arşiv</option>
          </select>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === "all"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setStatusFilter("bekliyor")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === "bekliyor"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`}
            >
              ⏳ Bekleyenler ({stats.bekleyen})
            </button>
            <button
              onClick={() => setStatusFilter("tamamlandi")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === "tamamlandi"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              ✓ Yapılanlar ({stats.tamamlandi})
            </button>
          </div>
        </div>
      </div>

      {/* Ek Hizmetler Tablosu */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Konuk &amp; Şirket</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Hizmet / Teslimat Kalemi</th>
                <th className="py-3 px-4">Durum</th>
                <th className="py-3 px-4">Bağlantı &amp; Not</th>
                <th className="py-3 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Kayıtlı ek hizmet görevi bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const badge = getServiceBadge(task.serviceType);
                  const isDone = task.status === "tamamlandi";

                  return (
                    <tr
                      key={task.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isDone ? "bg-emerald-50/20" : ""
                      }`}
                    >
                      {/* Konuk & Şirket */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{task.guestName}</div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {task.company} · <span className="text-slate-400">{task.representative}</span>
                        </div>
                      </td>

                      {/* Kategori */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <span>{badge.icon}</span>
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Hizmet Kalemi */}
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {task.label}
                      </td>

                      {/* Durum Rozeti */}
                      <td className="py-3 px-4">
                        {isDone ? (
                          <div className="inline-flex flex-col">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <span>✓ Yapıldı</span>
                            </span>
                            {task.completedAt && (
                              <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {task.completedAt}
                                {task.completedBy && ` (${task.completedBy})`}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <span>⏳ Bekliyor</span>
                          </span>
                        )}
                      </td>

                      {/* Link ve Not */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <div className="space-y-1">
                          {task.link && (
                            <a
                              href={task.link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold truncate max-w-[180px]"
                              title={task.link}
                            >
                              <span>🔗</span>
                              <span className="truncate">{task.link}</span>
                            </a>
                          )}
                          {task.note && (
                            <p className="text-[10px] text-slate-500 italic truncate" title={task.note}>
                              {task.note}
                            </p>
                          )}
                          {!task.link && !task.note && (
                            <span className="text-[11px] text-slate-400">—</span>
                          )}
                        </div>
                      </td>

                      {/* İşlemler */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              setEditModal({
                                open: true,
                                guestId: task.guestId,
                                serviceId: task.serviceId,
                                label: task.label,
                                link: task.link || "",
                                note: task.note || "",
                              })
                            }
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Yayın Linki veya Not Ekle"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          </button>

                          <button
                            onClick={() => handleToggle(task)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1 ${
                              isDone
                                ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white"
                            }`}
                          >
                            {isDone ? (
                              <span>Geri Al</span>
                            ) : (
                              <>
                                <span>✓</span>
                                <span>Yapıldı</span>
                              </>
                            )}
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

      {/* Yayın Linki & Not Ekleme Modalı */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-xl animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Teslimat Detayı Ekle</h3>
                <p className="text-xs text-slate-500">{editModal.label}</p>
              </div>
              <button
                onClick={() =>
                  setEditModal({ open: false, guestId: "", serviceId: "", label: "", link: "", note: "" })
                }
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Yayın Bağlantısı (Link)
                </label>
                <input
                  type="url"
                  placeholder="https://instagram.com/reel/... veya haber linki"
                  value={editModal.link}
                  onChange={(e) => setEditModal({ ...editModal, link: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Operasyon Notu
                </label>
                <textarea
                  rows={3}
                  placeholder="Örn: 5 reels videosu teslim edildi, kapak görseli onaylandı..."
                  value={editModal.note}
                  onChange={(e) => setEditModal({ ...editModal, note: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setEditModal({ open: false, guestId: "", serviceId: "", label: "", link: "", note: "" })
                  }
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
