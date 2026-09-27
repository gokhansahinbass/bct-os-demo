"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getGuests,
  getStaff,
  subscribe,
  type Guest,
  type GuestStatus,
  type StaffMember,
} from "@/lib/store";

/**
 * BCT-OS paylaşımlı store'dan anlık veri çeken hook.
 * Store veya localStorage değiştiğinde tüm bileşenlerde re-render tetikler.
 */
export function useStore() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(() => {
    setGuests(getGuests());
    setStaff(getStaff());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
    const unsub = subscribe(refresh);
    return () => {
      unsub();
    };
  }, [refresh]);

  const byStatus = useCallback(
    (...statuses: GuestStatus[]) => guests.filter((g) => statuses.includes(g.status)),
    [guests]
  );

  const byId = useCallback(
    (id: string) => guests.find((g) => g.id === id),
    [guests]
  );

  return { guests, staff, byStatus, byId, refresh, isLoaded };
}
