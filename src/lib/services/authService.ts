import { verify } from "@node-rs/argon2";
import { config } from "../config";
import {
  checkLockout,
  registerFailedAttempt,
  resetAttempts,
} from "../security";
import { Logger } from "../logger";

// A pre-generated valid Argon2id hash used to perform dummy verifications to prevent timing attacks.
const DUMMY_HASH = "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHQ$dGVzdHBhc3N3b3JkZm9yZHVtbXloYXNo";

export interface LoginResult {
  success: boolean;
  username?: string;
  badge?: string;
  errorCode?: "LOCKOUT" | "INVALID_CREDENTIALS" | "INTERNAL_ERROR";
  errorMessage: string;
}

export class AuthService {
  /**
   * Performs credential verification with timing-attack prevention, rate limits check, and account lockout.
   */
  public static async login(username: string, password: string): Promise<LoginResult> {
    const trimmedUsername = (username || "").trim();
    if (!trimmedUsername || !password) {
      return {
        success: false,
        errorCode: "INVALID_CREDENTIALS",
        errorMessage: "Invalid username or password.",
      };
    }

    // 1. Check account lockout status
    const lockout = checkLockout(trimmedUsername);
    if (!lockout.allowed) {
      const remainingMin = Math.ceil(lockout.remainingMs / 60000);
      return {
        success: false,
        errorCode: "LOCKOUT",
        errorMessage: `This account is locked out due to multiple failed login attempts. Try again in ${remainingMin} minute(s).`,
      };
    }

    try {
      // 2. Lookup founder
      const foundFounder = config.founders.find(
        (f) => f.username && f.username.toLowerCase() === trimmedUsername.toLowerCase()
      );

      let verificationSuccess = false;

      if (foundFounder && foundFounder.passwordHash) {
        // Real verification
        verificationSuccess = await verify(foundFounder.passwordHash, password);
      } else {
        // Dummy verification to ensure constant-time response (prevent username enumeration via timing)
        await verify(DUMMY_HASH, password);
      }

      if (verificationSuccess && foundFounder) {
        // Login success - clear lockouts
        resetAttempts(trimmedUsername);
        Logger.info(`Successful login for user: ${foundFounder.username}`);
        return {
          success: true,
          username: foundFounder.username,
          badge: foundFounder.badge,
          errorMessage: "Success",
        };
      } else {
        // Login failed
        registerFailedAttempt(trimmedUsername);
        Logger.warn(`Failed login attempt for user: ${trimmedUsername}`);
        return {
          success: false,
          errorCode: "INVALID_CREDENTIALS",
          errorMessage: "Invalid username or password.", // Generic error message
        };
      }
    } catch (err) {
      Logger.error(`Error during auth login verification:`, err);
      return {
        success: false,
        errorCode: "INTERNAL_ERROR",
        errorMessage: "An internal security error occurred.",
      };
    }
  }
}
