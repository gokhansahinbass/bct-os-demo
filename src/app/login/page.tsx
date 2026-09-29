"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getStaff, setCurrentUser, setActiveRole, getRoles } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      const trimmedUser = username.trim().toLowerCase();
      const staffList = getStaff();
      const rolesList = getRoles();

      // 1. Personel Listesinden Kontrol Et (Admin tarafından verilen şifreler)
      const matched = staffList.find(
        (s) =>
          ((s.username && s.username.toLowerCase() === trimmedUser) ||
            s.email.toLowerCase() === trimmedUser) &&
          s.password === password
      );

      // 2. Süper Admin Master Fallback (gokhan / bct2026)
      const isMasterAdmin = trimmedUser === "gokhan" && password === "bct2026";

      if (matched || isMasterAdmin) {
        const activeStaff = matched || staffList.find((s) => s.id === "usr-gokhan") || staffList[0];
        
        if (activeStaff && activeStaff.status === "inactive") {
          setError("Hesabınız sistem yöneticisi tarafından dondurulmuştur. Lütfen yöneticinizle iletişime geçin.");
          setLoading(false);
          return;
        }

        // Rol Belirle
        let roleKey = "admin";
        if (isMasterAdmin) {
          roleKey = "admin";
        } else if (activeStaff) {
          const foundRole = rolesList.find((r) => r.label === activeStaff.role);
          if (foundRole) {
            roleKey = foundRole.key;
          } else if (activeStaff.isLeader) {
            roleKey = "cagri_sefi";
          } else if (activeStaff.role.includes("Çağrı")) {
            roleKey = "cagri_temsilci";
          } else if (activeStaff.role.includes("Pazarlama")) {
            roleKey = "pazarlama";
          } else if (activeStaff.role.includes("Kurgu") || activeStaff.role.includes("Montaj")) {
            roleKey = "kurgu";
          } else if (activeStaff.role.includes("İzleme")) {
            roleKey = "izleme";
          }
        }

        // Cookie & Session Yaz
        document.cookie = "bct_auth=granted; path=/; max-age=28800; SameSite=Lax";
        setCurrentUser(activeStaff);
        setActiveRole(roleKey);

        // Rolüne uygun sayfaya yönlendir
        if (roleKey === "kurgu") {
          router.push("/dashboard/montaj");
        } else if (roleKey === "izleme") {
          router.push("/dashboard/izleme");
        } else if (roleKey === "pazarlama") {
          router.push("/dashboard/pazarlama");
        } else {
          router.push("/dashboard/cagri-merkezi");
        }
      } else {
        setError("Kullanıcı adı veya yetkilendirilmiş şifre hatalı. Lütfen kontrol ediniz.");
        setLoading(false);
      }
    }, 400);
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen flex items-center justify-center p-4">
      <main className="w-full max-w-[420px]">
        {/* Login Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_25px_-5px_rgba(0,0,0,0.02)]">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] mb-1.5">BCT-OS</h1>
            <p className="text-sm font-medium text-[#64748B]">Stüdyo Operasyon Sistemi · Güvenli Giriş</p>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-[#334155] uppercase tracking-wider mb-1.5">
                Kullanıcı Adı veya E-Posta
              </label>
              <input
                type="text"
                id="username"
                name="username"
                required
                placeholder="Örn: gokhan veya ayse"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] transition-all duration-150 ease-in-out focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 hover:border-[#CBD5E1]"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-[#334155] uppercase tracking-wider mb-1.5">
                Admin Tarafından Verilen Şifre
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
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-semibold animate-fade-in">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] disabled:bg-[#93C5FD] text-white font-bold text-sm rounded-lg shadow-sm transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:ring-offset-2 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Doğrulanıyor...
                  </>
                ) : (
                  "Güvenli Giriş Yap"
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Helper */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <button
              onClick={() => setShowDemoAccounts(!showDemoAccounts)}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer inline-flex items-center gap-1"
            >
              <span>🔑</span>
              <span>{showDemoAccounts ? "Demo Hesapları Gizle ▲" : "Tanımlı Personel Şifrelerini Göster ▼"}</span>
            </button>

            {showDemoAccounts && (
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1.5 animate-fade-in font-mono">
                <div className="flex items-center justify-between py-0.5 border-b border-slate-200 text-slate-700 font-bold">
                  <span>Rol / Kullanıcı</span>
                  <span>Şifre</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>👑 Süper Admin: <strong>gokhan</strong></span>
                  <span className="font-bold text-blue-700">bct2026</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>👑 Oda 1 Şefi: <strong>ayse</strong></span>
                  <span className="font-bold text-blue-700">ayse123</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>👑 Oda 2 Şefi: <strong>caner</strong></span>
                  <span className="font-bold text-blue-700">caner123</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>👑 Oda 3 Şefi: <strong>elif</strong></span>
                  <span className="font-bold text-blue-700">elif123</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>📞 Çağrı Temsilcisi: <strong>hakan</strong></span>
                  <span className="font-bold text-blue-700">bct123</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>📈 Pazarlamacı: <strong>selin</strong></span>
                  <span className="font-bold text-blue-700">selin123</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>🎬 İzleme / Revize: <strong>mert</strong></span>
                  <span className="font-bold text-blue-700">mert123</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Version Note */}
        <div className="mt-6 text-center">
          <span className="text-xs text-[#94A3B8] font-mono">BCT-OS v2.4 · RBAC &amp; Granular Yetki Sistemi Aktif</span>
        </div>
      </main>
    </div>
  );
}
