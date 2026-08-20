"use client";

import { LoaderCircle, Mail, UserCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { GithubIcon } from "../github-icon";
import { Modal } from "../modal";

interface AuthModalProps {
  onClose: () => void;
  onNotify: (message: string) => void;
}

/** 登录 / 注册：GitHub OAuth + 邮箱验证码（OTP），新邮箱自动注册 */
export function AuthModal({ onClose, onNotify }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const startCountdown = () => {
    setCountdown(60);
    const timer = window.setInterval(() => {
      setCountdown((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
  };

  const sendCode = async () => {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      onNotify("请输入有效邮箱");
      return;
    }
    setBusy(true);
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: trimmed,
        type: "sign-in",
      });
      if (error) {
        throw new Error(error.message || "验证码发送失败");
      }
      setCodeSent(true);
      startCountdown();
      onNotify("验证码已发送，请查收邮箱");
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "验证码发送失败");
    } finally {
      setBusy(false);
    }
  };

  const signInWithOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      const { error } = await authClient.signIn.emailOtp({
        email: email.trim(),
        otp: otp.trim(),
      });
      if (error) {
        throw new Error(error.message || "验证码不正确或已过期");
      }
      onClose();
      onNotify("欢迎来到星火场，现在可以发布作品了");
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "登录失败");
    } finally {
      setBusy(false);
    }
  };

  const signInWithGithub = async () => {
    setBusy(true);
    try {
      const { data, error } = await authClient.signIn.social({
        provider: "github",
        // 必须传绝对地址：相对路径会被解析到 API 的 baseURL（4000 端口）而非前端站点
        callbackURL: `${window.location.origin}/`,
      });
      if (error) {
        throw new Error(error.message || "GitHub 登录暂不可用");
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "GitHub 登录失败");
      setBusy(false);
    }
  };

  return (
    <Modal titleId="auth-title" onClose={onClose} className="auth-modal">
      <span className="modal-icon">
        <UserCircle size={24} />
      </span>
      <span className="section-kicker">欢迎来到星火场</span>
      <h2 id="auth-title">登录 / 注册</h2>
      <p>输入邮箱接收验证码即可登录，新邮箱将自动注册；也可以直接用 GitHub 继续。</p>

      <button type="button" className="oauth-button" onClick={signInWithGithub} disabled={busy}>
        <GithubIcon size={17} /> 使用 GitHub 继续
      </button>
      <div className="oauth-divider">
        <span>或使用邮箱验证码</span>
      </div>

      <form onSubmit={signInWithOtp}>
        <label>
          邮箱
          <div className="otp-row">
            <input
              type="email"
              required
              maxLength={180}
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={codeSent && busy}
            />
            <button
              type="button"
              className="otp-resend"
              onClick={sendCode}
              disabled={busy || countdown > 0}
            >
              {countdown > 0 ? `${countdown}s` : codeSent ? "重新发送" : "发送验证码"}
            </button>
          </div>
        </label>
        {codeSent && (
          <label className="otp-code">
            验证码
            <input
              name="otp"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              minLength={4}
              required
              autoFocus
              placeholder="邮箱中的 6 位数字"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
            />
          </label>
        )}
        <button className="primary-button" type="submit" disabled={busy || !codeSent}>
          {busy ? (
            <>
              <LoaderCircle className="spin" size={17} /> 请稍候
            </>
          ) : (
            <>
              <Mail size={15} /> 验证并登录
            </>
          )}
        </button>
        <small className="form-hint">验证码发到你的邮箱，10 分钟内有效。</small>
      </form>

      <small className="auth-note">
        继续即表示你同意
        <a href="/covenant" target="_blank" rel="noreferrer">
          社区公约
        </a>
        ：真实体验，拒绝刷量。
      </small>
    </Modal>
  );
}
