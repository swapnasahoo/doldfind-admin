import { z } from "zod";

const configSchema = z.object({
  google: z.object({
    projectId: z.string().min(1, "GOOGLE_PROJECT_ID is required"),
    clientEmail: z.string().email("GOOGLE_CLIENT_EMAIL must be a valid email"),
    privateKey: z.string().min(1, "GOOGLE_PRIVATE_KEY is required"),
    sheetId: z.string().min(1, "GOOGLE_SHEET_ID is required"),
  }),
  session: z.object({
    secret: z.string().min(32, "JWT_SESSION_SECRET must be at least 32 characters long"),
  }),
  founders: z.array(
    z.object({
      username: z.string().min(1, "Username is required"),
      passwordHash: z.string().min(1, "Password hash is required"),
      badge: z.string().min(1, "Badge is required"),
    })
  ),
});

export type Config = z.infer<typeof configSchema>;

let cachedConfig: Config | null = null;

export function loadConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  const rawConfig = {
    google: {
      projectId: process.env.GOOGLE_PROJECT_ID,
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      sheetId: process.env.GOOGLE_SHEET_ID,
    },
    session: {
      secret: process.env.JWT_SESSION_SECRET,
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
  };

  const result = configSchema.safeParse(rawConfig);

  if (!result.success) {
    console.error("========== ENV VALIDATION FAILED ==========");
    console.error(JSON.stringify(result.error.format(), null, 2));

    console.error("========== RAW ENV CHECK ==========");
    console.table({
      GOOGLE_PROJECT_ID: !!process.env.GOOGLE_PROJECT_ID,
      GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
      GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
      GOOGLE_SHEET_ID: !!process.env.GOOGLE_SHEET_ID,
      JWT_SESSION_SECRET_LENGTH:
        process.env.JWT_SESSION_SECRET?.length ?? 0,

      ADMIN_SWAPNA_USERNAME: process.env.ADMIN_SWAPNA_USERNAME,
      ADMIN_SWAPNA_PASSWORD_HASH:
        !!process.env.ADMIN_SWAPNA_PASSWORD_HASH,
      ADMIN_SWAPNA_BADGE: process.env.ADMIN_SWAPNA_BADGE,

      ADMIN_RIHAN_USERNAME: process.env.ADMIN_RIHAN_USERNAME,
      ADMIN_RIHAN_PASSWORD_HASH:
        !!process.env.ADMIN_RIHAN_PASSWORD_HASH,
      ADMIN_RIHAN_BADGE: process.env.ADMIN_RIHAN_BADGE,

      ADMIN_ISHAN_USERNAME: process.env.ADMIN_ISHAN_USERNAME,
      ADMIN_ISHAN_PASSWORD_HASH:
        !!process.env.ADMIN_ISHAN_PASSWORD_HASH,
      ADMIN_ISHAN_BADGE: process.env.ADMIN_ISHAN_BADGE,
    });

    throw new Error("Configuration validation failed.");
  }

  cachedConfig = result.data;
  return cachedConfig;
}

export const config = loadConfig();

export default config;
