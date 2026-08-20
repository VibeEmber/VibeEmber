import { Injectable } from "@nestjs/common";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import type { SessionUser } from "@vibeember/shared";
import { readConfig } from "../config";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.service";
import { SparkService } from "../spark/spark.service";

/**
 * Better-Auth：GitHub OAuth + 邮箱验证码（OTP）登录，无密码。
 * - 管理员引导：BOOTSTRAP_ADMIN_EMAIL 首次注册自动成为 admin
 * - 会话/Cookie/CSRF 全部由 Better-Auth 管理
 */
@Injectable()
export class AuthService {
  readonly auth;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly sparks: SparkService,
  ) {
    const config = readConfig();

    this.auth = betterAuth({
      database: prismaAdapter(this.prisma, { provider: "postgresql" }),
      secret: config.betterAuthSecret,
      baseURL: config.betterAuthUrl,
      trustedOrigins: [config.webUrl],
      emailAndPassword: { enabled: false },
      user: {
        additionalFields: {
          role: { type: "string", defaultValue: "member", input: false },
          bio: { type: "string", defaultValue: "", input: false },
        },
      },
      databaseHooks: {
        user: {
          create: {
            before: async (user) => ({
              data: {
                role: user.email.toLowerCase() === config.bootstrapAdminEmail ? "admin" : "member",
              },
            }),
            after: async (user) => {
              await this.sparks.grantSignupBonus(user.id);
            },
          },
        },
      },
      socialProviders: config.githubClientId
        ? {
            github: {
              clientId: config.githubClientId,
              clientSecret: config.githubClientSecret ?? "",
            },
          }
        : {},
      plugins: [
        emailOTP({
          sendVerificationOTP: async ({ email, otp, type }) => {
            await this.mail.sendOtp(email, otp, type);
          },
        }),
      ],
    });
  }

  async getSessionUser(headers: Headers): Promise<SessionUser | null> {
    const session = await this.auth.api.getSession({ headers });
    if (!session?.user) {
      return null;
    }
    const raw = session.user as Record<string, unknown>;
    return {
      id: String(raw.id),
      email: String(raw.email ?? ""),
      name: String(raw.name ?? ""),
      image: (raw.image as string | null) ?? null,
      role: raw.role === "admin" ? "admin" : "member",
      bio: typeof raw.bio === "string" ? raw.bio : undefined,
    };
  }
}
