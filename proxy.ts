import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = [
  "/painel",
  "/producao",
  "/despesas",
  "/fechamento",
  "/racoes",
  "/relatorios",
  "/configuracoes",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedRoute = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (!isProtectedRoute || hasSessionCookie(request)) {
    return NextResponse.next();
  }

  const signInUrl = new URL("/entrar", request.url);
  signInUrl.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);

  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: [
    "/painel/:path*",
    "/producao/:path*",
    "/despesas/:path*",
    "/fechamento/:path*",
    "/racoes/:path*",
    "/relatorios/:path*",
    "/configuracoes/:path*",
  ],
};

function hasSessionCookie(request: NextRequest) {
  return request.cookies.has("authjs.session-token") || request.cookies.has("__Secure-authjs.session-token");
}
