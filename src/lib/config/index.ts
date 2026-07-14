import { z } from "zod";

const configSchema = z.object({
  google: z.object({
    projectId: z.string().min(1, "GOOGLE_PROJECT_ID is required"),
    clientEmail: z.string().email("GOOGLE_CLIENT_EMAIL must be a valid email"),
    privateKey: z.string().min(1, "GOOGLE_PRIVATE_KEY is required"),
    sheetId: z.string().min(1, "GOOGLE_SHEET_ID is required"),
  }),
  session: z.object({
    secret: z.string().min(32, "SESSION_SECRET must be at least 32 characters long"),
  }),
  founders: z.array(
    z.object({
      username: z.string().min(1),
      passwordHash: z.string().min(1),
      badge: z.string().min(1),
    })
  ),
});

export type Config = z.infer<typeof configSchema>;

let cachedConfig: Config | null = null;

/**
 * Loads configuration from environment variables and validates them.
 * Returns mock values during build phase if environment variables are missing.
 */
export function loadConfig(): Config {
  if (cachedConfig) return cachedConfig;

  // Detect Next.js build phase
  const isBuildPhase = 
    process.env.NEXT_PHASE === "phase-production-build" ||
    (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production");

  const parseResult = configSchema.safeParse({
    google: {
      projectId: process.env.GOOGLE_PROJECT_ID,
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      sheetId: process.env.GOOGLE_SHEET_ID,
    },
    session: {
      secret: process.env.SESSION_SECRET,
    },
    founders: [
      {
        username: process.env.ADMIN_SWAPNA_USERNAME,
        passwordHash: process.env.ADMIN_SWAPNA_PASSWORD_HASH,
        badge: process.env.ADMIN_SWAPNA_BADGE,
      },
      {
        username: process.env.ADMIN_RIHAN_USERNAME,
        passwordHash: process.env.ADMIN_RIHAN_PASSWORD_HASH,
        badge: process.env.ADMIN_RIHAN_BADGE,
      },
      {
        username: process.env.ADMIN_ISHAN_USERNAME,
        passwordHash: process.env.ADMIN_ISHAN_PASSWORD_HASH,
        badge: process.env.ADMIN_ISHAN_BADGE,
      },
    ],
  });

  if (!parseResult.success) {
    if (isBuildPhase) {
      // Return temporary mock configs during Next.js build-time static checks
      return {
        google: {
          projectId: "mock-project",
          clientEmail: "mock@example.com",
          privateKey: "mock-private-key",
          sheetId: "mock-sheet-id",
        },
        session: {
          secret: "mock-session-secret-long-enough-32-chars-minimum",
        },
        founders: [
          { username: "mock-user-1", passwordHash: "mock-hash", badge: "Founder" },
          { username: "mock-user-2", passwordHash: "mock-hash", badge: "Founder" },
          { username: "mock-user-3", passwordHash: "mock-hash", badge: "Founder" },
        ],
      };
    }

    console.error("❌ Invalid environment variables configuration:", parseResult.error.format());
    throw new Error("Configuration validation failed. Check your environment variables.");
  }

  cachedConfig = parseResult.data;
  return cachedConfig;
}

export const config = loadConfig();
export default config;
