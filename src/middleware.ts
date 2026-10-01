import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get("bct_auth")?.value;
  const isAuthenticated = authCookie === "granted";

  // 1. Dashboard sayfalarına yetkisiz erişim kontrolü (Sunucu Düzeyinde Koruma)
  if (pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Zaten oturum açmış kullanıcı /login sayfasına giderse dashboard'a yönlendir
  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard/cagri-merkezi", request.url));
  }

  // 3. Güvenlik Başlıkları (Security Headers)
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()"
  );

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/kiosk/:path*",
  ],
};
