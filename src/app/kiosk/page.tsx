"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { addGuest, updateGuest, addNotification, type SocialMedia, type Guest } from "@/lib/store";
import { useStore } from "@/lib/useStore";
import Link from "next/link";

const PLATFORM_OPTIONS = [
  { key: "instagram", label: "Instagram", icon: "IG", prefix: "@", placeholder: "kullaniciadi" },
  { key: "x", label: "X (Twitter)", icon: "X", prefix: "@", placeholder: "kullaniciadi" },
  { key: "facebook", label: "Facebook", icon: "FB", prefix: "", placeholder: "facebook.com/sayfa" },
  { key: "linkedin", label: "LinkedIn", icon: "IN", prefix: "", placeholder: "linkedin.com/in/isim" },
  { key: "youtube", label: "YouTube", icon: "YT", prefix: "", placeholder: "youtube.com/@kanal" },
  { key: "website", label: "Web Sitesi", icon: "WEB", prefix: "", placeholder: "alanadi.com" },
  { key: "phone", label: "Telefon", icon: "TEL", prefix: "+90", placeholder: "(532) 000 00 00" },
];

const MAX_VIDEO_ITEMS = 4;

export default function KioskPage() {
  const { guests } = useStore();
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [platformValues, setPlatformValues] = useState<Record<string, string>>({});
  const [showInVideo, setShowInVideo] = useState<string[]>(["instagram", "website"]);
  const [confirmed, setConfirmed] = useState(true);
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "success">("idle");
  const [lastRegNo, setLastRegNo] = useState<string>("");

  // Çağrı Merkezi Randevu Eşleştirme State'leri
  const [matchedGuest, setMatchedGuest] = useState<Guest | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionBoxRef = useRef<HTMLDivElement>(null);

  // Dışarı tıklandığında öneri kutusunu kapat
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionBoxRef.current && !suggestionBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Konuk adı yazdıkça eşleşen randevuları filtrele
  const matchingCandidates = useMemo(() => {
    if (!fullName.trim() || matchedGuest) return [];
    const q = fullName.toLowerCase().trim();
    return guests
      .filter((g) => {
        const nameMatch = g.name.toLowerCase().includes(q);
        const compMatch = (g.company || "").toLowerCase().includes(q);
        return nameMatch || compMatch;
      })
      .slice(0, 5); // En iyi 5 eşleşme
  }, [guests, fullName, matchedGuest]);

  function setPlatformValue(key: string, value: string) {
    setPlatformValues((prev) => ({ ...prev, [key]: value }));
  }

  function toggleVideoDisplay(key: string) {
    setShowInVideo((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      }
      if (prev.length >= MAX_VIDEO_ITEMS) {
        return prev;
      }
      return [...prev, key];
    });
  }

  // Önerilen listeden randevulu konuğu seçtiğinde otomatik doldur
  function handleSelectCandidate(candidate: Guest) {
    setMatchedGuest(candidate);
    setFullName(candidate.name);

    const compTitle = `${candidate.company || ""} — ${candidate.title || "Konuk"}`.trim().replace(/^—\s*|\s*—$/g, "");
    setTitle(compTitle);
    setShowSuggestions(false);

    // Sosyal medya ve iletişim verilerini doldur
    const newPlatformValues: Record<string, string> = {};
    if (candidate.phone) {
      newPlatformValues.phone = candidate.phone.replace(/^\+90\s*/, "").replace(/^0\s*/, "").trim();
    }
    if (candidate.instagram) newPlatformValues.instagram = candidate.instagram.replace(/^@/, "").trim();
    if (candidate.website) newPlatformValues.website = candidate.website;
    if (candidate.socialMedia?.x) newPlatformValues.x = candidate.socialMedia.x.replace(/^@/, "").trim();
    if (candidate.socialMedia?.linkedin) newPlatformValues.linkedin = candidate.socialMedia.linkedin;
    if (candidate.socialMedia?.facebook) newPlatformValues.facebook = candidate.socialMedia.facebook;
    if (candidate.socialMedia?.youtube) newPlatformValues.youtube = candidate.socialMedia.youtube;
    setPlatformValues((prev) => ({ ...prev, ...newPlatformValues }));

    if (candidate.socialMedia?.showInVideo && candidate.socialMedia.showInVideo.length > 0) {
      setShowInVideo(candidate.socialMedia.showInVideo);
    }
  }

  // Eşleştirmeyi temizle
  function handleClearMatch() {
    setMatchedGuest(null);
    setFullName("");
    setTitle("");
    setPlatformValues({});
  }

  const handleSubmit = useCallback(() => {
    if (!fullName.trim()) {
      alert("Lütfen ad ve soyadınızı giriniz.");
      return;
    }
    if (!title.trim()) {
      alert("Lütfen firma ve unvanınızı giriniz.");
      return;
    }
    if (!confirmed) {
      alert("Lütfen alt bant önizlemesini onaylayınız.");
      return;
    }

    setSubmitState("loading");

    setTimeout(() => {
      const parts = title.includes("—") ? title.split("—") : title.split("-");
      const companyPart = parts[0]?.trim() || title.trim();
      const titlePart = parts.length > 1 ? parts.slice(1).join("—").trim() : "Konuk";

      const socialMedia: SocialMedia = {
        instagram: (platformValues.instagram || "").replace("@", "").trim(),
        x: (platformValues.x || "").replace("@", "").trim(),
        facebook: (platformValues.facebook || "").trim(),
        linkedin: (platformValues.linkedin || "").trim(),
        youtube: (platformValues.youtube || "").trim(),
        website: (platformValues.website || "").trim(),
        phone: (platformValues.phone || "").trim(),
        showInVideo,
      };

      // ── DURUM 1: ÇAĞRI MERKEZİNDEKİ MEVCUT KONUKLA EŞLEŞTİ İSE ──
      if (matchedGuest) {
        updateGuest(matchedGuest.id, {
          name: fullName.trim(),
          company: companyPart,
          title: titlePart,
          phone: socialMedia.phone || matchedGuest.phone,
          instagram: socialMedia.instagram || matchedGuest.instagram,
          website: socialMedia.website || matchedGuest.website,
          showIg: showInVideo.includes("instagram"),
          showWeb: showInVideo.includes("website"),
          status: "kiosk_registered",
          socialMedia,
        });

        // İlgili birimlere bildirimler
        addNotification({
          to: "pazarlama",
          from: "kiosk",
          type: "guest_arrived",
          title: "Konuk Kiosk'tan Kaydoldu",
          message: `${matchedGuest.name} (${companyPart}) stüdyoya giriş yaptı. Bekleme salonunda hazır.`,
          link: "/dashboard/pazarlama",
        });

        addNotification({
          to: "reji",
          from: "kiosk",
          type: "guest_arrived",
          title: "Yeni Konuk Sıraya Girdi",
          message: `${matchedGuest.name} (${companyPart}) ${matchedGuest.studio || "Gri Stüdyo"} çekim sırasına alındı.`,
          link: "/dashboard/reji",
        });

        if (matchedGuest.representative) {
          addNotification({
            to: matchedGuest.representative,
            from: "kiosk",
            type: "guest_arrived",
            title: `Konuğunuz Geldi: ${matchedGuest.name}`,
            message: `Davet ettiğiniz konuğunuz ${matchedGuest.name} stüdyoya giriş yaptı.`,
            link: "/dashboard/odalar",
          });
        }

        setLastRegNo(matchedGuest.registrationNo);
      } else {
        // ── DURUM 2: YENİ / RANDEVUSUZ KONUK İSE ──
        const created = addGuest({
          name: fullName.trim(),
          company: companyPart,
          title: titlePart,
          phone: socialMedia.phone || "+90 (500) 000 00 00",
          instagram: socialMedia.instagram || "",
          website: socialMedia.website || "",
          showIg: showInVideo.includes("instagram"),
          showWeb: showInVideo.includes("website"),
          vip: false,
          status: "kiosk_registered",
          representative: "Kiosk Girişi (Doğrudan Geldi)",
          appointmentTime: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
          shootTime: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
          shootDuration: "25 dk",
          studio: "Gri Stüdyo",
          editor: "",
          amount: "0",
          paymentStatus: "odenmedi",
          onOdemeMiktari: 0,
          socialMedia,
        });

        setLastRegNo(created.registrationNo);
      }

      setSubmitState("success");

      setTimeout(() => {
        setFullName("");
        setTitle("");
        setPlatformValues({});
        setShowInVideo(["instagram", "website"]);
        setMatchedGuest(null);
        setSubmitState("idle");
      }, 4000);
    }, 800);
  }, [fullName, title, platformValues, showInVideo, confirmed, matchedGuest]);

  const previewName = fullName.trim() ? fullName.toUpperCase() : "MİSAFİR AD SOYAD";
  const previewTitle = title.trim() ? title : "Firma & Unvan Bilgisi (Örn: Yazılım A.Ş. — Kurucu Ortak)";

  // Önizleme için videoda gösterilecek öğeler
  const videoPreviewItems = showInVideo
    .map((key) => {
      const platform = PLATFORM_OPTIONS.find((p) => p.key === key);
      const value = platformValues[key];
      if (!platform || !value?.trim()) return null;
      return { icon: platform.icon, value: platform.prefix && !value.startsWith(platform.prefix) ? platform.prefix + value : value };
    })
    .filter(Boolean);

  return (
    <div className="bg-[#F8FAFC] text-slate-900 font-sans antialiased min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Status Pill Watermark & Dashboard Link */}
      <div className="flex items-center gap-3 mb-6">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-xs select-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-slate-700 tracking-wider uppercase">BCT Stüdyo · Misafir Kayıt Terminali</span>
          <span className="text-slate-300">|</span>
          <span className="text-xs font-medium text-emerald-600">Hazır</span>
        </div>

        <Link
          href="/dashboard/cagri-merkezi"
          className="text-xs text-slate-500 hover:text-blue-600 bg-white border border-slate-200 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 shadow-xs"
        >
          <span>Dashboard&apos;a Dön</span>
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </Link>
      </div>

      {/* Main Kiosk Container */}
      <main className="w-full max-w-5xl bg-white border border-[#E2E8F0] rounded-2xl shadow-xl shadow-slate-200/60 overflow-hidden flex flex-col md:flex-row">
        {/* LEFT COLUMN: Form */}
        <div className="w-full md:w-[55%] p-6 sm:p-8 md:p-10 flex flex-col justify-between space-y-5 bg-white">
          <div>
            <div className="mb-5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Stüdyo Kayıt Formu</h1>
              <p className="text-sm text-slate-500 mt-1">Lütfen alt bantta (KJ) yer alacak bilgilerinizi eksiksiz giriniz.</p>
            </div>

            {/* Eşleşen Randevu Bildirim Kartı */}
            {matchedGuest && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="material-symbols-outlined text-emerald-600 text-2xl shrink-0">how_to_reg</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-emerald-950 truncate">
                      ✓ Randevunuz Bulundu: {matchedGuest.name}
                    </p>
                    <p className="text-[11px] text-emerald-800 truncate">
                      {matchedGuest.company || "Şirket"} • Saat {matchedGuest.appointmentTime} (Temsilci: {matchedGuest.representative || "Çağrı Merkezi"})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearMatch}
                  className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-200/70 hover:bg-emerald-200 px-2 py-1 rounded-lg shrink-0 cursor-pointer"
                >
                  Farklı Giriş
                </button>
              </div>
            )}

            <div className="space-y-4">
              {/* Ad Soyad ve Otomatik Tamamlama / Öneri Menüsü */}
              <div className="space-y-1.5 relative" ref={suggestionBoxRef}>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700" htmlFor="input-fullname">
                    Ad Soyad <span className="text-rose-500">*</span>
                  </label>
                  {!matchedGuest && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      (Çağrı merkezinde randevunuz varsa adınızı yazınca otomatik çıkar)
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    autoComplete="off"
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-800 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-all placeholder:text-slate-400"
                    id="input-fullname"
                    placeholder="Adınızı yazmaya başlayın..."
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (matchedGuest) setMatchedGuest(null);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                  />
                  <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">
                    search
                  </span>
                </div>

                {/* Otomatik Tamamlama Öneri Listesi */}
                {showSuggestions && matchingCandidates.length > 0 && !matchedGuest && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-100 animate-fadeIn">
                    <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span>Randevulu Konuklar ({matchingCandidates.length})</span>
                      <span>Seçmek için tıklayınız</span>
                    </div>

                    {matchingCandidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        onClick={() => handleSelectCandidate(candidate)}
                        className="p-3 hover:bg-blue-50/80 transition cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700 truncate">
                            {candidate.name}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {candidate.company || "Şirketsiz"} {candidate.title ? `• ${candidate.title}` : ""}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 block">
                            Randevu: {candidate.appointmentTime || "-"}
                          </span>
                          {candidate.representative && (
                            <span className="text-[10px] text-slate-400 mt-0.5 block">
                              Temsilci: {candidate.representative}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Firma ve Resmi Unvan */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700" htmlFor="input-title">
                  Firma ve Resmi Unvan <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    autoComplete="off"
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-800 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-all placeholder:text-slate-400"
                    id="input-title"
                    placeholder="Örn: Karaca Bilişim — Kurucu Ortak"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">corporate_fare</span>
                </div>
              </div>

              {/* Platform Bilgileri */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Sosyal Medya &amp; İletişim Bilgileri</label>
                  <span className={`text-[11px] font-medium ${showInVideo.length >= MAX_VIDEO_ITEMS ? "text-amber-600" : "text-slate-400"}`}>
                    Video: {showInVideo.length}/{MAX_VIDEO_ITEMS}
                  </span>
                </div>

                {showInVideo.length >= MAX_VIDEO_ITEMS && (
                  <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
                    <span className="material-symbols-outlined text-amber-600 text-sm">warning</span>
                    Alt bantta en fazla {MAX_VIDEO_ITEMS} bilgi gösterilebilir. Daha fazla eklemek için birini kaldırın.
                  </div>
                )}

                <div className="space-y-2">
                  {PLATFORM_OPTIONS.map((platform) => {
                    const value = platformValues[platform.key] || "";
                    const isInVideo = showInVideo.includes(platform.key);
                    const isLimitReached = showInVideo.length >= MAX_VIDEO_ITEMS && !isInVideo;

                    return (
                      <div key={platform.key} className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {platform.icon}
                        </span>
                        <div className="flex-1 flex items-center rounded-lg border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-blue-600 bg-white">
                          {platform.prefix && (
                            <span className="bg-slate-50 border-r border-slate-200 px-2.5 py-2 text-slate-500 text-xs font-bold select-none shrink-0">
                              {platform.prefix}
                            </span>
                          )}
                          <input
                            className="w-full px-3 py-2 text-slate-800 text-sm focus:outline-none placeholder:text-slate-400 bg-transparent"
                            placeholder={platform.placeholder}
                            type="text"
                            value={
                              platform.prefix === "+90"
                                ? value.replace(/^\+90\s*/, "").replace(/^0\s*/, "")
                                : platform.prefix === "@"
                                ? value.replace(/^@+/, "")
                                : value
                            }
                            onChange={(e) => {
                              let val = e.target.value;
                              if (platform.prefix === "+90") {
                                val = val.replace(/^\+90\s*/, "").replace(/^0\s*/, "");
                              } else if (platform.prefix === "@") {
                                val = val.replace(/^@+/, "");
                              }
                              setPlatformValue(platform.key, val);
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleVideoDisplay(platform.key)}
                          disabled={isLimitReached}
                          className={`shrink-0 px-2 py-1.5 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                            isInVideo
                              ? "bg-blue-50 border-blue-200 text-blue-700"
                              : isLimitReached
                              ? "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed"
                              : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                          }`}
                          title={isInVideo ? "Videodan kaldır" : isLimitReached ? "Limit aşıldı" : "Videoda göster"}
                        >
                          {isInVideo ? "📺 Video" : "Ekle"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Consent */}
              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer select-none group">
                  <input checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 focus:ring-offset-0 transition-colors" type="checkbox" />
                  <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors">
                    Yukarıdaki bilgilerin doğruluğunu ve alt bantta (KJ) bu şekilde yayınlanmasını onaylıyorum.
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={handleSubmit}
              disabled={submitState === "loading" || submitState === "success"}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                submitState === "success"
                  ? "bg-emerald-600 shadow-emerald-500/25"
                  : submitState === "loading"
                  ? "bg-blue-400 cursor-wait"
                  : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-500/25 hover:shadow-blue-500/35"
              }`}
            >
              {submitState === "loading" && (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Kaydınız Alınıyor...</span>
                </>
              )}
              {submitState === "success" && (
                <>
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>Giriş Yapıldı! (Sıra No: {lastRegNo})</span>
                </>
              )}
              {submitState === "idle" && (
                <>
                  <span>{matchedGuest ? "Randevu Girişimi Onayla & Stüdyoya Bildir" : "Stüdyoya Giriş Yap"}</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Live KJ Video Preview */}
        <div className="w-full md:w-[45%] bg-[#0F172A] p-6 sm:p-8 flex flex-col justify-between text-white relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                CANLI YAYIN ALT BANT (KJ) ÖNİZLEMESİ
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded font-mono">1920x1080 FHD</span>
            </div>

            {/* Video Frame Mockup */}
            <div className="relative aspect-video w-full rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl flex flex-col justify-between p-4">
              {/* Studio Backdrop Sim */}
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-blue-950/40"></div>

              {/* Watermark / Logo */}
              <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-500">
                <span className="font-bold text-slate-400 tracking-wider">BCT STUDIO LIVE</span>
                <span className="text-red-500 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  REC
                </span>
              </div>

              {/* Simulated Guest Silhouette */}
              <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                <span className="material-symbols-outlined text-8xl text-white">person</span>
              </div>

              {/* LOWER THIRD (KJ) OVERLAY */}
              <div className="relative z-10 mt-auto">
                <div className="bg-gradient-to-r from-blue-700/95 via-blue-800/95 to-slate-900/95 backdrop-blur-md rounded-lg p-3.5 border-l-4 border-l-amber-400 shadow-xl space-y-1">
                  <p className="text-xs font-black tracking-wide text-white drop-shadow-xs truncate font-mono">
                    {previewName}
                  </p>
                  <p className="text-[11px] font-medium text-blue-200/90 drop-shadow-xs truncate">
                    {previewTitle}
                  </p>

                  {/* Dynamic Icons Bar */}
                  {videoPreviewItems.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-white/10 text-[9px]">
                      {videoPreviewItems.map((item, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 bg-black/30 px-1.5 py-0.5 rounded text-white/90 font-mono">
                          <strong className="text-amber-400 font-bold">{item?.icon}:</strong>
                          <span className="truncate max-w-[120px]">{item?.value}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-3 text-center">
              Reji ve canlı yayın operatörleri alt bantta bu önizlemeyi temel alacaktır.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800 text-center">
            <span className="text-[10px] text-slate-500">BCT Medya &amp; Prodüksiyon Canlı Kayıt Sistemi · Terminal v2.4</span>
          </div>
        </div>
      </main>
    </div>
  );
}
