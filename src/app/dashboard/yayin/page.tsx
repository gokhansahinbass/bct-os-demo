"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/lib/useStore";
import { updateGuestStatus } from "@/lib/store";

export default function YayinPage() {
  const { guests, canAccessPage, activeRoleDef } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [archiveState, setArchiveState] = useState<"idle" | "loading" | "done">("idle");
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Candidates for publishing: review_approved, publishing, or edit_done
  const publishCandidates = useMemo(() => {
    const list = guests.filter((g) =>
      ["review_approved", "publishing", "edit_done"].includes(g.status)
    );
    return list.length > 0 ? list : guests.filter((g) => g.status !== "archived");
  }, [guests]);

  const activeGuest = useMemo(() => {
    if (selectedId) {
      const found = guests.find((g) => g.id === selectedId);
      if (found) return found;
    }
    return publishCandidates[0] || guests[0] || null;
  }, [guests, selectedId, publishCandidates]);

  function handleArchive() {
    if (!activeGuest) return;
    if (!confirm(`${activeGuest.name} misafirinin dijital teslimat süreci tamamlanıp arşive kaldırılsın mı?`)) return;

    setArchiveState("loading");
    setTimeout(() => {
      updateGuestStatus(activeGuest.id, "archived");
      setArchiveState("done");
      setTimeout(() => setArchiveState("idle"), 3000);
    }, 800);
  }

  function handleCopyYt() {
    const content = document.getElementById("youtubeCopyContent")?.innerText;
    if (content && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(content);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    }
  }

  // Clean phone for wa.me link
  const cleanPhone = activeGuest?.phone ? activeGuest.phone.replace(/\D/g, "") : "905328401920";
  const waText = encodeURIComponent(
    `Sayın ${activeGuest?.name || "Değerli Konuğumuz"}, BCT Stüdyo çekiminiz ve dijital kartınız hazırlanmıştır. Yayın tanıtım materyalleriniz ekte yer almaktadır.`
  );

  if (!canAccessPage("/dashboard/yayin")) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs max-w-xl mx-auto my-12 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-3xl border border-amber-200 shadow-inner">
          🔒
        </div>
        <h2 className="text-lg font-bold text-slate-900">Erişim Yetkiniz Bulunmuyor</h2>
        <p className="text-xs text-slate-500">
          Mevcut rolünüz ({activeRoleDef?.label || "Rolünüz"}) Dijital Kart &amp; Yayın modülünü görüntüleme yetkisine sahip değildir.
        </p>
        <Link href="/dashboard" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition">
          Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200/60">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="text-slate-500/70">Dijital Kart &amp; Yayın</span>
          <span className="text-slate-400/40">/</span>
          <span className="font-medium text-[#2563EB]">
            {activeGuest?.name} — Dijital Teslimat ve Sosyal Medya Yayını
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Canlı Teslimat Masası
          </span>
          <span className="px-2.5 py-1 rounded-md bg-blue-50 text-[#2563EB] font-medium border border-blue-200">
            {activeGuest?.registrationNo || "#BCT-8921"}
          </span>
        </div>
      </div>

      {/* Main Split */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 mt-6 items-start">
        {/* LEFT: Queue */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Panel Header */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#0F172A]">Kart &amp; Yayın Bekleyenler</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#2563EB]">
                  {publishCandidates.length} Misafir
                </span>
              </div>
            </div>
            <p className="mt-1 text-sm text-slate-500">Kurgusu ve revizesi onaylanan teslimat işleri</p>
          </div>

          {/* Queue Cards */}
          <div className="flex flex-col gap-3">
            {publishCandidates.map((g) => {
              const isSelected = activeGuest?.id === g.id;
              return (
                <div
                  key={g.id}
                  onClick={() => setSelectedId(g.id)}
                  className={`relative rounded-xl p-4 shadow-sm cursor-pointer transition-all border ${
                    isSelected
                      ? "bg-blue-50/40 border-[#2563EB] ring-1 ring-[#2563EB]"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -left-1 top-4 bottom-4 w-1 bg-[#2563EB] rounded-r"></div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#0F172A]">{g.name}</span>
                        {Boolean(g.services && g.services.length > 0 && g.services.some(s => s.price > 0)) && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ★ VIP
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">{g.company} — {g.title}</p>
                    </div>
                    {isSelected && (
                      <span className="text-[11px] text-[#2563EB] font-medium px-2 py-0.5 bg-white/80 rounded-md">
                        İşlemde →
                      </span>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-1.5">
                    <div className="flex items-center text-[11px] text-emerald-700 font-medium">
                      <span className="material-symbols-outlined text-sm mr-1">check_circle</span>
                      İzleme Onaylandı • {g.shootTime}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200/60">
                        🎥 {g.studio}
                      </span>
                      <span className="text-[#2563EB] font-medium text-[11px]">
                        {g.status === "archived" ? "Arşivlendi" : "Hazırlanıyor"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Metrics */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="text-[11px] uppercase tracking-wider text-slate-500 mb-3 font-semibold">
              Günlük Dağıtım Hızı
            </h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <div className="text-xl font-bold text-[#2563EB]">14 dk</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Ort. Hazırlık</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <div className="text-xl font-bold text-emerald-600">%100</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Teslimat Doğruluğu</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Workstation */}
        {activeGuest ? (
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col gap-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/60">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">{activeGuest.name}</h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    ★ {activeGuest.services?.find((s) => s.type === "video")?.details?.[0]?.label || "Stüdyo Canlı Yayın"}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {activeGuest.company} — {activeGuest.title} • Çekim: {activeGuest.shootTime} • Kayıt No:{" "}
                  <span className="font-mono text-[#0F172A] font-medium">{activeGuest.registrationNo}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-blue-50 text-[#2563EB] border border-blue-200/40">
                  <span className="material-symbols-outlined text-sm">bolt</span>
                  Yayın Hazırlığı
                </span>
              </div>
            </div>

            {/* Section 1: Dijital Kart */}
            <section className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <h3 className="text-base font-semibold text-[#0F172A] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-[#2563EB] text-[11px] flex items-center justify-center font-bold">1</span>
                    Dijital Kart &amp; Kapak Görseli Yükleme
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5 ml-7">
                    Misafire gönderilecek ve YouTube / Instagram kapağında kullanılacak onaylı görsel.
                  </p>
                </div>
                <span className="text-[11px] text-[#2563EB] font-medium">Önerilen: 1920×1080 / 1080×1350</span>
              </div>
              <div className="ml-7 mt-1">
                <div className="border-2 border-dashed border-blue-300/60 hover:border-[#2563EB] bg-blue-50/10 hover:bg-blue-50/30 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group">
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-[#2563EB] group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-2xl">cloud_upload</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm text-[#0F172A] font-medium">Dijital Kart Görselini Sürükleyin (JPG/PNG)</p>
                    <p className="text-sm text-slate-500">veya bilgisayarınızdan dosya seçin • Maksimum 25 MB</p>
                  </div>
                </div>
                {/* Uploaded Preview */}
                <div className="mt-3 bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 overflow-hidden flex-shrink-0 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-xs">
                      KJ
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#0F172A] font-medium truncate">
                          BCT_{activeGuest.name.replace(/\s+/g, "")}_DigitalCard_v1.png
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <span className="material-symbols-outlined text-xs">check</span> Hazır ✓
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">2.4 MB • 1920 × 1080 px • PNG 24-bit sRGB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">Otomatik Üretildi</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: YouTube Otomasyon */}
            <section className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-[#0F172A] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-[#2563EB] text-[11px] flex items-center justify-center font-bold">2</span>
                    YouTube Otomasyon Metinleri
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5 ml-7">
                    YouTube Başlık ve Açıklaması (Misafir bilgilerinden canlı üretildi)
                  </p>
                </div>
                <div className="ml-7 sm:ml-0 flex items-center gap-2">
                  <button
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-colors shadow-xs cursor-pointer ${
                      copyFeedback
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "border-slate-200/80 bg-white text-[#0F172A] hover:bg-slate-50"
                    }`}
                    onClick={handleCopyYt}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {copyFeedback ? "check" : "content_copy"}
                    </span>
                    {copyFeedback ? "Kopyalandı!" : "Kopyala"}
                  </button>
                </div>
              </div>
              <div className="ml-7 mt-1">
                <div className="relative bg-slate-50 rounded-xl border border-slate-200 p-4 font-mono text-sm text-slate-700 leading-relaxed select-all">
                  <div className="whitespace-pre-line" id="youtubeCopyContent">{`${activeGuest.name} ile Sektörün Geleceği ve Dönüşüm Stratejileri | BCT Röportaj Serisi ${activeGuest.registrationNo}

📌 Bu bölümde ${activeGuest.company} ${activeGuest.title} Sayın ${activeGuest.name} ile stüdyomuzda bir araya geldik. Kurumsal hedefler, liderlik stratejileri ve sektör dinamiklerini konuştuk.

⏱️ Zaman Damgaları:
00:00 Giriş & Tanıtım
01:05 ${activeGuest.company} Hikayesi & Vizyon
12:40 Gelecek Stratejileri ve Yenilikler
22:15 Kapanış & Değerlendirme

🔗 Web: ${activeGuest.website || "bctmedya.com"} | IG: ${activeGuest.instagram ? "@" + activeGuest.instagram : "@bctmedya"}
#BCT #Roportaj #${activeGuest.name.replace(/\s+/g, "")} #${activeGuest.company.replace(/[^a-zA-Z0-9]/g, "")}`}</div>
                </div>
              </div>
            </section>

            {/* Section 3: WhatsApp İletişimi */}
            <section className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <h3 className="text-base font-semibold text-[#0F172A] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-[#2563EB] text-[11px] flex items-center justify-center font-bold">3</span>
                    Müşteri İletişimi &amp; WhatsApp Teslimatı
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5 ml-7">WhatsApp Yayın Bildirimi ve Dijital Kart İletimi</p>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Şablon Hazır
                </span>
              </div>
              <div className="ml-7 mt-1 flex flex-col gap-3">
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-sm text-[#0F172A] leading-relaxed">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Giden Mesaj İçeriği:
                  </div>
                  <p className="text-[#0F172A]/90 italic">
                    &ldquo;Sayın {activeGuest.name}, programınız kanalımızda yayında olacaktır. Dijital kartınız ektedir. Yayına dair tüm tanıtım materyalleriniz hazırlanmıştır.&rdquo;
                  </p>
                </div>
                <div className="bg-slate-100/70 rounded-xl border border-slate-200/60 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <span className="material-symbols-outlined text-base text-slate-500">contact_phone</span>
                    <span>
                      Alıcı: <strong className="text-[#0F172A] font-semibold">{activeGuest.phone || "+90 (500) 000 00 00"}</strong>
                    </span>
                  </div>
                  <a
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#25D366] hover:bg-[#1ebd5b] text-white text-sm font-semibold transition-all shadow-sm cursor-pointer"
                    href={`https://wa.me/${cleanPhone}?text=${waText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="material-symbols-outlined text-base leading-none">chat</span>
                    WhatsApp&apos;ta Aç ve Gönder
                  </a>
                </div>
              </div>
            </section>

            {/* Footer Action */}
            <div className="pt-6 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="material-symbols-outlined text-base text-[#2563EB]">info</span>
                <span>Tüm teslimat adımları tamamlandıktan sonra kart arşive taşınır.</span>
              </div>
              <button
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl text-white text-base font-semibold transition-all shadow-sm cursor-pointer ${
                  archiveState === "done" ? "bg-emerald-600" : "bg-[#2563EB] hover:bg-[#1D4ED8]"
                }`}
                onClick={handleArchive}
                disabled={archiveState !== "idle"}
              >
                {archiveState === "idle" && (
                  <>
                    <span>SÜRECİ TAMAMLA VE ARŞİVLE</span>
                    <span className="material-symbols-outlined text-lg leading-none">arrow_forward</span>
                  </>
                )}
                {archiveState === "loading" && (
                  <>
                    <span className="material-symbols-outlined text-lg animate-spin">refresh</span>
                    <span>İşleniyor...</span>
                  </>
                )}
                {archiveState === "done" && (
                  <>
                    <span className="material-symbols-outlined text-lg">check</span>
                    <span>Başarıyla Arşivlendi ✓</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            Yayın masasında işlemek için soldaki kuyruktan bir konuk seçiniz.
          </div>
        )}
      </div>
    </div>
  );
}
