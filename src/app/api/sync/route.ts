import { NextResponse } from "next/server";
import { syncAllDataToSupabase, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: false,
        message:
          "Supabase henüz yapılandırılmamış. Lütfen Vercel veya sunucu ortam değişkenlerinde NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY değerlerini tanımlayınız.",
      });
    }

    const res = await syncAllDataToSupabase({
      guests: body.guests || [],
      staff: body.staff || [],
      roles: body.roles || [],
      rooms: body.rooms || [],
    });

    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: `Hata: ${err?.message || "Sunucu hatası"}` },
      { status: 500 }
    );
  }
}
