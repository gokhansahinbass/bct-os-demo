"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/useStore";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  addStaff,
  toggleStaffStatus,
  deleteStaff,
  updateStaffPassword,
  updateStaff,
  resetToDefaults,
  addRole,
  updateRole,
  deleteRole,
  PERMISSION_GROUPS,
  type RoleDefinition,
} from "@/lib/store";

export default function AdminPage() {
  const { staff, guests, roles, rooms, canAccessPage } = useStore();
  const [activeTab, setActiveTab] = useState<"staff" | "rbac" | "system">("staff");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);

  if (!canAccessPage("/dashboard/admin")) {
    return null;
  }

  // ── Personel Listesi State ──
  const [search, setSearch] = useState("");
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("bct123");
  const [roleSelect, setRoleSelect] = useState("cagri_temsilci");
  const [roomSelect, setRoomSelect] = useState("oda-1");

  // Şifre Gösterme / Gizleme (Satır Bazlı)
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // Şifre Değiştirme Modalı
  const [passwordModal, setPasswordModal] = useState<{
    open: boolean;
    staffId: string;
    staffName: string;
    currentUsername: string;
    newPassword: string;
  }>({
    open: false,
    staffId: "",
    staffName: "",
    currentUsername: "",
    newPassword: "",
  });

  // ── RBAC Matrisi State ──
  const [matrixCategory, setMatrixCategory] = useState<"pages" | "rooms" | "sensitive">("pages");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRoleLabel, setNewRoleLabel] = useState("");
  const [newRoleDept, setNewRoleDept] = useState("Teknik & Operasyon");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRoleColor, setNewRoleColor] = useState("blue");
  const [newRolePerms, setNewRolePerms] = useState<Record<string, boolean>>({
    cagri: false,
    odalar: false,
    pazarlama: false,
    montaj: false,
    izleme: false,
    revize: false,
    yayin: false,
    yonetim: false,
    admin: false,
    room_oda1: true,
    room_oda2: false,
    room_oda3: false,
    view_montaj_stats: false,
    view_revision_details: false,
    view_financial_revenue: false,
    view_guest_contact: true,
    can_edit_packages: false,
    can_delete_records: false,
  });

  // Filtrelenmiş Personel Listesi
  const filteredStaff = useMemo(() => {
    if (!search.trim()) return staff;
    const q = search.toLowerCase();
    return staff.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.username && s.username.toLowerCase().includes(q)) ||
        s.role.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q)
    );
  }, [staff, search]);

  // Yeni Personel Ekleme
  function handleCreateStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const matchedRole = roles.find((r) => r.key === roleSelect);
    const roleLabel = matchedRole?.label || "Çağrı Merkezi Temsilcisi";
    let deptName = matchedRole?.department || "Operasyon";

    const isCagriRole = roleSelect.includes("cagri") || matchedRole?.department.includes("Çağrı");
    if (isCagriRole && roomSelect) {
      deptName = `Çağrı Merkezi — ${roomSelect === "oda-1" ? "Oda 1" : roomSelect === "oda-2" ? "Oda 2" : "Oda 3"}`;
    }

    const assignedUsername = username.trim() || email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    const assignedPassword = password.trim() || "bct123";

    const created = addStaff({
      name: name.trim(),
      email: email.trim(),
      username: assignedUsername,
      password: assignedPassword,
      role: roleLabel,
      department: deptName,
      status: "active",
      room: isCagriRole ? roomSelect : undefined,
    });

    setShowStaffModal(false);
    setName("");
    setEmail("");
    setUsername("");
    setPassword("bct123");
    setRoomSelect("oda-1");
    setFeedback(`✓ Yeni personel "${created.name}" (@${created.username}) eklendi. Giriş şifresi: "${assignedPassword}"`);
    setTimeout(() => setFeedback(null), 5000);
  }

  // Personel Şifresini Güncelleme
  function handleSaveNewPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordModal.staffId || !passwordModal.newPassword.trim()) return;

    updateStaffPassword(passwordModal.staffId, passwordModal.newPassword.trim());
    setFeedback(`✓ ${passwordModal.staffName} adlı personelin şifresi "${passwordModal.newPassword.trim()}" olarak güncellendi.`);
    setPasswordModal({ open: false, staffId: "", staffName: "", currentUsername: "", newPassword: "" });
    setTimeout(() => setFeedback(null), 4000);
  }

  // Yeni Rol Tanımlama
  function handleCreateRole(e: React.FormEvent) {
    e.preventDefault();
    if (!newRoleLabel.trim()) return;

    const created = addRole({
      label: newRoleLabel.trim(),
      department: newRoleDept.trim() || "Genel Operasyon",
      description: newRoleDesc.trim() || "Özel yetki profili",
      color: newRoleColor,
      permissions: newRolePerms,
    });

    setShowRoleModal(false);
    setNewRoleLabel("");
    setNewRoleDesc("");
    setNewRolePerms({
      cagri: false,
      odalar: false,
      pazarlama: false,
      montaj: false,
      izleme: false,
      revize: false,
      yayin: false,
      yonetim: false,
      admin: false,
      room_oda1: true,
      room_oda2: false,
      room_oda3: false,
      view_montaj_stats: false,
      view_revision_details: false,
      view_financial_revenue: false,
      view_guest_contact: true,
      can_edit_packages: false,
      can_delete_records: false,
    });
    setFeedback(`✓ Yeni rol "${created.label}" sisteme eklendi ve tüm yetkileri yapılandırıldı.`);
    setTimeout(() => setFeedback(null), 4000);
  }

  // Personel Aktif/Pasif
  function handleToggleStatus(id: string) {
    toggleStaffStatus(id);
    setFeedback("✓ Personel durumu güncellendi.");
    setTimeout(() => setFeedback(null), 2500);
  }

  // Personel Sil
  function handleDeleteStaff(id: string, staffName: string) {
    if (!confirm(`${staffName} adlı personeli sistemden kalıcı olarak silmek istediğinize emin misiniz?`)) return;
    deleteStaff(id);
    setFeedback(`✓ ${staffName} sistemden silindi.`);
    setTimeout(() => setFeedback(null), 3000);
  }

  // Rol Sil
  function handleDeleteRole(roleKey: string, roleLabel: string) {
    if (roleKey === "admin") {
      alert("Süper Admin rolü silinemez.");
      return;
    }
    if (!confirm(`"${roleLabel}" rolünü sistemden kaldırmak istediğinize emin misiniz? Bu role atanmış personeller etkilenebilir.`)) return;
    deleteRole(roleKey);
    setFeedback(`✓ "${roleLabel}" rolü kaldırıldı.`);
    setTimeout(() => setFeedback(null), 3000);
  }

  // Rol İznini Aç/Kapat (Matris Tıklaması)
  function toggleRolePermission(roleKey: string, permKey: string) {
    if (roleKey === "admin") return; // Super admin her zaman tam yetkili
    const targetRole = roles.find((r) => r.key === roleKey);
    if (!targetRole) return;

    const currentVal = targetRole.permissions[permKey] ?? false;
    updateRole(roleKey, {
      permissions: {
        ...targetRole.permissions,
        [permKey]: !currentVal,
      },
    });

    const categoryItem =
      PERMISSION_GROUPS.pages.find((p) => p.key === permKey) ||
      PERMISSION_GROUPS.rooms.find((r) => r.key === permKey) ||
      PERMISSION_GROUPS.sensitive.find((s) => s.key === permKey);

    const permLabel = categoryItem?.label || permKey;
    setFeedback(`✓ ${targetRole.label} için "${permLabel}" yetkisi ${!currentVal ? "AÇILDI (İzin Verildi)" : "KAPATILDI (Kısıtlandı)"}.`);
    setTimeout(() => setFeedback(null), 3000);
  }

  // Demo Verileri Sıfırlama
  function handleResetData() {
    if (!confirm("Tüm personel şifreleri, roller ve demo verileri fabrika ayarlarına sıfırlansın mı?")) return;
    resetToDefaults();
    setFeedback("✓ Sistem ve yetkiler fabrika ayarlarına başarıyla sıfırlandı.");
    setTimeout(() => setFeedback(null), 4000);
  }

  // Supabase Senkronizasyonu
  async function handleSyncToSupabase() {
    setSyncLoading(true);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guests, staff, roles, rooms }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback(data.message || "✓ Veriler Supabase veritabanına aktarıldı.");
      } else {
        alert(data.message || "Senkronizasyon başarısız.");
      }
    } catch (err: any) {
      alert("Senkronizasyon hatası: " + err.message);
    } finally {
      setSyncLoading(false);
      setTimeout(() => setFeedback(null), 6000);
    }
  }

  // Tam Yedek İndirme (JSON)
  function handleExportBackup() {
    const backupData = {
      exportDate: new Date().toISOString(),
      staff,
      guests,
      roles,
      rooms,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BCT_OS_Backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedback("✓ Tam veritabanı yedeği JSON dosyası olarak indirildi.");
    setTimeout(() => setFeedback(null), 4000);
  }

  // Aktif Gösterilecek İzin Listesi
  const currentPermissionsList = useMemo(() => {
    if (matrixCategory === "pages") return PERMISSION_GROUPS.pages;
    if (matrixCategory === "rooms") return PERMISSION_GROUPS.rooms;
    return PERMISSION_GROUPS.sensitive;
  }, [matrixCategory]);

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">Sistem Ayarları &amp; Yetki Yönetimi</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              TAM KONTROL PANELİ
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Personel şifre yetkisi, oda erişimleri ve rollere göre ekran blurlama / hassas veri kısıtlama merkezi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-white border border-slate-200 text-slate-700 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100"></span>
            YETKİ: SÜPER ADMİN (Gökhan)
          </span>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fade-in shadow-xs">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
            {feedback}
          </span>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 hover:text-emerald-950 font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
        <button
          onClick={() => setActiveTab("staff")}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all cursor-pointer border-b-2 flex items-center gap-2 ${
            activeTab === "staff"
              ? "border-blue-600 text-blue-600 bg-white shadow-2xs"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">badge</span>
          Personel &amp; Şifre Yönetimi ({staff.length})
        </button>

        <button
          onClick={() => setActiveTab("rbac")}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all cursor-pointer border-b-2 flex items-center gap-2 ${
            activeTab === "rbac"
              ? "border-blue-600 text-blue-600 bg-white shadow-2xs"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">admin_panel_settings</span>
          Rol &amp; Yetki Matrisi (Tam Kontrol)
        </button>

        <button
          onClick={() => setActiveTab("system")}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all cursor-pointer border-b-2 flex items-center gap-2 ${
            activeTab === "system"
              ? "border-blue-600 text-blue-600 bg-white shadow-2xs"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">tune</span>
          Veri &amp; Fabrika Ayarları
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SEKME 1: PERSONEL & ŞİFRE YÖNETİMİ (Requirement 1)
          - Yeni eklenen üyelere şifre verme yetkisi bizde
          - Verdiğimiz şifreler ile girebilirler
          - Kullanıcı adı & şifre görüntüleme & güncelleme
      ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "staff" && (
        <div className="space-y-4">
          {/* Bilgilendirme Kartı */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-3">
              <span className="p-2 bg-blue-600 text-white rounded-lg text-lg">
                <span className="material-symbols-outlined text-[20px] block">vpn_key</span>
              </span>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Şifre ve Giriş Yetki Yönetimi
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Tüm personellerin giriş şifresi yetkisi yöneticidedir. Çalışanlar sadece sizin atadığınız şifre ile sisteme giriş yapabilir. Aşağıdan şifreleri görebilir veya anında değiştirebilirsiniz.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setName("");
                setEmail("");
                setUsername("");
                setPassword("bct123");
                setShowStaffModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex-shrink-0"
            >
              <span className="text-base font-bold leading-none">+</span>
              Yeni Personel Ekle (Şifreli)
            </button>
          </div>

          {/* Filtre ve Arama */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                search
              </span>
              <input
                className="pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:border-blue-500 w-72"
                placeholder="İsim, e-posta, kullanıcı adı veya rol ara..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Toplam {filteredStaff.length} personel listeleniyor
            </span>
          </div>

          {/* Personel Tablosu */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="px-5 py-3">Personel</th>
                  <th className="px-5 py-3">Giriş Kullanıcı Adı</th>
                  <th className="px-5 py-3">Giriş Şifresi</th>
                  <th className="px-5 py-3">Rol &amp; Görev</th>
                  <th className="px-5 py-3">Departman / Satış Odası</th>
                  <th className="px-5 py-3">Durum</th>
                  <th className="px-5 py-3 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((member) => {
                  const isRevealed = Boolean(revealedPasswords[member.id]);
                  const staffUsername = member.username || member.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
                  const staffPassword = member.password || "bct123";

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/70 transition group">
                      {/* Avatar & İsim */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {member.avatar}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{member.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{member.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Kullanıcı Adı */}
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                          @{staffUsername}
                        </span>
                      </td>

                      {/* Şifre & Göz İkonu & Şifre Değiştir */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                            isRevealed
                              ? "bg-amber-50 text-amber-900 border border-amber-200 font-bold"
                              : "bg-slate-100 text-slate-500 tracking-widest"
                          }`}>
                            {isRevealed ? staffPassword : "••••••••"}
                          </span>

                          {/* Göz İkonu: Göster / Gizle */}
                          <button
                            type="button"
                            onClick={() =>
                              setRevealedPasswords((prev) => ({
                                ...prev,
                                [member.id]: !prev[member.id],
                              }))
                            }
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                            title={isRevealed ? "Şifreyi Gizle" : "Şifreyi Göster"}
                          >
                            <span className="material-symbols-outlined text-[16px] block">
                              {isRevealed ? "visibility_off" : "visibility"}
                            </span>
                          </button>

                          {/* Şifreyi Güncelle Butonu */}
                          <button
                            type="button"
                            onClick={() =>
                              setPasswordModal({
                                open: true,
                                staffId: member.id,
                                staffName: member.name,
                                currentUsername: staffUsername,
                                newPassword: staffPassword,
                              })
                            }
                            className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded text-[10px] font-semibold border border-slate-200 transition cursor-pointer flex items-center gap-1"
                            title="Bu personele yeni şifre belirle"
                          >
                            <span className="material-symbols-outlined text-[13px]">key</span>
                            Değiştir
                          </button>
                        </div>
                      </td>

                      {/* Rol */}
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-800">{member.role}</span>
                      </td>

                      {/* Departman / Oda */}
                      <td className="px-5 py-3.5 text-slate-600">
                        {member.room ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            🚪 {member.room === "oda-1" ? "Oda 1" : member.room === "oda-2" ? "Oda 2" : "Oda 3"}
                          </span>
                        ) : (
                          member.department
                        )}
                      </td>

                      {/* Durum */}
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => handleToggleStatus(member.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border cursor-pointer ${
                            member.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${member.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                          {member.status === "active" ? "Aktif" : "Pasif"}
                        </button>
                      </td>

                      {/* İşlemler */}
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteStaff(member.id, member.name)}
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded cursor-pointer opacity-0 group-hover:opacity-100 transition"
                          title="Personeli Sil"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SEKME 2: TAM KONTROL ROL & YETKİ MATRİSİ (Requirement 2 & 3)
          - Hangi rol hangi odaya girebilir (Oda 1, Oda 2, Oda 3)
          - Neyi görebilir (Sayfa & modül izinleri)
          - Hassas veri görünürlüğü & blurlama kuralları
          - Canlı tıklama ile anında yetki açma/kapatma
      ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "rbac" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
            {/* Üst Başlık & Yeni Rol Butonu */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#0F172A]">Tam Kontrol Yetki &amp; Erişim Matrisi</h2>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                    {roles.length} Rol Tanımlı
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Her rolün hangi odalara girebileceğini, hangi sayfaları görebileceğini ve hangi alanların blurlanacağını en ince ayrıntısına kadar ayarlayın.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRoleModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer transition"
                >
                  <span className="text-sm font-bold">+</span> Yeni Rol Tanımla
                </button>
              </div>
            </div>

            {/* Yetki Kategori Seçici (3 Grup) */}
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-xl">
              <button
                onClick={() => setMatrixCategory("pages")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  matrixCategory === "pages"
                    ? "bg-white text-blue-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">menu_book</span>
                1. Sayfa &amp; Modül Erişimleri ({PERMISSION_GROUPS.pages.length})
              </button>

              <button
                onClick={() => setMatrixCategory("rooms")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  matrixCategory === "rooms"
                    ? "bg-white text-indigo-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">meeting_room</span>
                2. Satış Odaları Yetkisi ({PERMISSION_GROUPS.rooms.length} Oda)
              </button>

              <button
                onClick={() => setMatrixCategory("sensitive")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  matrixCategory === "sensitive"
                    ? "bg-white text-amber-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">lock</span>
                3. Hassas Veri Görünürlüğü &amp; Blurlama Kuralları ({PERMISSION_GROUPS.sensitive.length})
              </button>
            </div>

            {/* Kategori Açıklama Kutusu */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
              {matrixCategory === "pages" && (
                <span>
                  <strong>Sayfa Erişim Kuralı:</strong> İzni kapalı olan rollerin sol menüsünde o sayfalar gizlenir ve doğrudan URL ile gelmeye çalışırlarsa &ldquo;Yetki Kısıtlandı&rdquo; güvenlik ekranı çıkar.
                </span>
              )}
              {matrixCategory === "rooms" && (
                <span>
                  <strong>Oda Erişim Kuralı:</strong> Bir rolün oda izni kapalıysa, Oda &amp; Konuk Takibi ekranında o satış odasının sekmesini göremez veya o odanın konuk ve ciro verilerine erişemez.
                </span>
              )}
              {matrixCategory === "sensitive" && (
                <span>
                  <strong>Blurlama &amp; Hassas Veri Kuralı:</strong> Örneğin Çağrı Merkezi için revize detayları veya montaj istatistikleri kapalıysa, o sayfalara gittiklerinde ekranın ilgili kısımları (örn: sağ panel) <strong>blurlanır</strong> ve kilit mesajı gösterilir.
                </span>
              )}
            </div>

            {/* Dinamik RBAC Matris Tablosu */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                    <th className="text-left px-4 py-3 min-w-[220px]">Rol &amp; Departman</th>
                    {currentPermissionsList.map((item) => (
                      <th key={item.key} className="text-center px-3 py-3 min-w-[110px]" title={item.desc}>
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-slate-800">{item.shortLabel}</span>
                          <span className="text-[9px] text-slate-400 font-normal lowercase truncate max-w-[100px]">
                            {item.key}
                          </span>
                        </div>
                      </th>
                    ))}
                    <th className="text-right px-4 py-3">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roles.map((role) => {
                    const isAdmin = role.key === "admin";
                    return (
                      <tr key={role.key} className="hover:bg-slate-50/50 transition">
                        {/* Rol Adı & Rozet */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  role.color === "red"
                                    ? "#EF4444"
                                    : role.color === "indigo"
                                    ? "#6366F1"
                                    : role.color === "blue"
                                    ? "#2563EB"
                                    : role.color === "emerald"
                                    ? "#10B981"
                                    : role.color === "violet"
                                    ? "#8B5CF6"
                                    : "#F59E0B",
                              }}
                            ></span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 block">{role.label}</span>
                                {isAdmin && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-100 text-red-800 border border-red-200">
                                    Full
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400">{role.department}</span>
                            </div>
                          </div>
                        </td>

                        {/* Yetki Butonları */}
                        {currentPermissionsList.map((item) => {
                          const hasAccess = isAdmin ? true : (role.permissions[item.key] ?? false);
                          return (
                            <td key={item.key} className="text-center px-2 py-3.5">
                              <button
                                onClick={() => toggleRolePermission(role.key, item.key)}
                                disabled={isAdmin}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border inline-flex items-center gap-1 ${
                                  hasAccess
                                    ? "bg-emerald-50 border-emerald-300 text-emerald-700 font-bold hover:bg-emerald-100"
                                    : "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                                } ${isAdmin ? "opacity-80 cursor-not-allowed" : "cursor-pointer"}`}
                                title={
                                  isAdmin
                                    ? "Süper Admin tüm yetkilere sahiptir"
                                    : `${role.label} için "${item.label}" yetkisini ${hasAccess ? "kapat" : "aç"}`
                                }
                              >
                                <span>{hasAccess ? "✓" : "✕"}</span>
                                <span className="text-[10px] hidden sm:inline">
                                  {hasAccess ? "İzinli" : "Kısıtlı"}
                                </span>
                              </button>
                            </td>
                          );
                        })}

                        {/* İşlem */}
                        <td className="px-4 py-3.5 text-right">
                          {!isAdmin && (
                            <button
                              onClick={() => handleDeleteRole(role.key, role.label)}
                              className="text-slate-400 hover:text-red-600 p-1 text-xs cursor-pointer transition font-medium"
                              title="Rolü Sil"
                            >
                              Sil
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tanımlı Rol Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roles.map((role) => {
              const assignedStaff = staff.filter((s) => s.role === role.label);
              const enabledPages = PERMISSION_GROUPS.pages.filter((p) => role.key === "admin" || role.permissions[p.key]).length;
              const enabledRooms = PERMISSION_GROUPS.rooms.filter((r) => role.key === "admin" || role.permissions[r.key]).length;
              const blurredRestrictions = PERMISSION_GROUPS.sensitive.filter((s) => role.key !== "admin" && !role.permissions[s.key]).length;

              return (
                <div key={role.key} className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              role.color === "red"
                                ? "#EF4444"
                                : role.color === "indigo"
                                ? "#6366F1"
                                : role.color === "blue"
                                ? "#2563EB"
                                : role.color === "emerald"
                                ? "#10B981"
                                : role.color === "violet"
                                ? "#8B5CF6"
                                : "#F59E0B",
                          }}
                        ></span>
                        <h3 className="font-bold text-sm text-[#0F172A]">{role.label}</h3>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                        {role.key === "admin" ? "Süper Admin" : `${enabledPages}/9 Modül`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">{role.description || role.department}</p>

                    {/* Yetki Özeti Rozetleri */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        🚪 {enabledRooms}/3 Satış Odası
                      </span>
                      {blurredRestrictions > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          🔒 {blurredRestrictions} Hassas Veri Kısıtlı
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          ✓ Tam Görünürlük
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Atanmış Personel ({assignedStaff.length})
                    </span>
                    <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                      {assignedStaff.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">Bu rolde henüz personel yok</p>
                      ) : (
                        assignedStaff.map((s) => (
                          <div key={s.id} className="flex items-center justify-between text-xs py-1 px-1.5 rounded bg-slate-50">
                            <span className="font-medium text-slate-800">{s.name}</span>
                            <span className="text-[10px] font-mono text-slate-400">@{s.username || s.email.split("@")[0]}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SEKME 3: SİSTEM & VERİ YÖNETİMİ
      ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "system" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">Sistem Durumu &amp; Veritabanı</h2>
                <p className="text-xs text-slate-500">Mevcut sistem kapasitesi ve kalıcı bulut veritabanı durumu</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${
                    isSupabaseConfigured
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSupabaseConfigured ? "bg-emerald-500 animate-pulse" : "bg-blue-500"
                    }`}
                  ></span>
                  <span>{isSupabaseConfigured ? "Supabase Bulut DB Aktif" : "Supabase Hazır (Yapılandırma Bekleniyor)"}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 font-semibold block mb-1">Toplam Konuk</span>
                <span className="text-2xl font-bold text-slate-900 font-mono">{guests.length}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 font-semibold block mb-1">Toplam Personel</span>
                <span className="text-2xl font-bold text-slate-900 font-mono">{staff.length}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 font-semibold block mb-1">Tanımlı Rol Sayısı</span>
                <span className="text-2xl font-bold text-blue-600 font-mono">{roles.length}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 font-semibold block mb-1">Satış Odası</span>
                <span className="text-2xl font-bold text-indigo-600 font-mono">{rooms.length || 3} Oda</span>
              </div>
            </div>

            {/* Supabase Bulut Veritabanı Entegrasyon Kartı */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-xl shrink-0">
                    🐘
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Supabase (PostgreSQL) Canlı Bulut Senkronizasyonu</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        TAM OTOMATİK &amp; CANLI (REALTIME)
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Herhangi bir personel konuk eklediğinde, durum güncellediğinde veya dergi içeriği yüklediğinde veriler <strong>anında otomatik olarak Supabase'e yazılır</strong> ve tüm cihazlara (50+ çalışan) canlı olarak iletilir. Yöneticinin işlem yapması gerekmez.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowSqlModal(true)}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition cursor-pointer border border-white/15"
                  >
                    SQL Şemasını Gör
                  </button>

                  <button
                    disabled={syncLoading}
                    onClick={handleSyncToSupabase}
                    title="Normalde sistem tam otomatiktir. Bu buton sadece acil durumda veya sıfırdan zorla buluta basmak istediğinizde kullanılır."
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 disabled:bg-blue-800"
                  >
                    {syncLoading ? (
                      <>
                        <span className="animate-spin text-sm">⏳</span>
                        <span>Aktarılıyor...</span>
                      </>
                    ) : (
                      <>
                        <span>⚡</span>
                        <span>Zorla Yeniden Eşitle (Manuel)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Otomatik İlk Tohumlama (Auto-Seed)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Canlı Çift Yönlü Dinleme (Realtime)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>API: <code>/api/guests</code> &amp; <code>/api/staff</code></span>
                </div>
              </div>
            </div>

            {/* Yedekleme & Fabrika Ayarları */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Yedekleme &amp; Sıfırlama
                </h3>
                <p className="text-xs text-slate-500">
                  Verilerinizi JSON dosyası olarak bilgisayarınıza indirebilir veya sistemi fabrika ayarlarına sıfırlayabilirsiniz.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportBackup}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>📥</span>
                  <span>Yedek İndir (JSON)</span>
                </button>

                <button
                  onClick={handleResetData}
                  className="px-4 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold border border-red-200 transition cursor-pointer"
                >
                  Fabrika Ayarlarına Sıfırla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODAL: ŞİFRE DEĞİŞTİR (Requirement 1)
      ═══════════════════════════════════════════════════════════════ */}
      {passwordModal.open && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPasswordModal((prev) => ({ ...prev, open: false }));
          }}
        >
          <form
            onSubmit={handleSaveNewPassword}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#0F172A]">Personel Şifresini Güncelle</h3>
                <p className="text-xs text-slate-500">Çalışana yeni bir giriş şifresi atayın</p>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModal((prev) => ({ ...prev, open: false }))}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-[11px] text-blue-700 font-semibold block">Personel Bilgisi:</span>
                <p className="font-bold text-slate-900 text-sm">{passwordModal.staffName}</p>
                <p className="text-xs font-mono text-blue-800">Kullanıcı Adı: @{passwordModal.currentUsername}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Yeni Giriş Şifresi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Yeni şifreyi giriniz (örn: ayse2026)"
                  value={passwordModal.newPassword}
                  onChange={(e) => setPasswordModal((prev) => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono font-bold text-slate-900"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Personel yalnızca bu şifre ile giriş yapabilecektir.
                </p>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => setPasswordModal((prev) => ({ ...prev, open: false }))}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                Şifreyi Kaydet
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODAL: YENİ PERSONEL EKLE (ŞİFRE ATAMA İLE) (Requirement 1)
      ═══════════════════════════════════════════════════════════════ */}
      {showStaffModal && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowStaffModal(false);
          }}
        >
          <form
            onSubmit={handleCreateStaff}
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#0F172A]">Yeni Personel Kaydet (Şifreli)</h3>
                <p className="text-xs text-slate-500">Personel bilgilerini girip giriş şifresini siz belirleyin</p>
              </div>
              <button
                type="button"
                onClick={() => setShowStaffModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ad Soyad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Selin Karaca"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!username) {
                        setUsername(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]/g, "")
                            .slice(0, 15)
                        );
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    E-Posta <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="selin@bct.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Kullanıcı Adı ve Şifre Belirleme (Requirement 1) */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
                <span className="text-xs font-bold text-blue-900 block flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">vpn_key</span>
                  Giriş Yetkisi ve Şifre Tanımlama
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Kullanıcı Adı <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">@</span>
                      <input
                        type="text"
                        required
                        placeholder="selin"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
                        className="w-full pl-6 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Verilecek Şifre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="bct123"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono font-bold text-blue-700"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-blue-700">
                  Personel sisteme sadece burada girdiğiniz kullanıcı adı ve şifre ile erişebilir.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Atanacak Rol
                  </label>
                  <select
                    value={roleSelect}
                    onChange={(e) => setRoleSelect(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer font-semibold"
                  >
                    {roles.map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.label} — ({r.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bağlı Satış Odası
                  </label>
                  <select
                    value={roomSelect}
                    onChange={(e) => setRoomSelect(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer font-semibold"
                  >
                    <option value="oda-1">Oda 1: Satış &amp; Teyit</option>
                    <option value="oda-2">Oda 2: VIP Portföy</option>
                    <option value="oda-3">Oda 3: Hızlı Teyit</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowStaffModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                Personeli Ekle &amp; Şifreyi Kaydet
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODAL: YENİ ROL TANIMLA (Requirement 2 & 3)
          - 3 Kategoride de izin belirleyebilme
      ═══════════════════════════════════════════════════════════════ */}
      {showRoleModal && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRoleModal(false);
          }}
        >
          <form
            onSubmit={handleCreateRole}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#0F172A]">Yeni Rol &amp; Yetki Profili Tanımla</h3>
                <p className="text-xs text-slate-500">Oda izinleri, sayfa erişimleri ve blurlama kısıtlamalarını yapılandırın</p>
              </div>
              <button
                type="button"
                onClick={() => setShowRoleModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rol / Unvan Adı <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Web Tasarımcı veya Stüdyo Koordinatörü"
                    value={newRoleLabel}
                    onChange={(e) => setNewRoleLabel(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Departman</label>
                  <input
                    type="text"
                    placeholder="Örn: Teknik & Tasarım"
                    value={newRoleDept}
                    onChange={(e) => setNewRoleDept(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Görev Açıklaması</label>
                <input
                  type="text"
                  placeholder="Örn: Görsel tasarımlar ve sosyal medya içerik onaylarından sorumludur"
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 1. Sayfa & Modül Erişimleri */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-blue-600">menu_book</span>
                  1. Sayfa &amp; Modül Erişim İzinleri (Menüde Görünme)
                </label>
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {PERMISSION_GROUPS.pages.map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center gap-2 p-1.5 rounded-lg bg-white border border-slate-200 text-xs cursor-pointer hover:border-blue-300"
                    >
                      <input
                        type="checkbox"
                        checked={newRolePerms[item.key] || false}
                        onChange={(e) =>
                          setNewRolePerms((prev) => ({
                            ...prev,
                            [item.key]: e.target.checked,
                          }))
                        }
                        className="rounded text-blue-600 cursor-pointer"
                      />
                      <span className="font-semibold text-slate-800">{item.shortLabel}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 2. Satış Odaları Yetkisi */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-indigo-600">meeting_room</span>
                  2. Satış Odaları Yetkileri (Hangi Odayı Görebilir?)
                </label>
                <div className="grid grid-cols-3 gap-2 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-200">
                  {PERMISSION_GROUPS.rooms.map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center gap-2 p-1.5 rounded-lg bg-white border border-indigo-200 text-xs cursor-pointer hover:border-indigo-400"
                    >
                      <input
                        type="checkbox"
                        checked={newRolePerms[item.key] || false}
                        onChange={(e) =>
                          setNewRolePerms((prev) => ({
                            ...prev,
                            [item.key]: e.target.checked,
                          }))
                        }
                        className="rounded text-indigo-600 cursor-pointer"
                      />
                      <span className="font-semibold text-slate-800">{item.shortLabel}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 3. Hassas Veri Görünürlüğü & Blurlama */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-amber-600">lock</span>
                  3. Hassas Veri Görünürlüğü (Kapalıysa Blurlanır)
                </label>
                <div className="grid grid-cols-2 gap-2 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200">
                  {PERMISSION_GROUPS.sensitive.map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center gap-2 p-1.5 rounded-lg bg-white border border-amber-200 text-xs cursor-pointer hover:border-amber-400"
                    >
                      <input
                        type="checkbox"
                        checked={newRolePerms[item.key] || false}
                        onChange={(e) =>
                          setNewRolePerms((prev) => ({
                            ...prev,
                            [item.key]: e.target.checked,
                          }))
                        }
                        className="rounded text-amber-600 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-800 block text-[11px]">{item.shortLabel}</span>
                        <span className="text-[10px] text-slate-400 block truncate">{item.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowRoleModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                Rolü Kaydet &amp; Aktifleştir
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: SUPABASE SQL ŞEMASI GÖRÜNTÜLEME */}
      {showSqlModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSqlModal(false);
          }}
        >
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-base text-[#0F172A] flex items-center gap-2">
                  <span>🐘</span>
                  <span>Supabase (PostgreSQL) Tablo ve Güvenlik Şeması</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Bu SQL kodunu Supabase Dashboard &gt; SQL Editor alanına yapıştırıp "Run" tuşuna basınız.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                <span className="font-bold block">Kurulum Adımları:</span>
                <ol className="list-decimal pl-4 space-y-0.5 text-blue-800">
                  <li><strong>supabase.com</strong> adresinde ücretsiz bir proje oluşturun.</li>
                  <li>Sol menüden <strong>SQL Editor</strong> bölümüne gidin.</li>
                  <li>Aşağıdaki SQL şemasını yapıştırıp <strong>RUN</strong> butonuna basın.</li>
                  <li><strong>Project Settings &gt; API</strong> sayfasındaki URL ve anon key değerlerini Vercel ortam değişkenlerine ekleyin.</li>
                </ol>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between pb-1.5 text-xs text-slate-500 font-mono">
                  <span>supabase/schema.sql</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`-- BCT-OS PostgreSQL Schema
CREATE TABLE IF NOT EXISTS public.roles (id TEXT PRIMARY KEY, key TEXT UNIQUE NOT NULL, label TEXT NOT NULL, color TEXT NOT NULL, department TEXT NOT NULL, permissions JSONB NOT NULL DEFAULT '{}'::jsonb);
CREATE TABLE IF NOT EXISTS public.rooms (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, color TEXT NOT NULL, staff_ids JSONB NOT NULL DEFAULT '[]'::jsonb);
CREATE TABLE IF NOT EXISTS public.staff (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL DEFAULT 'bct123', role TEXT NOT NULL, department TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', avatar TEXT NOT NULL, room TEXT, is_leader BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.guests (id TEXT PRIMARY KEY, name TEXT NOT NULL, company TEXT NOT NULL, title TEXT NOT NULL, phone TEXT NOT NULL, instagram TEXT, website TEXT, show_ig BOOLEAN NOT NULL DEFAULT FALSE, show_web BOOLEAN NOT NULL DEFAULT FALSE, vip BOOLEAN NOT NULL DEFAULT FALSE, status TEXT NOT NULL DEFAULT 'appointment_set', representative TEXT NOT NULL, appointment_date TEXT, appointment_time TEXT, shoot_time TEXT, shoot_duration TEXT, studio TEXT, editor TEXT, amount TEXT NOT NULL DEFAULT '0', payment_status TEXT NOT NULL DEFAULT 'odenmedi', on_odeme_miktari NUMERIC NOT NULL DEFAULT 0, registration_no TEXT UNIQUE NOT NULL, room TEXT, marketer TEXT, cancelled_reason TEXT, cancelled_at TEXT, services JSONB NOT NULL DEFAULT '[]'::jsonb, social_media JSONB NOT NULL DEFAULT '{}'::jsonb, notes JSONB NOT NULL DEFAULT '[]'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.audit_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), actor_id TEXT, actor_name TEXT, action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, details JSONB DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Guests" ON public.guests FOR SELECT USING (true);
CREATE POLICY "Public Write Guests" ON public.guests FOR ALL USING (true);
CREATE POLICY "Public Read Staff" ON public.staff FOR SELECT USING (true);
CREATE POLICY "Public Write Staff" ON public.staff FOR ALL USING (true);`);
                      setFeedback("✓ SQL Şeması panoya kopyalandı!");
                      setTimeout(() => setFeedback(null), 3000);
                    }}
                    className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                  >
                    📋 Panoya Kopyala
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-60 leading-relaxed">
{`-- 1. Eklentileri Etkinleştir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Roller Tablosu
CREATE TABLE IF NOT EXISTS public.roles (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT 'blue',
    department TEXT NOT NULL,
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 3. Odalar Tablosu
CREATE TABLE IF NOT EXISTS public.rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT NOT NULL DEFAULT '#2563EB',
    staff_ids JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 4. Personel Tablosu (50+ Kullanıcı)
CREATE TABLE IF NOT EXISTS public.staff (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL DEFAULT 'bct123',
    role TEXT NOT NULL,
    department TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    avatar TEXT NOT NULL DEFAULT 'ST',
    room TEXT REFERENCES public.rooms(id),
    is_leader BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Konuklar ve Hizmetler Tablosu
CREATE TABLE IF NOT EXISTS public.guests (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'Yönetici',
    phone TEXT NOT NULL,
    instagram TEXT DEFAULT '',
    website TEXT DEFAULT '',
    show_ig BOOLEAN NOT NULL DEFAULT FALSE,
    show_web BOOLEAN NOT NULL DEFAULT FALSE,
    vip BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'appointment_set',
    representative TEXT NOT NULL,
    appointment_date TEXT,
    appointment_time TEXT,
    shoot_time TEXT,
    shoot_duration TEXT DEFAULT '25 dk',
    studio TEXT DEFAULT 'Stüdyo A (4K)',
    editor TEXT DEFAULT '',
    amount TEXT NOT NULL DEFAULT '0',
    payment_status TEXT NOT NULL DEFAULT 'odenmedi',
    on_odeme_miktari NUMERIC NOT NULL DEFAULT 0,
    registration_no TEXT UNIQUE NOT NULL,
    room TEXT REFERENCES public.rooms(id),
    marketer TEXT,
    cancelled_reason TEXT,
    cancelled_at TEXT,
    services JSONB NOT NULL DEFAULT '[]'::jsonb,
    social_media JSONB NOT NULL DEFAULT '{}'::jsonb,
    notes JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`}
                </pre>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-xs text-slate-500">Tam dosya konumu: <code>supabase/schema.sql</code></span>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
