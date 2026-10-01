/**
 * BCT-OS: Supabase Standalone Seed & Migration Script
 * Kullanım: node scripts/seed-supabase.js
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// 1. Ortam Değişkenlerini Yükle
function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      content.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const [k, ...v] = trimmed.split("=");
          if (k && v.length > 0) {
            process.env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
          }
        }
      });
      console.log(`[BCT-OS] ${file} yüklendi.`);
      break;
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("your-project-id")) {
  console.log("\n⚠️  [BCT-OS Tohumlama Uyarısı]");
  console.log("Supabase URL veya Key henüz tanımlanmamış (.env.local).");
  console.log("Sistem yerel depolama (Local-First) ile eksiksiz çalışmaya devam ediyor.\n");
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SEED_ROOMS = [
  { id: "oda-1", name: "Oda 1 (Ana Satış)", description: "Ayşe Yılmaz liderliğinde çağrı merkezi satış odası", color: "blue", staff_ids: ["usr-ayse", "usr-hakan", "usr-zeynep"] },
  { id: "oda-2", name: "Oda 2 (VIP Satış)", description: "Caner Kaya liderliğinde VIP konuk satış odası", color: "purple", staff_ids: ["usr-caner", "usr-elif", "usr-kemal"] },
  { id: "oda-3", name: "Oda 3 (Yeni Ekipler)", description: "Stüdyo çağrı merkezi rezervasyon odası", color: "emerald", staff_ids: ["usr-irem", "usr-mehmet"] },
];

const SEED_STAFF = [
  { id: "usr-gokhan", name: "Gökhan Şahinbaş", email: "gokhan@bct.com", username: "gokhan", password_hash: "admin123", role: "Süper Admin", department: "Yönetim", status: "active", is_leader: true },
  { id: "usr-ayse", name: "Ayşe Yılmaz", email: "ayse@bct.com", username: "ayse", password_hash: "bct123", role: "Çağrı Merkezi Şefi", department: "Çağrı Merkezi — Oda 1", status: "active", room: "oda-1", is_leader: true },
  { id: "usr-caner", name: "Caner Kaya", email: "caner@bct.com", username: "caner", password_hash: "bct123", role: "Çağrı Merkezi Şefi", department: "Çağrı Merkezi — Oda 2", status: "active", room: "oda-2", is_leader: true },
  { id: "usr-selin", name: "Selin Demir", email: "selin@bct.com", username: "selin", password_hash: "bct123", role: "Pazarlama Uzmanı", department: "Pazarlama & VIP Satış", status: "active", is_leader: false },
  { id: "usr-irem", name: "İrem Yıldız", email: "irem@bct.com", username: "irem", password_hash: "irem123", role: "Dergi Tasarımcısı", department: "Dergi Masası & Baskı", status: "active", is_leader: false },
  { id: "usr-hakan", name: "Hakan Özkan", email: "hakan@bct.com", username: "hakan", password_hash: "bct123", role: "Çağrı Merkezi Temsilcisi", department: "Çağrı Merkezi — Oda 1", status: "active", room: "oda-1", is_leader: false },
];

async function runSeed() {
  console.log("\n🚀 [BCT-OS] Supabase Veritabanı Tohumlama Başlatılıyor...");
  console.log(`Bağlantı: ${supabaseUrl}\n`);

  try {
    // 1. Odaları Aktar
    console.log("1. Satış Odaları aktarılıyor...");
    for (const r of SEED_ROOMS) {
      const { error } = await supabase.from("rooms").upsert(r);
      if (error) console.warn(`  - Oda (${r.id}) uyarısı:`, error.message);
      else console.log(`  ✓ Oda: ${r.name}`);
    }

    // 2. Personelleri Aktar
    console.log("\n2. Personeller aktarılıyor...");
    for (const s of SEED_STAFF) {
      const { error } = await supabase.from("staff").upsert(s);
      if (error) console.warn(`  - Personel (${s.username}) uyarısı:`, error.message);
      else console.log(`  ✓ Personel: ${s.name} (@${s.username})`);
    }

    console.log("\n✅ [BCT-OS] Tohumlama başarıyla tamamlandı!");
  } catch (err) {
    console.error("Tohumlama hatası:", err.message);
  }
}

runSeed();
