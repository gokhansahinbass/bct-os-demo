import type { Guest, Room } from "./store";

/**
 * UTF-8 BOM ekleyerek Türkçe karakterlerin (ğ, ü, ş, ı, ö, ç, İ vb.)
 * Excel'de bozulmadan doğrudan açılmasını sağlar.
 */
function downloadCSV(csvContent: string, fileName: string) {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCSV(field: any): string {
  if (field === null || field === undefined) return '""';
  const str = String(field).replace(/"/g, '""');
  return `"${str}"`;
}

// ── 1. Konuk Listesi Excel/CSV Dışa Aktarma ──

export function exportGuestsToCSV(guests: Guest[], fileName = "BCT-OS_Konuk_Listesi.csv") {
  const headers = [
    "Kayıt No",
    "Konuk Adı",
    "Firma",
    "Ünvan",
    "Telefon",
    "Temsilci",
    "Randevu Tarihi",
    "Randevu Saati",
    "Durum",
    "Ciro (TL)",
    "Ödeme Durumu",
    "Ön Ödeme (TL)",
    "Hizmetler",
    "Satış Odası",
    "Instagram",
    "Web Sitesi",
  ];

  const rows = guests.map((g) => {
    const servicesStr = (g.services || [])
      .map((s) => s.details.map((d) => d.label).join(", "))
      .filter(Boolean)
      .join(" | ");

    return [
      escapeCSV(g.registrationNo || g.id),
      escapeCSV(g.name),
      escapeCSV(g.company),
      escapeCSV(g.title || "Yönetici"),
      escapeCSV(g.phone),
      escapeCSV(g.representative || "-"),
      escapeCSV(g.appointmentDate || "-"),
      escapeCSV(g.appointmentTime || "-"),
      escapeCSV(g.status),
      escapeCSV(g.amount || "0"),
      escapeCSV(g.paymentStatus || "odenmedi"),
      escapeCSV(g.onOdemeMiktari || 0),
      escapeCSV(servicesStr || "Standart Çekim"),
      escapeCSV(g.room || "oda-1"),
      escapeCSV(g.instagram || "-"),
      escapeCSV(g.website || "-"),
    ].join(";");
  });

  const csv = [headers.join(";"), ...rows].join("\r\n");
  downloadCSV(csv, fileName);
}

// ── 2. Dergi Masası Siparişleri Excel/CSV Dışa Aktarma ──

export function exportMagazineOrdersToCSV(
  orders: Array<{ guest: Guest; service: any; status: string }>,
  fileName = "BCT-OS_Dergi_Siparisleri.csv"
) {
  const headers = [
    "Kayıt No",
    "Müşteri Adı",
    "Firma",
    "Satın Alınan Sayfalar / Paket",
    "İçerik & Tasarım Durumu",
    "Yüklenen Dosya Sayısı",
    "Tasarım Notları",
    "Tamamlanma Tarihi",
    "Sorumlu Editör",
    "İletişim Telefonu",
  ];

  const rows = orders.map(({ guest, service, status }) => {
    const pages = service.details.map((d: any) => d.label).join(", ");
    const fileCount = service.magazineFiles?.length || 0;

    return [
      escapeCSV(guest.registrationNo || guest.id),
      escapeCSV(guest.name),
      escapeCSV(guest.company),
      escapeCSV(pages || "Dergi Sayfası"),
      escapeCSV(status),
      escapeCSV(fileCount),
      escapeCSV(service.magazineNotes || "-"),
      escapeCSV(service.completedAt || "-"),
      escapeCSV(service.completedBy || "İrem"),
      escapeCSV(guest.phone),
    ].join(";");
  });

  const csv = [headers.join(";"), ...rows].join("\r\n");
  downloadCSV(csv, fileName);
}

// ── 3. Ek Hizmetler (Reels, Haber Siteleri vb.) Excel Dışa Aktarma ──

export function exportExtraServicesToCSV(
  items: Array<{ guest: Guest; service: any; detail: any }>,
  fileName = "BCT-OS_Ek_Hizmetler_Raporu.csv"
) {
  const headers = [
    "Kayıt No",
    "Konuk Adı",
    "Firma",
    "Hizmet Türü / Detay",
    "Durum",
    "Tamamlanma Tarihi",
    "Yapan Personel",
    "Yayın Linki / Not",
    "Telefon",
  ];

  const rows = items.map(({ guest, service, detail }) => {
    return [
      escapeCSV(guest.registrationNo || guest.id),
      escapeCSV(guest.name),
      escapeCSV(guest.company),
      escapeCSV(detail.label || service.type),
      escapeCSV(detail.status || "bekliyor"),
      escapeCSV(detail.completedAt || "-"),
      escapeCSV(detail.completedBy || "-"),
      escapeCSV(detail.link || detail.note || "-"),
      escapeCSV(guest.phone),
    ].join(";");
  });

  const csv = [headers.join(";"), ...rows].join("\r\n");
  downloadCSV(csv, fileName);
}

// ── 4. Yönetim Finansal & Oda Performans Raporu ──

export function exportFinancialSummaryToCSV(
  roomsData: Array<{ room: Room; metrics: any }>,
  fileName = "BCT-OS_Oda_Finansal_Rapor.csv"
) {
  const headers = [
    "Oda Adı",
    "Toplam Konuk",
    "Başarılı Satış",
    "Kaçan / İptal",
    "Dönüşüm Oranı (%)",
    "Ortalama Sepet (TL)",
    "Ön Ödeme Toplamı (TL)",
    "Toplam Ciro (TL)",
    "Odadaki Personel Sayısı",
  ];

  const rows = roomsData.map(({ room, metrics }) => {
    return [
      escapeCSV(room.name),
      escapeCSV(metrics.total),
      escapeCSV(metrics.successfulSales),
      escapeCSV(metrics.failedSales),
      escapeCSV(`%${metrics.conversionRate}`),
      escapeCSV(metrics.avgBasket.toLocaleString("tr-TR")),
      escapeCSV(metrics.onOdemeToplami.toLocaleString("tr-TR")),
      escapeCSV(metrics.ciro.toLocaleString("tr-TR")),
      escapeCSV(metrics.staffCount),
    ].join(";");
  });

  const csv = [headers.join(";"), ...rows].join("\r\n");
  downloadCSV(csv, fileName);
}

// ── 5. Tarayıcı Yazdırma (PDF olarak kaydetme) ──

export function printCurrentPageReport() {
  if (typeof window !== "undefined") {
    window.print();
  }
}
