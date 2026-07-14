import { Logger } from "../logger";

// --- Rate Limiter ---
interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

const rateLimitDb = new Map<string, RateLimitBucket>();

/**
 * Basic in-memory Token Bucket sliding-window rate limiter.
 * Can be replaced with Redis/Upstash later.
 */
export function checkRateLimit(ip: string, action: string, limit = 10, windowMs = 60 * 1000): boolean {
  const key = `${ip}:${action}`;
  const now = Date.now();
  const bucket = rateLimitDb.get(key) || { tokens: limit, lastRefill: now };

  const elapsed = now - bucket.lastRefill;
  // Refill tokens proportional to elapsed time
  const refilledTokens = bucket.tokens + elapsed * (limit / windowMs);

  bucket.tokens = Math.min(limit, refilledTokens);
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    rateLimitDb.set(key, bucket);
    return true; // Request allowed
  }

  rateLimitDb.set(key, bucket);
  Logger.warn(`Rate limit exceeded for IP: ${ip} on action: ${action}`);
  return false; // Rate limited
}

// --- Account Lockout ---
interface LockoutState {
  attempts: number;
  lockoutUntil: number;
}

const lockoutDb = new Map<string, LockoutState>();

/**
 * Checks if a user account is locked out due to excessive failed attempts.
 */
export function checkLockout(username: string): { allowed: boolean; remainingMs: number } {
  const key = username.trim().toLowerCase();
  const now = Date.now();
  const state = lockoutDb.get(key);

  if (state && state.lockoutUntil > now) {
    return { allowed: false, remainingMs: state.lockoutUntil - now };
  }

  return { allowed: true, remainingMs: 0 };
}

/**
 * Registers a failed login attempt, triggering a lockout if limits are reached.
 */
export function registerFailedAttempt(username: string, maxAttempts = 5, lockoutDurationMs = 15 * 60 * 1000): void {
  const key = username.trim().toLowerCase();
  const now = Date.now();
  const state = lockoutDb.get(key) || { attempts: 0, lockoutUntil: 0 };

  state.attempts += 1;
  if (state.attempts >= maxAttempts) {
    state.lockoutUntil = now + lockoutDurationMs;
    Logger.warn(`Account locked out: ${key} for ${lockoutDurationMs / 60000} mins`);
  }
  lockoutDb.set(key, state);
}

/**
 * Resets failed login attempts upon a successful login.
 */
export function resetAttempts(username: string): void {
  lockoutDb.delete(username.trim().toLowerCase());
}

// --- Input Sanitization & WAF ---
/**
 * Scans a string for malicious content like script tags, XSS payloads, HTML tags, or javascript: protocols.
 */
export function hasMaliciousContent(val: string): boolean {
  if (typeof val !== "string") return false;

  // HTML tag regex
  const htmlTagRegex = /<[^>]*>/g;
  // Javascript injection e.g. javascript:alert(), onload=, onclick=
  const jsInjectionRegex = /javascript:|on\w+\s*=/i;
  // Script tags check
  const scriptTagRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

  // Malformed Unicode surrogate check
  const malformedUnicode = /[\uD800-\uDFFF]/g;

  return (
    htmlTagRegex.test(val) ||
    jsInjectionRegex.test(val) ||
    scriptTagRegex.test(val) ||
    malformedUnicode.test(val)
  );
}

/**
 * Recursively checks an object or array to ensure it does not contain HTML/JS/XSS payloads.
 */
export function validateSafePayload(payload: unknown): boolean {
  if (payload === null || payload === undefined) return true;

  if (typeof payload === "string") {
    // Normalization check
    try {
      if (payload !== payload.normalize()) {
        return false; // Malformed unicode normalization
      }
    } catch {
      return false; // Normalization error
    }

    return !hasMaliciousContent(payload);
  }

  if (Array.isArray(payload)) {
    return payload.every(validateSafePayload);
  }

  if (typeof payload === "object") {
    return Object.values(payload).every(validateSafePayload);
  }

  return true;
}
