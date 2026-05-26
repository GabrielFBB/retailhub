import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

const publicPaths = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (publicPaths.includes(pathname)) {
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  const isProtectedPage =
    pathname.startsWith("/dashboard") || pathname.startsWith("/inventory");
  const isProtectedApi =
    pathname.startsWith("/api/products") ||
    pathname.startsWith("/api/dashboard") ||
    pathname.startsWith("/api/sales");

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  if (!session) {
    if (isProtectedApi) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/inventory/:path*",
    "/api/products/:path*",
    "/api/dashboard/:path*",
    "/api/sales",
    "/api/sales/:path*",
    "/login",
    "/register",
  ],
};
