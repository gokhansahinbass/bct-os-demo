"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useStore } from "@/lib/useStore";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const {
    canAccessPage,
    activeRole,
    activeRoleDef,
    currentUser,
    isInPreviewMode,
    isRealAdmin,
    exitAdminPreview,
  } = useStore();

  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    // Cookie kontrolü — giriş yapılmış mı?
    const hasAuth = document.cookie.split(";").some((c) => c.trim().startsWith("bct_auth=granted"));
    if (!hasAuth) {
      router.replace("/login");
    } else {
      setAuthorized(true);
    }

    // Çevrimiçi / Çevrimdışı Bağlantı Durumu İzleme
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => {
        setIsOnline(true);
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 4000);
      };
      const handleOffline = () => {
        setIsOnline(false);
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, [router]);

  // Giriş yetkisi yoksa spinner göster
  if (!authorized) {
    return (
      <div className="h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-[#2563EB] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Sayfa bazlı RBAC yetki kontrolü
  const isAllowed = canAccessPage(pathname);

  function getFallbackPath() {
    if (activeRole === "dergi_tasarimci") return "/dashboard/dergi";
    if (activeRole === "kurgu") return "/dashboard/montaj";
    if (activeRole === "izleme") return "/dashboard/izleme";
    if (activeRole === "pazarlama") return "/dashboard/pazarlama";
    return "/dashboard/cagri-merkezi";
  }

  return (
    <div className="h-screen overflow-hidden flex">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        <Header />

        {/* ── Admin Rol Önizleme / Canlı Teftiş Modu Banner'ı ── */}
        {isInPreviewMode && (
          <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white text-xs font-semibold px-5 py-2.5 flex items-center justify-between shadow-md z-30 shrink-0 border-b border-amber-500/50">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center text-sm font-bold shrink-0">
                👁️
              </div>
              <div className="text-xs leading-tight">
                <span className="font-bold uppercase tracking-wider text-amber-200">Admin Rol Önizleme / Teftiş:</span>
                <span className="mx-2 text-amber-300">|</span>
                <span>
                  Şu anda <strong className="text-white">{activeRoleDef?.label}</strong> ({currentUser?.name}) rolünü canlı inceliyorsunuz.
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                exitAdminPreview();
                router.push("/dashboard/admin");
              }}
              className="bg-white hover:bg-amber-50 text-amber-900 font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 transition cursor-pointer shrink-0"
              title="Önizlemeyi bitirip Süper Admin paneline dön"
            >
              <span>🛡️</span>
              <span>Önizlemeyi Bitir ve Admin'e Dön</span>
            </button>
          </div>
        )}

        {/* ── Offline-First Bilgilendirme Banner'ı ── */}
        {!isOnline && (
          <div className="bg-amber-600 text-white text-xs font-semibold px-4 py-2 flex items-center justify-between shadow-xs z-20 shrink-0">
            <div className="flex items-center gap-2">
              <span className="animate-pulse">⚠️</span>
              <span>
                <strong>Çevrimdışı Mod (Offline-First):</strong> İnternet bağlantınız koptu. Tüm değişiklikler yerel olarak güvenle saklanmaktadır. Bağlantı geldiğinde bulut ile otomatik eşitlenecektir.
              </span>
            </div>
            <span className="text-[10px] font-mono bg-amber-700/90 px-2 py-0.5 rounded">YEREL DEPOLAMA DEVREDE</span>
          </div>
        )}

        {showReconnected && (
          <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 flex items-center justify-between shadow-xs z-20 shrink-0">
            <div className="flex items-center gap-2">
              <span>✓</span>
              <span>
                <strong>Bağlantı Kuruldu:</strong> İnternet erişimi yeniden sağlandı. Veriler Supabase bulut veritabanı ile canlı eşitleniyor.
              </span>
            </div>
            <span className="text-[10px] font-mono bg-emerald-700/90 px-2 py-0.5 rounded">CANLI BULUT SENKRON</span>
          </div>
        )}

        <main className="flex-1 bg-[#F8FAFC] p-8 overflow-y-auto">
          {!isAllowed ? (
            <div className="h-full min-h-[500px] flex items-center justify-center p-4">
              <div className="max-w-md w-full bg-white border border-red-200/90 rounded-2xl p-8 shadow-sm text-center">
                <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100 shadow-2xs">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-[#0F172A] mb-1.5">Yetkisiz Sayfa Erişimi</h2>
                <p className="text-sm text-[#64748B] mb-3">
                  Bu modüle doğrudan bağlantı (URL) üzerinden erişiminiz sistem güvenlik ilkeleri gereğince engellenmiştir.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 mb-6">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Mevcut Rolünüz:</span>
                  <span className="text-blue-700 font-bold">{activeRoleDef?.label || activeRole}</span>
                </div>
                <div>
                  <button
                    onClick={() => router.push(getFallbackPath())}
                    className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white font-bold text-sm rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>←</span>
                    <span>Yetkili Çalışma Alanıma Dön</span>
                  </button>

                  {(isInPreviewMode || isRealAdmin) && (
                    <button
                      onClick={() => {
                        exitAdminPreview();
                        router.push("/dashboard/admin");
                      }}
                      className="w-full mt-2.5 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-sm rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>🛡️</span>
                      <span>Önizlemeyi Sonlandır ve Süper Admin'e Dön</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
