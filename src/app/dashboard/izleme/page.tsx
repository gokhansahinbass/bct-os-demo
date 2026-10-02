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
  openGuestDossier,
} from "@/lib/store";

export default function IzlemePage() {
  const { guests, canAccessPage, isSensitiveBlurred, activeRoleDef } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");
  const [newNoteTime, setNewNoteTime] = useState("00:00");
  const [approveState, setApproveState] = useState<"idle" | "loading" | "done">("idle");
  const [feedback, setFeedback] = useState<string | null>(null);

  // İzleme adayları: kurguda, kurgusu biten veya izlemede olanlar
  const reviewCandidates = useMemo(() => {
    const matched = guests.filter((g) =>
      ["edit_done", "reviewing", "review_approved", "editing"].includes(g.status)
    );
    return matched.length > 0 ? matched : guests.filter(g => g.status !== "archived");
  }, [guests]);

  const activeGuest = useMemo(() => {
    if (selectedId) {
      const g = guests.find((item) => item.id === selectedId);
      if (g) return g;
    }
    return reviewCandidates[0] || null;
  }, [guests, selectedId, reviewCandidates]);

  const notes = activeGuest?.notes || [];

  function handleToggleResolved(noteId: string) {
    if (!activeGuest) return;
    toggleNoteResolved(activeGuest.id, noteId);
  }

  function handleDeleteNote(noteId: string) {
    if (!activeGuest) return;
    deleteNoteFromGuest(activeGuest.id, noteId);
  }

  function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim() || !activeGuest) return;

    // Dakika:saniye formatını yüzdeye çevir (yaklaşık 25:30 süre baz alındı)
    const parts = newNoteTime.split(":");
    const totalSec = parseInt(parts[0] || "0") * 60 + parseInt(parts[1] || "0");
    const percent = Math.min(100, (totalSec / (25 * 60 + 30)) * 100);

    addNoteToGuest(activeGuest.id, {
      time: newNoteTime,
      percent,
      author: "Gökhan (Kurgu)",
      authorType: "staff",
      text: newNote.trim(),
      resolved: false,
    });

    setNewNote("");
  }

  function handleApprove() {
    if (!activeGuest) return;
    setApproveState("loading");

    setTimeout(() => {
      updateGuestStatus(activeGuest.id, "review_approved");
      
      // Yayın masasına bildirim
      addNotification({
        to: "yayin",
        from: "izleme",
        type: "task",
        title: `📺 Yayına Hazır: ${activeGuest.name}`,
        message: `${activeGuest.name} (${activeGuest.company}) videosu onaylandı. Yayın akışı ve dijital kart için hazır.`,
        link: "/dashboard/yayin",
      });

      // Temsilciye müjde
      if (activeGuest.representative) {
        addNotification({
          to: activeGuest.representative,
          from: "izleme",
          type: "success",
          title: `✅ Video Onaylandı: ${activeGuest.name}`,
          message: `Konuğunuz ${activeGuest.name}'ın videosu kalite kontrolünden tam not aldı ve yayın sırasına alındı.`,
          link: "/dashboard/odalar",
        });
      }

      // Genel duyuru
      addNotification({
        to: "all",
        from: "izleme",
        type: "info",
        title: "İzleme Onayı",
        message: `${activeGuest.name} videosu onaylandı ve dijital kart & yayın masasına sevk edildi.`,
        link: "/dashboard/yayin",
      });

      setApproveState("done");
      setFeedback(`✓ ${activeGuest.name} videosu onaylandı ve Dijital Kart & Yayın masasına sevk edildi.`);
      setTimeout(() => {
        setApproveState("idle");
        setFeedback(null);
      }, 4000);
    }, 700);
  }

  function handleSendBack() {
    if (!activeGuest) return;
    updateGuestStatus(activeGuest.id, "editing");

    // Kurgu ekibine ve editöre bildirim
    addNotification({
      to: "kurgu",
      from: "izleme",
      type: "task",
      title: `⚠️ Revize Talebi: ${activeGuest.name}`,
      message: `${activeGuest.name} videosu izleme masasından revize notlarıyla kurguya geri yönlendirildi.`,
      link: "/dashboard/montaj",
    });

    if (activeGuest.editor) {
      addNotification({
        to: activeGuest.editor,
        from: "izleme",
        type: "task",
        title: `⚠️ Revize Notu: ${activeGuest.name}`,
        message: `Kurguladığınız ${activeGuest.name} videosu için revize talebi var.`,
        link: "/dashboard/montaj",
      });
    }

    if (activeGuest.representative) {
      addNotification({
        to: activeGuest.representative,
        from: "izleme",
        type: "warning",
        title: `📝 Revize Talebi: ${activeGuest.name}`,
        message: `Konuğunuz ${activeGuest.name}'ın videosu için revize talebinde bulunuldu, kurgucu ilgileniyor.`,
        link: "/dashboard/revize",
      });
    }

    setFeedback(`↩ ${activeGuest.name} videosu revize için kurgu masasına geri gönderildi.`);
    setTimeout(() => setFeedback(null), 4000);
  }

  const activeCount = notes.filter((n) => !n.resolved).length;
  const resolvedCount = notes.filter((n) => n.resolved).length;

  // İzleme kuyruğu durum bilgileri
  const waitingCount = guests.filter((g) => g.status === "edit_done").length;
  const inReviewCount = guests.filter((g) => g.status === "reviewing").length;
  const approvedCount = guests.filter((g) => g.status === "review_approved").length;

  function getStatusLabel(status: string) {
    switch (status) {
      case "editing": return { text: "Kurguda", color: "bg-blue-100 text-blue-700 border-blue-200" };
      case "edit_done": return { text: "İzleme Bekliyor", color: "bg-amber-100 text-amber-700 border-amber-200" };
      case "reviewing": return { text: "İzleniyor", color: "bg-violet-100 text-violet-700 border-violet-200" };
      case "review_approved": return { text: "Onaylandı", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
      default: return { text: status, color: "bg-slate-100 text-slate-600 border-slate-200" };
    }
  }

  if (!canAccessPage("/dashboard/izleme")) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs max-w-xl mx-auto my-12 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-3xl border border-amber-200 shadow-inner">
          🔒
        </div>
        <h2 className="text-lg font-bold text-slate-900">Erişim Yetkiniz Bulunmuyor</h2>
        <p className="text-xs text-slate-500">
          Mevcut rolünüz ({activeRoleDef?.label || "Rolünüz"}) İzleme Masası modülünü görüntüleme yetkisine sahip değildir.
        </p>
        <Link href="/dashboard" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition">
          Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-[1560px] mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
          <h1 className="text-xl font-semibold text-[#0F172A]">İzleme & Revize Masası</h1>
          <span className="text-slate-400 text-sm">/</span>
          <p className="text-sm text-slate-600">Video izleme, not ekleme ve onay süreci</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
            <span className="material-symbols-outlined text-[12px]">pending</span>
            {waitingCount} Bekleyen
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200 font-medium">
            <span className="material-symbols-outlined text-[12px]">visibility</span>
            {inReviewCount} İzleniyor
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
            <span className="material-symbols-outlined text-[12px]">check_circle</span>
            {approvedCount} Onaylı
          </span>
        </div>
      </div>

      {feedback && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-base">task_alt</span>
            {feedback}
          </span>
          <button onClick={() => setFeedback(null)} className="font-semibold text-emerald-700 hover:text-emerald-900 text-xs">Kapat</button>
        </div>
      )}

      {/* Main Split */}
      <div className="grid grid-cols-12 gap-6 items-start">

        {/* LEFT: Konuk Listesi */}
        <section className="col-span-12 lg:col-span-4 flex flex-col h-[calc(100vh-160px)] bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
          <div className="p-4 bg-slate-50/50 border-b border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-base font-semibold text-[#0F172A]">İzleme Kuyruğu</h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-amber-50 text-amber-700 font-semibold">
                {reviewCandidates.length} Video
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {reviewCandidates.map((g) => {
              const isSelected = activeGuest?.id === g.id;
              const status = getStatusLabel(g.status);
              const noteCount = g.notes?.length || 0;
              const unresolvedCount = g.notes?.filter(n => !n.resolved).length || 0;

              return (
                <article
                  key={g.id}
                  onClick={() => setSelectedId(g.id)}
                  className={`relative p-3.5 rounded-lg shadow-sm cursor-pointer transition-all hover:shadow group border ${
                    isSelected
                      ? "bg-blue-50/40 border-[#2563EB] ring-1 ring-[#2563EB]"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {isSelected && <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#2563EB] rounded-r-full"></div>}
                  <div className={isSelected ? "pl-2" : ""}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className="text-sm font-semibold text-[#0F172A] group-hover:text-[#2563EB] transition-colors truncate">
                          {g.name}
                        </h3>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openGuestDossier(g.id);
                          }}
                          className="text-slate-400 hover:text-blue-600 transition p-0.5 text-xs shrink-0"
                          title="360° Konuk Dosyası ve Süreç Röntgenini Aç"
                        >
                          👁️
                        </button>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-medium whitespace-nowrap ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{g.company}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500">Kurgucu: <strong className="text-slate-700">{g.editor || "Atanmamış"}</strong></span>
                      </div>
                      {noteCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          <span className="material-symbols-outlined text-[12px]">edit_note</span>
                          {unresolvedCount > 0 ? `${unresolvedCount} açık` : `${noteCount} çözüldü`}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* RIGHT: Revize Masası */}
        {activeGuest ? (
          <main className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col">
            {/* Header */}
            <header className="pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">{activeGuest.name}</h2>
                    <button
                      type="button"
                      onClick={() => openGuestDossier(activeGuest.id)}
                      className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                      title="360° Konuk Dosyası ve Süreç Röntgenini Aç"
                    >
                      <span>360° Röntgen</span>
                      <span>👁️</span>
                    </button>
                    <span className={`text-[11px] px-2 py-0.5 rounded border font-medium ${getStatusLabel(activeGuest.status).color}`}>
                      {getStatusLabel(activeGuest.status).text}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{activeGuest.company} — {activeGuest.title}</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 rounded-md bg-slate-50 text-slate-500 border border-slate-200 font-mono">{activeGuest.registrationNo}</span>
                  <span className="px-2 py-1 rounded-md bg-slate-50 text-slate-500 border border-slate-200">
                    <span className="material-symbols-outlined text-[12px] mr-0.5 align-middle">videocam</span>
                    {activeGuest.studio}
                  </span>
                </div>
              </div>
              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
                <span>Kurgucu: <strong className="text-slate-800">{activeGuest.editor || "Atanmamış"}</strong></span>
                <span className="text-slate-300">•</span>
                <span>Çekim: {activeGuest.shootTime}</span>
                <span className="text-slate-300">•</span>
                <span>Stüdyo: {activeGuest.studio}</span>
              </div>
            </header>

            {/* Revize Notları */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-[#0F172A]">Revize Notları</h3>
                  <p className="text-xs text-slate-500">{activeCount} Aktif Not • {resolvedCount} Çözüldü</p>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  Canlı Senkron
                </span>
              </div>

              {/* Add Note */}
              <form
                className="border border-slate-200 rounded-lg p-2 flex items-center gap-2 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all mb-4"
                onSubmit={handleAddNote}
              >
                <input
                  type="text"
                  className="w-16 text-center bg-white border border-slate-200 text-blue-700 text-xs font-mono font-semibold px-1.5 py-1.5 rounded shrink-0"
                  placeholder="mm:ss"
                  value={newNoteTime}
                  onChange={(e) => setNewNoteTime(e.target.value)}
                  title="Zaman damgası (dakika:saniye)"
                />
                <input
                  className="flex-1 bg-transparent border-none text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none min-w-0"
                  placeholder="Revize notunuzu yazın (örn: Alt bant geç giriyor)..."
                  required
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3.5 py-1.5 rounded-md transition shadow-sm shrink-0 flex items-center gap-1 cursor-pointer"
                  type="submit"
                >
                  Ekle <span className="material-symbols-outlined text-sm">send</span>
                </button>
              </form>

              {/* Notes List */}
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {notes.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                    Henüz revize notu eklenmemiş. Yukarıdaki formdan ekleyebilirsiniz.
                  </div>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      className={`border rounded-lg p-3.5 transition-shadow hover:shadow-xs group ${
                        note.resolved ? "bg-slate-50/70 opacity-70 border-slate-200" : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-blue-700 text-xs font-mono font-semibold px-2 py-0.5 rounded border border-slate-200/70">
                            <span className="material-symbols-outlined text-[12px]">schedule</span>
                            {note.time}
                          </span>
                          {note.authorType === "client" ? (
                            <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200/60">
                              {note.author}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-medium">{note.author}</span>
                          )}
                        </div>
                      </div>
                      <p className={`text-sm text-slate-800 leading-relaxed mb-3 ${note.resolved ? "line-through text-slate-400" : ""}`}>
                        {note.text}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                          <input
                            className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                            type="checkbox"
                            checked={note.resolved}
                            onChange={() => handleToggleResolved(note.id)}
                          />
                          <span className="text-[11px] text-slate-600">
                            {note.resolved ? "Çözüldü ✓" : "Çözüldü olarak işaretle"}
                          </span>
                        </label>
                        <button
                          className="text-slate-400 hover:text-red-600 p-1 rounded cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteNote(note.id)}
                          title="Notu Sil"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-5 border-t border-slate-200 mt-4 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  className="py-3 px-4 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-sm font-semibold flex items-center justify-center gap-2 transition-all border border-amber-200 cursor-pointer"
                  onClick={handleSendBack}
                  disabled={!activeGuest}
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">undo</span>
                  Revize İçin Kurguya Geri Gönder
                </button>
                <button
                  className={`py-3 px-4 rounded-lg text-sm font-semibold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    approveState === "done"
                      ? "bg-emerald-600 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                  onClick={handleApprove}
                  disabled={approveState !== "idle" || !activeGuest}
                  type="button"
                >
                  {approveState === "idle" && (
                    <>
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      Onayla → Dijital Karta Gönder
                    </>
                  )}
                  {approveState === "loading" && (
                    <>
                      <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                      Aktarılıyor...
                    </>
                  )}
                  {approveState === "done" && (
                    <>
                      <span className="material-symbols-outlined text-base">check</span>
                      Dijital Kart Masasına Gönderildi ✓
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-center text-slate-500">
                Onaylandığında kurgu kilitlenir ve dijital kart ekibine bildirim gönderilir.
              </p>
            </div>
          </main>
        ) : (
          <div className="col-span-12 lg:col-span-8 bg-white rounded-xl shadow-sm p-12 text-center text-slate-400 border border-slate-200">
            İzleme kuyruğunda henüz video yok.
          </div>
        )}
      </div>
    </div>
  );
}
