import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protege todas las rutas /admin excepto el login.
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const cookie = request.cookies.get("vicen_admin");
    if (!cookie || cookie.value !== "1") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
