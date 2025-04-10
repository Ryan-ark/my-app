import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Check if user is authenticated by looking for the session token
  const hasSessionToken = request.cookies.has("next-auth.session-token");
  
  const pathname = request.nextUrl.pathname;
  const isOnDashboard = pathname.startsWith('/dashboard');
  
  if (isOnDashboard && !hasSessionToken) {
    // Redirect to login page if not authenticated
    const url = new URL("/login", request.url);
    // Add the current path as a redirect parameter
    url.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

// Configure which paths this middleware will run on
export const config = {
  matcher: ["/dashboard/:path*"],
}; 