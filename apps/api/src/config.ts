export interface SmtpConfig {
  host: string;
  port: number;
  user?: string;
  pass?: string;
}

export interface AppConfig {
  apiPort: number;
  webUrl: string;
  betterAuthSecret: string;
  betterAuthUrl: string;
  bootstrapAdminEmail: string;
  githubClientId?: string;
  githubClientSecret?: string;
  smtp: SmtpConfig;
  mailFrom: string;
  databaseUrl: string;
}

const DEV_SECRET = "dev-only-secret-change-me-32chars!";

/** 统一读取环境变量；开发默认值与根目录 .env.example 一致，开箱即用 */
export function readConfig(): AppConfig {
  const betterAuthSecret = process.env.BETTER_AUTH_SECRET || DEV_SECRET;
  if (process.env.NODE_ENV === "production" && betterAuthSecret === DEV_SECRET) {
    console.warn("[config] 生产环境仍在使用开发默认 BETTER_AUTH_SECRET，请立即替换为强随机值！");
  }

  return {
    apiPort: Number(process.env.API_PORT ?? 4000),
    webUrl: (process.env.WEB_URL ?? "http://localhost:3000").replace(/\/+$/, ""),
    betterAuthSecret,
    betterAuthUrl: (process.env.BETTER_AUTH_URL ?? "http://localhost:4000").replace(/\/+$/, ""),
    bootstrapAdminEmail: (process.env.BOOTSTRAP_ADMIN_EMAIL ?? "admin@vibeember.dev").toLowerCase(),
    githubClientId: process.env.GITHUB_CLIENT_ID || undefined,
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET || undefined,
    smtp: {
      host: process.env.SMTP_HOST ?? "localhost",
      port: Number(process.env.SMTP_PORT ?? 1025),
      user: process.env.SMTP_USER || undefined,
      pass: process.env.SMTP_PASS || undefined,
    },
    mailFrom: process.env.MAIL_FROM ?? "星火场 <noreply@vibember.dev>",
    databaseUrl: process.env.DATABASE_URL ?? "postgresql://vibe:vibe@localhost:5432/vibeember",
  };
}
