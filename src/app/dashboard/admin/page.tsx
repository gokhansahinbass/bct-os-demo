"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/useStore";
import { addStaff, toggleStaffStatus, deleteStaff } from "@/lib/store";

export default function AdminPage() {
  const { staff } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  // New staff form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleSelect, setRoleSelect] = useState("kurgu");

  const filteredStaff = useMemo(() => {
    if (!search.trim()) return staff;
    const q = search.toLowerCase();
    return staff.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q)
    );
  }, [staff, search]);

  function handleCreateStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    let roleName = "Montaj / Kurgu Ekibi";
    let deptName = "Montaj & Timeline";

    if (roleSelect === "cagri") {
      roleName = "Çağrı Temsilcisi";
      deptName = "Çağrı Merkezi";
    } else if (roleSelect === "pazarlama") {
      roleName = "Pazarlama Sorumlusu";
      deptName = "Pazarlama Masası";
    } else if (roleSelect === "izleme") {
      roleName = "İzleme Moderatörü";
      deptName = "İzleme & Revize";
    } else if (roleSelect === "admin") {
      roleName = "Süper Admin";
      deptName = "Yönetim & IT";
    }

    const created = addStaff({
      name: name.trim(),
      email: email.trim(),
      role: roleName,
      department: deptName,
      status: "active",
    });

    setShowModal(false);
    setName("");
    setEmail("");
    setPassword("");
    setFeedback(`✓ Yeni personel (${created.name}) başarıyla sisteme eklendi ve erişim tanımlandı.`);
    setTimeout(() => setFeedback(null), 4000);
  }

  function handleToggle(id: string) {
    toggleStaffStatus(id);
    setFeedback("✓ Personel durumu güncellendi.");
    setTimeout(() => setFeedback(null), 3000);
  }

  function handleDelete(id: string, staffName: string) {
    if (!confirm(`${staffName} adlı personeli sistemden silmek istediğinize emin misiniz?`)) return;
    deleteStaff(id);
    setFeedback("✓ Personel silindi.");
    setTimeout(() => setFeedback(null), 3000);
  }

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#0F172A] tracking-tight">Sistem Yönetimi</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Stüdyo personel rolleri, yetkilendirmeler ve genel sistem konfigürasyonu
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-white border border-slate-200 text-slate-600 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100"></span>
              AUTH: SUPERADMIN (Gökhan)
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 border-b border-slate-200 flex items-center gap-6">
          <button className="flex items-center gap-2 py-3 px-1 border-b-2 border-[#2563EB] text-[#2563EB] text-sm font-semibold transition-colors relative cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">group</span>
            Kullanıcılar &amp; Roller
            <span className="ml-1 px-1.5 py-0.5 text-[11px] font-semibold bg-blue-50 text-[#2563EB] rounded-full">
              {staff.length}
            </span>
          </button>
          <button className="flex items-center gap-2 py-3 px-1 border-b-2 border-transparent text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[18px] text-slate-400">payments</span>
            Paket &amp; Fiyat Ayarları
          </button>
          <button className="flex items-center gap-2 py-3 px-1 border-b-2 border-transparent text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[18px] text-slate-400">hard_drive</span>
            Stüdyo &amp; HDD Envanteri
          </button>
          <button className="flex items-center gap-2 py-3 px-1 border-b-2 border-transparent text-slate-400 hover:text-slate-700 text-sm font-semibold transition-colors ml-auto cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">tune</span>
            Global Değişkenler
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-base">task_alt</span>
            {feedback}
          </span>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 hover:text-emerald-950 font-semibold text-xs">
            Kapat
          </button>
        </div>
      )}

      {/* Users Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Action Bar */}
        <div className="px-5 py-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/10 transition-all"
                placeholder="Kullanıcı adı, e-posta veya rol ile ara..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 bg-slate-100/80 border border-slate-200/80">
              {staff.length} Personel Kayıtlı
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
              onClick={() => setShowModal(true)}
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Yeni Personel Ekle
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200">
                <th className="py-3 px-6 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Ad Soyad</th>
                <th className="py-3 px-6 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Departman / Rol</th>
                <th className="py-3 px-6 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">E-Posta / Kullanıcı Adı</th>
                <th className="py-3 px-6 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Durum</th>
                <th className="py-3 px-6 text-[11px] font-semibold tracking-wider text-slate-500 uppercase text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredStaff.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="py-3.5 px-6 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-[#2563EB] font-semibold text-xs flex items-center justify-center border border-blue-200">
                        {member.avatar}
                      </div>
                      <div>
                        <span className="font-medium text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                          {member.name}
                        </span>
                        <p className="text-[11px] text-slate-400">Kayıt: {member.createdAt}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-6 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {member.department} — {member.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 whitespace-nowrap font-mono text-xs text-slate-600">
                    {member.email}
                  </td>
                  <td className="py-3.5 px-6 whitespace-nowrap">
                    <button
                      onClick={() => handleToggle(member.id)}
                      className="cursor-pointer"
                      title="Durumu Değiştir"
                    >
                      {member.status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 hover:bg-emerald-100 transition">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 hover:bg-slate-200 transition">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          Pasif
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="py-3.5 px-6 whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => handleDelete(member.id, member.name)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                        title="Personeli Sil"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Toplam <strong>{filteredStaff.length}</strong> kayıt listelendi</span>
        </div>
      </div>

      {/* Role Permission Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-[#0F172A]">Varsayılan Erişim Matrisi &amp; Güvenlik Politikası</h3>
            <p className="text-sm text-slate-500">Stüdyo modülleri ve departmanlar arası operasyonel yetki dağılımı</p>
          </div>
          <span className="text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            Güvenli Oturum Aktif
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Çağrı Masası Erişimi</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">Yeni randevu oluşturma, WhatsApp taslak tetikleme ve ilk müşteri kayıt yetkisi.</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Atanan: {staff.filter((s) => s.department.includes("Çağrı")).length} Kullanıcı</span>
            </div>
          </div>
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Montaj &amp; NAS Depolama</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">Ham çekim havuzuna okuma/yazma, timeline revize onaylama ve export kuyruğu.</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Atanan: {staff.filter((s) => s.department.includes("Montaj")).length} Kullanıcı</span>
            </div>
          </div>
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Yönetim &amp; Muhasebe Kokpiti</span>
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">Fiyat tarifesi değiştirme, kullanıcı silme/ekleme ve finansal rapor indirme tam izni.</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Atanan: {staff.filter((s) => s.department.includes("Yönetim")).length} Kullanıcı</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-white">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
                  <h2 className="text-lg font-semibold text-[#0F172A] tracking-tight">Yeni Kullanıcı Oluştur</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">Sisteme erişecek yeni stüdyo personeli ve rol tanımlaması</p>
              </div>
              <button
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => setShowModal(false)}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <form className="px-6 py-5 space-y-4 bg-white" onSubmit={handleCreateStaff}>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Ad Soyad <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/10 transition-all"
                  placeholder="Örn: Selin Aksoy"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Giriş Kullanıcı Adı (E-Posta) <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/10 font-mono transition-all"
                  placeholder="selin@bct.com"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-[11px] text-slate-400 mt-1">Sistem davet kodu bu adrese gönderilecektir.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Geçici Şifre <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/10 font-mono transition-all"
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Rol Seçimi &amp; Yetki Seviyesi <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer"
                  value={roleSelect}
                  onChange={(e) => setRoleSelect(e.target.value)}
                >
                  <option value="kurgu">Montaj / Kurgu Ekibi</option>
                  <option value="cagri">Çağrı Merkezi Operatörü</option>
                  <option value="pazarlama">Pazarlama Masası Sorumlusu</option>
                  <option value="izleme">İzleme &amp; Revize Moderatörü</option>
                  <option value="admin">Süper Admin (Tam Yetki)</option>
                </select>
              </div>
              <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-100 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-blue-600 text-[18px] shrink-0 mt-0.5">info</span>
                <p className="text-xs text-blue-900 leading-snug">
                  Yeni personel ilk girişinde şifresini değiştirmek ve 2FA onaylamak zorundadır.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                  onClick={() => setShowModal(false)}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Kullanıcıyı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
