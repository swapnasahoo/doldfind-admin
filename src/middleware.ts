import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Retrieve the session secret for verification in edge middleware.
const secretText = process.env.SESSION_SECRET || "";
const encodedSecret = new TextEncoder().encode(secretText);

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Skip check for public API endpoints
  if (
    path === "/api/auth/login" ||
    path === "/api/auth/logout"
  ) {
    return NextResponse.next();
  }

  // 2. Protect all other API endpoints
  if (path.startsWith("/api/")) {
    const sessionCookie = request.cookies.get("session")?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Unauthenticated session. Please log in first.",
          },
        },
        { status: 401 }
      );
    }

    try {
      // Verify JWT session signature and expiration
      await jwtVerify(sessionCookie, encodedSecret, {
        algorithms: ["HS256"],
      });
      return NextResponse.next();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid or expired session. Please log in again.",
          },
        },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
