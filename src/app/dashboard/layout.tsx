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
  const { canAccessPage, activeRole, activeRoleDef } = useStore();

  useEffect(() => {
    // Cookie kontrolü — giriş yapılmış mı?
    const hasAuth = document.cookie.split(";").some((c) => c.trim().startsWith("bct_auth=granted"));
    if (!hasAuth) {
      router.replace("/login");
    } else {
      setAuthorized(true);
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
