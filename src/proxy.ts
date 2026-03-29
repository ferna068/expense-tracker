import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith("/auth");
  const isApiAuth = pathname.startsWith("/api/auth");
  const isPublic = isAuthPage || isApiAuth;

  if (!isLoggedIn && !isPublic) {
    return Response.redirect(new URL("/auth/login", req.nextUrl));
  }

  if (isLoggedIn && isAuthPage) {
    return Response.redirect(new URL("/dashboard", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
