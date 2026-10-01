import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Guest, StaffMember, RoleDefinition, Room } from "./store";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "https://your-project-id.supabase.co" &&
    !supabaseUrl.includes("placeholder")
);

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return cachedClient;
}

// ── Veritabanı Okuma & Yazma Servisleri ──

export async function fetchGuestsFromSupabase(): Promise<Guest[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from("guests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase fetchGuests error:", error.message);
      return null;
    }

    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      company: row.company,
      title: row.title || "Yönetici",
      phone: row.phone,
      instagram: row.instagram || "",
      website: row.website || "",
      showIg: Boolean(row.show_ig),
      showWeb: Boolean(row.show_web),
      vip: Boolean(row.vip),
      status: row.status,
      representative: row.representative,
      appointmentDate: row.appointment_date,
      appointmentTime: row.appointment_time,
      shootTime: row.shoot_time,
      shootDuration: row.shoot_duration || "25 dk",
      studio: row.studio || "Stüdyo A (4K)",
      editor: row.editor || "",
      amount: row.amount || "0",
      paymentStatus: row.payment_status || "odenmedi",
      onOdemeMiktari: Number(row.on_odeme_miktari) || 0,
      registrationNo: row.registration_no,
      room: row.room || "oda-1",
      marketer: row.marketer,
      cancelledReason: row.cancelled_reason,
      cancelledAt: row.cancelled_at,
      services: row.services || [],
      socialMedia: row.social_media || {},
      notes: row.notes || [],
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error("fetchGuestsFromSupabase exception:", err);
    return null;
  }
}

export async function upsertGuestToSupabase(guest: Guest): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: guest.id,
      name: guest.name,
      company: guest.company,
      title: guest.title,
      phone: guest.phone,
      instagram: guest.instagram,
      website: guest.website,
      show_ig: guest.showIg,
      show_web: guest.showWeb,
      vip: guest.vip,
      status: guest.status,
      representative: guest.representative,
      appointment_date: guest.appointmentDate,
      appointment_time: guest.appointmentTime,
      shoot_time: guest.shootTime,
      shoot_duration: guest.shootDuration,
      studio: guest.studio,
      editor: guest.editor,
      amount: guest.amount,
      payment_status: guest.paymentStatus,
      on_odeme_miktari: guest.onOdemeMiktari,
      registration_no: guest.registrationNo,
      room: guest.room,
      marketer: guest.marketer,
      cancelled_reason: guest.cancelledReason,
      cancelled_at: guest.cancelledAt,
      services: guest.services,
      social_media: guest.socialMedia,
      notes: guest.notes,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from("guests").upsert(payload);
    if (error) {
      console.error("upsertGuestToSupabase error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("upsertGuestToSupabase exception:", err);
    return false;
  }
}

export async function deleteGuestFromSupabase(guestId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from("guests").delete().eq("id", guestId);
    return !error;
  } catch {
    return false;
  }
}

export async function fetchStaffFromSupabase(): Promise<StaffMember[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.from("staff").select("*");
    if (error) {
      console.warn("fetchStaffFromSupabase error:", error.message);
      return null;
    }
    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      username: row.username,
      password: row.password_hash,
      role: row.role,
      department: row.department,
      status: row.status,
      avatar: row.avatar,
      room: row.room,
      isLeader: Boolean(row.is_leader),
      createdAt: row.created_at,
    }));
  } catch {
    return null;
  }
}

export async function upsertStaffToSupabase(staff: StaffMember): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      username: staff.username,
      password_hash: staff.password,
      role: staff.role,
      department: staff.department,
      status: staff.status,
      avatar: staff.avatar,
      room: staff.room || null,
      is_leader: Boolean(staff.isLeader),
    };

    const { error } = await client.from("staff").upsert(payload);
    return !error;
  } catch {
    return false;
  }
}

// ── Toplu Senkronizasyon (Mevcut Verileri Supabase'e Aktarma) ──

export async function syncAllDataToSupabase(data: {
  guests: Guest[];
  staff: StaffMember[];
  roles: RoleDefinition[];
  rooms: Room[];
}): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message:
        "Supabase bağlantı bilgileri (.env) henüz tanımlanmamış. Lütfen NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY değerlerini giriniz.",
    };
  }

  try {
    // 1. Odaları Aktar
    for (const r of data.rooms) {
      await client.from("rooms").upsert({
        id: r.id,
        name: r.name,
        description: r.description,
        color: r.color,
        staff_ids: r.staffIds,
      });
    }

    // 2. Rolleri Aktar
    for (const rl of data.roles) {
      await client.from("roles").upsert({
        id: "role-" + rl.key,
        key: rl.key,
        label: rl.label,
        color: rl.color,
        department: rl.department,
        description: rl.description,
        permissions: rl.permissions,
      });
    }

    // 3. Personelleri Aktar
    for (const s of data.staff) {
      await upsertStaffToSupabase(s);
    }

    // 4. Konukları Aktar
    for (const g of data.guests) {
      await upsertGuestToSupabase(g);
    }

    return {
      success: true,
      message: `✓ Başarılı: ${data.guests.length} konuk, ${data.staff.length} personel, ${data.rooms.length} oda ve ${data.roles.length} rol Supabase veritabanına eksiksiz aktarıldı.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Senkronizasyon sırasında hata oluştu: ${err?.message || "Bilinmeyen hata"}`,
    };
  }
}

// ── Otomatik Başlatma, Otomatik Tohumlama (Auto-Seed) ve Canlı Dinleme (Realtime) ──

let realtimeSubscription: any = null;
let isAutoSyncInitialized = false;

export async function setupSupabaseAutoSync(callbacks: {
  getInitialData: () => {
    guests: Guest[];
    staff: StaffMember[];
    roles: RoleDefinition[];
    rooms: Room[];
  };
  onRemoteGuestsLoaded: (remoteGuests: Guest[]) => void;
  onRemoteStaffLoaded: (remoteStaff: StaffMember[]) => void;
}) {
  if (typeof window === "undefined" || !isSupabaseConfigured) return;
  const client = getSupabaseClient();
  if (!client) return;

  if (isAutoSyncInitialized) return;
  isAutoSyncInitialized = true;

  try {
    // 1. Supabase tablosundaki kayıt sayısını kontrol et
    const { count, error } = await client
      .from("guests")
      .select("*", { count: "exact", head: true });

    if (!error) {
      if (count === 0 || count === null) {
        // Tablo henüz boş! OTOMATİK OLARAK doldur (Yöneticiye ihtiyaç duymadan)
        const initial = callbacks.getInitialData();
        await syncAllDataToSupabase(initial);
      } else {
        // Tabloda veri var! En güncel verileri çek ve yerel duruma uygula
        const remoteGuests = await fetchGuestsFromSupabase();
        if (remoteGuests && remoteGuests.length > 0) {
          callbacks.onRemoteGuestsLoaded(remoteGuests);
        }
        const remoteStaff = await fetchStaffFromSupabase();
        if (remoteStaff && remoteStaff.length > 0) {
          callbacks.onRemoteStaffLoaded(remoteStaff);
        }
      }
    }

    // 2. Canlı Değişiklik Dinleyicisi (Realtime Subscription)
    // Bir personel telefondan konuk veya randevu güncellediğinde, diğer ekranlar anında güncellenir
    if (!realtimeSubscription) {
      realtimeSubscription = client
        .channel("bct-live-updates")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "guests" },
          async () => {
            const updated = await fetchGuestsFromSupabase();
            if (updated) callbacks.onRemoteGuestsLoaded(updated);
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "staff" },
          async () => {
            const updated = await fetchStaffFromSupabase();
            if (updated) callbacks.onRemoteStaffLoaded(updated);
          }
        )
        .subscribe();
    }
  } catch (err) {
    console.warn("[BCT-OS] Supabase otomatik senkronizasyon:", err);
  }
}

