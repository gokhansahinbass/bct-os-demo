"use client";

import { openGuestDossier } from "@/lib/store";

interface GuestNameClickableProps {
  guestId: string;
  name: string;
  company?: string;
  vip?: boolean;
  className?: string;
  subtitleClassName?: string;
}

export default function GuestNameClickable({
  guestId,
  name,
  company,
  vip = false,
  className = "",
  subtitleClassName = "",
}: GuestNameClickableProps) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        openGuestDossier(guestId);
      }}
      className={`inline-block group cursor-pointer text-left transition-all ${className}`}
      title="360° Konuk Dosyasını ve Süreç Durumunu Görüntüle"
    >
      <div className="flex items-center gap-1.5">
        <span className="font-bold text-slate-900 group-hover:text-blue-600 group-hover:underline underline-offset-2 transition-colors">
          {name}
        </span>
        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 text-[13px] select-none">
          👁️
        </span>
        {vip && (
          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-black rounded uppercase">
            VIP
          </span>
        )}
      </div>
      {company && (
        <p className={`text-slate-500 text-xs truncate group-hover:text-slate-700 ${subtitleClassName}`}>
          {company}
        </p>
      )}
    </div>
  );
}
