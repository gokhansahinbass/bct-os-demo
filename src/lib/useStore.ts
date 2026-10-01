"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  getGuests,
  getStaff,
  getNotifications,
  getRooms,
  getRoles,
  getAuditLogs,
  addAuditLog,
  clearAuditLogs,
  getCurrentUser,
  setCurrentUser as storeSetCurrentUser,
  getActiveRole,
  setActiveRole as storeSetActiveRole,
  getAdminOriginUser,
  setAdminOriginUser as storeSetAdminOriginUser,
  isRealAdminSession,
  exitAdminPreview as storeExitAdminPreview,
  changeStaffPassword,
  hasRolePermission,
  canRoleAccessPath,
  canRoleAccessRoom,
  isRoleRestricted,
  canUserManageGuestStatus,
  subscribe,
  applyRemoteGuests,
  applyRemoteStaff,
  type Guest,
  type GuestStatus,
  type StaffMember,
  type Notification,
  type AuditLog,
  type Room,
  type RoleDefinition,
  type PasswordChangeResult,
} from "@/lib/store";
import { setupSupabaseAutoSync } from "@/lib/supabase";

/**
 * BCT-OS paylaşımlı store'dan anlık veri çeken hook.
 * Store veya localStorage değiştiğinde tüm bileşenlerde re-render tetikler.
 */
export function useStore() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [currentUser, setLocalCurrentUser] = useState<StaffMember | null>(null);
  const [adminOriginUser, setLocalAdminOriginUser] = useState<StaffMember | null>(null);
  const [activeRole, setLocalActiveRole] = useState<string>("admin");
  const [isRealAdmin, setIsRealAdmin] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(() => {
    setGuests(getGuests());
    setStaff(getStaff());
    setNotifications(getNotifications());
    setAuditLogs(getAuditLogs());
    setRooms(getRooms());
    setRoles(getRoles());
    setLocalCurrentUser(getCurrentUser());
    setLocalAdminOriginUser(getAdminOriginUser());
    setLocalActiveRole(getActiveRole());
    setIsRealAdmin(isRealAdminSession());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
    const unsub = subscribe(refresh);

    // Supabase arka plan otomatik başlatma, boşsa otomatik tohumlama (Auto-seed)
    // ve canlı veritabanı değişikliklerini anlık dinleme (Realtime)
    setupSupabaseAutoSync({
      getInitialData: () => ({
        guests: getGuests(),
        staff: getStaff(),
        roles: getRoles(),
        rooms: getRooms(),
      }),
      onRemoteGuestsLoaded: (remoteGuests) => {
        applyRemoteGuests(remoteGuests);
      },
      onRemoteStaffLoaded: (remoteStaff) => {
        applyRemoteStaff(remoteStaff);
      },
    });

    return () => {
      unsub();
    };
  }, [refresh]);

  const activeRoleDef = useMemo(() => {
    return roles.find((r) => r.key === activeRole) || roles.find((r) => r.key === "admin") || null;
  }, [roles, activeRole]);

  const setActiveRole = useCallback((roleKey: string) => {
    storeSetActiveRole(roleKey);
    setLocalActiveRole(roleKey);
  }, []);

  const setCurrentUser = useCallback((user: StaffMember | null) => {
    storeSetCurrentUser(user);
    setLocalCurrentUser(user);
  }, []);

  const hasPermission = useCallback((permKey: string) => {
    return hasRolePermission(activeRole, permKey);
  }, [activeRole]);

  const canAccessPage = useCallback((pathname: string) => {
    return canRoleAccessPath(activeRole, pathname);
  }, [activeRole]);

  const canAccessRoom = useCallback((roomId: string) => {
    return canRoleAccessRoom(activeRole, roomId);
  }, [activeRole]);

  const isSensitiveBlurred = useCallback((restrictionKey: "montaj" | "revize" | "revenue" | "contact") => {
    return isRoleRestricted(activeRole, restrictionKey);
  }, [activeRole]);

  const canManageGuest = useCallback(
    (guest: Guest, roomLeaderName?: string) => {
      return canUserManageGuestStatus(currentUser, activeRole, guest, roomLeaderName);
    },
    [currentUser, activeRole]
  );

  const byStatus = useCallback(
    (...statuses: GuestStatus[]) => guests.filter((g) => statuses.includes(g.status)),
    [guests]
  );

  const byId = useCallback(
    (id: string) => guests.find((g) => g.id === id),
    [guests]
  );

  const byRoom = useCallback(
    (roomId: string) => guests.filter((g) => g.room === roomId),
    [guests]
  );

  const staffByRoom = useCallback(
    (roomId: string) => staff.filter((s) => s.room === roomId),
    [staff]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const exitAdminPreview = useCallback(() => {
    storeExitAdminPreview();
    refresh();
  }, [refresh]);

  const changePassword = useCallback(
    (currentPass: string, newPass: string, confirmPass: string): PasswordChangeResult => {
      if (!currentUser) {
        return { success: false, message: "Aktif kullanıcı oturumu bulunamadı." };
      }
      const res = changeStaffPassword(currentUser.id, currentPass, newPass, confirmPass);
      if (res.success) {
        refresh();
      }
      return res;
    },
    [currentUser, refresh]
  );

  const isInPreviewMode = useMemo(() => {
    return Boolean(adminOriginUser && activeRole !== "admin");
  }, [adminOriginUser, activeRole]);

  return {
    guests,
    staff,
    notifications,
    auditLogs,
    addAuditLog,
    clearAuditLogs,
    rooms,
    roles,
    currentUser,
    activeRole,
    activeRoleDef,
    setActiveRole,
    setCurrentUser,
    adminOriginUser,
    isRealAdmin,
    isInPreviewMode,
    exitAdminPreview,
    changePassword,
    hasPermission,
    canAccessPage,
    canAccessRoom,
    isSensitiveBlurred,
    canManageGuest,
    byStatus,
    byId,
    byRoom,
    staffByRoom,
    unreadCount,
    refresh,
    isLoaded,
  };
}
