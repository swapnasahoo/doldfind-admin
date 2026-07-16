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
  ).min(1, "At least one founder must be configured"),
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
      secret: process.env.JWT_SESSION_SECRET || process.env.SESSION_SECRET,
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
    ].filter((f) => Boolean(f.username || f.passwordHash || f.badge)),
  };

  const result = configSchema.safeParse(rawConfig);

  if (!result.success) {
    console.error("========== ENV VALIDATION FAILED ==========");
    console.error(JSON.stringify(result.error.format(), null, 2));

    throw new Error("Configuration validation failed.");
  }

  cachedConfig = result.data;
  return cachedConfig;
}

export const config = loadConfig();

export default config;
