// BCT-OS Paylaşımlı Veri Deposu
// Tüm sayfalar bu store'u kullanarak birbirleriyle tam senkronize çalışır.
// Veriler localStorage'da tutulur — sayfa yenilemelerinde veya sekmeler arasında bile anında güncellenir.

export type GuestStatus =
  | "kiosk_registered"    // Kiosk'ta kayıt oldu
  | "appointment_set"     // Çağrı merkezi randevu verdi
  | "in_studio"           // Stüdyoda çekimde
  | "shoot_done"          // Çekim bitti → Pazarlama bekliyor
  | "package_set"         // Pazarlama paket tanımladı → Montaj bekliyor
  | "editing"             // Montajda kurguda
  | "edit_done"           // Kurgu bitti → İzleme bekliyor
  | "reviewing"           // İzlemede revize ediliyor
  | "review_approved"     // İzleme onaylandı → Yayın bekliyor
  | "publishing"          // Yayında hazırlanıyor
  | "archived";           // Arşivlendi (tamamlandı)

export interface RevisionNote {
  id: string;
  time: string;
  percent: number;
  author: string;
  authorType: "staff" | "client";
  text: string;
  resolved: boolean;
  createdAt: string;
}

export interface Guest {
  id: string;
  name: string;
  company: string;
  title: string;
  phone: string;
  instagram: string;
  website: string;
  showIg: boolean;
  showWeb: boolean;
  vip: boolean;
  status: GuestStatus;
  representative: string;
  appointmentTime: string;
  shootTime: string;
  shootDuration: string;
  studio: string;
  hdd: string;
  editor: string;
  amount: string;
  paymentStatus: string;
  videoPackage: string;
  magazinePackage: string;
  pressDistribution: boolean;
  registrationNo: string;
  createdAt: string;
  notes: RevisionNote[];
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "active" | "inactive";
  avatar: string;
  createdAt: string;
}

// Varsayılan demo konukları — pipeline aşamalarını sergilemek için
const DEFAULT_GUESTS: Guest[] = [
  {
    id: "guest-boran",
    name: "Boran Şahin",
    company: "Yazılım A.Ş.",
    title: "Kurucu Ortak",
    phone: "+90 (532) 840 19 20",
    instagram: "boransahin",
    website: "yazilimas.com",
    showIg: true,
    showWeb: true,
    vip: true,
    status: "review_approved",
    representative: "Ayşe Yılmaz",
    appointmentTime: "14:30",
    shootTime: "14:15",
    shootDuration: "25 dk",
    studio: "Stüdyo A (4K)",
    hdd: "HDD-01 Kırmızı WD",
    editor: "Gökhan",
    amount: "60.000",
    paymentStatus: "Kapora Alındı (20.000 TL)",
    videoPackage: "VIP Kalıcı Video & Sosyal Medya Yayını",
    magazinePackage: "2 Sayfa Röportaj + Ön Kapak",
    pressDistribution: true,
    registrationNo: "#BCT-8921",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    notes: [
      { id: "note-1", time: "01:05", percent: 4.24, author: "Stajyer Mert", authorType: "staff", text: "Girişteki alt bant 2 saniye geç giriyor, düzeltilmeli.", resolved: true, createdAt: new Date().toISOString() },
      { id: "note-2", time: "12:40", percent: 49.67, author: "Müşteri", authorType: "client", text: "Konuşmacının yaka mikrofonu hışırdamış, sesi biraz toparlayalım.", resolved: false, createdAt: new Date().toISOString() },
    ],
  },
  {
    id: "guest-leyla",
    name: "Leyla Yılmaz",
    company: "Nova Medya",
    title: "Kreatif Direktör",
    phone: "+90 (541) 210 55 30",
    instagram: "leylaylmz",
    website: "novamedya.com",
    showIg: true,
    showWeb: true,
    vip: true,
    status: "editing",
    representative: "Caner Kaya",
    appointmentTime: "15:00",
    shootTime: "13:30",
    shootDuration: "32 dk",
    studio: "Stüdyo B",
    hdd: "HDD-02 Siyah",
    editor: "Gökhan",
    amount: "45.000",
    paymentStatus: "Tamamı Tahsil Edildi",
    videoPackage: "VIP Kalıcı Video & Sosyal Medya Yayını",
    magazinePackage: "1 Sayfa Röportaj (Standart)",
    pressDistribution: false,
    registrationNo: "#BCT-8922",
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    notes: [
      { id: "note-l1", time: "05:12", percent: 20.5, author: "Gökhan", authorType: "staff", text: "Giriş jeneriği müzik dengesi ayarlandı.", resolved: true, createdAt: new Date().toISOString() }
    ],
  },
  {
    id: "guest-ahmet",
    name: "Ahmet Taşçı",
    company: "Taşçı Lojistik",
    title: "Genel Müdür",
    phone: "+90 (532) 789 21 44",
    instagram: "tascilojistik",
    website: "tascilojistik.com",
    showIg: false,
    showWeb: true,
    vip: false,
    status: "package_set",
    representative: "Mert Demir",
    appointmentTime: "16:30",
    shootTime: "11:45",
    shootDuration: "18 dk",
    studio: "Stüdyo A",
    hdd: "HDD-03 Gri SanDisk",
    editor: "",
    amount: "0",
    paymentStatus: "Ücretsiz Çekim",
    videoPackage: "Ücretsiz Tek Seferlik Canlı Yayın",
    magazinePackage: "Basılı Dergi İstemiyor",
    pressDistribution: false,
    registrationNo: "#BCT-8923",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    notes: [],
  },
  {
    id: "guest-canan",
    name: "Canan Demir",
    company: "Demir Hukuk Bürosu",
    title: "Yönetici Ortak",
    phone: "+90 (533) 456 12 78",
    instagram: "canandemir.av",
    website: "demirhukuk.com",
    showIg: true,
    showWeb: true,
    vip: true,
    status: "shoot_done",
    representative: "Ayşe Yılmaz",
    appointmentTime: "17:00",
    shootTime: "12:40",
    shootDuration: "30 dk",
    studio: "Stüdyo A (4K)",
    hdd: "HDD-04 Mavi Seagate",
    editor: "",
    amount: "50.000",
    paymentStatus: "Fatura Bekliyor",
    videoPackage: "VIP Kalıcı Video & Sosyal Medya Yayını",
    magazinePackage: "1 Sayfa Röportaj (Standart)",
    pressDistribution: true,
    registrationNo: "#BCT-8924",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    notes: [],
  },
];

const DEFAULT_STAFF: StaffMember[] = [
  {
    id: "usr-ayse",
    name: "Ayşe Yılmaz",
    email: "ayse@bct.com",
    role: "Kıdemli Temsilci",
    department: "Çağrı Merkezi - Oda 1",
    status: "active",
    avatar: "AY",
    createdAt: "2024-01-15",
  },
  {
    id: "usr-gokhan",
    name: "Gökhan Şahinbaş",
    email: "gokhan@bct.com",
    role: "Süper Admin / Kurgu Şefi",
    department: "Montaj & Yönetim",
    status: "active",
    avatar: "GŞ",
    createdAt: "2024-01-01",
  },
  {
    id: "usr-mert",
    name: "Mert Demir",
    email: "mert@bct.com",
    role: "İzleme Stajyeri",
    department: "İzleme Masası",
    status: "inactive",
    avatar: "MD",
    createdAt: "2024-06-10",
  },
  {
    id: "usr-caner",
    name: "Caner Kaya",
    email: "caner@bct.com",
    role: "Çağrı Temsilcisi",
    department: "Çağrı Merkezi - Oda 2",
    status: "active",
    avatar: "CK",
    createdAt: "2024-03-20",
  },
];

const GUESTS_STORAGE_KEY = "bct_os_guests";
const STAFF_STORAGE_KEY = "bct_os_staff";

function loadGuests(): Guest[] {
  if (typeof window === "undefined") return DEFAULT_GUESTS;
  try {
    const stored = localStorage.getItem(GUESTS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return DEFAULT_GUESTS;
}

function saveGuests(guests: Guest[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUESTS_STORAGE_KEY, JSON.stringify(guests));
}

function loadStaff(): StaffMember[] {
  if (typeof window === "undefined") return DEFAULT_STAFF;
  try {
    const stored = localStorage.getItem(STAFF_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return DEFAULT_STAFF;
}

function saveStaff(staff: StaffMember[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(staff));
}

// Event-based reaktif bildirim sistemi
const listeners = new Set<() => void>();

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify() {
  listeners.forEach((fn) => fn());
}

// Tarayıcı sekmeleri arası (storage event) senkronizasyon
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === GUESTS_STORAGE_KEY || e.key === STAFF_STORAGE_KEY) {
      notify();
    }
  });
}

// ── Public Guest API ──

export function getGuests(): Guest[] {
  return loadGuests();
}

export function getGuestById(id: string): Guest | undefined {
  return loadGuests().find((g) => g.id === id);
}

export function getGuestsByStatus(...statuses: GuestStatus[]): Guest[] {
  return loadGuests().filter((g) => statuses.includes(g.status));
}

export function addGuest(guest: Omit<Guest, "id" | "createdAt" | "registrationNo" | "notes">): Guest {
  const guests = loadGuests();
  const nextNo = 8920 + guests.length + 1;
  const newGuest: Guest = {
    ...guest,
    id: "guest-" + Date.now(),
    createdAt: new Date().toISOString(),
    registrationNo: "#BCT-" + nextNo,
    notes: [],
  };
  guests.unshift(newGuest); // En başa ekle
  saveGuests(guests);
  notify();
  return newGuest;
}

export function updateGuest(id: string, updates: Partial<Guest>) {
  const guests = loadGuests();
  const idx = guests.findIndex((g) => g.id === id);
  if (idx === -1) return;
  guests[idx] = { ...guests[idx], ...updates };
  saveGuests(guests);
  notify();
}

export function updateGuestStatus(id: string, status: GuestStatus) {
  updateGuest(id, { status });
}

export function deleteGuest(id: string) {
  const guests = loadGuests().filter((g) => g.id !== id);
  saveGuests(guests);
  notify();
}

export function addNoteToGuest(guestId: string, note: Omit<RevisionNote, "id" | "createdAt">) {
  const guests = loadGuests();
  const idx = guests.findIndex((g) => g.id === guestId);
  if (idx === -1) return;
  guests[idx].notes.unshift({
    ...note,
    id: "note-" + Date.now(),
    createdAt: new Date().toISOString(),
  });
  saveGuests(guests);
  notify();
}

export function toggleNoteResolved(guestId: string, noteId: string) {
  const guests = loadGuests();
  const guest = guests.find((g) => g.id === guestId);
  if (!guest) return;
  const note = guest.notes.find((n) => n.id === noteId);
  if (!note) return;
  note.resolved = !note.resolved;
  saveGuests(guests);
  notify();
}

export function deleteNoteFromGuest(guestId: string, noteId: string) {
  const guests = loadGuests();
  const guest = guests.find((g) => g.id === guestId);
  if (!guest) return;
  guest.notes = guest.notes.filter((n) => n.id !== noteId);
  saveGuests(guests);
  notify();
}

// ── Public Staff API ──

export function getStaff(): StaffMember[] {
  return loadStaff();
}

export function addStaff(staffData: Omit<StaffMember, "id" | "createdAt" | "avatar">): StaffMember {
  const staff = loadStaff();
  const initials = staffData.name
    .split(" ")
    .map((w) => w[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 2);
  const newStaff: StaffMember = {
    ...staffData,
    id: "usr-" + Date.now(),
    avatar: initials || "ST",
    createdAt: new Date().toISOString().split("T")[0],
  };
  staff.unshift(newStaff);
  saveStaff(staff);
  notify();
  return newStaff;
}

export function toggleStaffStatus(id: string) {
  const staff = loadStaff();
  const member = staff.find((s) => s.id === id);
  if (!member) return;
  member.status = member.status === "active" ? "inactive" : "active";
  saveStaff(staff);
  notify();
}

export function deleteStaff(id: string) {
  const staff = loadStaff().filter((s) => s.id !== id);
  saveStaff(staff);
  notify();
}

// ── Reset to Defaults ──

export function resetToDefaults() {
  saveGuests(DEFAULT_GUESTS);
  saveStaff(DEFAULT_STAFF);
  notify();
}
