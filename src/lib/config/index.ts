import { z } from "zod";

const configSchema = z.object({
  session: z.object({
    secret: z.string().min(32, "JWT_SESSION_SECRET must be at least 32 characters long"),
  }),
  appwrite: z.object({
    endpoint: z.string().default("https://cloud.appwrite.io/v1"),
    projectId: z.string().optional().default(""),
    apiKey: z.string().optional().default(""),
    databaseId: z.string().optional().default("doldfind-db"),
    collectionId: z.string().optional().default("places"),
    bucketId: z.string().optional().default("place-images"),
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
    session: {
      secret: process.env.JWT_SESSION_SECRET || process.env.SESSION_SECRET,
    },
    appwrite: {
      endpoint: process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1",
      projectId: process.env.APPWRITE_PROJECT_ID || "",
      apiKey: process.env.APPWRITE_API_KEY || "",
      databaseId: process.env.APPWRITE_DATABASE_ID || "doldfind-db",
      collectionId: process.env.APPWRITE_COLLECTION_ID || "places",
      bucketId: process.env.APPWRITE_BUCKET_ID || "place-images",
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
