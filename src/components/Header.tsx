"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/useStore";
import {
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  setAdminOriginUser,
  getAdminOriginUser,
} from "@/lib/store";
import Link from "next/link";
import ChangePasswordModal from "@/components/ChangePasswordModal";

export default function Header() {
  const {
    notifications,
    unreadCount,
    roles,
    activeRole,
    activeRoleDef,
    setActiveRole,
    currentUser,
    setCurrentUser,
    staff,
    adminOriginUser,
    isRealAdmin,
    isInPreviewMode,
    exitAdminPreview,
  } = useStore();

  const [showNotifs, setShowNotifs] = useState(false);
  const [notifTab, setNotifTab] = useState<"targeted" | "all">("targeted");
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // ── Hedefli Bildirim Filtreleme (Bana / Birimime Özel) ──
  const targetedNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (n.to === "all") return true;
      if (currentUser?.id && n.to === currentUser.id) return true;
      if (currentUser?.name && n.to.toLowerCase() === currentUser.name.toLowerCase()) return true;
      if (activeRole && n.to.toLowerCase() === activeRole.toLowerCase()) return true;
      if (activeRole === "cagri_sefi" && n.to === "cagri_sefi") return true;
      if (activeRole === "cagri_temsilci" && currentUser?.name && n.to.toLowerCase() === currentUser.name.toLowerCase()) return true;
      if (activeRole === "admin") return true;
      return false;
    });
  }, [notifications, currentUser, activeRole]);

  const myUnreadCount = useMemo(() => {
    return targetedNotifications.filter((n) => !n.read).length;
  }, [targetedNotifications]);

  const displayedNotifications = notifTab === "targeted" ? targetedNotifications : notifications;
  const displayedUnreadCount = displayedNotifications.filter((n) => !n.read).length;

  function handleRoleChange(newRole: string) {
    if (newRole === "admin") {
      exitAdminPreview();
      return;
    }

    // Eğer henüz origin admin kaydedilmediyse mevcut admin oturumunu kaydet
    const existingOrigin = adminOriginUser || getAdminOriginUser();
    if (!existingOrigin) {
      const adminStaff =
        currentUser?.role === "Süper Admin" || currentUser?.id === "usr-gokhan"
          ? currentUser
          : staff.find((s) => s.id === "usr-gokhan" || s.role === "Süper Admin") || staff[0];
      setAdminOriginUser(adminStaff);
    }

    setActiveRole(newRole);

    if (newRole === "cagri_temsilci") {
      const rep = staff.find((s) => s.id === "usr-hakan") || staff.find((s) => s.role.includes("Çağrı"));
      if (rep) setCurrentUser(rep);
    } else if (newRole === "cagri_sefi") {
      const leader = staff.find((s) => s.id === "usr-ayse") || staff.find((s) => s.isLeader);
      if (leader) setCurrentUser(leader);
    } else if (newRole === "pazarlama") {
      const marketer = staff.find((s) => s.id === "usr-selin") || staff.find((s) => s.department?.includes("Pazarlama"));
      if (marketer) setCurrentUser(marketer);
    } else if (newRole === "kurgu") {
      const editor = staff.find((s) => s.id === "usr-ahmet") || staff.find((s) => s.role.includes("Kurgu"));
      if (editor) setCurrentUser(editor);
    } else if (newRole === "dergi_tasarimci") {
      const designer = staff.find((s) => s.role.includes("Dergi")) || staff.find((s) => s.department?.includes("Dergi"));
      if (designer) setCurrentUser(designer);
    }
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  function getIcon(type: string) {
    switch (type) {
      case "guest_arrived": return "how_to_reg";
      case "task": return "assignment";
      case "warning": return "warning";
      case "success": return "check_circle";
      default: return "notifications";
    }
  }

  function getIconColor(type: string) {
    switch (type) {
      case "guest_arrived": return "text-blue-600";
      case "task": return "text-purple-600";
      case "warning": return "text-amber-600";
      case "success": return "text-emerald-600";
      default: return "text-slate-500";
    }
  }

  function getRecipientBadge(to: string) {
    if (to === "all") return "Tüm Sistem";
    if (to === "reji") return "Reji Ekibi";
    if (to === "pazarlama") return "Pazarlama";
    if (to === "kurgu") return "Kurgu & Montaj";
    if (to === "izleme") return "İzleme Masası";
    if (to === "yayin") return "Yayın Masası";
    if (to === "cagri_sefi") return "Çağrı Şefleri";
    if (to === "dergi_tasarimci") return "Dergi Ekibi";
    if (to === "ek_hizmetler") return "Ek Hizmetler";
    return `Kişiye Özel: ${to}`;
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Şimdi";
    if (mins < 60) return `${mins} dk önce`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} saat önce`;
    return `${Math.floor(hours / 24)} gün önce`;
  }

  return (
    <header className="h-14 bg-white border-b border-[#E2E8F0] px-6 flex items-center justify-between shrink-0 z-10 relative">
      {/* Left: Breadcrumb / Status / Preview Alert */}
      <div className="flex items-center gap-3 text-sm">
        <span className="text-[11px] font-mono text-slate-500">BCT-OS v2.4</span>
        <span className="text-slate-300">|</span>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium text-emerald-700">Canlı Sistem</span>
        </div>

        {isInPreviewMode && (
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
            <span className="animate-pulse">👁️</span>
            <span>Önizleme: <strong>{activeRoleDef?.label}</strong> ({currentUser?.name})</span>
            <button
              onClick={() => exitAdminPreview()}
              className="ml-1 text-[10px] bg-amber-800 hover:bg-amber-950 text-white px-2 py-0.5 rounded-full transition cursor-pointer font-bold"
              title="Önizlemeyi Sonlandır ve Admin'e Dön"
            >
              Kapat ✕
            </button>
          </div>
        )}
      </div>

      {/* Right: Role Switcher + Password Change + Notification + Time */}
      <div className="flex items-center gap-3">
        {/* Interactive Role Switcher: Gerçek Süper Admin ise VEYA Admin önizleme modundaysa HER ZAMAN görünür */}
        {(isRealAdmin || currentUser?.role === "Süper Admin" || currentUser?.username === "gokhan" || currentUser?.id === "usr-gokhan" || Boolean(adminOriginUser)) ? (
          <div className="flex items-center gap-1.5 bg-slate-100/90 border border-slate-200 px-2.5 py-1 rounded-xl shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
              <span>🛡️</span> Rol:
            </span>
            <select
              value={activeRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              title="Sistemi farklı rollerin gözünden canlı test edin"
            >
              {roles.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label} {r.key === "admin" ? "(Süper Admin)" : `(${r.department})`}
                </option>
              ))}
            </select>

            {/* Çağrı Temsilcisi Seçici (Hakan Demir, Emre Çelik vb. arasındaki yetki farkını test etmek için) */}
            {activeRole === "cagri_temsilci" && (
              <div className="flex items-center gap-1 pl-2 border-l border-slate-300 ml-1">
                <span className="text-[10px] font-bold text-blue-600">👤 Temsilci:</span>
                <select
                  value={currentUser?.id || "usr-hakan"}
                  onChange={(e) => {
                    const found = staff.find((s) => s.id === e.target.value);
                    if (found) setCurrentUser(found);
                  }}
                  className="bg-transparent text-xs font-bold text-blue-900 focus:outline-none cursor-pointer"
                  title="Hangi çağrı temsilcisinin gözünden test etmek istediğinizi seçin"
                >
                  {staff
                    .filter((s) => s.room && !s.isLeader && s.role.includes("Çağrı"))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.room === "oda-1" ? "Oda 1" : s.room === "oda-2" ? "Oda 2" : "Oda 3"})
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Çağrı Şefi Seçici (Oda 1, Oda 2, Oda 3 Şefleri Arasında Geçiş) */}
            {activeRole === "cagri_sefi" && (
              <div className="flex items-center gap-1 pl-2 border-l border-slate-300 ml-1">
                <span className="text-[10px] font-bold text-indigo-600">👑 Şef:</span>
                <select
                  value={currentUser?.id || "usr-ayse"}
                  onChange={(e) => {
                    const found = staff.find((s) => s.id === e.target.value);
                    if (found) setCurrentUser(found);
                  }}
                  className="bg-transparent text-xs font-bold text-indigo-900 focus:outline-none cursor-pointer"
                  title="Hangi oda şefinin gözünden test etmek istediğinizi seçin"
                >
                  {staff
                    .filter((s) => s.room && s.isLeader)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.room === "oda-1" ? "Oda 1" : s.room === "oda-2" ? "Oda 2" : "Oda 3"})
                      </option>
                    ))}
                </select>
              </div>
            )}

            {(activeRole !== "admin" || isInPreviewMode) && (
              <button
                onClick={() => exitAdminPreview()}
                className="text-[11px] bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded-lg font-bold shadow-xs transition flex items-center gap-1 cursor-pointer ml-1"
                title="Süper Admin Moduna Dön"
              >
                <span>🛡️</span>
                <span>Admin'e Dön</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span className="text-xs font-bold text-slate-700">{activeRoleDef?.label || "Yetkili Kullanıcı"}</span>
          </div>
        )}

        {/* Kullanıcı Profili & Şifre Değiştirme Butonu */}
        {currentUser && (
          <button
            onClick={() => setShowPasswordModal(true)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-700 hover:text-blue-700 transition-colors cursor-pointer group shadow-2xs"
            title="Giriş şifrenizi değiştirmek için tıklayın"
          >
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shadow-2xs">
              {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-left hidden lg:block leading-tight">
              <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700 truncate max-w-[110px]">
                {currentUser.name.split(" ")[0]}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">Şifre Değiştir</p>
            </div>
            <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-blue-600 transition-colors ml-0.5">
              vpn_key
            </span>
          </button>
        )}
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-[#0F172A] transition-colors cursor-pointer"
            title="Bildirimler"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {myUnreadCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                {myUnreadCount}
              </span>
            ) : unreadCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-slate-400 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            ) : null}
          </button>

          {/* Notification Dropdown */}
          {showNotifs && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)}></div>

              <div className="absolute right-0 top-12 w-[420px] bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
                {/* Dropdown Header */}
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#0F172A]">Bildirim Merkezi</span>
                    {displayedUnreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] bg-red-100 text-red-700 font-semibold">
                        {displayedUnreadCount} yeni
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllNotificationsRead()}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                    >
                      Tümünü Okundu Yap
                    </button>
                  )}
                </div>

                {/* Filter Tabs: Bana Özel vs Tüm Sistem */}
                <div className="flex border-b border-slate-200 bg-slate-100/70 p-1 gap-1">
                  <button
                    onClick={() => setNotifTab("targeted")}
                    className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      notifTab === "targeted"
                        ? "bg-white text-blue-700 shadow-xs border border-slate-200/80"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>🎯 Bana / Birimime Özel</span>
                    {myUnreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">
                        {myUnreadCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setNotifTab("all")}
                    className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      notifTab === "all"
                        ? "bg-white text-blue-700 shadow-xs border border-slate-200/80"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>🌐 Tüm Sistem Akışı</span>
                    <span className="text-[10px] text-slate-400">({notifications.length})</span>
                  </button>
                </div>

                {/* Notification List */}
                <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                  {displayedNotifications.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-3xl text-slate-300">notifications_off</span>
                      <span>Bu sekmede bildirim bulunmuyor</span>
                    </div>
                  ) : (
                    displayedNotifications.slice(0, 15).map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer group ${
                          !n.read ? "bg-blue-50/40" : ""
                        }`}
                        onClick={() => {
                          markNotificationRead(n.id);
                          if (n.link) {
                            setShowNotifs(false);
                          }
                        }}
                      >
                        <span className={`material-symbols-outlined text-lg mt-0.5 shrink-0 ${getIconColor(n.type)}`}>
                          {getIcon(n.type)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-[#0F172A] truncate">{n.title}</span>
                            {!n.read && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>}
                            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {getRecipientBadge(n.to)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block font-mono">{timeAgo(n.createdAt)}</span>
                        </div>
                        {n.link && (
                          <Link
                            href={n.link}
                            onClick={() => setShowNotifs(false)}
                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-800 self-center p-1"
                            title="Sayfaya Git"
                          >
                            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                          </Link>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(n.id);
                          }}
                          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-600 self-start p-1"
                          title="Sil"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Time */}
        <div className="flex flex-col items-end">
          <span className="text-sm font-semibold text-[#0F172A] font-mono tracking-wide">{timeStr}</span>
          <span className="text-[11px] text-slate-500 capitalize">{dateStr}</span>
        </div>
      </div>

      {/* ── Kullanıcı Şifre Değiştirme Modalı ── */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </header>
  );
}
