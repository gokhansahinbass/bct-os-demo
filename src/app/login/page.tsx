"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 🔐 Demo Giriş Bilgileri — sadece sen bileceksin
const VALID_USERNAME = "gokhan";
const VALID_PASSWORD = "bct2026";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Kısa gecikme — gerçekçi his vermesi için
    setTimeout(() => {
      if (username.trim().toLowerCase() === VALID_USERNAME && password === VALID_PASSWORD) {
        // Cookie yaz — diğer sayfalar kontrol edecek
        document.cookie = "bct_auth=granted; path=/; max-age=28800; SameSite=Lax";
        router.push("/dashboard/cagri-merkezi");
      } else {
        setError("Kullanıcı adı veya şifre hatalı.");
        setLoading(false);
      }
    }, 400);
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen flex items-center justify-center p-4">
      <main className="w-full max-w-[400px]">
        {/* Login Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_25px_-5px_rgba(0,0,0,0.02)]">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] mb-1.5">BCT-OS</h1>
            <p className="text-sm font-medium text-[#64748B]">Stüdyo Operasyon Sistemi</p>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-[#334155] uppercase tracking-wider mb-1.5">
                Kullanıcı Adı
              </label>
              <input
                type="text"
                id="username"
                name="username"
                required
                placeholder="kullanici.adi"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] transition-all duration-150 ease-in-out focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 hover:border-[#CBD5E1]"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-[#334155] uppercase tracking-wider mb-1.5">
                Şifre
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] transition-all duration-150 ease-in-out focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 hover:border-[#CBD5E1]"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] disabled:bg-[#93C5FD] text-white font-medium text-sm rounded-lg shadow-sm transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:ring-offset-2 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Giriş Yapılıyor...
                  </>
                ) : (
                  "Giriş Yap"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Version Note */}
        <div className="mt-6 text-center">
          <span className="text-xs text-[#94A3B8] font-mono">BCT-OS v2.4 · Güvenli Bağlantı</span>
        </div>
      </main>
    </div>
  );
}
