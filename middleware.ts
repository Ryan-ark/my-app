import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Check if user is authenticated by looking for the session token
  // Handle different cookie naming patterns between environments
  const hasSessionToken = request.cookies.has("next-auth.session-token") || 
                          request.cookies.has("__Secure-next-auth.session-token") ||
                          request.cookies.has("__Host-next-auth.session-token");
  
  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = pathname.startsWith('/dashboard') || 
                          pathname.startsWith('/feed-fish') || 
                          pathname.startsWith('/ai-assistant');
  
  if (isProtectedRoute && !hasSessionToken) {
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
  matcher: ["/dashboard/:path*", "/feed-fish/:path*", "/ai-assistant/:path*"],
}; 