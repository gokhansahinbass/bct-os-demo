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
  | "archived"            // Arşivlendi (tamamlandı)
  | "cancelled";          // Randevu iptal edildi

// ── Dinamik Hizmet Modeli ──

export type ServiceType = "dergi" | "haber_sitesi" | "sosyal_medya" | "ek_hizmet" | "video";

export interface ServiceDetail {
  label: string;       // Örn: "Ön Kapak", "2 Sayfa Röportaj", "Reels Kurgu"
  checked: boolean;
}

export interface Service {
  id: string;
  type: ServiceType;
  details: ServiceDetail[];
  quantity?: number;          // Haber sitesi sayısı vb.
  customNote?: string;        // Serbest alan
  price: number;
  createdAt: string;
}

// ── Genişletilmiş Sosyal Medya ──

export interface SocialMedia {
  x?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  youtube?: string;
  website?: string;
  phone?: string;
  showInVideo: string[];      // Max 4 öge — aşılırsa uyarı
}

// ── Bildirim Sistemi ──

export interface Notification {
  id: string;
  to: string;        // staff ID veya "all"
  from: string;      // staff ID veya "system"
  type: "task" | "info" | "warning";
  title: string;
  message: string;
  read: boolean;
  link?: string;     // opsiyonel yönlendirme linki
  createdAt: string;
}

// ── Revize Notları ──

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

// ── Konuk (Guest) Arayüzü ──

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
  appointmentDate?: string;   // Tarih (Örn: "12 Ekim 2026")
  appointmentTime: string;    // Saat (Örn: "14:30")
  shootTime: string;
  shootDuration: string;
  studio: string;
  editor: string;
  amount: string;
  paymentStatus: "odenmedi" | "on_odeme" | "tamamlandi" | "ucretsiz";
  onOdemeMiktari: number;      // Ön ödeme yapıldıysa miktarı
  registrationNo: string;
  createdAt: string;
  notes: RevisionNote[];
  services: Service[];
  socialMedia: SocialMedia;
  room: string;               // Konuğu getiren call center odası
  marketer?: string;          // Satışı üstlenen pazarlamacı (Pazarlama Masası)
  cancelledReason?: string;   // İptal gerekçesi
  cancelledAt?: string;       // İptal edilme tarihi
}

// ── Personel (Staff) Arayüzü ──

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  username?: string;          // Giriş kullanıcı adı
  password?: string;          // Giriş şifresi (admin tarafından verilir)
  role: string;
  department: string;
  status: "active" | "inactive";
  avatar: string;
  createdAt: string;
  room?: string;              // Atanan oda (örn: "oda-1")
  isLeader?: boolean;         // Oda Şefi / Yönetici mi?
}

// ── Oda Tanımları ──
// ÖNEMLI: "Odalar" sadece Call Center satış odalarıdır.
// Bu odalar birbirleriyle teyit/konuk getirme konusunda rekabet eder.
// Montaj/Kurgu ayrı bir departmandır, oda değildir ve rekabete girmez.

export interface Room {
  id: string;
  name: string;
  description: string;
  color: string;              // Renk kodu
  staffIds: string[];
}

const DEFAULT_ROOMS: Room[] = [
  {
    id: "oda-1",
    name: "Oda 1",
    description: "Çağrı Merkezi — 1. Satış & Teyit Odası",
    color: "#2563EB",
    staffIds: ["usr-ayse", "usr-hakan", "usr-seda", "usr-emre", "usr-yasemin", "usr-baris"],
  },
  {
    id: "oda-2",
    name: "Oda 2",
    description: "Çağrı Merkezi — 2. Satış & Teyit Odası",
    color: "#7C3AED",
    staffIds: ["usr-caner", "usr-tolga", "usr-busra", "usr-kerem", "usr-merve", "usr-onur"],
  },
  {
    id: "oda-3",
    name: "Oda 3",
    description: "Çağrı Merkezi — 3. Satış & Teyit Odası",
    color: "#059669",
    staffIds: ["usr-elif", "usr-murat-koc", "usr-duygu", "usr-sinan", "usr-gizem", "usr-serdar"],
  },
];

// ── Rol ve Yetki Tanımları (RBAC) ──

export interface RoleDefinition {
  key: string;
  label: string;
  color: string;
  department: string;
  description?: string;
  permissions: Record<string, boolean>;
}

export interface PermissionItem {
  key: string;
  label: string;
  shortLabel: string;
  desc: string;
  icon?: string;
}

export const PERMISSION_GROUPS = {
  pages: [
    { key: "cagri", label: "Çağrı Merkezi", shortLabel: "Çağrı", desc: "Randevu & konuk davet modülü", icon: "call" },
    { key: "odalar", label: "Oda & Konuk Takibi", shortLabel: "Odalar", desc: "Satış odaları konuk randevu tabloları", icon: "meeting_room" },
    { key: "pazarlama", label: "Pazarlama Masası", shortLabel: "Pazarlama", desc: "Ek paket satışı ve tahsilat takibi", icon: "campaign" },
    { key: "montaj", label: "Kurgu & Montaj", shortLabel: "Montaj", desc: "Video kurgu ve ham kayıt işleme", icon: "movie_edit" },
    { key: "izleme", label: "İzleme Masası", shortLabel: "İzleme", desc: "Kalite kontrol ve onay masası", icon: "visibility" },
    { key: "revize", label: "Revize Yönetimi", shortLabel: "Revize", desc: "Video revize notları ve düzeltmeler", icon: "rate_review" },
    { key: "yayin", label: "Dijital Kart & Yayın", shortLabel: "Yayın", desc: "QR kart ve canlı yayın teslimi", icon: "qr_code_2" },
    { key: "yonetim", label: "Yönetim Kokpiti", shortLabel: "Yönetim", desc: "Üst düzey ciro ve ekip analitiği", icon: "insights" },
    { key: "admin", label: "Sistem Ayarları", shortLabel: "Admin", desc: "Personel, RBAC ve veri yönetimi", icon: "admin_panel_settings" },
  ] as PermissionItem[],

  rooms: [
    { key: "room_oda1", label: "Oda 1: Satış & Teyit Odası", shortLabel: "Oda 1", desc: "1. Çağrı Merkezi Odası konuk verileri", icon: "meeting_room" },
    { key: "room_oda2", label: "Oda 2: VIP Satış & Portföy", shortLabel: "Oda 2", desc: "2. Çağrı Merkezi Odası konuk verileri", icon: "meeting_room" },
    { key: "room_oda3", label: "Oda 3: Hızlı Teyit & Randevu", shortLabel: "Oda 3", desc: "3. Çağrı Merkezi Odası konuk verileri", icon: "meeting_room" },
  ] as PermissionItem[],

  sensitive: [
    { key: "view_montaj_stats", label: "Montaj & Kurgu Sayılarını Görme", shortLabel: "Montaj Stats", desc: "Kapalıysa montaj sayaçları ve kurgucu istatistikleri blurlanır", icon: "bar_chart" },
    { key: "view_revision_details", label: "Revize Notları & Detaylarını Görme", shortLabel: "Revize Detay", desc: "Kapalıysa revize ekranının sağı ve notlar blurlanır", icon: "speaker_notes" },
    { key: "view_financial_revenue", label: "Ciro & Finansal Rakamları Görme", shortLabel: "Ciro / Finans", desc: "Kapalıysa satış tutarları ve ciro rakamları gizlenir (₺***.***)", icon: "payments" },
    { key: "view_guest_contact", label: "Konuk Telefon & İletişim Görme", shortLabel: "İletişim", desc: "Kapalıysa konuk telefonları maskelenir", icon: "contact_phone" },
    { key: "can_edit_packages", label: "Paket Fiyatı & Hizmet Düzenleme", shortLabel: "Paket Düzenle", desc: "Kapalıysa paket fiyatı ve ek hizmet değiştiremez", icon: "edit_note" },
    { key: "can_delete_records", label: "Kayıt & Veri Silme Yetkisi", shortLabel: "Veri Silme", desc: "Kapalıysa sistemden hiçbir randevuyu veya personeli silemez", icon: "delete_forever" },
  ] as PermissionItem[],
};

export const DEFAULT_ROLES_LIST: RoleDefinition[] = [
  {
    key: "admin",
    label: "Süper Admin",
    color: "red",
    department: "Yönetim",
    description: "Tüm sistem, odalar, finans ve personel yetkilerine tam erişim.",
    permissions: {
      cagri: true, odalar: true, pazarlama: true, montaj: true, izleme: true, revize: true, yayin: true, yonetim: true, admin: true,
      room_oda1: true, room_oda2: true, room_oda3: true,
      view_montaj_stats: true, view_revision_details: true, view_financial_revenue: true, view_guest_contact: true, can_edit_packages: true, can_delete_records: true,
    },
  },
  {
    key: "cagri_sefi",
    label: "Oda Şefi / Yönetici",
    color: "indigo",
    department: "Çağrı Merkezi",
    description: "Oda ekibini yönetme, teyit hedefleri belirleme ve bizzat kendi konuklarını getirme yetkisi.",
    permissions: {
      cagri: true, odalar: true, pazarlama: false, montaj: false, izleme: false, revize: false, yayin: false, yonetim: false, admin: false,
      room_oda1: true, room_oda2: true, room_oda3: true,
      view_montaj_stats: false, view_revision_details: false, view_financial_revenue: true, view_guest_contact: true, can_edit_packages: false, can_delete_records: false,
    },
  },
  {
    key: "cagri_temsilci",
    label: "Çağrı Merkezi Temsilcisi",
    color: "blue",
    department: "Çağrı Merkezi",
    description: "Bireysel konuk randevusu oluşturma, teyit alma ve getirdiği konukları takip etme.",
    permissions: {
      cagri: true, odalar: true, pazarlama: false, montaj: false, izleme: false, revize: false, yayin: false, yonetim: false, admin: false,
      room_oda1: true, room_oda2: true, room_oda3: true,
      view_montaj_stats: false, view_revision_details: false, view_financial_revenue: false, view_guest_contact: true, can_edit_packages: false, can_delete_records: false,
    },
  },
  {
    key: "pazarlama",
    label: "Pazarlama Sorumlusu",
    color: "emerald",
    department: "Pazarlama Masası",
    description: "Dergi, haber sitesi, reels paket satışı ve tahsilat yönetimi.",
    permissions: {
      cagri: true, odalar: true, pazarlama: true, montaj: false, izleme: false, revize: false, yayin: false, yonetim: false, admin: false,
      room_oda1: true, room_oda2: true, room_oda3: true,
      view_montaj_stats: false, view_revision_details: false, view_financial_revenue: true, view_guest_contact: true, can_edit_packages: true, can_delete_records: false,
    },
  },
  {
    key: "kurgu",
    label: "Montaj / Kurgu Ekibi",
    color: "violet",
    department: "Kurgu & Montaj",
    description: "Ham video kurgusu, alt bant hazırlama ve revize takibi.",
    permissions: {
      cagri: false, odalar: false, pazarlama: false, montaj: true, izleme: false, revize: true, yayin: false, yonetim: false, admin: false,
      room_oda1: false, room_oda2: false, room_oda3: false,
      view_montaj_stats: true, view_revision_details: true, view_financial_revenue: false, view_guest_contact: false, can_edit_packages: false, can_delete_records: false,
    },
  },
  {
    key: "izleme",
    label: "İzleme Moderatörü",
    color: "amber",
    department: "İzleme Masası",
    description: "Video kalite onayı, revize notu düşme ve sevk kontrolü.",
    permissions: {
      cagri: false, odalar: false, pazarlama: false, montaj: false, izleme: true, revize: true, yayin: true, yonetim: false, admin: false,
      room_oda1: false, room_oda2: false, room_oda3: false,
      view_montaj_stats: true, view_revision_details: true, view_financial_revenue: false, view_guest_contact: false, can_edit_packages: false, can_delete_records: false,
    },
  },
];

// ── Varsayılan demo konukları ──

function createDefaultSocialMedia(ig: string, web: string, phone: string): SocialMedia {
  return {
    instagram: ig,
    website: web,
    phone: phone,
    x: "",
    facebook: "",
    linkedin: "",
    youtube: "",
    showInVideo: ig ? ["instagram", "website"] : ["website"],
  };
}

const DEFAULT_GUESTS: Guest[] = [
  // ── ODA 1 KONUKLARI (Oda Şefi: Ayşe Yılmaz, Çalışanlar: Hakan Demir, Seda Yıldız, Emre Çelik, Yasemin Kurt, Barış Koç) ──
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
    representative: "Ayşe Yılmaz",      // Oda Şefi Bizzat Getirdi
    appointmentDate: "12 Ekim 2026",
    appointmentTime: "14:30",
    shootTime: "14:15",
    shootDuration: "25 dk",
    studio: "Stüdyo A (4K)",
    editor: "Gökhan",
    amount: "60.000",
    paymentStatus: "on_odeme",
    onOdemeMiktari: 20000,
    registrationNo: "#BCT-8921",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    notes: [
      { id: "note-1", time: "01:05", percent: 4.24, author: "Mert Demir", authorType: "staff", text: "Girişteki alt bant 2 saniye geç giriyor, düzeltilmeli.", resolved: true, createdAt: new Date().toISOString() },
      { id: "note-2", time: "12:40", percent: 49.67, author: "Müşteri", authorType: "client", text: "Konuşmacının yaka mikrofonu hışırdamış, sesi biraz toparlayalım.", resolved: false, createdAt: new Date().toISOString() },
    ],
    services: [
      { id: "svc-1", type: "dergi", details: [{ label: "Ön Kapak", checked: true }, { label: "2 Sayfa Röportaj", checked: true }], price: 25000, createdAt: new Date().toISOString() },
      { id: "svc-2", type: "haber_sitesi", details: [{ label: "Ulusal Basın Dağıtım", checked: true }], quantity: 15, price: 10000, createdAt: new Date().toISOString() },
      { id: "svc-3", type: "video", details: [{ label: "VIP Kalıcı Video", checked: true }, { label: "Sosyal Medya Yayını", checked: true }], price: 25000, createdAt: new Date().toISOString() },
    ],
    socialMedia: createDefaultSocialMedia("boransahin", "yazilimas.com", "+90 (532) 840 19 20"),
    room: "oda-1",
    marketer: "Selin Karaca",           // Pazarlamacı satışı kapattı
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
    representative: "Hakan Demir",      // Oda 1 Temsilcisi Getirdi
    appointmentDate: "12 Ekim 2026",
    appointmentTime: "16:30",
    shootTime: "11:45",
    shootDuration: "18 dk",
    studio: "Stüdyo A",
    editor: "",
    amount: "0",
    paymentStatus: "ucretsiz",
    onOdemeMiktari: 0,
    registrationNo: "#BCT-8923",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    notes: [],
    services: [],
    socialMedia: createDefaultSocialMedia("tascilojistik", "tascilojistik.com", "+90 (532) 789 21 44"),
    room: "oda-1",
    marketer: "Burak Aksoy",            // Pazarlamacı görüştü (paket almadı)
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
    representative: "Seda Yıldız",      // Oda 1 Temsilcisi Getirdi
    appointmentDate: "12 Ekim 2026",
    appointmentTime: "17:00",
    shootTime: "12:40",
    shootDuration: "30 dk",
    studio: "Stüdyo A (4K)",
    editor: "",
    amount: "50.000",
    paymentStatus: "on_odeme",
    onOdemeMiktari: 15000,
    registrationNo: "#BCT-8924",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    notes: [],
    services: [
      { id: "svc-7", type: "dergi", details: [{ label: "1 Sayfa Röportaj", checked: true }], price: 15000, createdAt: new Date().toISOString() },
      { id: "svc-8", type: "haber_sitesi", details: [{ label: "Ulusal Basın Dağıtım", checked: true }], quantity: 15, price: 10000, createdAt: new Date().toISOString() },
      { id: "svc-9", type: "video", details: [{ label: "VIP Kalıcı Video", checked: true }], price: 25000, createdAt: new Date().toISOString() },
    ],
    socialMedia: createDefaultSocialMedia("canandemir.av", "demirhukuk.com", "+90 (533) 456 12 78"),
    room: "oda-1",
    marketer: "Selin Karaca",           // Pazarlamacı satışı kapattı
  },
  {
    id: "guest-murat",
    name: "Murat Aydın",
    company: "Aydın Teknoloji Ltd.",
    title: "Kurucu Ortak",
    phone: "+90 (533) 112 23 34",
    instagram: "aydintekno",
    website: "aydinteknoloji.io",
    showIg: true,
    showWeb: true,
    vip: false,
    status: "appointment_set",
    representative: "Emre Çelik",       // Oda 1 Temsilcisi Getirdi
    appointmentDate: "14 Ekim 2026",
    appointmentTime: "11:00",
    shootTime: "11:15",
    shootDuration: "20 dk",
    studio: "Stüdyo A (4K)",
    editor: "",
    amount: "0",
    paymentStatus: "odenmedi",
    onOdemeMiktari: 0,
    registrationNo: "#BCT-8927",
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    notes: [],
    services: [],
    socialMedia: createDefaultSocialMedia("aydintekno", "aydinteknoloji.io", "+90 (533) 112 23 34"),
    room: "oda-1",
  },
  {
    id: "guest-melis",
    name: "Melis Çetin",
    company: "Çetin Mimarlık & Tasarım",
    title: "Kurucu Mimar",
    phone: "+90 (533) 222 33 44",
    instagram: "cetinmimarlik",
    website: "cetinmimarlik.com",
    showIg: true,
    showWeb: true,
    vip: true,
    status: "in_studio",
    representative: "Yasemin Kurt",     // Oda 1 Temsilcisi Getirdi
    appointmentDate: "12 Ekim 2026",
    appointmentTime: "17:30",
    shootTime: "17:35",
    shootDuration: "25 dk",
    studio: "Stüdyo B",
    editor: "",
    amount: "35.000",
    paymentStatus: "on_odeme",
    onOdemeMiktari: 10000,
    registrationNo: "#BCT-8930",
    createdAt: new Date(Date.now() - 3600000 * 9).toISOString(),
    notes: [],
    services: [
      { id: "svc-m1", type: "sosyal_medya", details: [{ label: "Instagram Reels x3", checked: true }], price: 20000, createdAt: new Date().toISOString() },
      { id: "svc-m2", type: "video", details: [{ label: "4K YouTube Master Arşiv", checked: true }], price: 15000, createdAt: new Date().toISOString() },
    ],
    socialMedia: createDefaultSocialMedia("cetinmimarlik", "cetinmimarlik.com", "+90 (533) 222 33 44"),
    room: "oda-1",
    marketer: "Burak Aksoy",            // Pazarlamacı satışı kapattı
  },
  {
    id: "guest-tarik",
    name: "Tarık Sönmez",
    company: "Sönmez Kimya Sanayi",
    title: "Genel Müdür",
    phone: "+90 (532) 999 88 77",
    instagram: "sonmezkimya",
    website: "sonmezkimya.com.tr",
    showIg: false,
    showWeb: true,
    vip: false,
    status: "cancelled",
    representative: "Barış Koç",        // Oda 1 Temsilcisi Getirdi
    appointmentDate: "12 Ekim 2026",
    appointmentTime: "18:00",
    shootTime: "18:15",
    shootDuration: "20 dk",
    studio: "Stüdyo A (4K)",
    editor: "",
    amount: "0",
    paymentStatus: "odenmedi",
    onOdemeMiktari: 0,
    registrationNo: "#BCT-8931",
    createdAt: new Date(Date.now() - 3600000 * 15).toISOString(),
    cancelledReason: "Fabrika acil denetimi nedeniyle konuk randevuyu erteledi/iptal etti.",
    cancelledAt: "11 Ekim 2026 14:20",
    notes: [],
    services: [],
    socialMedia: createDefaultSocialMedia("sonmezkimya", "sonmezkimya.com.tr", "+90 (532) 999 88 77"),
    room: "oda-1",
  },

  // ── ODA 2 KONUKLARI (Oda Şefi: Caner Kaya, Çalışanlar: Tolga Şen, Büşra Aydın, Kerem Vural, Merve Güler, Onur Doğan) ──
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
    representative: "Caner Kaya",       // Oda Şefi Bizzat Getirdi
    appointmentDate: "12 Ekim 2026",
    appointmentTime: "15:00",
    shootTime: "13:30",
    shootDuration: "32 dk",
    studio: "Stüdyo B",
    editor: "Gökhan",
    amount: "45.000",
    paymentStatus: "tamamlandi",
    onOdemeMiktari: 0,
    registrationNo: "#BCT-8922",
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    notes: [
      { id: "note-l1", time: "05:12", percent: 20.5, author: "Gökhan", authorType: "staff", text: "Giriş jeneriği müzik dengesi ayarlandı.", resolved: true, createdAt: new Date().toISOString() }
    ],
    services: [
      { id: "svc-4", type: "dergi", details: [{ label: "1 Sayfa Röportaj", checked: true }], price: 15000, createdAt: new Date().toISOString() },
      { id: "svc-5", type: "sosyal_medya", details: [{ label: "Instagram Reels x2", checked: true }, { label: "YouTube Shorts x1", checked: true }], price: 30000, createdAt: new Date().toISOString() },
    ],
    socialMedia: createDefaultSocialMedia("leylaylmz", "novamedya.com", "+90 (541) 210 55 30"),
    room: "oda-2",
    marketer: "Burak Aksoy",            // Pazarlamacı satışı kapattı
  },
  {
    id: "guest-serkan",
    name: "Serkan Kaya",
    company: "Kaya Mimarlık & İnşaat",
    title: "Yönetim Kurulu Başkanı",
    phone: "+90 (532) 345 67 89",
    instagram: "kayamimarlik",
    website: "kayamimarlik.com.tr",
    showIg: true,
    showWeb: true,
    vip: false,
    status: "appointment_set",
    representative: "Tolga Şen",        // Oda 2 Temsilcisi Getirdi
    appointmentDate: "13 Ekim 2026",
    appointmentTime: "14:00",
    shootTime: "14:15",
    shootDuration: "25 dk",
    studio: "Stüdyo A (4K)",
    editor: "",
    amount: "0",
    paymentStatus: "odenmedi",
    onOdemeMiktari: 0,
    registrationNo: "#BCT-8925",
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    notes: [],
    services: [],
    socialMedia: createDefaultSocialMedia("kayamimarlik", "kayamimarlik.com.tr", "+90 (532) 345 67 89"),
    room: "oda-2",
  },
  {
    id: "guest-kemal",
    name: "Kemal Özkan",
    company: "Özkan Sağlık Grubu",
    title: "CEO",
    phone: "+90 (535) 667 78 89",
    instagram: "ozkansaglik",
    website: "ozkansaglik.com",
    showIg: true,
    showWeb: true,
    vip: false,
    status: "cancelled",
    representative: "Büşra Aydın",      // Oda 2 Temsilcisi Getirdi
    appointmentDate: "12 Ekim 2026",
    appointmentTime: "10:30",
    shootTime: "10:45",
    shootDuration: "30 dk",
    studio: "Stüdyo A (4K)",
    editor: "",
    amount: "0",
    paymentStatus: "odenmedi",
    onOdemeMiktari: 0,
    registrationNo: "#BCT-8929",
    createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    cancelledReason: "Hastane açılış programı çakışması nedeniyle erteleme/iptal talebi iletildi.",
    cancelledAt: "11 Ekim 2026 18:30",
    notes: [],
    services: [],
    socialMedia: createDefaultSocialMedia("ozkansaglik", "ozkansaglik.com", "+90 (535) 667 78 89"),
    room: "oda-2",
  },
  {
    id: "guest-aslihan",
    name: "Aslıhan Erdem",
    company: "Erdem Dental Klinik",
    title: "Başhekim",
    phone: "+90 (543) 777 66 55",
    instagram: "erdemdental",
    website: "erdemdental.com",
    showIg: true,
    showWeb: true,
    vip: true,
    status: "shoot_done",
    representative: "Kerem Vural",      // Oda 2 Temsilcisi Getirdi
    appointmentDate: "12 Ekim 2026",
    appointmentTime: "16:00",
    shootTime: "13:00",
    shootDuration: "25 dk",
    studio: "Stüdyo A (4K)",
    editor: "",
    amount: "40.000",
    paymentStatus: "on_odeme",
    onOdemeMiktari: 15000,
    registrationNo: "#BCT-8932",
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    notes: [],
    services: [
      { id: "svc-a1", type: "haber_sitesi", details: [{ label: "Ekonomi & Sağlık Basın Portalları", checked: true }], quantity: 10, price: 15000, createdAt: new Date().toISOString() },
      { id: "svc-a2", type: "video", details: [{ label: "VIP Kalıcı Video", checked: true }], price: 25000, createdAt: new Date().toISOString() },
    ],
    socialMedia: createDefaultSocialMedia("erdemdental", "erdemdental.com", "+90 (543) 777 66 55"),
    room: "oda-2",
    marketer: "Selin Karaca",           // Pazarlamacı satışı kapattı
  },
  {
    id: "guest-oguzhan",
    name: "Oğuzhan Yalçın",
    company: "Yalçın Otomotiv",
    title: "Yönetim Kurulu Üyesi",
    phone: "+90 (530) 444 33 22",
    instagram: "yalcinto",
    website: "yalcinotomotiv.com",
    showIg: false,
    showWeb: true,
    vip: false,
    status: "shoot_done",
    representative: "Merve Güler",      // Oda 2 Temsilcisi Getirdi
    appointmentDate: "12 Ekim 2026",
    appointmentTime: "13:00",
    shootTime: "13:15",
    shootDuration: "20 dk",
    studio: "Stüdyo B",
    editor: "",
    amount: "0",
    paymentStatus: "ucretsiz",
    onOdemeMiktari: 0,
    registrationNo: "#BCT-8933",
    createdAt: new Date(Date.now() - 3600000 * 11).toISOString(),
    notes: [],
    services: [],
    socialMedia: createDefaultSocialMedia("yalcinto", "yalcinotomotiv.com", "+90 (530) 444 33 22"),
    room: "oda-2",
    marketer: "Selin Karaca",           // Pazarlamacı görüştü (paket almadı)
  },
  {
    id: "guest-ece",
    name: "Ece Vatan",
    company: "Vatan Danışmanlık",
    title: "İK Direktörü",
    phone: "+90 (555) 123 99 88",
    instagram: "vatandanismanlik",
    website: "vatandanismanlik.com",
    showIg: true,
    showWeb: true,
    vip: false,
    status: "appointment_set",
    representative: "Onur Doğan",       // Oda 2 Temsilcisi Getirdi
    appointmentDate: "15 Ekim 2026",
    appointmentTime: "10:30",
    shootTime: "10:45",
    shootDuration: "25 dk",
    studio: "Stüdyo A (4K)",
    editor: "",
    amount: "0",
    paymentStatus: "odenmedi",
    onOdemeMiktari: 0,
    registrationNo: "#BCT-8934",
    createdAt: new Date(Date.now() - 3600000 * 13).toISOString(),
    notes: [],
    services: [],
    socialMedia: createDefaultSocialMedia("vatandanismanlik", "vatandanismanlik.com", "+90 (555) 123 99 88"),
    room: "oda-2",
  },

  // ── ODA 3 KONUKLARI (Oda Şefi: Elif Arslan, Çalışanlar: Murat Koç, Duygu Keskin, Sinan Öztürk, Gizem Şimşek, Serdar Alkan) ──
  {
    id: "guest-zeynep",
    name: "Zeynep Koç",
    company: "Koç Finans Danışmanlık",
    title: "Genel Müdür",
    phone: "+90 (542) 987 65 43",
    instagram: "kocfinans",
    website: "kocfinans.com",
    showIg: true,
    showWeb: true,
    vip: false,
    status: "appointment_set",
    representative: "Elif Arslan",      // Oda Şefi Bizzat Getirdi
    appointmentDate: "13 Ekim 2026",
    appointmentTime: "15:30",
    shootTime: "15:45",
    shootDuration: "30 dk",
    studio: "Stüdyo B",
    editor: "",
    amount: "0",
    paymentStatus: "odenmedi",
    onOdemeMiktari: 0,
    registrationNo: "#BCT-8926",
    createdAt: new Date(Date.now() - 3600000 * 7).toISOString(),
    notes: [],
    services: [],
    socialMedia: createDefaultSocialMedia("kocfinans", "kocfinans.com", "+90 (542) 987 65 43"),
    room: "oda-3",
  },
  {
    id: "guest-deniz",
    name: "Deniz Yurt",
    company: "Yurt E-Ticaret A.Ş.",
    title: "Pazarlama Direktörü",
    phone: "+90 (544) 555 44 33",
    instagram: "yurteticaret",
    website: "yurteticaret.com",
    showIg: false,
    showWeb: true,
    vip: false,
    status: "cancelled",
    representative: "Duygu Keskin",     // Oda 3 Temsilcisi Getirdi
    appointmentDate: "11 Ekim 2026",
    appointmentTime: "16:00",
    shootTime: "16:15",
    shootDuration: "25 dk",
    studio: "Stüdyo B",
    editor: "",
    amount: "0",
    paymentStatus: "odenmedi",
    onOdemeMiktari: 0,
    registrationNo: "#BCT-8928",
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    cancelledReason: "Konuk acil yurt dışı iş seyahati nedeniyle randevuyu iptal etti.",
    cancelledAt: "11 Ekim 2026 10:15",
    notes: [],
    services: [],
    socialMedia: createDefaultSocialMedia("yurteticaret", "yurteticaret.com", "+90 (544) 555 44 33"),
    room: "oda-3",
  },
  {
    id: "guest-faruk",
    name: "Faruk Tekin",
    company: "Tekin Enerji Sistemleri",
    title: "CEO",
    phone: "+90 (532) 111 22 88",
    instagram: "tekinenerji",
    website: "tekinenerji.com.tr",
    showIg: true,
    showWeb: true,
    vip: true,
    status: "editing",
    representative: "Murat Koç",        // Oda 3 Temsilcisi Getirdi
    appointmentDate: "12 Ekim 2026",
    appointmentTime: "12:00",
    shootTime: "12:15",
    shootDuration: "35 dk",
    studio: "Stüdyo A (4K)",
    editor: "Gökhan",
    amount: "55.000",
    paymentStatus: "on_odeme",
    onOdemeMiktari: 20000,
    registrationNo: "#BCT-8935",
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    notes: [],
    services: [
      { id: "svc-f1", type: "dergi", details: [{ label: "2 Sayfa Röportaj", checked: true }, { label: "İç Kapak", checked: true }], price: 30000, createdAt: new Date().toISOString() },
      { id: "svc-f2", type: "video", details: [{ label: "VIP Kalıcı Video", checked: true }], price: 25000, createdAt: new Date().toISOString() },
    ],
    socialMedia: createDefaultSocialMedia("tekinenerji", "tekinenerji.com.tr", "+90 (532) 111 22 88"),
    room: "oda-3",
    marketer: "Selin Karaca",           // Pazarlamacı satışı kapattı
  },
  {
    id: "guest-banu",
    name: "Banu Çiçek",
    company: "Çiçek Moda & Tekstil",
    title: "Kreatif Direktör",
    phone: "+90 (542) 333 44 55",
    instagram: "cicekmoda",
    website: "cicekmoda.com",
    showIg: true,
    showWeb: true,
    vip: false,
    status: "package_set",
    representative: "Sinan Öztürk",     // Oda 3 Temsilcisi Getirdi
    appointmentDate: "12 Ekim 2026",
    appointmentTime: "15:45",
    shootTime: "16:00",
    shootDuration: "20 dk",
    studio: "Stüdyo B",
    editor: "",
    amount: "0",
    paymentStatus: "ucretsiz",
    onOdemeMiktari: 0,
    registrationNo: "#BCT-8936",
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    notes: [],
    services: [],
    socialMedia: createDefaultSocialMedia("cicekmoda", "cicekmoda.com", "+90 (542) 333 44 55"),
    room: "oda-3",
    marketer: "Burak Aksoy",            // Pazarlamacı görüştü (paket almadı)
  },
  {
    id: "guest-cihan",
    name: "Cihan Berk",
    company: "Berk Lojistik Filo",
    title: "Operasyon Direktörü",
    phone: "+90 (533) 888 77 66",
    instagram: "berklojistik",
    website: "berkfilo.com",
    showIg: true,
    showWeb: true,
    vip: true,
    status: "shoot_done",
    representative: "Gizem Şimşek",     // Oda 3 Temsilcisi Getirdi
    appointmentDate: "12 Ekim 2026",
    appointmentTime: "14:45",
    shootTime: "15:00",
    shootDuration: "25 dk",
    studio: "Stüdyo A (4K)",
    editor: "",
    amount: "30.000",
    paymentStatus: "on_odeme",
    onOdemeMiktari: 10000,
    registrationNo: "#BCT-8937",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    notes: [],
    services: [
      { id: "svc-c1", type: "haber_sitesi", details: [{ label: "Ulusal Basın Dağıtım", checked: true }], quantity: 15, price: 10000, createdAt: new Date().toISOString() },
      { id: "svc-c2", type: "sosyal_medya", details: [{ label: "Instagram Reels x2", checked: true }], price: 20000, createdAt: new Date().toISOString() },
    ],
    socialMedia: createDefaultSocialMedia("berklojistik", "berkfilo.com", "+90 (533) 888 77 66"),
    room: "oda-3",
    marketer: "Burak Aksoy",            // Pazarlamacı satışı kapattı
  },
  {
    id: "guest-nilufer",
    name: "Nilüfer Tan",
    company: "Tan Hukuk Danışmanlık",
    title: "Kurucu Avukat",
    phone: "+90 (535) 444 55 66",
    instagram: "tanhukuk",
    website: "tanhukuk.av.tr",
    showIg: true,
    showWeb: true,
    vip: false,
    status: "appointment_set",
    representative: "Serdar Alkan",     // Oda 3 Temsilcisi Getirdi
    appointmentDate: "14 Ekim 2026",
    appointmentTime: "16:30",
    shootTime: "16:45",
    shootDuration: "25 dk",
    studio: "Stüdyo B",
    editor: "",
    amount: "0",
    paymentStatus: "odenmedi",
    onOdemeMiktari: 0,
    registrationNo: "#BCT-8938",
    createdAt: new Date(Date.now() - 3600000 * 7).toISOString(),
    notes: [],
    services: [],
    socialMedia: createDefaultSocialMedia("tanhukuk", "tanhukuk.av.tr", "+90 (535) 444 55 66"),
    room: "oda-3",
  },
];

const DEFAULT_STAFF: StaffMember[] = [
  // ── ODA 1 KADROSU (Şef + 5 Temsilci = 6 Kişi) ──
  {
    id: "usr-ayse",
    name: "Ayşe Yılmaz",
    email: "ayse@bct.com",
    username: "ayse",
    password: "ayse123",
    role: "Oda Şefi / Yönetici",
    department: "Çağrı Merkezi — Oda 1",
    status: "active",
    avatar: "AY",
    createdAt: "2024-01-15",
    room: "oda-1",
    isLeader: true,
  },
  {
    id: "usr-hakan",
    name: "Hakan Demir",
    email: "hakan@bct.com",
    username: "hakan",
    password: "bct123",
    role: "Çağrı Merkezi Temsilcisi",
    department: "Çağrı Merkezi — Oda 1",
    status: "active",
    avatar: "HD",
    createdAt: "2024-02-10",
    room: "oda-1",
  },
  {
    id: "usr-seda",
    name: "Seda Yıldız",
    email: "seda@bct.com",
    username: "seda",
    password: "bct123",
    role: "Çağrı Merkezi Temsilcisi",
    department: "Çağrı Merkezi — Oda 1",
    status: "active",
    avatar: "SY",
    createdAt: "2024-03-05",
    room: "oda-1",
  },
  {
    id: "usr-emre",
    name: "Emre Çelik",
    email: "emre@bct.com",
    username: "emre",
    password: "bct123",
    role: "Çağrı Merkezi Temsilcisi",
    department: "Çağrı Merkezi — Oda 1",
    status: "active",
    avatar: "EÇ",
    createdAt: "2024-04-12",
    room: "oda-1",
  },
  {
    id: "usr-yasemin",
    name: "Yasemin Kurt",
    email: "yasemin@bct.com",
    username: "yasemin",
    password: "bct123",
    role: "Çağrı Merkezi Temsilcisi",
    department: "Çağrı Merkezi — Oda 1",
    status: "active",
    avatar: "YK",
    createdAt: "2024-05-18",
    room: "oda-1",
  },
  {
    id: "usr-baris",
    name: "Barış Koç",
    email: "baris@bct.com",
    username: "baris",
    password: "bct123",
    role: "Çağrı Merkezi Temsilcisi",
    department: "Çağrı Merkezi — Oda 1",
    status: "active",
    avatar: "BK",
    createdAt: "2024-06-01",
    room: "oda-1",
  },

  // ── ODA 2 KADROSU (Şef + 5 Temsilci = 6 Kişi) ──
  {
    id: "usr-caner",
    name: "Caner Kaya",
    email: "caner@bct.com",
    username: "caner",
    password: "caner123",
    role: "Oda Şefi / Yönetici",
    department: "Çağrı Merkezi — Oda 2",
    status: "active",
    avatar: "CK",
    createdAt: "2024-03-20",
    room: "oda-2",
    isLeader: true,
  },
  {
    id: "usr-tolga",
    name: "Tolga Şen",
    email: "tolga@bct.com",
    username: "tolga",
    password: "bct123",
    role: "Çağrı Merkezi Temsilcisi",
    department: "Çağrı Merkezi — Oda 2",
    status: "active",
    avatar: "TŞ",
    createdAt: "2024-03-25",
    room: "oda-2",
  },
  {
    id: "usr-busra",
    name: "Büşra Aydın",
    email: "busra@bct.com",
    username: "busra",
    password: "bct123",
    role: "Çağrı Merkezi Temsilcisi",
    department: "Çağrı Merkezi — Oda 2",
    status: "active",
    avatar: "BA",
    createdAt: "2024-04-01",
    room: "oda-2",
  },
  {
    id: "usr-kerem",
    name: "Kerem Vural",
    email: "kerem@bct.com",
    username: "kerem",
    password: "bct123",
    role: "Çağrı Merkezi Temsilcisi",
    department: "Çağrı Merkezi — Oda 2",
    status: "active",
    avatar: "KV",
    createdAt: "2024-04-15",
    room: "oda-2",
  },
  {
    id: "usr-merve",
    name: "Merve Güler",
    email: "merve@bct.com",
    username: "merve",
    password: "bct123",
    role: "Çağrı Merkezi Temsilcisi",
    department: "Çağrı Merkezi — Oda 2",
    status: "active",
    avatar: "MG",
    createdAt: "2024-05-10",
    room: "oda-2",
  },
  {
    id: "usr-onur",
    name: "Onur Doğan",
    email: "onur@bct.com",
    username: "onur",
    password: "bct123",
    role: "Çağrı Merkezi Temsilcisi",
    department: "Çağrı Merkezi — Oda 2",
    status: "active",
    avatar: "OD",
    createdAt: "2024-06-05",
    room: "oda-2",
  },

  // ── ODA 3 KADROSU (Şef + 5 Temsilci = 6 Kişi) ──
  {
    id: "usr-elif",
    name: "Elif Arslan",
    email: "elif@bct.com",
    username: "elif",
    password: "elif123",
    role: "Oda Şefi / Yönetici",
    department: "Çağrı Merkezi — Oda 3",
    status: "active",
    avatar: "EA",
    createdAt: "2024-05-01",
    room: "oda-3",
    isLeader: true,
  },
  {
    id: "usr-murat-koc",
    name: "Murat Koç",
    email: "murat@bct.com",
    username: "murat",
    password: "bct123",
    role: "Çağrı Merkezi Temsilcisi",
    department: "Çağrı Merkezi — Oda 3",
    status: "active",
    avatar: "MK",
    createdAt: "2024-05-12",
    room: "oda-3",
  },
  {
    id: "usr-duygu",
    name: "Duygu Keskin",
    email: "duygu@bct.com",
    username: "duygu",
    password: "bct123",
    role: "Çağrı Merkezi Temsilcisi",
    department: "Çağrı Merkezi — Oda 3",
    status: "active",
    avatar: "DK",
    createdAt: "2024-05-20",
    room: "oda-3",
  },
  {
    id: "usr-sinan",
    name: "Sinan Öztürk",
    email: "sinan@bct.com",
    username: "sinan",
    password: "bct123",
    role: "Çağrı Merkezi Temsilcisi",
    department: "Çağrı Merkezi — Oda 3",
    status: "active",
    avatar: "SÖ",
    createdAt: "2024-06-01",
    room: "oda-3",
  },
  {
    id: "usr-gizem",
    name: "Gizem Şimşek",
    email: "gizem@bct.com",
    username: "gizem",
    password: "bct123",
    role: "Çağrı Merkezi Temsilcisi",
    department: "Çağrı Merkezi — Oda 3",
    status: "active",
    avatar: "GŞ",
    createdAt: "2024-06-15",
    room: "oda-3",
  },
  {
    id: "usr-serdar",
    name: "Serdar Alkan",
    email: "serdar@bct.com",
    username: "serdar",
    password: "bct123",
    role: "Çağrı Merkezi Temsilcisi",
    department: "Çağrı Merkezi — Oda 3",
    status: "active",
    avatar: "SA",
    createdAt: "2024-07-01",
    room: "oda-3",
  },

  // ── PAZARLAMA MASASI (Ayrı birim — Stüdyoya gelen konuklara paket satar) ──
  {
    id: "usr-selin",
    name: "Selin Karaca",
    email: "selin@bct.com",
    username: "selin",
    password: "selin123",
    role: "Kıdemli Pazarlama Uzmanı",
    department: "Pazarlama Masası",
    status: "active",
    avatar: "SK",
    createdAt: "2024-02-15",
  },
  {
    id: "usr-burak",
    name: "Burak Aksoy",
    email: "burak@bct.com",
    username: "burak",
    password: "burak123",
    role: "Pazarlama Sorumlusu",
    department: "Pazarlama Masası",
    status: "active",
    avatar: "BA",
    createdAt: "2024-04-10",
  },

  // ── MONTAJ & KURGU DEPARTMANI (Ayrı teknik birim — rekabete girmez) ──
  {
    id: "usr-gokhan",
    name: "Gökhan Şahinbaş",
    email: "gokhan@bct.com",
    username: "gokhan",
    password: "bct2026",
    role: "Süper Admin / Kurgu Şefi",
    department: "Montaj & Kurgu Departmanı",
    status: "active",
    avatar: "GŞ",
    createdAt: "2024-01-01",
  },
  {
    id: "usr-mert",
    name: "Mert Demir",
    email: "mert@bct.com",
    username: "mert",
    password: "mert123",
    role: "İzleme & Revize Sorumlusu",
    department: "Montaj & Kurgu Departmanı",
    status: "active",
    avatar: "MD",
    createdAt: "2024-06-10",
  },
];

const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    to: "usr-gokhan",
    from: "system",
    type: "task",
    title: "Yeni Kurgu Görevi",
    message: "Boran Şahin (VIP) videosu kurgu kuyruğuna eklendi.",
    read: false,
    link: "/dashboard/montaj",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "notif-2",
    to: "usr-gokhan",
    from: "system",
    type: "info",
    title: "İzleme Onayı",
    message: "Leyla Yılmaz videosu izleme onayını bekliyor.",
    read: false,
    link: "/dashboard/izleme",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "notif-3",
    to: "all",
    from: "system",
    type: "warning",
    title: "Darboğaz Uyarısı",
    message: "İzleme masasında 3 video onay bekliyor. Kapasite kritik seviyede.",
    read: true,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

// ── Storage Keys ──

const GUESTS_STORAGE_KEY = "bct_os_guests";
const STAFF_STORAGE_KEY = "bct_os_staff";
const NOTIFICATIONS_STORAGE_KEY = "bct_os_notifications";
const ROOMS_STORAGE_KEY = "bct_os_rooms";
const ROLES_STORAGE_KEY = "bct_os_roles";

// ── Load / Save Helpers ──

function loadGuests(): Guest[] {
  if (typeof window === "undefined") return DEFAULT_GUESTS;
  try {
    const stored = localStorage.getItem(GUESTS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Eksik DEFAULT_GUESTS varsa (yeni eklenen iptal ve gelecek konuklar) birleştir
        const existingIds = new Set(parsed.map((g: Guest) => g.id));
        const missingDefaults = DEFAULT_GUESTS.filter((dg) => !existingIds.has(dg.id));
        const combined = [...parsed, ...missingDefaults];

        return combined.map((g: Guest) => {
          let services = g.services || [];
          const defaultMatch = DEFAULT_GUESTS.find((dg) => dg.id === g.id);
          if (services.length === 0 && defaultMatch && defaultMatch.services.length > 0) {
            services = defaultMatch.services;
          }

          // VIP KURALI: Paket almayan biri (ücretli hizmeti olmayan) ASLA VIP OLAMAZ!
          const hasPaidServices = services.length > 0 && services.some((s) => s.price > 0);
          const totalAmount = services.reduce((sum, s) => sum + (s.price || 0), 0);

          return {
            ...g,
            services,
            vip: hasPaidServices,
            amount: totalAmount > 0 ? totalAmount.toLocaleString("tr-TR") : "0",
            socialMedia: g.socialMedia || createDefaultSocialMedia(g.instagram || "", g.website || "", g.phone || ""),
            room: g.room || defaultMatch?.room || "oda-1",
            marketer: defaultMatch?.marketer || g.marketer,
            representative: defaultMatch?.representative || g.representative || "Ayşe Yılmaz",
            appointmentDate: g.appointmentDate || defaultMatch?.appointmentDate || "12 Ekim 2026",
            appointmentTime: g.appointmentTime || defaultMatch?.appointmentTime || "15:00",
            shootTime: g.shootTime || defaultMatch?.shootTime || "15:15",
            cancelledReason: g.cancelledReason || defaultMatch?.cancelledReason,
            cancelledAt: g.cancelledAt || defaultMatch?.cancelledAt,
          };
        });
      }
    }
  } catch { /* ignore */ }
  return DEFAULT_GUESTS;
}

function saveGuests(guests: Guest[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUESTS_STORAGE_KEY, JSON.stringify(guests));
}

function loadRoles(): RoleDefinition[] {
  if (typeof window === "undefined") return DEFAULT_ROLES_LIST;
  try {
    const stored = localStorage.getItem(ROLES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingKeys = new Set(parsed.map((r: RoleDefinition) => r.key));
        const missingDefaults = DEFAULT_ROLES_LIST.filter((dr) => !existingKeys.has(dr.key));
        const merged = parsed.map((pr: RoleDefinition) => {
          const defaultDef = DEFAULT_ROLES_LIST.find((dr) => dr.key === pr.key);
          return {
            ...pr,
            permissions: {
              ...(defaultDef?.permissions || {}),
              ...pr.permissions,
            },
          };
        });
        return [...merged, ...missingDefaults];
      }
    }
  } catch { /* ignore */ }
  return DEFAULT_ROLES_LIST;
}

function saveRoles(roles: RoleDefinition[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles));
}

function loadStaff(): StaffMember[] {
  if (typeof window === "undefined") return DEFAULT_STAFF;
  try {
    const stored = localStorage.getItem(STAFF_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingMap = new Map(parsed.map((s: StaffMember) => [s.id, s]));
        const merged = DEFAULT_STAFF.map((ds) => {
          const existing = existingMap.get(ds.id);
          return existing ? { 
            ...ds, 
            ...existing, 
            role: ds.role, 
            room: ds.room, 
            isLeader: ds.isLeader,
            username: existing.username || ds.username,
            password: existing.password || ds.password,
          } : ds;
        });
        parsed.forEach((s: StaffMember) => {
          if (!DEFAULT_STAFF.some((ds) => ds.id === s.id)) {
            merged.push({
              ...s,
              username: s.username || s.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, ""),
              password: s.password || "bct123",
            });
          }
        });
        return merged;
      }
    }
  } catch { /* ignore */ }
  return DEFAULT_STAFF;
}

function saveStaff(staff: StaffMember[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(staff));
}

function loadNotifications(): Notification[] {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATIONS;
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  return DEFAULT_NOTIFICATIONS;
}

function saveNotifications(notifications: Notification[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
}

function loadRooms(): Room[] {
  if (typeof window === "undefined") return DEFAULT_ROOMS;
  try {
    const stored = localStorage.getItem(ROOMS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return DEFAULT_ROOMS.map((dr) => {
          const found = parsed.find((r: Room) => r.id === dr.id);
          return found ? { ...dr, ...found, staffIds: dr.staffIds } : dr;
        });
      }
    }
  } catch { /* ignore */ }
  return DEFAULT_ROOMS;
}

function saveRooms(rooms: Room[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms));
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
    if (
      e.key === GUESTS_STORAGE_KEY ||
      e.key === STAFF_STORAGE_KEY ||
      e.key === NOTIFICATIONS_STORAGE_KEY ||
      e.key === ROOMS_STORAGE_KEY
    ) {
      notify();
    }
  });
}

// ══════════════════════════════════
// ── Public Guest API ──
// ══════════════════════════════════

export function getGuests(): Guest[] {
  return loadGuests();
}

export function getGuestById(id: string): Guest | undefined {
  return loadGuests().find((g) => g.id === id);
}

export function getGuestsByStatus(...statuses: GuestStatus[]): Guest[] {
  return loadGuests().filter((g) => statuses.includes(g.status));
}

export function getGuestsByRoom(roomId: string): Guest[] {
  return loadGuests().filter((g) => g.room === roomId);
}

export function addGuest(
  guest: Omit<Guest, "id" | "createdAt" | "registrationNo" | "notes" | "services" | "socialMedia" | "room" | "paymentStatus" | "onOdemeMiktari"> & {
    room?: string;
    services?: Service[];
    socialMedia?: SocialMedia;
    paymentStatus?: "odenmedi" | "on_odeme" | "tamamlandi" | "ucretsiz";
    onOdemeMiktari?: number;
  }
): Guest {
  const guests = loadGuests();
  const nextNo = 8920 + guests.length + 1;
  const services = guest.services || [];
  const hasPaidServices = services.length > 0 && services.some((s) => s.price > 0);
  const totalAmount = services.reduce((sum, s) => sum + (s.price || 0), 0);

  const newGuest: Guest = {
    ...guest,
    paymentStatus: guest.paymentStatus || "odenmedi",
    onOdemeMiktari: guest.onOdemeMiktari || 0,
    vip: hasPaidServices,
    amount: totalAmount > 0 ? totalAmount.toLocaleString("tr-TR") : (guest.amount || "0"),
    id: "guest-" + Date.now(),
    createdAt: new Date().toISOString(),
    registrationNo: "#BCT-" + nextNo,
    notes: [],
    services,
    socialMedia: guest.socialMedia || createDefaultSocialMedia(guest.instagram || "", guest.website || "", guest.phone || ""),
    room: guest.room || "oda-1",
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
  const updated = { ...guests[idx], ...updates };
  // VIP Senkronizasyonu: Paket almayan biri ASLA VIP olamaz
  if (updated.services) {
    const hasPaid = updated.services.length > 0 && updated.services.some((s) => s.price > 0);
    updated.vip = hasPaid;
    const total = updated.services.reduce((sum, s) => sum + (s.price || 0), 0);
    updated.amount = total > 0 ? total.toLocaleString("tr-TR") : "0";
  }
  guests[idx] = updated;
  saveGuests(guests);
  notify();
}

export function updateGuestStatus(id: string, status: GuestStatus) {
  updateGuest(id, { status });
}

export function cancelGuestAppointment(guestId: string, reason?: string) {
  const guests = loadGuests();
  const idx = guests.findIndex((g) => g.id === guestId);
  if (idx === -1) return;
  guests[idx].status = "cancelled";
  guests[idx].cancelledReason = reason || "Konuk talebi ile randevu iptal edildi.";
  guests[idx].cancelledAt = new Date().toLocaleString("tr-TR");
  saveGuests(guests);
  notify();
}

export function restoreGuestAppointment(guestId: string) {
  const guests = loadGuests();
  const idx = guests.findIndex((g) => g.id === guestId);
  if (idx === -1) return;
  guests[idx].status = "appointment_set";
  guests[idx].cancelledReason = undefined;
  guests[idx].cancelledAt = undefined;
  saveGuests(guests);
  notify();
}

export function markGuestArrived(guestId: string) {
  const guests = loadGuests();
  const idx = guests.findIndex((g) => g.id === guestId);
  if (idx === -1) return;
  guests[idx].status = "kiosk_registered";
  saveGuests(guests);
  notify();
}

export function deleteGuest(id: string) {
  const guests = loadGuests().filter((g) => g.id !== id);
  saveGuests(guests);
  notify();
}

// ── Guest Service API ──

export function addServiceToGuest(guestId: string, service: Omit<Service, "id" | "createdAt">): Service | undefined {
  const guests = loadGuests();
  const idx = guests.findIndex((g) => g.id === guestId);
  if (idx === -1) return undefined;
  const newService: Service = {
    ...service,
    id: "svc-" + Date.now(),
    createdAt: new Date().toISOString(),
  };
  guests[idx].services.push(newService);
  // Toplam fiyatı ve VIP durumunu otomatik güncelle
  const totalPrice = guests[idx].services.reduce((sum, s) => sum + s.price, 0);
  guests[idx].amount = totalPrice.toLocaleString("tr-TR");
  guests[idx].vip = totalPrice > 0 && guests[idx].services.length > 0;
  saveGuests(guests);
  notify();
  return newService;
}

export function removeServiceFromGuest(guestId: string, serviceId: string) {
  const guests = loadGuests();
  const idx = guests.findIndex((g) => g.id === guestId);
  if (idx === -1) return;
  guests[idx].services = guests[idx].services.filter((s) => s.id !== serviceId);
  const totalPrice = guests[idx].services.reduce((sum, s) => sum + s.price, 0);
  guests[idx].amount = totalPrice.toLocaleString("tr-TR");
  guests[idx].vip = totalPrice > 0 && guests[idx].services.length > 0;
  saveGuests(guests);
  notify();
}

export function updateServiceInGuest(guestId: string, serviceId: string, updates: Partial<Service>) {
  const guests = loadGuests();
  const idx = guests.findIndex((g) => g.id === guestId);
  if (idx === -1) return;
  const svcIdx = guests[idx].services.findIndex((s) => s.id === serviceId);
  if (svcIdx === -1) return;
  guests[idx].services[svcIdx] = { ...guests[idx].services[svcIdx], ...updates };
  const totalPrice = guests[idx].services.reduce((sum, s) => sum + s.price, 0);
  guests[idx].amount = totalPrice.toLocaleString("tr-TR");
  guests[idx].vip = totalPrice > 0 && guests[idx].services.length > 0;
  saveGuests(guests);
  notify();
}

// ── Guest Notes API ──

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

// ══════════════════════════════════
// ── Public Staff API ──
// ══════════════════════════════════

export function getStaff(): StaffMember[] {
  return loadStaff();
}

export function getStaffByRoom(roomId: string): StaffMember[] {
  return loadStaff().filter((s) => s.room === roomId);
}

export function addStaff(staffData: Omit<StaffMember, "id" | "createdAt" | "avatar">): StaffMember {
  const staff = loadStaff();
  const initials = staffData.name
    .split(" ")
    .map((w) => w[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 2);
  const username = staffData.username || staffData.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
  const password = staffData.password || "bct123";
  const newStaff: StaffMember = {
    ...staffData,
    username,
    password,
    id: "usr-" + Date.now(),
    avatar: initials || "ST",
    createdAt: new Date().toISOString().split("T")[0],
  };
  staff.unshift(newStaff);
  saveStaff(staff);
  notify();
  return newStaff;
}

export function updateStaffPassword(id: string, newPassword: string): boolean {
  const staff = loadStaff();
  const member = staff.find((s) => s.id === id);
  if (!member) return false;
  member.password = newPassword;
  saveStaff(staff);
  notify();
  return true;
}

export function updateStaff(id: string, updates: Partial<StaffMember>): boolean {
  const staff = loadStaff();
  const idx = staff.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  staff[idx] = { ...staff[idx], ...updates };
  saveStaff(staff);
  notify();
  return true;
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

// ══════════════════════════════════
// ── Public Notifications API ──
// ══════════════════════════════════

export function getNotifications(): Notification[] {
  return loadNotifications();
}

export function getUnreadNotifications(): Notification[] {
  return loadNotifications().filter((n) => !n.read);
}

export function addNotification(data: Omit<Notification, "id" | "createdAt" | "read">): Notification {
  const notifications = loadNotifications();
  const newNotif: Notification = {
    ...data,
    id: "notif-" + Date.now(),
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifications.unshift(newNotif);
  // Max 50 bildirim tut
  if (notifications.length > 50) notifications.pop();
  saveNotifications(notifications);
  notify();
  return newNotif;
}

export function markNotificationRead(id: string) {
  const notifications = loadNotifications();
  const notif = notifications.find((n) => n.id === id);
  if (!notif) return;
  notif.read = true;
  saveNotifications(notifications);
  notify();
}

export function markAllNotificationsRead() {
  const notifications = loadNotifications();
  notifications.forEach((n) => (n.read = true));
  saveNotifications(notifications);
  notify();
}

export function deleteNotification(id: string) {
  const notifications = loadNotifications().filter((n) => n.id !== id);
  saveNotifications(notifications);
  notify();
}

// ══════════════════════════════════
// ── Public Rooms API ──
// ══════════════════════════════════

export function getRooms(): Room[] {
  return loadRooms();
}

export function getRoomById(id: string): Room | undefined {
  return loadRooms().find((r) => r.id === id);
}

export function updateRoom(id: string, updates: Partial<Room>) {
  const rooms = loadRooms();
  const idx = rooms.findIndex((r) => r.id === id);
  if (idx === -1) return;
  rooms[idx] = { ...rooms[idx], ...updates };
  saveRooms(rooms);
  notify();
}

// ══════════════════════════════════
// ── Public Roles API ──
// ══════════════════════════════════

export function getRoles(): RoleDefinition[] {
  return loadRoles();
}

export function addRole(roleData: Omit<RoleDefinition, "key"> & { key?: string }): RoleDefinition {
  const roles = loadRoles();
  const key = roleData.key || "role-" + roleData.label.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 20) + "-" + Date.now();
  const newRole: RoleDefinition = {
    ...roleData,
    key,
  };
  roles.push(newRole);
  saveRoles(roles);
  notify();
  return newRole;
}

export function updateRole(key: string, updates: Partial<RoleDefinition>) {
  const roles = loadRoles();
  const idx = roles.findIndex((r) => r.key === key);
  if (idx === -1) return;
  roles[idx] = { ...roles[idx], ...updates };
  saveRoles(roles);
  notify();
}

export function deleteRole(key: string) {
  if (key === "admin") return; // Super admin silinemez
  const roles = loadRoles().filter((r) => r.key !== key);
  saveRoles(roles);
  notify();
}

// ══════════════════════════════════
// ── Reset to Defaults ──
// ══════════════════════════════════

export function resetToDefaults() {
  saveGuests(DEFAULT_GUESTS);
  saveStaff(DEFAULT_STAFF);
  saveNotifications(DEFAULT_NOTIFICATIONS);
  saveRooms(DEFAULT_ROOMS);
  saveRoles(DEFAULT_ROLES_LIST);
  notify();
}

// ══════════════════════════════════
// ── Session & Active Role Management ──
// ══════════════════════════════════

export const CURRENT_USER_STORAGE_KEY = "bct_current_user";
export const ACTIVE_ROLE_STORAGE_KEY = "bct_active_role";

export function getCurrentUser(): StaffMember | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return loadStaff().find((s) => s.id === "usr-gokhan") || null;
}

export function setCurrentUser(user: StaffMember | null) {
  if (typeof window === "undefined") return;
  if (!user) {
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
  } else {
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
  }
  notify();
}

export function getActiveRole(): string {
  if (typeof window === "undefined") return "admin";
  try {
    const stored = localStorage.getItem(ACTIVE_ROLE_STORAGE_KEY);
    if (stored) return stored;
  } catch {}
  return "admin";
}

export function setActiveRole(roleKey: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_ROLE_STORAGE_KEY, roleKey);
  notify();
}

export function hasRolePermission(roleKey: string, permKey: string): boolean {
  if (roleKey === "admin") return true;
  const roles = loadRoles();
  const role = roles.find((r) => r.key === roleKey);
  if (!role) return false;
  return Boolean(role.permissions[permKey]);
}

export function canRoleAccessPath(roleKey: string, pathname: string): boolean {
  if (roleKey === "admin") return true;
  if (pathname.includes("/cagri-merkezi")) return hasRolePermission(roleKey, "cagri");
  if (pathname.includes("/odalar")) return hasRolePermission(roleKey, "odalar");
  if (pathname.includes("/pazarlama")) return hasRolePermission(roleKey, "pazarlama");
  if (pathname.includes("/montaj")) return hasRolePermission(roleKey, "montaj");
  if (pathname.includes("/izleme")) return hasRolePermission(roleKey, "izleme");
  if (pathname.includes("/revize")) return hasRolePermission(roleKey, "revize");
  if (pathname.includes("/yayin")) return hasRolePermission(roleKey, "yayin");
  if (pathname.includes("/yonetim")) return hasRolePermission(roleKey, "yonetim");
  if (pathname.includes("/admin")) return hasRolePermission(roleKey, "admin");
  return true;
}

export function canRoleAccessRoom(roleKey: string, roomId: string): boolean {
  if (roleKey === "admin") return true;
  if (roomId === "oda-1") return hasRolePermission(roleKey, "room_oda1");
  if (roomId === "oda-2") return hasRolePermission(roleKey, "room_oda2");
  if (roomId === "oda-3") return hasRolePermission(roleKey, "room_oda3");
  return true;
}

export function isRoleRestricted(roleKey: string, restrictionKey: "montaj" | "revize" | "revenue" | "contact"): boolean {
  if (roleKey === "admin") return false;
  if (restrictionKey === "montaj") return !hasRolePermission(roleKey, "view_montaj_stats");
  if (restrictionKey === "revize") return !hasRolePermission(roleKey, "view_revision_details");
  if (restrictionKey === "revenue") return !hasRolePermission(roleKey, "view_financial_revenue");
  if (restrictionKey === "contact") return !hasRolePermission(roleKey, "view_guest_contact");
  return false;
}

/**
 * Konuk randevu durumu ve aksiyon yetkilendirme kontrolü.
 * Kural: Randevu iptali, 'Geldi' işaretleme veya iptali geri alma işlemleri
 * YALNIZCA:
 * 1) Süper Admin (admin rolü veya Süper Admin personeli),
 * 2) O konuğu bizzat getiren/çağıran temsilci (guest.representative),
 * 3) VEYA o odanın yetkili lideri / şefi (roomLeaderName veya isLeader && user.room === guest.room)
 * tarafından yapılabilir. Normal bir çağrı elemanı başka personelin konuğunu ASLA değiştiremez.
 */
export function canUserManageGuestStatus(
  user: StaffMember | null,
  activeRole: string,
  guest: Guest,
  roomLeaderName?: string
): boolean {
  // 1. Süper Admin tam yetkilidir (admin rolündeyken)
  if (activeRole === "admin") {
    return true;
  }

  if (!user) return false;

  // 2. O konuğu bizzat çağıran/getiren temsilci
  if (
    guest.representative &&
    user.name &&
    guest.representative.trim().toLowerCase() === user.name.trim().toLowerCase()
  ) {
    return true;
  }

  // 3. O odanın lideri / şefi (Örn: Ayşe Yılmaz Oda 1'deki herkesi yönetebilir)
  if (
    roomLeaderName &&
    user.name &&
    roomLeaderName.trim().toLowerCase() === user.name.trim().toLowerCase()
  ) {
    return true;
  }

  // 4. Kullanıcı şef/lider ve odası bu konuğun odası ile eşleşiyorsa
  if (user.isLeader && user.room && guest.room && user.room === guest.room) {
    return true;
  }

  // 5. Şef önizleme rolünde ve oda eşleşiyorsa
  if (activeRole === "cagri_sefi" && user.room && guest.room && user.room === guest.room) {
    return true;
  }

  return false;
}



