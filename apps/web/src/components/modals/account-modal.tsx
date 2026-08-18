"use client";
/* eslint-disable @next/next/no-img-element */

import {
  ArrowRight,
  Check,
  LoaderCircle,
  LogOut,
  Plus,
  Rocket,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api, uploadFile } from "@vibeember/shared";
import type { ProjectPrivate, SessionUser } from "@vibeember/shared";
import { authClient } from "@/lib/auth-client";
import { Modal } from "../modal";

interface AccountModalProps {
  user: SessionUser;
  onClose: () => void;
  onNotify: (message: string) => void;
  onReviewed: () => void;
}

export function AccountModal({ user, onClose, onNotify, onReviewed }: AccountModalProps) {
  const [myProjects, setMyProjects] = useState<ProjectPrivate[]>([]);
  const [reviewProjects, setReviewProjects] = useState<ProjectPrivate[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const mine = await api.myProjects();
        setMyProjects(mine.projects);
        if (user.role === "admin") {
          const pending = await api.adminProjects("pending");
          setReviewProjects(pending.projects);
        }
      } catch (error) {
        onNotify(error instanceof Error ? error.message : "加载失败");
      }
    };
    void load();
  }, [user.role, onNotify]);

  const changeAvatar = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    setUploading(true);
    try {
      const { key } = await uploadFile("avatar", file);
      await api.updateMe({ avatarKey: key });
      // 刷新会话（头像 URL 写在 user.image 上）
      await authClient.getSession({ query: { disableCookieCache: true } });
      onNotify("头像已更新，社区展示稍后生效");
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "头像上传失败");
    } finally {
      setUploading(false);
    }
  };

  const logout = async () => {
    try {
      await authClient.signOut();
    } catch {
      // 本地状态照样清理
    }
    onClose();
    onNotify("已退出登录");
  };

  const reviewProject = async (project: ProjectPrivate, action: "approved" | "rejected") => {
    const reason =
      action === "rejected" ? (window.prompt("请填写驳回原因（投稿者可见）") ?? "") : "";
    if (action === "rejected" && !reason) {
      return;
    }
    setBusy(true);
    try {
      await api.reviewProject(project.id, { action, reason });
      setReviewProjects((items) => items.filter((item) => item.id !== project.id));
      if (action === "approved") {
        onReviewed();
      }
      onNotify(action === "approved" ? "已通过，项目现已公开展示" : "已驳回并记录原因");
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "审核失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal titleId="account-title" onClose={onClose} className="account-modal">
      <div className="account-head">
        <span className="account-avatar">
          {user.image ? (
            <img src={user.image} alt={user.name} />
          ) : (
            user.name.slice(0, 1).toUpperCase()
          )}
        </span>
        <div>
          <span>{user.role === "admin" ? "管理员" : "开发者"}</span>
          <h2 id="account-title">{user.name}</h2>
          <p>{user.email}</p>
        </div>
        <div className="account-tools">
          <button onClick={() => avatarInputRef.current?.click()} disabled={uploading}>
            {uploading ? <LoaderCircle className="spin" size={13} /> : <Upload size={13} />}{" "}
            更换头像
          </button>
          <button onClick={logout}>
            <LogOut size={15} /> 退出
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(event) => void changeAvatar(event.target.files?.[0])}
          />
        </div>
      </div>

      {user.role === "admin" && (
        <section className="review-panel">
          <div className="panel-title">
            <div>
              <span className="section-kicker">
                <ShieldCheck size={15} /> 审核工作台
              </span>
              <h3>待审核投稿</h3>
            </div>
            <strong>{reviewProjects.length}</strong>
          </div>
          <div className="submission-list">
            {reviewProjects.map((project) => (
              <article key={project.id}>
                <div>
                  <span>
                    {project.category} · {project.ownerEmail}
                  </span>
                  <h4>{project.name}</h4>
                  <p>{project.tagline}</p>
                  <a href={project.url} target="_blank" rel="noreferrer">
                    查看产品 <ArrowRight size={13} />
                  </a>
                </div>
                <div className="review-actions">
                  <button disabled={busy} onClick={() => void reviewProject(project, "rejected")}>
                    驳回
                  </button>
                  <button
                    disabled={busy}
                    className="approve"
                    onClick={() => void reviewProject(project, "approved")}
                  >
                    <Check size={14} /> 通过
                  </button>
                </div>
              </article>
            ))}
            {reviewProjects.length === 0 && (
              <div className="panel-empty">
                <Check size={18} /> 暂无待审核项目
              </div>
            )}
          </div>
        </section>
      )}

      <section className="my-projects">
        <div className="panel-title">
          <div>
            <span className="section-kicker">
              <Rocket size={15} /> 我的投稿
            </span>
            <h3>项目状态</h3>
          </div>
          <button onClick={onClose}>
            <Plus size={14} /> 新建投稿
          </button>
        </div>
        <div className="submission-list mine">
          {myProjects.map((project) => (
            <article key={project.id}>
              <div>
                <span>
                  {project.category} · {new Date(project.createdAt).toLocaleDateString("zh-CN")}
                </span>
                <h4>{project.name}</h4>
                <p>{project.tagline}</p>
                {project.status === "rejected" && project.rejectionReason && (
                  <em>驳回原因：{project.rejectionReason}</em>
                )}
              </div>
              {project.status === "approved" && project.qrUrl && (
                <img
                  className="qr-thumb"
                  src={project.qrUrl}
                  alt={`${project.name} 二维码`}
                  onError={(event) => {
                    event.currentTarget.style.setProperty("display", "none");
                  }}
                />
              )}
              <span className={`status-pill ${project.status}`}>
                {project.status === "approved"
                  ? "已上线"
                  : project.status === "rejected"
                    ? "已驳回"
                    : "审核中"}
              </span>
            </article>
          ))}
          {myProjects.length === 0 && (
            <div className="panel-empty">你还没有提交项目，发布第一个吧。</div>
          )}
        </div>
      </section>
    </Modal>
  );
}
