import { Injectable, type OnModuleInit } from "@nestjs/common";
import nodemailer, { type Transporter } from "nodemailer";
import { readConfig } from "../config";

/**
 * 邮件发送：开发默认连 Mailpit（docker compose，http://localhost:8025 收件箱），
 * 生产通过 SMTP_* 环境变量切换到真实 SMTP，代码无需改动。
 */
@Injectable()
export class MailService implements OnModuleInit {
  private transporter?: Transporter;
  private readonly config = readConfig();

  async onModuleInit(): Promise<void> {
    const { host, port, user, pass } = this.config.smtp;
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user ? { user, pass } : undefined,
    });
    try {
      await this.transporter.verify();
      console.log(`[mail] SMTP 已连接 ${host}:${port}`);
    } catch (error) {
      console.warn(
        `[mail] SMTP ${host}:${port} 不可用，验证码邮件将发送失败：`,
        (error as Error).message,
      );
    }
  }

  async sendOtp(to: string, otp: string, type: string): Promise<void> {
    if (!this.transporter) {
      throw new Error("邮件服务未就绪");
    }
    const subject = type === "sign-in" ? "星火场登录验证码" : "星火场邮箱验证码";
    const text = `你的验证码是 ${otp}，10 分钟内有效。若非本人操作，请忽略本邮件。`;
    const html = `
      <div style="max-width:420px;margin:0 auto;padding:32px 24px;font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;color:#171814;">
        <h2 style="margin:0 0 8px;font-size:20px;">${subject}</h2>
        <p style="margin:0 0 20px;color:#666;font-size:14px;">输入以下验证码完成验证，10 分钟内有效。</p>
        <div style="font-size:32px;font-weight:700;letter-spacing:8px;background:#f4f4ef;border-radius:12px;padding:16px 20px;text-align:center;">${otp}</div>
        <p style="margin:20px 0 0;color:#999;font-size:12px;">若非本人操作，请忽略本邮件。</p>
      </div>
    `;
    await this.transporter.sendMail({ from: this.config.mailFrom, to, subject, text, html });
  }
}
