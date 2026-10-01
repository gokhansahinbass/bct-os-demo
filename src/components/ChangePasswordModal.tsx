"use client";

import { useState } from "react";
import { useStore } from "@/lib/useStore";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { currentUser, changePassword } = useStore();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !currentUser) return null;

  function handleReset() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(null);
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setIsSubmitting(false);
  }

  function handleClose() {
    handleReset();
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword.trim()) {
      setError("Lütfen mevcut şifrenizi giriniz.");
      return;
    }

    if (!newPassword.trim()) {
      setError("Lütfen yeni bir şifre giriniz.");
      return;
    }

    if (newPassword.trim().length < 4) {
      setError("Yeni şifreniz en az 4 karakter uzunluğunda olmalıdır.");
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setError("Yeni şifreleriniz birbiriyle uyuşmuyor. Lütfen iki alanı da aynı yazın.");
      return;
    }

    if (newPassword.trim() === currentPassword.trim()) {
      setError("Yeni şifreniz mevcut şifreniz ile aynı olamaz. Lütfen farklı bir şifre seçin.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = changePassword(currentPassword, newPassword, confirmPassword);
      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => {
          handleClose();
        }, 1800);
      } else {
        setError(result.message);
        setIsSubmitting(false);
      }
    } catch {
      setError("Şifre güncellenirken beklenmeyen bir hata oluştu.");
      setIsSubmitting(false);
    }
  }

  const staffUsername =
    currentUser.username ||
    (currentUser.email ? currentUser.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") : "kullanici");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          handleClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <span className="material-symbols-outlined text-[22px]">lock_reset</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Şifremi Değiştir</h2>
              <p className="text-xs text-slate-300">Hesabınız için hatırlayabileceğiniz yeni bir şifre belirleyin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Kapat"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          {/* User Badge Info */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                  @{staffUsername}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">{currentUser.role} · {currentUser.department}</p>
            </div>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-start gap-2 shadow-2xs">
              <span className="material-symbols-outlined text-[16px] text-red-600 shrink-0 mt-0.5">error</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-start gap-2 shadow-2xs">
              <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0 mt-0.5">check_circle</span>
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Mevcut Şifre */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Mevcut Şifreniz <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Şu an kullandığınız şifre (örn: bct123)"
                  disabled={isSubmitting || Boolean(success)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 transition pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded transition cursor-pointer"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-[18px] block">
                    {showCurrent ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Doğrulama amacıyla şu anki sistem şifrenizi girmeniz gereklidir.
              </p>
            </div>

            {/* Yeni Şifre */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Yeni Şifreniz <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Hatırlayabileceğiniz yeni şifre (en az 4 karakter)"
                  disabled={isSubmitting || Boolean(success)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 transition pr-10"
                  required
                  minLength={4}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded transition cursor-pointer"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-[18px] block">
                    {showNew ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Yeni Şifre Tekrar */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Yeni Şifreniz (Tekrar) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Yeni şifrenizi tekrar yazınız"
                  disabled={isSubmitting || Boolean(success)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 transition pr-10"
                  required
                  minLength={4}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded transition cursor-pointer"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-[18px] block">
                    {showConfirm ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {newPassword && confirmPassword && (
                <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                  {newPassword === confirmPassword ? (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <span>✓</span> Şifreler eşleşiyor
                    </span>
                  ) : (
                    <span className="text-red-600 font-semibold flex items-center gap-1">
                      <span>✕</span> Şifreler henüz eşleşmiyor
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Vazgeç
              </button>

              <button
                type="submit"
                disabled={isSubmitting || Boolean(success)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    <span>Şifremi Kaydet</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
