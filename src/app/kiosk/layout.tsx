"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const hasAuth = document.cookie.split(";").some((c) => c.trim().startsWith("bct_auth=granted"));
    if (!hasAuth) {
      router.replace("/login");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) {
    return (
      <div className="h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-[#2563EB] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return <>{children}</>;
}
