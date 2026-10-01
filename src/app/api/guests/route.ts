import { NextResponse } from "next/server";
import { fetchGuestsFromSupabase, upsertGuestToSupabase, deleteGuestFromSupabase, isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  if (isSupabaseConfigured) {
    const data = await fetchGuestsFromSupabase();
    if (data) {
      return NextResponse.json({ success: true, source: "supabase", data });
    }
  }

  return NextResponse.json({
    success: true,
    source: "local",
    message: "Supabase not configured or unreachable, using local store",
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || !body.name) {
      return NextResponse.json({ success: false, error: "Geçersiz veri" }, { status: 400 });
    }

    if (isSupabaseConfigured) {
      const ok = await upsertGuestToSupabase(body);
      if (ok) {
        return NextResponse.json({ success: true, message: "Supabase üzerinde güncellendi" });
      }
    }

    return NextResponse.json({ success: true, message: "Yerel kayıt tamamlandı" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
