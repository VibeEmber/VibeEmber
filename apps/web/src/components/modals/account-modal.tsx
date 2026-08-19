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
import {
  CLAIM_STATUS_LABELS,
  REJECT_REASONS,
  SPARK_TYPE_LABELS,
  api,
  uploadFile,
  type RejectReason,
} from "@vibeember/shared";
import type {
  ProjectPrivate,
  SessionUser,
  SparkLedgerItem,
  SparkSummary,
  TaskClaimItem,
  TaskReportItem,
} from "@vibeember/shared";
import { authClient } from "@/lib/auth-client";
import { Modal } from "../modal";
import { TaskCreateModal } from "./task-create-modal";

interface AccountModalProps {
  user: SessionUser;
  onClose: () => void;
  onNotify: (message: string) => void;
  onReviewed: () => void;
  onOpenClaim: (claim: TaskClaimItem) => void;
}

export function AccountModal({
  user,
  onClose,
  onNotify,
  onReviewed,
  onOpenClaim,
}: AccountModalProps) {
  const [myProjects, setMyProjects] = useState<ProjectPrivate[]>([]);
  const [reviewProjects, setReviewProjects] = useState<ProjectPrivate[]>([]);
  const [sparks, setSparks] = useState<SparkSummary | null>(null);
  const [claims, setClaims] = useState<TaskClaimItem[]>([]);
  const [reviews, setReviews] = useState<TaskClaimItem[]>([]);
  const [reports, setReports] = useState<TaskReportItem[]>([]);
  const [ledger, setLedger] = useState<SparkLedgerItem[]>([]);
  const [creatingFor, setCreatingFor] = useState<ProjectPrivate | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [mine, sparkSummary, myClaims, pending, ledgerRows] = await Promise.all([
          api.myProjects(),
          api.sparks(),
          api.myClaims(),
          api.pendingReviews(),
          api.ledger(),
        ]);
        setMyProjects(mine.projects);
        setSparks(sparkSummary);
        setClaims(myClaims);
        setReviews(pending);
        setLedger(ledgerRows);
        if (user.role === "admin") {
          const [queue, reportList] = await Promise.all([
            api.adminProjects("pending"),
            api.adminReports(),
          ]);
          setReviewProjects(queue.projects);
          setReports(reportList.reports);
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
                    {project.kindLabel} · {project.ownerEmail}
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
                  {project.kindLabel} · {new Date(project.createdAt).toLocaleDateString("zh-CN")}
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
              {project.status === "approved" && (
                <button onClick={() => setCreatingFor(project)}>发起助燃</button>
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

      <section className="my-projects">
        <div className="panel-title">
          <div>
            <span className="section-kicker">火苗 {sparks?.available ?? 0}</span>
            <h3>我的助燃</h3>
          </div>
        </div>
        <div className="submission-list mine">
          {reviews.map((item) => (
            <ReviewCard
              key={item.id}
              item={item}
              busy={busy}
              onDone={(message) => {
                setReviews((rows) => rows.filter((row) => row.id !== item.id));
                onNotify(message);
              }}
              onFail={(message) => onNotify(message)}
            />
          ))}
          {claims.map((item) => (
            <article key={item.id}>
              <div>
                <span>
                  {CLAIM_STATUS_LABELS[item.status] ?? item.status} · {item.projectName}
                </span>
                <h4>{item.taskTitle}</h4>
                <p>{item.feedback || "尚未提交反馈"}</p>
              </div>
              {(item.status === "claimed" ||
                item.status === "submitted" ||
                item.status === "rejected" ||
                item.status === "accepted") && (
                <button onClick={() => onOpenClaim(item)}>
                  {item.status === "claimed"
                    ? "提交反馈"
                    : item.status === "rejected"
                      ? "查看驳回 / 举报"
                      : "查看进度"}
                </button>
              )}
            </article>
          ))}
          {reviews.length === 0 && claims.length === 0 && (
            <div className="panel-empty">还没有助燃记录。</div>
          )}
        </div>
      </section>

      {user.role === "admin" && reports.length > 0 && (
        <section className="my-projects">
          <div className="panel-title">
            <div>
              <span className="section-kicker">抽查</span>
              <h3>待处理举报</h3>
            </div>
          </div>
          <div className="submission-list mine">
            {reports.map((item) => (
              <article key={item.id}>
                <div>
                  <span>{item.kind === "spot_check" ? "系统抽查" : item.reporterName}</span>
                  <h4>{item.taskTitle}</h4>
                  <p>{item.reason}</p>
                </div>
                <div className="review-actions">
                  <button
                    onClick={() =>
                      void api.resolveReport(item.id, "dismissed", "维持原判").then(() => {
                        setReports((rows) => rows.filter((row) => row.id !== item.id));
                      })
                    }
                  >
                    驳回举报
                  </button>
                  <button
                    className="approve"
                    onClick={() =>
                      void api.resolveReport(item.id, "upheld", "改判补发").then(() => {
                        setReports((rows) => rows.filter((row) => row.id !== item.id));
                        onNotify("已改判并补发火苗");
                      })
                    }
                  >
                    改判
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="my-projects">
        <div className="panel-title">
          <div>
            <span className="section-kicker">账本</span>
            <h3>火苗从哪来、花到哪</h3>
          </div>
        </div>
        <div className="submission-list mine">
          {ledger.map((item) => (
            <article key={item.id}>
              <div>
                <span>{new Date(item.createdAt).toLocaleString("zh-CN")}</span>
                <h4>
                  {item.amount > 0 ? "+" : ""}
                  {item.amount} · {item.typeLabel || SPARK_TYPE_LABELS[item.type] || item.type}
                </h4>
                <p>{item.memo}</p>
              </div>
              <span className="status-pill pending">余 {item.balanceAfter}</span>
            </article>
          ))}
          {ledger.length === 0 && <div className="panel-empty">还没有流水。</div>}
        </div>
      </section>

      {creatingFor && (
        <TaskCreateModal
          project={creatingFor}
          sparks={sparks}
          onClose={() => setCreatingFor(null)}
          onNotify={onNotify}
          onCreated={() => {
            setCreatingFor(null);
            void api.sparks().then(setSparks);
            void api.ledger().then(setLedger);
          }}
        />
      )}
    </Modal>
  );
}

function ReviewCard({
  item,
  busy,
  onDone,
  onFail,
}: {
  item: TaskClaimItem;
  busy: boolean;
  onDone: (message: string) => void;
  onFail: (message: string) => void;
}) {
  const [rejectReason, setRejectReason] = useState<RejectReason>(REJECT_REASONS[0].id);
  const [note, setNote] = useState("");

  return (
    <article>
      <div>
        <span>待验收 · {item.userName}</span>
        <h4>{item.taskTitle}</h4>
        {(item.answers.length ? item.answers : [item.feedback]).map((answer, index) => (
          <p key={index}>
            {item.questions[index] ? `${item.questions[index]} ` : ""}
            {answer}
          </p>
        ))}
        {item.screenshotUrl && (
          <a href={item.screenshotUrl} target="_blank" rel="noreferrer">
            查看使用截图
          </a>
        )}
        {item.checklist.length > 0 && (
          <small className="form-hint">对照清单：{item.checklist.join(" / ")}</small>
        )}
        <label>
          驳回原因
          <select
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value as RejectReason)}
          >
            {REJECT_REASONS.map((reason) => (
              <option key={reason.id} value={reason.id}>
                {reason.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          补充说明
          <input value={note} onChange={(event) => setNote(event.target.value)} />
        </label>
      </div>
      <div className="review-actions">
        <button
          disabled={busy}
          onClick={() => {
            if (note.trim().length < 2) {
              onFail("驳回请补充至少 2 字说明");
              return;
            }
            void api
              .reviewClaim(item.id, { action: "rejected", rejectReason, note })
              .then(() => onDone("已按清单驳回"))
              .catch((error: unknown) =>
                onFail(error instanceof Error ? error.message : "操作失败"),
              );
          }}
        >
          驳回
        </button>
        <button
          className="approve"
          disabled={busy}
          onClick={() =>
            void api
              .reviewClaim(item.id, { action: "accepted" })
              .then(() => onDone("已通过并结算火苗"))
              .catch((error: unknown) =>
                onFail(error instanceof Error ? error.message : "操作失败"),
              )
          }
        >
          通过
        </button>
      </div>
    </article>
  );
}
