"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("Dashboard Hatası:", error);
    }
  }, [error]);

  return (
    <div className="h-full min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-xs text-center">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-[#0F172A] mb-1.5">Bu Sayfada Bir Sorun Oluştu</h3>
        <p className="text-xs text-[#64748B] mb-5">
          Verileriniz güvendedir. Sayfayı yenileyerek işleme devam edebilirsiniz.
        </p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          Modülü Yeniden Yükle
        </button>
      </div>
    </div>
  );
}
