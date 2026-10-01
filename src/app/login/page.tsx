"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getStaff, setCurrentUser, setActiveRole, getRoles, setAdminOriginUser } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function normalizeStr(str?: string): string {
    if (!str) return "";
    return str.trim().toLocaleLowerCase("tr-TR");
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      const inputUser = normalizeStr(username);
      const inputPass = password.trim();
      const staffList = getStaff();
      const rolesList = getRoles();

      // 1. Personel Listesinden Kontrol Et (Kullanıcı Adı, E-Posta veya Tam Ad eşleşmesi)
      const matched = staffList.find((s) => {
        const staffUsername = normalizeStr(s.username);
        const staffEmail = normalizeStr(s.email);
        const staffName = normalizeStr(s.name);
        const userMatches =
          (staffUsername && staffUsername === inputUser) ||
          (staffEmail && staffEmail === inputUser) ||
          (staffName && staffName === inputUser);

        const staffPassword = (s.password || "bct123").trim();
        return userMatches && staffPassword === inputPass;
      });

      // 2. Süper Admin Master Fallback (gokhan / bct2026)
      const isMasterAdmin =
        (inputUser === "gokhan" || inputUser === "gokhan sahinbas" || inputUser === "gökhansahinbas") &&
        inputPass === "bct2026";

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
          // Doğrudan rol key veya label eşleştirmesi
          const foundRole = rolesList.find(
            (r) =>
              r.key === activeStaff.role ||
              r.label.toLocaleLowerCase("tr-TR") === activeStaff.role.toLocaleLowerCase("tr-TR")
          );

          if (foundRole) {
            roleKey = foundRole.key;
          } else if (activeStaff.role === "dergi_tasarimci" || activeStaff.role.includes("Dergi")) {
            roleKey = "dergi_tasarimci";
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
        setAdminOriginUser(null);
        setCurrentUser(activeStaff);
        setActiveRole(roleKey);

        // Rolüne uygun yetkili sayfaya yönlendir
        if (roleKey === "dergi_tasarimci") {
          router.push("/dashboard/dergi");
        } else if (roleKey === "kurgu") {
          router.push("/dashboard/montaj");
        } else if (roleKey === "izleme") {
          router.push("/dashboard/izleme");
        } else if (roleKey === "pazarlama") {
          router.push("/dashboard/pazarlama");
        } else if (roleKey === "cagri_temsilci" || roleKey === "cagri_sefi") {
          router.push("/dashboard/cagri-merkezi");
        } else {
          router.push("/dashboard/cagri-merkezi");
        }
      } else {
        setError("Giriş bilgileri hatalı. Kullanıcı adı, e-posta veya şifrenizi kontrol ediniz.");
        setLoading(false);
      }
    }, 350);
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
                Kullanıcı Adı / E-Posta
              </label>
              <input
                type="text"
                id="username"
                name="username"
                required
                placeholder="Kullanıcı adınız veya e-postanız"
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

          {/* Secure System Notice */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-[#64748B]">
              Hesap bilgileriniz yöneticiniz tarafından tanımlanır. Şifrenizi unuttuysanız sistem yöneticinize danışınız.
            </p>
          </div>
        </div>

        {/* Security & Version Note */}
        <div className="mt-6 text-center">
          <span className="text-xs text-[#94A3B8] font-mono">BCT-OS v2.4 · Güvenli Kimlik Doğrulama</span>
        </div>
      </main>
    </div>
  );
}
