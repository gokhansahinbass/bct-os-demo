"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/lib/useStore";
import {
  addNoteToGuest,
  toggleNoteResolved,
  deleteNoteFromGuest,
  updateGuestStatus,
  addNotification,
  Guest,
} from "@/lib/store";

export default function RevizePage() {
  const { guests, canAccessPage, hasPermission, isSensitiveBlurred, activeRoleDef } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "pending" | "resolved">("pending");
  const [roomFilter, setRoomFilter] = useState<string>("all");

  // New Note State
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteTime, setNewNoteTime] = useState("");
  const [newNoteAuthor, setNewNoteAuthor] = useState("İzleme & Kalite Kontrol");
  const [newNoteText, setNewNoteText] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Filter candidates: guests that have been shot or are in editing/review
  const relevantGuests = useMemo(() => {
    return guests.filter((g) =>
      ["shoot_done", "editing", "edit_done", "reviewing", "review_approved"].includes(g.status) ||
      (g.notes && g.notes.length > 0)
    );
  }, [guests]);

  const filteredGuests = useMemo(() => {
    return relevantGuests.filter((g) => {
      // Room filter
      if (roomFilter !== "all" && g.room !== roomFilter) return false;

      const hasPending = g.notes.some((n) => !n.resolved);
      if (filterMode === "pending") {
        return hasPending || g.status === "editing";
      }
      if (filterMode === "resolved") {
        return g.notes.length > 0 && g.notes.every((n) => n.resolved);
      }
      return true;
    });
  }, [relevantGuests, filterMode, roomFilter]);

  const activeGuest: Guest | null = useMemo(() => {
    if (selectedId) {
      const g = guests.find((item) => item.id === selectedId);
      if (g) return g;
    }
    return filteredGuests[0] || relevantGuests[0] || null;
  }, [guests, selectedId, filteredGuests, relevantGuests]);

  const activeNotes = activeGuest?.notes || [];
  const pendingNotesCount = activeNotes.filter((n) => !n.resolved).length;
  const resolvedNotesCount = activeNotes.filter((n) => n.resolved).length;

  // Stats across whole studio
  const totalPendingNotes = useMemo(() => {
    return guests.reduce((sum, g) => sum + (g.notes?.filter((n) => !n.resolved).length || 0), 0);
  }, [guests]);

  const totalVideosInRevize = useMemo(() => {
    return guests.filter((g) => g.notes?.some((n) => !n.resolved) || g.status === "editing").length;
  }, [guests]);

  function handleAddRevision(e: React.FormEvent) {
    e.preventDefault();
    if (!activeGuest || !newNoteText.trim()) return;

    let timeLabel = newNoteTime.trim();
    let percent = 0;

    if (timeLabel) {
      if (!timeLabel.includes(":")) {
        timeLabel = `0${timeLabel}:00`.slice(-5);
      }
      const parts = timeLabel.split(":");
      const totalSec = parseInt(parts[0] || "0") * 60 + parseInt(parts[1] || "0");
      percent = Math.min(100, (totalSec / (25 * 60)) * 100);
    } else {
      timeLabel = "Genel";
    }

    addNoteToGuest(activeGuest.id, {
      time: timeLabel,
      percent,
      author: newNoteAuthor,
      authorType: newNoteAuthor.includes("Müşteri") ? "client" : "staff",
      text: newNoteText.trim(),
      resolved: false,
    });

    // Otomatik olarak kurgu durumuna al ve bildirim at
    if (activeGuest.status !== "editing") {
      updateGuestStatus(activeGuest.id, "editing");
    }

    addNotification({
      to: "kurgu",
      from: newNoteAuthor,
      type: "task",
      title: `Yeni Revize: ${activeGuest.name}`,
      message: `[${timeLabel}] ${newNoteText.trim().slice(0, 60)}...`,
      link: "/dashboard/montaj",
    });

    setNewNoteText("");
    setNewNoteTime("");
    setIsAddingNote(false);
    setFeedback(`✓ "${activeGuest.name}" için yeni revize notu eklendi ve kurgu masasına iletildi.`);
    setTimeout(() => setFeedback(null), 4000);
  }

  function handleSendToMontaj() {
    if (!activeGuest) return;
    updateGuestStatus(activeGuest.id, "editing");
    addNotification({
      to: "kurgu",
      from: "Revize Masası",
      type: "task",
      title: `Revize Sevk Edildi: ${activeGuest.name}`,
      message: `${pendingNotesCount} adet bekleyen revize notu ile kurgu panosuna sevk edildi.`,
      link: "/dashboard/montaj",
    });
    setFeedback(`✓ ${activeGuest.name} videosu kurgucuya iletildi.`);
    setTimeout(() => setFeedback(null), 4000);
  }

  function handleSendToIzleme() {
    if (!activeGuest) return;
    updateGuestStatus(activeGuest.id, "reviewing");
    addNotification({
      to: "izleme",
      from: "Revize Masası",
      type: "info",
      title: `Revize Bitti, İzlemeye Gönderildi: ${activeGuest.name}`,
      message: `Tüm revizeler tamamlandı olarak işaretlendi ve izleme onayına sunuldu.`,
      link: "/dashboard/izleme",
    });
    addNotification({
      to: "all",
      from: "Revize Masası",
      type: "info",
      title: `Revize Tamamlandı: ${activeGuest.name}`,
      message: `Tüm revizeler tamamlandı ve video izleme onayına gönderildi.`,
      link: "/dashboard/izleme",
    });
    setFeedback(`✓ ${activeGuest.name} videosu onay için İzleme Masasına gönderildi.`);
    setTimeout(() => setFeedback(null), 4000);
  }

  if (!canAccessPage("/dashboard/revize")) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs max-w-xl mx-auto my-12 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-3xl border border-amber-200 shadow-inner">
          🔒
        </div>
        <h2 className="text-lg font-bold text-slate-900">Erişim Yetkiniz Bulunmuyor</h2>
        <p className="text-xs text-slate-500">
          Mevcut rolünüz ({activeRoleDef?.label || "Rolünüz"}) Revize Yönetimi modülünü görüntüleme yetkisine sahip değildir.
        </p>
        <Link href="/dashboard" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition">
          Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

  const isRevBlurred = isSensitiveBlurred("revize");

  return (
    <div className="flex flex-col w-full max-w-[1560px] mx-auto pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 gap-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">Revize Masası</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
              {isRevBlurred ? "🔒 Kısıtlı" : `${totalPendingNotes} Bekleyen Not`}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {isRevBlurred ? "🔒 Kısıtlı" : `${totalVideosInRevize} Video`}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            İzleme, müşteri veya temsilciden gelen video revizelerini takip edin, dakika bazlı notlar ekleyin ve kurgu masasına aktarın.
          </p>
        </div>

        {/* Global studio stats */}
        <div className="flex items-center gap-2">
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Aktif Revizeler</span>
              <strong className="text-base text-amber-600 font-bold">
                {isRevBlurred ? "🔒" : totalPendingNotes}
              </strong>
            </div>
            <div className="w-px h-7 bg-slate-200" />
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Kurgudaki Videolar</span>
              <strong className="text-base text-blue-600 font-bold">
                {isRevBlurred ? "🔒" : guests.filter((g) => g.status === "editing").length}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fade-in">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-emerald-600 hover:text-emerald-900 cursor-pointer">✕</button>
        </div>
      )}

      {/* Filters row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-6">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setFilterMode("pending")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              filterMode === "pending"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Açık / Bekleyenler ({relevantGuests.filter(g => g.notes.some(n => !n.resolved) || g.status === "editing").length})
          </button>
          <button
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              filterMode === "all"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Tüm Videolar ({relevantGuests.length})
          </button>
          <button
            onClick={() => setFilterMode("resolved")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              filterMode === "resolved"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Tamamlananlar ({relevantGuests.filter(g => g.notes.length > 0 && g.notes.every(n => n.resolved)).length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Oda:</span>
          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Tüm Satış Odaları</option>
            <option value="oda-1">Oda 1</option>
            <option value="oda-2">Oda 2</option>
            <option value="oda-3">Oda 3</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Left List (40%), Right Detail & Notes (60%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* LEFT: Video Cards List */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Revize Bekleyen Videolar ({filteredGuests.length})
          </div>

          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {filteredGuests.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs">
                Filtreye uygun revize kaydı bulunamadı.
              </div>
            ) : (
              filteredGuests.map((g) => {
                const isSelected = activeGuest?.id === g.id;
                const unres = g.notes.filter((n) => !n.resolved).length;
                const res = g.notes.filter((n) => n.resolved).length;

                return (
                  <div
                    key={g.id}
                    onClick={() => setSelectedId(g.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/60 border-blue-500 ring-2 ring-blue-100 shadow-sm"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-[#0F172A] truncate">{g.name}</h3>
                          {Boolean(g.services && g.services.length > 0 && g.services.some(s => s.price > 0)) && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded border border-amber-200">
                              VIP
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {g.company} • {g.title}
                        </p>
                      </div>

                      {/* Pending notes counter */}
                      {unres > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                          {unres} Not
                        </span>
                      ) : res > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                          ✓ Bitti
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                          Not Yok
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
                      <div className="flex items-center gap-3">
                        <span>Kurgucu: <strong className="text-slate-700">{g.editor || "Gökhan"}</strong></span>
                        <span>Stüdyo: <strong className="text-slate-700">{g.studio}</strong></span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">{g.registrationNo}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: Selected Video & Revision Workstation */}
        <div className="lg:col-span-7 flex flex-col gap-4 relative">
          {/* Rol Kısıtlaması: Revize detaylarını görme yetkisi kapalıysa sağ ekranı blurla */}
          {isRevBlurred && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xs z-30 rounded-2xl flex flex-col items-center justify-center p-8 text-center border border-slate-200 shadow-md">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-3xl mb-3 shadow-inner border border-amber-200">
                🔒
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">
                Revize Detayları Rolünüze Kısıtlanmıştır
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mb-3">
                Mevcut rolünüz ({activeRoleDef?.label || "Rolünüz"}) için video revize zaman damgaları, düzeltme notları ve kurgu süreçleri gizlenmiştir.
              </p>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-mono border border-slate-200">
                Yetki Kodu: view_revision_details [KAPALI]
              </span>
            </div>
          )}

          <div className={isRevBlurred ? "filter blur-sm select-none pointer-events-none flex flex-col gap-4" : "flex flex-col gap-4"}>
          {activeGuest ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col gap-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-200 gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-[#0F172A]">{activeGuest.name}</h2>
                    <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-600">
                      {activeGuest.registrationNo}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {activeGuest.room === "oda-1" ? "Oda 1 (Ayşe Yılmaz)" : activeGuest.room === "oda-2" ? "Oda 2 (Caner Kaya)" : "Oda 3"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {activeGuest.company} — {activeGuest.title} • Çekim: {activeGuest.shootTime} • Kurgucu: <strong>{activeGuest.editor || "Gökhan"}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAddingNote(!isAddingNote)}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition"
                  >
                    <span className="text-sm font-bold">+</span> Revize Notu Ekle
                  </button>
                </div>
              </div>

              {/* Collapsible / Expandable Add Revision Note Form */}
              {isAddingNote && (
                <form
                  onSubmit={handleAddRevision}
                  className="bg-slate-50 border border-blue-200 rounded-xl p-4 flex flex-col gap-3 animate-fade-in"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Yeni Revize Notu Girişi
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingNote(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Kapat ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Video Dakikası / Zaman Damgası
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: 03:45 (boşsa 'Genel')"
                        value={newNoteTime}
                        onChange={(e) => setNewNoteTime(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 font-mono text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Not Sahibi / Rolü
                      </label>
                      <select
                        value={newNoteAuthor}
                        onChange={(e) => setNewNoteAuthor(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                      >
                        <option value="İzleme & Kalite Kontrol">İzleme & Kalite Kontrol</option>
                        <option value="Kurgu Şefi (Gökhan)">Kurgu Şefi (Gökhan)</option>
                        <option value="Müşteri Talebi">Müşteri Talebi</option>
                        <option value="Satış Temsilcisi">Satış Temsilcisi</option>
                        <option value="Yönetim">Yönetim</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Revize Notu / Açıklama
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Düzeltilmesi istenen ayrıntıyı açıkça yazın (örn: 03:45'teki alt yazı fontu küçültülecek, arka plan sesi kısılacak)..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      required
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingNote(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer transition"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer transition flex items-center gap-1.5"
                    >
                      Revizeyi Kaydet & Sevk Et
                    </button>
                  </div>
                </form>
              )}

              {/* Revision Notes List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-[#0F172A]">Kayıtlı Revizeler</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                      {pendingNotesCount} Açık • {resolvedNotesCount} Tamamlandı
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {activeNotes.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                      <p className="text-xs text-slate-500 font-medium">Bu video için henüz revize notu bulunmuyor.</p>
                      <button
                        onClick={() => setIsAddingNote(true)}
                        className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                      >
                        + İlk revize notunu ekleyin
                      </button>
                    </div>
                  ) : (
                    activeNotes.map((note) => (
                      <div
                        key={note.id}
                        className={`p-4 rounded-xl border transition-all ${
                          note.resolved
                            ? "bg-slate-50/60 border-slate-200 opacity-60"
                            : "bg-white border-amber-200 shadow-xs ring-1 ring-amber-100"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-blue-700 border border-slate-200">
                              ⏱ {note.time}
                            </span>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                              note.authorType === "client"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}>
                              {note.author}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => deleteNoteFromGuest(activeGuest.id, note.id)}
                              className="text-slate-400 hover:text-red-600 text-xs p-1 cursor-pointer transition"
                              title="Revizeyi Sil"
                            >
                              Sil ✕
                            </button>
                          </div>
                        </div>

                        <p className={`text-xs text-slate-800 leading-relaxed my-2 ${note.resolved ? "line-through text-slate-400" : ""}`}>
                          {note.text}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={note.resolved}
                              onChange={() => toggleNoteResolved(activeGuest.id, note.id)}
                              className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span className="text-[11px] font-semibold text-slate-700">
                              {note.resolved ? "✓ Revize Çözüldü" : "Çözüldü olarak işaretle"}
                            </span>
                          </label>
                          <span className="text-[10px] text-slate-400">
                            {new Date(note.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Durum: <strong className="text-slate-800">{activeGuest.status === "editing" ? "Kurguda" : activeGuest.status === "reviewing" ? "İzlemede" : activeGuest.status}</strong>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleSendToMontaj}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1.5"
                  >
                    <span>↩</span> Kurgucuya İlet
                  </button>
                  <button
                    onClick={handleSendToIzleme}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition flex items-center justify-center gap-1.5"
                  >
                    <span>✓</span> Tekrar İzlemeye Gönder
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm">
              Lütfen soldaki listeden bir video seçin.
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
