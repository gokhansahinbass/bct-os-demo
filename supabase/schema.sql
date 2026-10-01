-- =========================================================
-- BCT-OS STÜDYO OPERASYON SİSTEMİ
-- Supabase (PostgreSQL) Prodüksiyon Veritabanı Şeması
-- =========================================================

-- 1. Eklentileri Etkinleştir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Roller Tablosu (RBAC)
CREATE TABLE IF NOT EXISTS public.roles (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT 'blue',
    department TEXT NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Satış Odaları Tablosu (Call Center)
CREATE TABLE IF NOT EXISTS public.rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT NOT NULL DEFAULT '#2563EB',
    staff_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Personel Tablosu (Staff)
CREATE TABLE IF NOT EXISTS public.staff (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL DEFAULT 'bct123',
    role TEXT NOT NULL,
    department TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'inactive'
    avatar TEXT NOT NULL DEFAULT 'ST',
    room TEXT REFERENCES public.rooms(id) ON DELETE SET NULL,
    is_leader BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Konuklar ve Randevular Tablosu (Guests)
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
    payment_status TEXT NOT NULL DEFAULT 'odenmedi', -- 'odenmedi' | 'on_odeme' | 'tamamlandi' | 'ucretsiz'
    on_odeme_miktari NUMERIC NOT NULL DEFAULT 0,
    registration_no TEXT UNIQUE NOT NULL,
    room TEXT REFERENCES public.rooms(id) ON DELETE SET NULL,
    marketer TEXT,
    cancelled_reason TEXT,
    cancelled_at TEXT,
    services JSONB NOT NULL DEFAULT '[]'::jsonb,
    social_media JSONB NOT NULL DEFAULT '{}'::jsonb,
    notes JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Bildirimler Tablosu
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY DEFAULT ('notif-' || gen_random_uuid()),
    recipient_id TEXT NOT NULL, -- staff id veya 'all'
    sender_id TEXT NOT NULL DEFAULT 'system',
    type TEXT NOT NULL DEFAULT 'info', -- 'task' | 'info' | 'warning'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Audit Log / İşlem Geçmişi Tablosu
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id TEXT,
    actor_name TEXT,
    action TEXT NOT NULL, -- 'create_guest', 'cancel_appointment', 'update_status', 'add_service'
    entity_type TEXT NOT NULL, -- 'guest', 'staff', 'service'
    entity_id TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Performans İndeksleri
CREATE INDEX IF NOT EXISTS idx_guests_status ON public.guests(status);
CREATE INDEX IF NOT EXISTS idx_guests_room ON public.guests(room);
CREATE INDEX IF NOT EXISTS idx_guests_rep ON public.guests(representative);
CREATE INDEX IF NOT EXISTS idx_staff_username ON public.staff(username);
CREATE INDEX IF NOT EXISTS idx_staff_email ON public.staff(email);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);

-- =========================================================
-- BAŞLANGIÇ VERİLERİ (SEED DATA)
-- =========================================================

-- Roller
INSERT INTO public.roles (id, key, label, color, department, description, permissions)
VALUES 
('role-admin', 'admin', 'Süper Admin', 'red', 'Yönetim', 'Tüm sistem, odalar, finans, dergi ve personel yetkilerine tam erişim.', '{"cagri":true,"odalar":true,"pazarlama":true,"dergi":true,"ek_hizmetler":true,"montaj":true,"izleme":true,"revize":true,"yayin":true,"yonetim":true,"admin":true,"room_oda1":true,"room_oda2":true,"room_oda3":true,"view_montaj_stats":true,"view_revision_details":true,"view_financial_revenue":true,"view_guest_contact":true,"can_edit_packages":true,"can_delete_records":true}'::jsonb),
('role-dergi', 'dergi_tasarimci', 'Dergi Tasarım & Editör', 'cyan', 'Dergi Masası', 'Müşterilerin dergi siparişlerini takip etme, içerik/dosya toplama ve baskı onaylama.', '{"cagri":false,"odalar":false,"pazarlama":false,"dergi":true,"ek_hizmetler":false,"montaj":false,"izleme":false,"revize":false,"yayin":false,"yonetim":false,"admin":false,"room_oda1":false,"room_oda2":false,"room_oda3":false,"view_montaj_stats":false,"view_revision_details":false,"view_financial_revenue":false,"view_guest_contact":true,"can_edit_packages":false,"can_delete_records":false}'::jsonb),
('role-sefi', 'cagri_sefi', 'Oda Şefi / Yönetici', 'indigo', 'Çağrı Merkezi', 'Oda ekibini yönetme, teyit hedefleri belirleme ve bizzat kendi konuklarını getirme yetkisi.', '{"cagri":true,"odalar":true,"pazarlama":false,"dergi":false,"ek_hizmetler":false,"montaj":false,"izleme":false,"revize":false,"yayin":false,"yonetim":false,"admin":false,"room_oda1":true,"room_oda2":true,"room_oda3":true,"view_montaj_stats":false,"view_revision_details":false,"view_financial_revenue":true,"view_guest_contact":true,"can_edit_packages":false,"can_delete_records":false}'::jsonb),
('role-temsilci', 'cagri_temsilci', 'Çağrı Merkezi Temsilcisi', 'blue', 'Çağrı Merkezi', 'Bireysel konuk randevusu oluşturma, teyit alma ve getirdiği konukları takip etme.', '{"cagri":true,"odalar":true,"pazarlama":false,"dergi":false,"ek_hizmetler":false,"montaj":false,"izleme":false,"revize":false,"yayin":false,"yonetim":false,"admin":false,"room_oda1":true,"room_oda2":true,"room_oda3":true,"view_montaj_stats":false,"view_revision_details":false,"view_financial_revenue":false,"view_guest_contact":true,"can_edit_packages":false,"can_delete_records":false}'::jsonb),
('role-pazarlama', 'pazarlama', 'Pazarlama Sorumlusu', 'emerald', 'Pazarlama Masası', 'Dergi, haber sitesi, reels paket satışı ve tahsilat yönetimi.', '{"cagri":true,"odalar":true,"pazarlama":true,"dergi":true,"ek_hizmetler":true,"montaj":false,"izleme":false,"revize":false,"yayin":false,"yonetim":false,"admin":false,"room_oda1":true,"room_oda2":true,"room_oda3":true,"view_montaj_stats":false,"view_revision_details":false,"view_financial_revenue":true,"view_guest_contact":true,"can_edit_packages":true,"can_delete_records":false}'::jsonb),
('role-kurgu', 'kurgu', 'Montaj / Kurgu Ekibi', 'violet', 'Kurgu & Montaj', 'Ham video kurgusu, alt bant hazırlama ve revize takibi.', '{"cagri":false,"odalar":false,"pazarlama":false,"dergi":false,"ek_hizmetler":false,"montaj":true,"izleme":false,"revize":true,"yayin":false,"yonetim":false,"admin":false,"room_oda1":false,"room_oda2":false,"room_oda3":false,"view_montaj_stats":true,"view_revision_details":true,"view_financial_revenue":false,"view_guest_contact":false,"can_edit_packages":false,"can_delete_records":false}'::jsonb),
('role-izleme', 'izleme', 'İzleme Moderatörü', 'amber', 'İzleme Masası', 'Video kalite onayı, revize notu düşme ve sevk kontrolü.', '{"cagri":false,"odalar":false,"pazarlama":false,"dergi":false,"ek_hizmetler":false,"montaj":false,"izleme":true,"revize":true,"yayin":true,"yonetim":false,"admin":false,"room_oda1":false,"room_oda2":false,"room_oda3":false,"view_montaj_stats":true,"view_revision_details":true,"view_financial_revenue":false,"view_guest_contact":false,"can_edit_packages":false,"can_delete_records":false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Odalar
INSERT INTO public.rooms (id, name, description, color, staff_ids)
VALUES
('oda-1', 'Oda 1', 'Çağrı Merkezi — 1. Satış & Teyit Odası', '#2563EB', '["usr-ayse", "usr-hakan", "usr-seda", "usr-emre", "usr-yasemin", "usr-baris"]'::jsonb),
('oda-2', 'Oda 2', 'Çağrı Merkezi — 2. Satış & Teyit Odası', '#7C3AED', '["usr-caner", "usr-tolga", "usr-busra", "usr-kerem", "usr-merve", "usr-onur"]'::jsonb),
('oda-3', 'Oda 3', 'Çağrı Merkezi — 3. Satış & Teyit Odası', '#059669', '["usr-elif", "usr-murat-koc", "usr-duygu", "usr-sinan", "usr-gizem", "usr-serdar"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Süper Admin & Ana Personeller
INSERT INTO public.staff (id, name, email, username, password_hash, role, department, status, avatar, room, is_leader)
VALUES
('usr-gokhan', 'Gökhan Şahinbaş', 'gokhan@bct.com', 'gokhan', 'bct2026', 'Süper Admin', 'Yönetim', 'active', 'GŞ', NULL, FALSE),
('usr-irem', 'İrem Kaya', 'irem@bct.com', 'irem', 'irem123', 'Dergi Tasarım & Editör', 'Dergi Masası', 'active', 'İK', NULL, FALSE),
('usr-selin', 'Selin Karaca', 'selin@bct.com', 'selin', 'selin123', 'Pazarlama Sorumlusu', 'Pazarlama Masası', 'active', 'SK', NULL, FALSE),
('usr-ayse', 'Ayşe Yılmaz', 'ayse@bct.com', 'ayse', 'ayse123', 'Oda Şefi / Yönetici', 'Çağrı Merkezi — Oda 1', 'active', 'AY', 'oda-1', TRUE),
('usr-caner', 'Caner Kaya', 'caner@bct.com', 'caner', 'caner123', 'Oda Şefi / Yönetici', 'Çağrı Merkezi — Oda 2', 'active', 'CK', 'oda-2', TRUE),
('usr-elif', 'Elif Arslan', 'elif@bct.com', 'elif', 'elif123', 'Oda Şefi / Yönetici', 'Çağrı Merkezi — Oda 3', 'active', 'EA', 'oda-3', TRUE),
('usr-mert', 'Mert Demir', 'mert@bct.com', 'mert', 'mert123', 'İzleme Moderatörü', 'İzleme Masası', 'active', 'MD', NULL, FALSE)
ON CONFLICT (email) DO NOTHING;

-- RLS (Row Level Security) - Varsayılan Olarak Açık ve Yetkilere Bağlı
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Anon/Authenticated okuma izinleri (API Route üzerinden güvenli erişim)
CREATE POLICY "Public Read Roles" ON public.roles FOR SELECT USING (true);
CREATE POLICY "Public Read Rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Public Read Staff" ON public.staff FOR SELECT USING (true);
CREATE POLICY "Public Read Guests" ON public.guests FOR SELECT USING (true);
CREATE POLICY "Public Write Guests" ON public.guests FOR ALL USING (true);
CREATE POLICY "Public Write Staff" ON public.staff FOR ALL USING (true);
