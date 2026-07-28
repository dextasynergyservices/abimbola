import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Allow public access to /admin/login and /api/auth
	if (pathname.startsWith("/admin/login") || pathname.startsWith("/api/auth")) {
		return NextResponse.next();
	}

	// Check NextAuth session tokens
	const sessionToken =
		request.cookies.get("authjs.session-token")?.value ||
		request.cookies.get("__Secure-authjs.session-token")?.value ||
		request.cookies.get("next-auth.session-token")?.value ||
		request.cookies.get("__Secure-next-auth.session-token")?.value;

	if (!sessionToken && pathname.startsWith("/admin")) {
		const loginUrl = new URL("/admin/login", request.url);
		loginUrl.searchParams.set("callbackUrl", pathname);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/admin/:path*", "/api/admin/:path*"],
};
