import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const guestId = (formData.get("guestId") as string) || "general";
    const serviceId = (formData.get("serviceId") as string) || "dergi";

    if (!file) {
      return NextResponse.json(
        { success: false, message: "Dosya bulunamadı." },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileExt = file.name.split(".").pop() || "bin";
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${guestId}/${serviceId}_${Date.now()}_${sanitizedName}`;

    // 1. Supabase Storage Denemesi (Eğer yapılandırılmışsa)
    if (isSupabaseConfigured) {
      const client = getSupabaseClient();
      if (client) {
        try {
          const { data: uploadData, error: uploadError } = await client.storage
            .from("bct-assets")
            .upload(uniqueFileName, fileBuffer, {
              contentType: file.type || "application/octet-stream",
              upsert: true,
            });

          if (!uploadError && uploadData) {
            const { data: publicUrlData } = client.storage
              .from("bct-assets")
              .getPublicUrl(uploadData.path);

            return NextResponse.json({
              success: true,
              storage: "supabase",
              url: publicUrlData.publicUrl,
              name: file.name,
              size: file.size,
              type: file.type.startsWith("image/")
                ? "image"
                : file.type.includes("pdf")
                ? "pdf"
                : "doc",
            });
          }
        } catch (supabaseErr) {
          console.warn("[Upload API] Supabase storage fallback to local:", supabaseErr);
        }
      }
    }

    // 2. Yerel / İstemci Uyumlu Veri URL'i (Data URL Fallback)
    const base64Data = fileBuffer.toString("base64");
    const dataUrl = `data:${file.type || "application/octet-stream"};base64,${base64Data}`;

    return NextResponse.json({
      success: true,
      storage: "local",
      url: dataUrl,
      name: file.name,
      size: file.size,
      type: file.type.startsWith("image/")
        ? "image"
        : file.type.includes("pdf")
        ? "pdf"
        : "doc",
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Dosya yüklenirken hata oluştu." },
      { status: 500 }
    );
  }
}
