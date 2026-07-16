import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Retrieve the session secret for verification in edge middleware.
const secretText = process.env.JWT_SESSION_SECRET || process.env.SESSION_SECRET || "";
if (!secretText || secretText.length < 32) {
  throw new Error("JWT_SESSION_SECRET is not configured or is too short. It must be at least 32 characters long.");
}
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

    if (!sessionCookie || sessionCookie.trim() === "") {
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
      // Verify JWT session signature, expiration, and algorithms explicitly
      const { payload } = await jwtVerify(sessionCookie, encodedSecret, {
        algorithms: ["HS256"],
      });

      // Prevent token forgery by ensuring payload contains necessary identifiers
      if (!payload || typeof payload !== "object" || !payload.username) {
        throw new Error("Invalid payload structure");
      }

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
