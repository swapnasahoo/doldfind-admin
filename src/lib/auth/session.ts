import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { config } from "../config";
import { Logger } from "../logger";

const encodedSecret = new TextEncoder().encode(config.session.secret);
const COOKIE_NAME = "session";
const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hour expiration
const RENEWAL_THRESHOLD_MS = 15 * 60 * 1000; // Renew if less than 15 minutes left

export interface SessionPayload {
  username: string;
  badge: string;
  expiresAt: number;
}

/**
 * Encrypts user credentials into a signed JWT session token.
 */
export async function encryptSession(payload: Omit<SessionPayload, "expiresAt">, expiresAt: Date): Promise<string> {
  const expirationTime = Math.floor(expiresAt.getTime() / 1000);
  return await new SignJWT({ ...payload, expiresAt: expirationTime })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(encodedSecret);
}

/**
 * Decrypts and verifies a signed JWT session token.
 */
export async function decryptSession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch (error) {
    Logger.warn("Failed to verify session token jwt", { errorRaw: String(error) });
    return null;
  }
}

/**
 * Creates and sets the session cookie in HTTP-only state.
 */
export async function createSessionCookie(username: string, badge: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const sessionToken = await encryptSession({ username, badge }, expiresAt);
  
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: expiresAt,
    path: "/",
  });
}

/**
 * Deletes the session cookie (Log out).
 */
export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Retrieves the current verified session.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await decryptSession(token);
  if (!session) return null;

  // Verify expiration time
  const now = Date.now();
  if (session.expiresAt * 1000 < now) {
    Logger.warn(`Session expired for user: ${session.username}`);
    return null;
  }

  return session;
}

/**
 * Renews the session token if the expiration threshold is reached.
 */
export async function renewSessionCookieIfNeeded(session: SessionPayload): Promise<void> {
  const now = Date.now();
  const expirationMs = session.expiresAt * 1000;
  
  if (expirationMs - now < RENEWAL_THRESHOLD_MS) {
    Logger.info(`Renewing session for user: ${session.username}`);
    await createSessionCookie(session.username, session.badge);
  }
}
