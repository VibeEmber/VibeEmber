"use client";
/* eslint-disable @next/next/no-img-element */

import {
  ArrowRight,
  BookOpen,
  Check,
  Flame,
  LoaderCircle,
  LogOut,
  Plus,
  Rocket,
  ShieldCheck,
  Upload,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { AuthModal } from "./modals/auth-modal";
import { SubmitModal } from "./modals/submit-modal";
import { TaskClaimModal } from "./modals/task-claim-modal";
import { TaskCreateModal } from "./modals/task-create-modal";
import { Toast } from "./toast";

const TABS = [
  { id: "overview", label: "概览", icon: UserRound },
  { id: "projects", label: "我的产品", icon: Rocket },
  { id: "aid", label: "互助", icon: Users },
  { id: "ledger", label: "火苗账本", icon: Flame },
  { id: "review", label: "投稿审核", icon: ShieldCheck, admin: true },
  { id: "reports", label: "抽查举报", icon: BookOpen, admin: true },
] as const;

type TabId = (typeof TABS)[number]["id"];

function isTab(value: string | null): value is TabId {
  return TABS.some((tab) => tab.id === value);
}

export function MeCenter({ user }: { user: SessionUser }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get("tab");
  const tab: TabId = isTab(requested) ? requested : "overview";
  const [myProjects, setMyProjects] = useState<ProjectPrivate[]>([]);
  const [reviewProjects, setReviewProjects] = useState<ProjectPrivate[]>([]);
  const [sparks, setSparks] = useState<SparkSummary | null>(null);
  const [claims, setClaims] = useState<TaskClaimItem[]>([]);
  const [reviews, setReviews] = useState<TaskClaimItem[]>([]);
  const [reports, setReports] = useState<TaskReportItem[]>([]);
  const [ledger, setLedger] = useState<SparkLedgerItem[]>([]);
  const [creatingFor, setCreatingFor] = useState<ProjectPrivate | null>(null);
  const [activeClaim, setActiveClaim] = useState<TaskClaimItem | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const onNotify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const menus = useMemo(
    () => TABS.filter((item) => !("admin" in item && item.admin) || user.role === "admin"),
    [user.role],
  );

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
  }, [user.role]);

  const changeAvatar = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const { key } = await uploadFile("avatar", file);
      await api.updateMe({ avatarKey: key });
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
      /* local state still clears */
    }
    onNotify("已退出登录");
    router.push("/");
  };

  const reviewProject = async (project: ProjectPrivate, action: "approved" | "rejected") => {
    const reason =
      action === "rejected" ? (window.prompt("请填写驳回原因（投稿者可见）") ?? "") : "";
    if (action === "rejected" && !reason) return;
    setBusy(true);
    try {
      await api.reviewProject(project.id, { action, reason });
      setReviewProjects((items) => items.filter((item) => item.id !== project.id));
      onNotify(action === "approved" ? "已通过，项目现已公开展示" : "已驳回并记录原因");
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "审核失败");
    } finally {
      setBusy(false);
    }
  };

  const badge = (id: TabId) => {
    if (id === "projects") return myProjects.length;
    if (id === "aid")
      return reviews.length + claims.filter((item) => item.status === "claimed").length;
    if (id === "review") return reviewProjects.length;
    if (id === "reports") return reports.length;
    return null;
  };

  return (
    <div className="me-shell">
      <aside className="me-nav">
        <div className="me-profile">
          <span className="account-avatar">
            {user.image ? <img src={user.image} alt={user.name} /> : user.name.slice(0, 1)}
          </span>
          <div>
            <span>{user.role === "admin" ? "管理员" : "开发者"}</span>
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </div>
        </div>
        <nav aria-label="个人中心菜单">
          {menus.map((item) => {
            const Icon = item.icon;
            const count = badge(item.id);
            return (
              <Link
                key={item.id}
                href={item.id === "overview" ? "/me" : `/me?tab=${item.id}`}
                className={tab === item.id ? "on" : ""}
              >
                <Icon size={16} />
                {item.label}
                {count ? <em>{count}</em> : null}
              </Link>
            );
          })}
        </nav>
        <button className="me-logout" onClick={() => void logout()}>
          <LogOut size={15} /> 退出登录
        </button>
      </aside>

      <section className="me-main">
        {tab === "overview" && (
          <>
            <header className="me-heading">
              <span className="section-kicker">个人中心</span>
              <h1>概览</h1>
              <p>资料、火苗和待办分开放，避免挤在一个对话框里。</p>
            </header>
            <div className="me-stats">
              <article>
                <span>可用火苗</span>
                <strong>{sparks?.available ?? 0}</strong>
                <small>冻结 {sparks?.frozen ?? 0}</small>
              </article>
              <article>
                <span>累计获得</span>
                <strong>{sparks?.lifetimeEarned ?? 0}</strong>
                <small>账本可对每一笔</small>
              </article>
              <article>
                <span>我的产品</span>
                <strong>{myProjects.length}</strong>
                <small>
                  {myProjects.filter((item) => item.status === "approved").length} 个已上线
                </small>
              </article>
              <article>
                <span>待处理互助</span>
                <strong>{reviews.length}</strong>
                <small>待提交 {claims.filter((item) => item.status === "claimed").length}</small>
              </article>
            </div>
            <div className="me-card">
              <div className="panel-title">
                <div>
                  <span className="section-kicker">资料</span>
                  <h3>头像与账号</h3>
                </div>
                <button onClick={() => avatarInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <LoaderCircle className="spin" size={13} /> : <Upload size={13} />}{" "}
                  更换头像
                </button>
              </div>
              <p className="form-hint">
                公开主页会展示这个头像。邮箱用于登录，不在社区卡片上公开。
              </p>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={(event) => void changeAvatar(event.target.files?.[0])}
              />
            </div>
          </>
        )}

        {tab === "projects" && (
          <>
            <header className="me-heading">
              <span className="section-kicker">
                <Rocket size={15} /> 我的产品
              </span>
              <h1>项目状态</h1>
              <button className="primary-button" onClick={() => setShowSubmit(true)}>
                <Plus size={16} /> 新建投稿
              </button>
            </header>
            <div className="submission-list mine me-list">
              {myProjects.map((project) => (
                <article key={project.id}>
                  <div>
                    <span>
                      {project.kindLabel} ·{" "}
                      {new Date(project.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                    <h4>
                      <Link href={`/p/${project.id}`}>{project.name}</Link>
                    </h4>
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
          </>
        )}

        {tab === "aid" && (
          <>
            <header className="me-heading">
              <span className="section-kicker">火苗 {sparks?.available ?? 0}</span>
              <h1>互助</h1>
              <p>左边验收别人帮你的反馈，下面是你领取的任务。</p>
            </header>
            <div className="submission-list mine me-list">
              {reviews.map((item) => (
                <ReviewCard
                  key={item.id}
                  item={item}
                  busy={busy}
                  onDone={(message) => {
                    setReviews((rows) => rows.filter((row) => row.id !== item.id));
                    onNotify(message);
                  }}
                  onFail={onNotify}
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
                    <button onClick={() => setActiveClaim(item)}>
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
          </>
        )}

        {tab === "ledger" && (
          <>
            <header className="me-heading">
              <span className="section-kicker">账本</span>
              <h1>火苗从哪来、花到哪</h1>
            </header>
            <div className="submission-list mine me-list">
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
          </>
        )}

        {tab === "review" && user.role === "admin" && (
          <>
            <header className="me-heading">
              <span className="section-kicker">
                <ShieldCheck size={15} /> 审核工作台
              </span>
              <h1>待审核投稿</h1>
              <strong className="me-count">{reviewProjects.length}</strong>
            </header>
            <div className="submission-list mine me-list">
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
          </>
        )}

        {tab === "reports" && user.role === "admin" && (
          <>
            <header className="me-heading">
              <span className="section-kicker">抽查</span>
              <h1>待处理举报</h1>
            </header>
            <div className="submission-list mine me-list">
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
              {reports.length === 0 && <div className="panel-empty">暂无待处理抽查。</div>}
            </div>
          </>
        )}
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
      {showSubmit && (
        <SubmitModal
          onClose={() => setShowSubmit(false)}
          onNotify={onNotify}
          onSubmitted={(message) => {
            setShowSubmit(false);
            onNotify(message);
            void api.myProjects().then((data) => setMyProjects(data.projects));
          }}
        />
      )}
      {activeClaim && (
        <TaskClaimModal
          claim={activeClaim}
          onClose={() => setActiveClaim(null)}
          onNotify={onNotify}
          onChanged={() => {
            void api.myClaims().then(setClaims);
          }}
        />
      )}
      <Toast message={toast} />
    </div>
  );
}

export function MeGate() {
  const { data: session, isPending } = authClient.useSession();
  const user = (session?.user ?? null) as SessionUser | null;
  const [showAuth, setShowAuth] = useState(false);
  const [toast, setToast] = useState("");

  if (isPending) {
    return <div className="panel-empty">加载个人中心…</div>;
  }
  if (!user) {
    return (
      <div className="me-signin">
        <h1>先登录，再进个人中心</h1>
        <p>产品、互助验收和火苗账本都记在这个账号上。</p>
        <button className="primary-button" onClick={() => setShowAuth(true)}>
          登录 / 注册
        </button>
        {showAuth && (
          <AuthModal
            onClose={() => setShowAuth(false)}
            onNotify={(message) => {
              setToast(message);
              window.setTimeout(() => setToast(""), 2400);
            }}
          />
        )}
        <Toast message={toast} />
      </div>
    );
  }
  return <MeCenter user={user} />;
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
