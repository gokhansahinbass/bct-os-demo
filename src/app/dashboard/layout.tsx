"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Cookie kontrolü — giriş yapılmış mı?
    const hasAuth = document.cookie.split(";").some((c) => c.trim().startsWith("bct_auth=granted"));
    if (!hasAuth) {
      router.replace("/login");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  // Yetkisizse boş ekran göster (login'e yönlenirken)
  if (!authorized) {
    return (
      <div className="h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-[#2563EB] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 bg-[#F8FAFC] p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
