"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/useStore";
import { updateGuest } from "@/lib/store";

export default function PazarlamaPage() {
  const { guests } = useStore();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Form states
  const [videoPackage, setVideoPackage] = useState<"vip" | "free">("vip");
  const [magazinePackage, setMagazinePackage] = useState("2 Sayfa Röportaj + Ön Kapak (Business Leaders Magazine)");
  const [pressDistribution, setPressDistribution] = useState(true);
  const [amount, setAmount] = useState("60.000");
  const [paymentStatus, setPaymentStatus] = useState("Kapora Alındı (20.000 TL)");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Candidates for packaging: shoot_done, kiosk_registered, or package_set, or all non-archived
  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const q = search.toLowerCase();
      const match = g.name.toLowerCase().includes(q) || g.company.toLowerCase().includes(q);
      return match && g.status !== "archived";
    });
  }, [guests, search]);

  // Selected guest or default to first guest
  const activeGuest = useMemo(() => {
    if (selectedId) {
      const found = guests.find((g) => g.id === selectedId);
      if (found) return found;
    }
    return filteredGuests[0] || guests[0] || null;
  }, [guests, selectedId, filteredGuests]);

  function handleSelectGuest(id: string) {
    setSelectedId(id);
    const g = guests.find((item) => item.id === id);
    if (g) {
      setVideoPackage(g.vip || g.videoPackage.includes("VIP") ? "vip" : "free");
      setMagazinePackage(g.magazinePackage || "1 Sayfa Röportaj (Standart)");
      setPressDistribution(g.pressDistribution ?? true);
      setAmount(g.amount && g.amount !== "0" ? g.amount : "50.000");
      setPaymentStatus(g.paymentStatus || "Kapora Alındı (20.000 TL)");
    }
  }

  function handleSaveAndSendToEdit() {
    if (!activeGuest) return;

    updateGuest(activeGuest.id, {
      videoPackage: videoPackage === "vip" ? "VIP Kalıcı Video & Sosyal Medya Yayını" : "Ücretsiz Tek Seferlik Canlı Yayın",
      magazinePackage,
      pressDistribution,
      amount,
      paymentStatus,
      vip: videoPackage === "vip",
      status: "package_set",
    });

    setFeedback(`✓ ${activeGuest.name} paketi tanımlandı ve Montaj Panosu'ndaki 'Kurgu Bekleyen' kuyruğuna aktarıldı!`);
    setTimeout(() => setFeedback(null), 4000);
  }

  return (
    <div className="flex flex-col w-full h-full max-w-[1560px] mx-auto">
      {/* Top Context Ribbon */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
            <h1 className="text-xl font-semibold text-[#0F172A]">Pazarlama Masası</h1>
          </div>
          <span className="text-slate-400 text-sm">/</span>
          <p className="text-sm text-slate-600">Bugün tamamlanan stüdyo çekimleri ve satış paketleme</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-600">Aktif Konuk Havuzu:</span>
          <span className="text-xs font-mono text-[#0F172A] bg-slate-100 px-2 py-0.5 rounded font-semibold">
            {guests.length} Konuk
          </span>
        </div>
      </div>

      {feedback && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
            {feedback}
          </span>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 hover:text-emerald-950 font-semibold text-xs">
            Kapat
          </button>
        </div>
      )}

      {/* Main Split */}
      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0 items-start">
        {/* LEFT: Bugün Çekimi Bitenler */}
        <section className="col-span-12 lg:col-span-4 flex flex-col h-[calc(100vh-160px)] bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
          <div className="p-4 bg-slate-50/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#0F172A]">Konuk Listesi</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] bg-blue-50 text-[#2563EB] font-semibold">
                  {filteredGuests.length} Kişi
                </span>
              </div>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-base pointer-events-none">search</span>
              <input
                className="w-full h-8 pl-8 pr-3 bg-white rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#2563EB] shadow-xs border border-slate-200 transition-all"
                placeholder="Misafir veya firma ara..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {filteredGuests.map((g) => {
              const isSelected = activeGuest?.id === g.id;
              const isPackaged = ["package_set", "editing", "edit_done", "reviewing", "review_approved", "publishing"].includes(g.status);

              return (
                <article
                  key={g.id}
                  onClick={() => handleSelectGuest(g.id)}
                  className={`relative p-3.5 rounded-lg shadow-sm cursor-pointer transition-all hover:shadow group border ${
                    isSelected
                      ? "bg-blue-50/40 border-[#2563EB] ring-1 ring-[#2563EB]"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#2563EB] rounded-r-full"></div>
                  )}
                  <div className={isSelected ? "pl-2" : ""}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-semibold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                          {g.name}
                        </h3>
                        {g.vip && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            VIP
                          </span>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono shrink-0">
                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                        {g.shootTime}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 truncate mb-2.5">
                      {g.company} • {g.shootDuration}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {g.studio}
                      </span>
                      {isPackaged ? (
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[13px]">check_circle</span>
                          Paket Hazır
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#2563EB] font-semibold flex items-center gap-0.5">
                          Paket Düzenle
                          <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="p-3 bg-slate-50/70 flex items-center justify-between text-slate-500 text-[11px] border-t border-slate-200">
            <span>Toplam {filteredGuests.length} misafir kaydı listelendi</span>
            <span className="font-mono">BCT-MKT-V2</span>
          </div>
        </section>

        {/* RIGHT: Paket Tanımlama Masası */}
        {activeGuest ? (
          <main className="col-span-12 lg:col-span-8 bg-white rounded-xl shadow-sm p-7 flex flex-col justify-between border border-slate-200">
            <header className="pb-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">{activeGuest.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-amber-100 text-amber-900 font-semibold tracking-wide uppercase">
                      {activeGuest.status === "package_set" ? "Kurguya Gönderildi" : "Paket Düzenleniyor"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {activeGuest.company} — {activeGuest.title}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-50 text-xs text-slate-500 font-mono">
                    <span className="material-symbols-outlined text-[14px] text-slate-400">schedule</span>
                    Çekim Saati: {activeGuest.shootTime}
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-50 text-xs text-slate-500 font-mono">
                    <span className="material-symbols-outlined text-[14px] text-slate-400">tag</span>
                    Kayıt No: {activeGuest.registrationNo}
                  </div>
                </div>
              </div>
            </header>

            <div className="space-y-6 pt-5">
              {/* Video Paketi */}
              <fieldset className="space-y-2.5">
                <legend className="block">
                  <span className="text-base font-semibold text-[#0F172A]">Video Paketi</span>
                  <span className="text-sm text-slate-500 block mt-0.5">Stüdyo kaydının yayınlanma ve arşivlenme formatı</span>
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  <label
                    onClick={() => setVideoPackage("vip")}
                    className={`relative flex items-start gap-3.5 p-4 rounded-lg cursor-pointer transition-all shadow-xs border ${
                      videoPackage === "vip"
                        ? "bg-blue-50/30 ring-2 ring-[#2563EB] border-blue-200"
                        : "bg-white hover:bg-slate-50/50 border-slate-200"
                    }`}
                  >
                    <input
                      checked={videoPackage === "vip"}
                      onChange={() => setVideoPackage("vip")}
                      className="mt-0.5 text-[#2563EB] focus:ring-0 w-4 h-4 cursor-pointer"
                      name="video_package"
                      type="radio"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-semibold text-[#0F172A]">VIP Kalıcı Video &amp; Sosyal Medya Yayını</span>
                        <span className="material-symbols-outlined text-[#2563EB] text-base">verified</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">YouTube 4K kalıcı arşiv, Reels/Shorts kurguları, LinkedIn kesitleri dahil.</p>
                    </div>
                  </label>

                  <label
                    onClick={() => setVideoPackage("free")}
                    className={`relative flex items-start gap-3.5 p-4 rounded-lg cursor-pointer transition-all shadow-xs border ${
                      videoPackage === "free"
                        ? "bg-blue-50/30 ring-2 ring-[#2563EB] border-blue-200"
                        : "bg-white hover:bg-slate-50/50 border-slate-200"
                    }`}
                  >
                    <input
                      checked={videoPackage === "free"}
                      onChange={() => setVideoPackage("free")}
                      className="mt-0.5 text-slate-400 focus:ring-0 w-4 h-4 cursor-pointer"
                      name="video_package"
                      type="radio"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-[#0F172A]">Ücretsiz Tek Seferlik Canlı Yayın</span>
                      <p className="text-sm text-slate-500 mt-1">Sadece canlı yayın akışı, kurgusuz ham kayıt teslimi.</p>
                    </div>
                  </label>
                </div>
              </fieldset>

              {/* Basılı Dergi */}
              <div className="space-y-1.5">
                <label className="block text-base font-semibold text-[#0F172A]">Basılı Dergi Paketi</label>
                <select
                  value={magazinePackage}
                  onChange={(e) => setMagazinePackage(e.target.value)}
                  className="w-full h-11 px-3.5 bg-white rounded-lg shadow-xs cursor-pointer hover:bg-slate-50 transition-colors border border-slate-200 text-sm"
                >
                  <option value="2 Sayfa Röportaj + Ön Kapak (Business Leaders Magazine)">2 Sayfa Röportaj + Ön Kapak (Business Leaders Magazine)</option>
                  <option value="1 Sayfa Röportaj (Standart)">1 Sayfa Röportaj (Standart)</option>
                  <option value="Basılı Dergi İstemiyor">Basılı Dergi İstemiyor</option>
                </select>
              </div>

              {/* Dijital Haber Dağıtımı */}
              <div className="space-y-1.5">
                <span className="block text-base font-semibold text-[#0F172A]">Basın ve Dijital Dağıtım</span>
                <label className="flex items-start gap-3.5 p-3.5 rounded-lg bg-white hover:bg-slate-50/60 cursor-pointer transition-all shadow-xs border border-slate-200">
                  <div className="pt-0.5">
                    <input
                      checked={pressDistribution}
                      onChange={(e) => setPressDistribution(e.target.checked)}
                      className="w-4 h-4 rounded text-[#2563EB] focus:ring-0 cursor-pointer"
                      type="checkbox"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#0F172A]">15 Ulusal Basın Sitesinde Haber Dağıtımı</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-semibold">Google News İndeks</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">Hürriyet, Milliyet, HaberTürk vb. sitelerde basın bülteni yayını ve Google News indeksleme.</p>
                  </div>
                </label>
              </div>

              {/* Finans & Tahsilat */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-[#0F172A]">
                    Finans &amp; Tahsilat <span className="text-sm text-slate-500 font-normal">(Muhasebe Onayı İçin)</span>
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Anlaşılan Tutar (TL)</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-sm text-slate-400">₺</span>
                      <input
                        className="w-full h-10 pl-7 pr-3 bg-white rounded-lg text-base font-semibold text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB] shadow-xs border border-slate-200"
                        type="text"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Tahsilat Durumu</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className="w-full h-10 px-3 bg-white rounded-lg text-sm font-medium text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB] shadow-xs appearance-none cursor-pointer border border-slate-200"
                    >
                      <option value="Kapora Alındı (20.000 TL)">Kapora Alındı (20.000 TL)</option>
                      <option value="Tamamı Tahsil Edildi">Tamamı Tahsil Edildi</option>
                      <option value="Fatura Bekliyor">Fatura Bekliyor</option>
                      <option value="Tahsilat Yapılmadı">Tahsilat Yapılmadı</option>
                      <option value="Ücretsiz Çekim">Ücretsiz Çekim</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <footer className="pt-6 mt-6">
              <button
                onClick={handleSaveAndSendToEdit}
                className="w-full h-12 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all group cursor-pointer"
                type="button"
              >
                <span>SATIŞI KAYDET VE KURGUYA GÖNDER</span>
                <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
              <p className="text-center text-sm text-slate-500 mt-2 flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-slate-400">info</span>
                Onaylandığında kurgu masasına bildirim düşecek ve ham görüntüler montaja aktarılacaktır.
              </p>
            </footer>
          </main>
        ) : (
          <div className="col-span-12 lg:col-span-8 bg-white rounded-xl shadow-sm p-12 text-center text-slate-400 border border-slate-200">
            Lütfen sol listeden paket tanımlanacak bir misafir seçiniz.
          </div>
        )}
      </div>
    </div>
  );
}
