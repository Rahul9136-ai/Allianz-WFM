import dotenv from "dotenv";
import path from "path";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProd: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT ?? 4000),
  appUrl: process.env.APP_URL ?? "http://localhost:5173",
  apiUrl: process.env.API_URL ?? "http://localhost:4000",

  databaseUrl: required("DATABASE_URL"),

  jwtSecret: required("JWT_SECRET", "dev-secret-change-me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "8h",
  jwtRefreshSecret: required("JWT_REFRESH_SECRET", "dev-refresh-secret-change-me"),
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  sessionTimeoutMinutes: Number(process.env.SESSION_TIMEOUT_MINUTES ?? 30),
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 10),

  azureAd: {
    tenantId: process.env.AZURE_AD_TENANT_ID ?? "",
    clientId: process.env.AZURE_AD_CLIENT_ID ?? "",
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET ?? "",
    redirectUri: process.env.AZURE_AD_REDIRECT_URI ?? "",
    get enabled() {
      return Boolean(this.tenantId && this.clientId && this.clientSecret);
    },
  },

  storage: {
    driver: (process.env.STORAGE_DRIVER as "local" | "azure") ?? "local",
    uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? "uploads"),
    maxUploadMb: Number(process.env.MAX_UPLOAD_MB ?? 20),
    azureConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING ?? "",
    azureContainer: process.env.AZURE_STORAGE_CONTAINER ?? "attachments",
  },

  email: {
    driver: (process.env.EMAIL_DRIVER as "dev" | "smtp") ?? "dev",
    from: process.env.EMAIL_FROM ?? "WFM Request Portal <no-reply@wfm-portal.local>",
    smtpHost: process.env.SMTP_HOST ?? "",
    smtpPort: Number(process.env.SMTP_PORT ?? 587),
    smtpUser: process.env.SMTP_USER ?? "",
    smtpPass: process.env.SMTP_PASS ?? "",
    smtpSecure: process.env.SMTP_SECURE === "true",
  },

  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
};
