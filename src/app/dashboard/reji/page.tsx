"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/lib/useStore";
import { type Guest, openGuestDossier } from "@/lib/store";
import StudioDelayBanner from "@/components/StudioDelayBanner";
import StudioDelayModal from "@/components/StudioDelayModal";
import UpdateTimeModal from "@/components/UpdateTimeModal";

export default function RejiPage() {
  const {
    guests,
    canAccessPage,
    activeRoleDef,
    studioDelays,
    clearStudioDelay,
    sendStudioReadyCall,
    assignGuestToStudio,
    completeStudioShoot,
  } = useStore();

  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [lastCallStudio, setLastCallStudio] = useState<string | null>(null);
  const [delayModalStudio, setDelayModalStudio] = useState<"Gri Stüdyo" | "Orta Stüdyo" | null>(null);
  const [updateTimeGuest, setUpdateTimeGuest] = useState<Guest | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  // Web Audio API ile kibar TV reji anons zili (Ding-Dong) çalma
  function playStudioChime() {
    try {
      if (typeof window === "undefined") return;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, now + 0.2); // A5
      gain2.gain.setValueAtTime(0.18, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.8);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Gri Stüdyoda şu anda çekimde olan konuk
  const griStudioGuest = useMemo(() => {
    return guests.find((g) => g.status === "in_studio" && g.studio === "Gri Stüdyo");
  }, [guests]);

  // Orta Stüdyoda şu anda çekimde olan konuk
  const ortaStudioGuest = useMemo(() => {
    return guests.find((g) => g.status === "in_studio" && g.studio === "Orta Stüdyo");
  }, [guests]);

  // Bekleme Salonunda Olanlar (Kiosk kaydı yapılmış veya randevu saati gelmiş olanlar)
  const waitingGuests = useMemo(() => {
    return guests.filter((g) => ["kiosk_registered", "appointment_set"].includes(g.status));
  }, [guests]);

  // Arama filtresi
  const filteredWaiting = useMemo(() => {
    if (!search.trim()) return waitingGuests;
    const q = search.toLowerCase();
    return waitingGuests.filter(
      (g) => g.name.toLowerCase().includes(q) || g.company.toLowerCase().includes(q) || g.representative.toLowerCase().includes(q)
    );
  }, [waitingGuests, search]);

  // Çekimi Tamamlanıp Kurguya Gidenler (Bugün)
  const completedToday = useMemo(() => {
    return guests.filter((g) => ["shoot_done", "editing", "edit_done", "review_approved"].includes(g.status));
  }, [guests]);

  // ── REJİ AKSİYONU 1: Stüdyo Boş Çağrısı Yayınla ──
  function handleStudioCall(studioName: "Gri Stüdyo" | "Orta Stüdyo") {
    sendStudioReadyCall(studioName);
    playStudioChime();
    setLastCallStudio(studioName);
    showToast(`📢 ${studioName} Boş Çağrısı Gönderildi! Bekleme salonuna bildirim iletildi.`);
    setTimeout(() => setLastCallStudio(null), 6000);
  }

  // ── REJİ AKSİYONU 2: Bekleme Salonundan Konuğu Stüdyoya Çek ──
  function handleTakeToStudio(guestId: string, studioName: "Gri Stüdyo" | "Orta Stüdyo") {
    const g = guests.find((item) => item.id === guestId);
    if (!g) return;

    assignGuestToStudio(guestId, studioName);
    playStudioChime();
    showToast(`🎬 ${g.name} (${g.company}) ${studioName}'ya çekime alındı!`);
  }

  // ── REJİ AKSİYONU 3: Çekimi Tamamla → Kurguya Gönder ──
  function handleFinishShoot(guestId: string) {
    const g = guests.find((item) => item.id === guestId);
    if (!g) return;

    completeStudioShoot(guestId);
    showToast(`✅ ${g.name} çekimi tamamlandı ve Montaj Masası'na aktarıldı.`);
  }

  // RBAC Kontrolü
  if (!canAccessPage("/dashboard/reji")) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs max-w-xl mx-auto my-12 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-3xl border border-amber-200 shadow-inner">
          🔒
        </div>
        <h2 className="text-lg font-bold text-slate-900">Erişim Yetkiniz Bulunmuyor</h2>
        <p className="text-xs text-slate-500">
          Mevcut rolünüz ({activeRoleDef?.label || "Rolünüz"}) Reji &amp; Stüdyo Komuta Masasını görüntüleme yetkisine sahip değildir.
        </p>
        <Link href="/dashboard" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition">
          Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full relative pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-xl border border-slate-700 shadow-2xl text-sm font-medium animate-fadeIn">
          <span className="material-symbols-outlined text-blue-400 text-[20px]">campaign</span>
          <span>{toast}</span>
        </div>
      )}

      {/* TOP CONTEXT & HEADING */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px] uppercase tracking-wider">Stüdyo Prodüksiyon</span>
            <span className="text-slate-400 text-[11px]">/</span>
            <span className="text-blue-600 text-[11px] font-semibold">Reji &amp; Stüdyo Komuta Masası</span>
          </div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reji &amp; Stüdyo Yönetimi</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 text-[11px] border border-red-200">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
              REJİ CANLI YAYIN
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Gri Stüdyo ve Orta Stüdyo canlı çekim durumu, stüdyo boş çağrıları ve bekleme salonundan konuk daveti.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/montaj"
            className="h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition"
          >
            <span className="material-symbols-outlined text-[16px] text-blue-600">movie_edit</span>
            Montaj Panosuna Git →
          </Link>
          <div className="h-9 px-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">headset_mic</span>
            <span>Reji Masası Aktif</span>
          </div>
        </div>
      </section>

      {/* ── CANLI ÇAĞRI FLASH BANNER'I (Son Gönderilen Çağrı) ── */}
      {lastCallStudio && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white shadow-md flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📢</span>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider">{lastCallStudio} BOŞ — ÇEKİM ALABİLİRİZ!</h3>
              <p className="text-xs text-amber-100 mt-0.5">
                Çağrı tüm karşılama ve bekleme salonu ekranlarına iletildi. Lütfen sıradaki konuğu stüdyoya alınız.
              </p>
            </div>
          </div>
          <button
            onClick={() => setLastCallStudio(null)}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition"
          >
            Kapat ✕
          </button>
        </div>
      )}

      {/* ── STÜDYO SARKMA / GECİKME UYARI BANNER'I ── */}
      <StudioDelayBanner />

      {/* ══════════════════════════════════════════════════════════
          BÖLÜM 1: STÜDYO CANLI MONİTÖRLERİ (GRİ STÜDYO & ORTA STÜDYO)
          ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* ── GRİ STÜDYO MONİTÖRÜ ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-blue-400"></span>
              <div>
                <h2 className="text-base font-bold tracking-tight">Gri Stüdyo</h2>
                <span className="text-[10px] text-slate-400 font-mono">Ana Canlı Yayın Stüdyosu</span>
              </div>
            </div>
            {griStudioGuest ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white shadow-2xs animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white"></span>
                🔴 ÇEKİMDE (ON-AIR)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                🟢 BOŞ / HAZIR
              </span>
            )}
          </div>

          <div className="p-6 flex-1 flex flex-col justify-between gap-5">
            {griStudioGuest ? (
              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Şu An Çekimdeki Konuk</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <h3 className="text-lg font-bold text-slate-900">{griStudioGuest.name}</h3>
                        <button
                          type="button"
                          onClick={() => openGuestDossier(griStudioGuest.id)}
                          className="px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-bold inline-flex items-center gap-1 border border-blue-200 transition"
                          title="360° Konuk Dosyası ve Süreç Röntgenini Aç"
                        >
                          <span>360° Röntgen</span>
                          <span>👁️</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-600">{griStudioGuest.company} — {griStudioGuest.title}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold font-mono">
                      {griStudioGuest.registrationNo}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                    <span>🎬 Çekim Başlangıcı: <strong className="text-slate-900">{griStudioGuest.shootTime || "Şimdi"}</strong></span>
                    <span>📞 Temsilci: <strong className="text-slate-900">{griStudioGuest.representative}</strong></span>
                  </div>
                </div>

                {/* Gri Stüdyo Çekim Sarkması Durumu / Bildir Butonu */}
                {studioDelays["Gri Stüdyo"]?.active ? (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-950">
                    <div className="flex items-center gap-2">
                      <span className="text-base animate-pulse">⚠️</span>
                      <div>
                        <span className="font-extrabold">Çekim Sarktı: +{studioDelays["Gri Stüdyo"].delayMinutes} dk</span>
                        <p className="text-[11px] text-amber-800">
                          {studioDelays["Gri Stüdyo"].reason} ({studioDelays["Gri Stüdyo"].reportedAt})
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => clearStudioDelay("Gri Stüdyo")}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-2xs transition cursor-pointer"
                    >
                      Normale Döndü ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDelayModalStudio("Gri Stüdyo")}
                    className="w-full py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-amber-700">timer</span>
                    <span>⏱️ Stüdyo Çekim Sarkması / Gecikme Bildir (+15 dk vb.)</span>
                  </button>
                )}

                <button
                  onClick={() => handleFinishShoot(griStudioGuest.id)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  ✅ Çekimi Tamamla → Kurgu Sırasına Gönder
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-xl gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl font-bold">
                  🎥
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Gri Stüdyo Şu Anda Boş</h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-0.5">
                    Yeni bir çekim başlatabilir veya bekleme salonuna &quot;Gri Stüdyo Boş — Çekim Alabiliriz&quot; bildirimi gönderebilirsiniz.
                  </p>
                </div>
                <button
                  onClick={() => handleStudioCall("Gri Stüdyo")}
                  className="mt-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">campaign</span>
                  📢 GRİ STÜDYO BOŞ — ÇEKİM ALABİLİRİZ
                </button>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Konuk Stüdyosu: Gri Stüdyo</span>
              <span className="font-mono">Canlı Sinyal: Aktif</span>
            </div>
          </div>
        </div>

        {/* ── ORTA STÜDYO MONİTÖRÜ ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-purple-400"></span>
              <div>
                <h2 className="text-base font-bold tracking-tight">Orta Stüdyo</h2>
                <span className="text-[10px] text-slate-400 font-mono">Özel Röportaj &amp; Çekim Alanı</span>
              </div>
            </div>
            {ortaStudioGuest ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white shadow-2xs animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white"></span>
                🔴 ÇEKİMDE (ON-AIR)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                🟢 BOŞ / HAZIR
              </span>
            )}
          </div>

          <div className="p-6 flex-1 flex flex-col justify-between gap-5">
            {ortaStudioGuest ? (
              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Şu An Çekimdeki Konuk</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <h3 className="text-lg font-bold text-slate-900">{ortaStudioGuest.name}</h3>
                        <button
                          type="button"
                          onClick={() => openGuestDossier(ortaStudioGuest.id)}
                          className="px-2 py-0.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded text-xs font-bold inline-flex items-center gap-1 border border-purple-200 transition"
                          title="360° Konuk Dosyası ve Süreç Röntgenini Aç"
                        >
                          <span>360° Röntgen</span>
                          <span>👁️</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-600">{ortaStudioGuest.company} — {ortaStudioGuest.title}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 text-xs font-bold font-mono">
                      {ortaStudioGuest.registrationNo}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                    <span>🎬 Çekim Başlangıcı: <strong className="text-slate-900">{ortaStudioGuest.shootTime || "Şimdi"}</strong></span>
                    <span>📞 Temsilci: <strong className="text-slate-900">{ortaStudioGuest.representative}</strong></span>
                  </div>
                </div>

                {/* Orta Stüdyo Çekim Sarkması Durumu / Bildir Butonu */}
                {studioDelays["Orta Stüdyo"]?.active ? (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-950">
                    <div className="flex items-center gap-2">
                      <span className="text-base animate-pulse">⚠️</span>
                      <div>
                        <span className="font-extrabold">Çekim Sarktı: +{studioDelays["Orta Stüdyo"].delayMinutes} dk</span>
                        <p className="text-[11px] text-amber-800">
                          {studioDelays["Orta Stüdyo"].reason} ({studioDelays["Orta Stüdyo"].reportedAt})
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => clearStudioDelay("Orta Stüdyo")}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-2xs transition cursor-pointer"
                    >
                      Normale Döndü ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDelayModalStudio("Orta Stüdyo")}
                    className="w-full py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-amber-700">timer</span>
                    <span>⏱️ Stüdyo Çekim Sarkması / Gecikme Bildir (+15 dk vb.)</span>
                  </button>
                )}

                <button
                  onClick={() => handleFinishShoot(ortaStudioGuest.id)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  ✅ Çekimi Tamamla → Kurgu Sırasına Gönder
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-xl gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl font-bold">
                  🎬
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Orta Stüdyo Şu Anda Boş</h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-0.5">
                    Yeni bir çekim başlatabilir veya bekleme salonuna &quot;Orta Stüdyo Boş — Çekim Alabiliriz&quot; bildirimi gönderebilirsiniz.
                  </p>
                </div>
                <button
                  onClick={() => handleStudioCall("Orta Stüdyo")}
                  className="mt-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">campaign</span>
                  📢 ORTA STÜDYO BOŞ — ÇEKİM ALABİLİRİZ
                </button>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Konuk Stüdyosu: Orta Stüdyo</span>
              <span className="font-mono">Canlı Sinyal: Aktif</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          BÖLÜM 2: BEKLEME SALONU KUYRUĞU (STÜDYOYA DAVET ET)
          ══════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-slate-900">Bekleme Salonu Kuyruğu</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                {waitingGuests.length} Konuk Bekliyor
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kiosk terminalinde giriş yapmış veya randevu saati gelen konuklar. Reji stüdyo boş çağrısı verdiğinde tek tıkla stüdyoya alabilirsiniz.
            </p>
          </div>

          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">search</span>
            <input
              type="text"
              placeholder="Bekleyen konuk ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs w-64 focus:bg-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {filteredWaiting.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 mt-4">
            Bekleme salonunda bekleyen konuk bulunmuyor.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 mt-2">
            {filteredWaiting.map((g) => (
              <div key={g.id} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 p-2 rounded-xl transition">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm shrink-0 border border-amber-200">
                    👤
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openGuestDossier(g.id)}
                        className="text-sm font-bold text-slate-900 hover:text-blue-600 hover:underline transition text-left flex items-center gap-1"
                        title="360° Konuk Dosyasını Aç"
                      >
                        <span>{g.name}</span>
                        <span className="text-xs text-blue-600">👁️</span>
                      </button>
                      {g.vip && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          ⭐ VIP
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-400">{g.registrationNo}</span>
                      {g.timeStatus === "gecikmeli" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <span>⏳</span>
                          <span>Geç Gelecek</span>
                        </span>
                      )}
                      {g.timeStatus === "erken_geldi" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                          <span>⚡</span>
                          <span>Erken Geldi</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {g.company} — {g.title} • Randevu: <strong className="text-slate-900">{g.appointmentTime || "14:00"}</strong>
                      {g.timeUpdateReason && (
                        <span className="text-amber-700 italic ml-1">({g.timeUpdateReason})</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-slate-500 mr-1 hidden sm:inline">
                    Temsilci: <strong>{g.representative}</strong>
                  </span>

                  <button
                    onClick={() => setUpdateTimeGuest(g)}
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                    title="Konuğun randevu saatini veya geliş beyanını güncelle"
                  >
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    <span className="hidden sm:inline">Saat / Beyan</span>
                  </button>

                  <button
                    onClick={() => handleTakeToStudio(g.id, "Gri Stüdyo")}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                  >
                    <span>🎥</span>
                    <span>Gri Stüdyoya Al</span>
                  </button>

                  <button
                    onClick={() => handleTakeToStudio(g.id, "Orta Stüdyo")}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                  >
                    <span>🎬</span>
                    <span>Orta Stüdyoya Al</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          BÖLÜM 3: BUGÜN ÇEKİMİ TAMAMLANANLAR (KURGUYA GİDENLER)
          ══════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Çekimi Tamamlanan Konuklar ({completedToday.length})</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Stüdyo çekimi bitmiş ve montaj/kurgu aşamasına aktarılmış konuk dökümü.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">Konuk &amp; Firma</th>
                <th className="py-2.5 px-3">Stüdyo</th>
                <th className="py-2.5 px-3">Çekim Saati</th>
                <th className="py-2.5 px-3">Kurgucu</th>
                <th className="py-2.5 px-3">Mevcut Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {completedToday.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-3">
                    <button
                      type="button"
                      onClick={() => openGuestDossier(g.id)}
                      className="text-slate-900 font-bold block text-left hover:text-blue-600 hover:underline flex items-center gap-1"
                      title="360° Konuk Dosyasını Aç"
                    >
                      <span>{g.name}</span>
                      <span className="text-xs text-blue-600 font-normal">👁️</span>
                    </button>
                    <span className="text-[11px] text-slate-500 block">{g.company}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {g.studio}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700">
                    {g.shootTime || "14:15"}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-slate-800 font-medium">{g.editor || "Atanacak"}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {g.status === "review_approved"
                        ? "İzleme Onaylandı"
                        : g.status === "editing"
                        ? "Kurgulanıyor"
                        : "Kurgu Bekliyor"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Stüdyo Çekim Sarkması / Gecikme Modalı ── */}
      {delayModalStudio && (
        <StudioDelayModal
          isOpen={Boolean(delayModalStudio)}
          studioName={delayModalStudio}
          currentDelay={studioDelays[delayModalStudio]}
          onClose={() => setDelayModalStudio(null)}
          onSuccess={(msg) => showToast(msg)}
        />
      )}

      {/* ── Konuk Randevu Saati & Beyan Güncelleme Modalı ── */}
      {updateTimeGuest && (
        <UpdateTimeModal
          isOpen={Boolean(updateTimeGuest)}
          guest={updateTimeGuest}
          onClose={() => setUpdateTimeGuest(null)}
          onSuccess={(msg) => showToast(msg)}
        />
      )}
    </div>
  );
}
