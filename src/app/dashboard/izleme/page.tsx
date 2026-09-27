"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/useStore";
import {
  addNoteToGuest,
  toggleNoteResolved,
  deleteNoteFromGuest,
  updateGuestStatus,
} from "@/lib/store";

export default function IzlemePage() {
  const { guests } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTime, setActiveTime] = useState("02:14");
  const [activePercent, setActivePercent] = useState(8.76);
  const [newNote, setNewNote] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [approveState, setApproveState] = useState<"idle" | "loading" | "done">("idle");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Review candidates: edit_done, reviewing, review_approved, or all active
  const reviewCandidates = useMemo(() => {
    const matched = guests.filter((g) =>
      ["edit_done", "reviewing", "review_approved", "editing"].includes(g.status)
    );
    return matched.length > 0 ? matched : guests;
  }, [guests]);

  const activeGuest = useMemo(() => {
    if (selectedId) {
      const g = guests.find((item) => item.id === selectedId);
      if (g) return g;
    }
    return reviewCandidates[0] || guests[0] || null;
  }, [guests, selectedId, reviewCandidates]);

  const notes = activeGuest?.notes || [];

  function seekToMarker(time: string, percent: number) {
    setActiveTime(time);
    setActivePercent(percent);
  }

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

    addNoteToGuest(activeGuest.id, {
      time: activeTime,
      percent: activePercent,
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
      setApproveState("done");
      setFeedback(`✓ ${activeGuest.name} videosu onaylandı ve Dijital Kart & Yayın masasına sevk edildi.`);
      setTimeout(() => {
        setApproveState("idle");
        setFeedback(null);
      }, 4000);
    }, 700);
  }

  const activeCount = notes.filter((n) => !n.resolved).length;
  const resolvedCount = notes.filter((n) => n.resolved).length;

  return (
    <div className="flex flex-col w-full">
      {/* 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-[1720px] mx-auto items-start">
        {/* LEFT: Video Player */}
        <div className="lg:col-span-7 flex flex-col gap-3 min-w-0">
          {/* Top Meta Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-4 py-3 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></div>
              <h1 className="text-sm font-semibold text-slate-900 truncate">
                {activeGuest ? `${activeGuest.name} — Çekim Master V1 (4K)` : "Video Seçilmedi"}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                {activeGuest?.status === "review_approved" ? "Onaylandı" : "Revize Aşamasında"}
              </span>
            </div>

            {/* Guest Selector Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-400">Konuk Değiştir:</span>
              <select
                className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                value={activeGuest?.id || ""}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {reviewCandidates.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.registrationNo})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {feedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center justify-between">
              <span>{feedback}</span>
              <button onClick={() => setFeedback(null)} className="font-semibold text-emerald-700 hover:text-emerald-900">Kapat</button>
            </div>
          )}

          {/* Video Player */}
          <div className="relative w-full aspect-video rounded-xl border border-slate-200 bg-slate-900 overflow-hidden shadow-sm flex flex-col justify-between group select-none">
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900"></div>

            {/* Top overlay */}
            <div className="relative z-10 flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/60 backdrop-blur-md text-white text-xs font-mono border border-white/10 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  {activeTime} <span className="text-white/40">/</span> <span className="text-white/70">25:30</span>
                </span>
                <span className="px-2 py-1 rounded bg-black/60 backdrop-blur-md text-amber-300 text-[11px] tracking-wider border border-white/10 font-mono">
                  {isPlaying ? "PLAYING" : "PAUSED"}
                </span>
              </div>
              <div className="px-2 py-1 rounded bg-black/40 backdrop-blur-md text-white/80 text-xs font-mono border border-white/10 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-blue-400">high_quality</span>
                UHD 4K · 50 FPS
              </div>
            </div>

            {/* Center Play Button */}
            <div className="relative z-10 flex items-center justify-center">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-16 h-16 rounded-full bg-white/95 hover:bg-white text-slate-900 shadow-xl flex items-center justify-center transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-3xl ml-1">
                  {isPlaying ? "pause" : "play_arrow"}
                </span>
              </button>
            </div>

            {/* Lower third simulation in video */}
            <div className="relative z-10 mx-6 mb-2">
              <div className="bg-white/90 backdrop-blur-md rounded-md border-l-4 border-blue-600 px-3 py-1.5 shadow-lg max-w-sm">
                <div className="text-xs font-bold text-slate-900 uppercase">{activeGuest?.name}</div>
                <div className="text-[10px] text-slate-600">{activeGuest?.company} — {activeGuest?.title}</div>
              </div>
            </div>

            {/* Control Bar */}
            <div className="relative z-10 p-3.5 m-3 rounded-lg bg-slate-950/85 backdrop-blur-md border border-white/10 text-white flex flex-col gap-2.5 shadow-lg">
              {/* Progress Bar with Markers */}
              <div
                className="relative w-full h-2 bg-slate-700/80 rounded-full cursor-pointer flex items-center"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
                  const totalSec = 25 * 60 + 30;
                  const curSec = Math.floor((pct / 100) * totalSec);
                  const min = String(Math.floor(curSec / 60)).padStart(2, "0");
                  const sec = String(curSec % 60).padStart(2, "0");
                  seekToMarker(`${min}:${sec}`, pct);
                }}
              >
                <div className="h-full bg-blue-600 rounded-full relative" style={{ width: `${activePercent}%` }}>
                  <span className="absolute -right-1.5 -top-1 w-4 h-4 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform"></span>
                </div>
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full hover:scale-150 transition-transform z-20 cursor-pointer border border-slate-900 ${
                      note.resolved ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                    style={{ left: `${note.percent}%` }}
                    title={`${note.author} (${note.time}): ${note.text}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      seekToMarker(note.time, note.percent);
                    }}
                  />
                ))}
              </div>
              {/* Bottom Controls */}
              <div className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="hover:text-white p-1 rounded cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {isPlaying ? "pause" : "play_arrow"}
                    </span>
                  </button>
                  <span className="text-xs font-mono text-slate-300">
                    <span className="text-white font-medium">{activeTime}</span> / 25:30
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] text-amber-300 font-mono">
                    {notes.length} Marker Noktası
                  </span>
                  <button className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition">1.0x</button>
                  <button className="hover:text-white p-1"><span className="material-symbols-outlined text-lg">fullscreen</span></button>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata Card */}
          <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 shadow-sm flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-400 text-base">hard_drive</span>
              <span className="font-medium text-slate-900">{activeGuest?.hdd || "HDD-01"}</span>
              <span className="text-slate-300">•</span>
              <span>Kurgucu: <strong className="text-slate-800 font-semibold">{activeGuest?.editor || "Gökhan"}</strong></span>
              <span className="text-slate-300">•</span>
              <span>Çekim: <span className="text-slate-700">{activeGuest?.shootTime || "14:15"} ({activeGuest?.shootDuration || "25 dk"})</span></span>
            </div>
            <span className="font-mono text-slate-400 text-[11px]">{activeGuest?.registrationNo}</span>
          </div>
        </div>

        {/* RIGHT: Revision Notes */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col h-full min-h-[580px] justify-between">
          <div>
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 tracking-tight">
                  Revize Notları ({activeGuest?.name})
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {activeCount} Aktif Not • {resolvedCount} Çözüldü
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                Canlı Senkron
              </span>
            </div>

            {/* Add Note Input */}
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center justify-between">
                <label className="text-[11px] uppercase text-slate-600 tracking-wide flex items-center gap-1 font-medium">
                  Zaman Damgalı Not Ekle
                </label>
                <span className="text-[11px] text-slate-400 font-mono">Otomatik Zaman İğnesi: {activeTime}</span>
              </div>
              <form
                className="border border-slate-200 rounded-lg p-1.5 flex items-center gap-2 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all"
                onSubmit={handleAddNote}
              >
                <button
                  type="button"
                  className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono font-semibold px-2 py-1 rounded shrink-0 hover:bg-blue-100 transition cursor-pointer"
                  title="Şu anki zamana kilitli"
                >
                  <span className="material-symbols-outlined text-[14px]">timer</span>
                  {activeTime}
                </button>
                <input
                  className="flex-1 bg-transparent border-none text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none min-w-0"
                  placeholder="Revize notunuzu yazın (örn: Alt bant geç giriyor)..."
                  required
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <button
                  className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm px-3.5 py-1.5 rounded-md transition shadow-sm shrink-0 flex items-center gap-1 cursor-pointer"
                  type="submit"
                >
                  Ekle <span className="material-symbols-outlined text-sm">send</span>
                </button>
              </form>
            </div>
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto space-y-3 my-2 pr-1 max-h-[360px]">
            {notes.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                Henüz revize notu eklenmemiş. Yukarıdaki formdan ekleyebilirsiniz.
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className={`bg-white border rounded-lg p-3.5 hover:border-slate-300 transition-shadow hover:shadow-xs group ${
                    note.resolved ? "bg-slate-50/70 opacity-70 border-slate-200" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => seekToMarker(note.time, note.percent)}
                        className="inline-flex items-center gap-1 bg-slate-100 hover:bg-blue-50 text-blue-700 text-xs font-mono font-semibold px-2 py-0.5 rounded cursor-pointer transition border border-slate-200/70"
                      >
                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                        {note.time}
                      </button>
                      {note.authorType === "client" ? (
                        <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200/60">
                          {note.author}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-medium">{note.author}</span>
                      )}
                    </div>
                  </div>
                  <p
                    className={`text-sm text-slate-800 leading-relaxed mb-3 ${
                      note.resolved ? "line-through text-slate-400" : ""
                    }`}
                  >
                    {note.text}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                        type="checkbox"
                        checked={note.resolved}
                        onChange={() => handleToggleResolved(note.id)}
                      />
                      <span className="text-[11px] text-slate-600 group-hover:text-slate-900 transition-colors">
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

          {/* Bottom Action */}
          <div className="pt-4 border-t border-slate-200 mt-2">
            <button
              className={`w-full py-3.5 px-4 rounded-lg text-base shadow-md hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer ${
                approveState === "done"
                  ? "bg-emerald-600 text-white"
                  : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white"
              }`}
              onClick={handleApprove}
              disabled={approveState !== "idle" || !activeGuest}
              type="button"
            >
              {approveState === "idle" && (
                <>
                  <span>İZLEME ONAYLANDI</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                  <span>DİJİTAL KARTA GÖNDER</span>
                </>
              )}
              {approveState === "loading" && (
                <>
                  <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                  <span>Dijital Karta Aktarılıyor...</span>
                </>
              )}
              {approveState === "done" && (
                <>
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <span>Dijital Kart Masasına Gönderildi</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-500 mt-2.5">
              Onaylandığında video kurgusu kilitlenir ve dijital kart ekibine iletilir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
