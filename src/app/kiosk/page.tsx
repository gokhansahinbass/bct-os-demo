"use client";

import { useState, useCallback } from "react";
import { addGuest, type SocialMedia } from "@/lib/store";
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
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [platformValues, setPlatformValues] = useState<Record<string, string>>({});
  const [showInVideo, setShowInVideo] = useState<string[]>(["instagram", "website"]);
  const [confirmed, setConfirmed] = useState(true);
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "success">("idle");
  const [lastRegNo, setLastRegNo] = useState<string>("");

  function setPlatformValue(key: string, value: string) {
    setPlatformValues((prev) => ({ ...prev, [key]: value }));
  }

  function toggleVideoDisplay(key: string) {
    setShowInVideo((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      }
      if (prev.length >= MAX_VIDEO_ITEMS) {
        return prev; // Limit aşıldı, ekleme
      }
      return [...prev, key];
    });
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
        representative: "Kiosk Girişi",
        appointmentTime: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
        shootTime: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
        shootDuration: "25 dk",
        studio: "Stüdyo A",
        editor: "",
        amount: "0",
        paymentStatus: "odenmedi",
        onOdemeMiktari: 0,
        socialMedia,
      });

      setLastRegNo(created.registrationNo);
      setSubmitState("success");

      setTimeout(() => {
        setFullName("");
        setTitle("");
        setPlatformValues({});
        setShowInVideo(["instagram", "website"]);
        setSubmitState("idle");
      }, 4000);
    }, 800);
  }, [fullName, title, platformValues, showInVideo, confirmed]);

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

            <div className="space-y-4">
              {/* Ad Soyad */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700" htmlFor="input-fullname">
                  Ad Soyad <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    autoComplete="off"
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-800 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-all placeholder:text-slate-400"
                    id="input-fullname"
                    placeholder="Örn: Selin Karaca"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                  <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">badge</span>
                </div>
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
                  <label className="text-xs font-semibold text-slate-700">Sosyal Medya & İletişim Bilgileri</label>
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
                        <div className="relative flex-1">
                          {platform.prefix && (
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium select-none">{platform.prefix}</span>
                          )}
                          <input
                            className={`w-full rounded-lg border border-slate-200 ${platform.prefix ? "pl-8" : "pl-3"} pr-3 py-2 text-slate-800 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-all placeholder:text-slate-400`}
                            placeholder={platform.placeholder}
                            type="text"
                            value={value}
                            onChange={(e) => setPlatformValue(platform.key, e.target.value)}
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
                  <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors leading-relaxed">
                    Adımın ve unvanımın yandaki önizlemedeki gibi yayınlanmasını onaylıyorum.
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button & Feedback */}
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
            <button
              className={`w-full font-semibold py-4 rounded-xl shadow-sm transition flex items-center justify-center gap-2 group cursor-pointer ${
                submitState === "success"
                  ? "bg-emerald-600 text-white"
                  : "bg-[#2563EB] text-white hover:bg-blue-700 active:scale-[0.99]"
              }`}
              onClick={handleSubmit}
              disabled={submitState !== "idle"}
              type="button"
            >
              {submitState === "idle" && (
                <>
                  <span>KAYDI TAMAMLA VE KURGUYA AKTAR</span>
                  <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </>
              )}
              {submitState === "loading" && (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                  <span>BCT-OS ÇEKİRDEĞİNE AKTARILIYOR...</span>
                </>
              )}
              {submitState === "success" && (
                <>
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  <span>KAYIT BAŞARIYLA TAMAMLANDI ({lastRegNo})</span>
                </>
              )}
            </button>

            {submitState === "success" && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn">
                <span className="material-symbols-outlined text-emerald-600 text-base">task_alt</span>
                <span>
                  <strong>{lastRegNo}</strong> numaralı kaydınız sisteme kaydedildi. Çağrı merkezi ve stüdyo ekranlarına canlı iletildi.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: TV Preview */}
        <div className="w-full md:w-[45%] bg-[#F1F5F9] p-6 sm:p-8 md:p-10 border-t md:border-t-0 md:border-l border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[18px]">live_tv</span>
                <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">CANLI ALT BANT ÖNİZLEMESİ</span>
              </div>
            </div>

            {/* TV Frame */}
            <div className="relative w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-lg aspect-video flex flex-col justify-end p-4">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 opacity-60"></div>
              <div className="absolute inset-2 border border-white/10 rounded pointer-events-none"></div>
              <div className="absolute top-2.5 right-3 text-[10px] font-mono text-white/50 tracking-wider">CAM-01 [CANLI]</div>

              {/* Lower Third */}
              <div className="relative z-10 w-full bg-white/95 backdrop-blur-md rounded-lg shadow-2xl border-l-4 border-blue-600 p-4 transition-all duration-300">
                <div className="flex flex-col">
                  <div className="text-[22px] font-bold text-slate-900 tracking-tight leading-tight uppercase truncate">
                    {previewName}
                  </div>
                  <div className="text-[15px] font-medium text-slate-600 mt-0.5 leading-snug truncate">
                    {previewTitle}
                  </div>
                  {videoPreviewItems.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-slate-100">
                      {videoPreviewItems.map((item, i) => (
                        <div key={i} className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded text-xs font-mono">
                          <span className="font-bold text-[10px] text-slate-400">{item!.icon}</span>
                          <span>{item!.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Callout */}
            <div className="mt-6 p-3.5 rounded-xl bg-white/80 border border-slate-200/90 flex items-start gap-3 shadow-xs">
              <span className="material-symbols-outlined text-blue-600 text-[20px] mt-0.5 shrink-0">verified_user</span>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bilgileriniz kurgu masasına ve yayın alt bandına harf hatası riski olmadan doğrudan bu formatta aktarılacaktır.
              </p>
            </div>
          </div>

          {/* Bottom Status */}
          <div className="pt-6 mt-6 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
            <span>BCT-OS v2.4 · Güvenli Bağlantı</span>
            <span className="font-medium font-mono">Terminal #01</span>
          </div>
        </div>
      </main>
    </div>
  );
}
