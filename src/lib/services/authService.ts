import { verify } from "@node-rs/argon2";
import { loadConfig } from "../config";
import {
  checkLockout,
  registerFailedAttempt,
  resetAttempts,
} from "../security";
import { Logger } from "../logger";

// A pre-generated valid Argon2id hash used to perform dummy verifications
// to prevent timing attacks.
const DUMMY_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHQ$dGVzdHBhc3N3b3JkZm9yZHVtbXloYXNo";

export interface LoginResult {
  success: boolean;
  username?: string;
  badge?: string;
  errorCode?: "LOCKOUT" | "INVALID_CREDENTIALS" | "INTERNAL_ERROR";
  errorMessage: string;
}

export class AuthService {
  /**
   * Performs credential verification with timing-attack prevention,
   * rate limits check, and account lockout.
   */
  public static async login(
    username: string,
    password: string
  ): Promise<LoginResult> {
    const trimmedUsername = (username || "").trim();

    if (!trimmedUsername || !password) {
      return {
        success: false,
        errorCode: "INVALID_CREDENTIALS",
        errorMessage: "Invalid username or password.",
      };
    }

    // Load configuration only when authentication is actually executed.
    const config = loadConfig();

    // Check account lockout status
    const lockout = checkLockout(trimmedUsername);

    if (!lockout.allowed) {
      const remainingMin = Math.ceil(lockout.remainingMs / 60000);

      return {
        success: false,
        errorCode: "LOCKOUT",
        errorMessage: `This account is locked due to multiple failed login attempts. Try again in ${remainingMin} minute(s).`,
      };
    }

    try {
      // Lookup founder
      const founder = config.founders.find(
        (f) => f.username.toLowerCase() === trimmedUsername.toLowerCase()
      );

      let verified = false;

      if (founder) {
        verified = await verify(founder.passwordHash, password);
      } else {
        // Dummy verification to prevent username timing attacks
        await verify(DUMMY_HASH, password);
      }

      if (verified && founder) {
        resetAttempts(trimmedUsername);

        Logger.info(`Successful login: ${founder.username}`);

        return {
          success: true,
          username: founder.username,
          badge: founder.badge,
          errorMessage: "Success",
        };
      }

      registerFailedAttempt(trimmedUsername);

      Logger.warn(`Failed login attempt: ${trimmedUsername}`);

      return {
        success: false,
        errorCode: "INVALID_CREDENTIALS",
        errorMessage: "Invalid username or password.",
      };
    } catch (error) {
      Logger.error("Authentication error:", error);

      return {
        success: false,
        errorCode: "INTERNAL_ERROR",
        errorMessage: "An internal security error occurred.",
      };
    }
  }
}
