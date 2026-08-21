"use client";
/* eslint-disable @next/next/no-img-element */

import {
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  Flame,
  LoaderCircle,
  LogOut,
  Rocket,
  ShieldCheck,
  Upload,
  UserRound,
  Users,
} from "./spark-icons";
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
  ProjectPublic,
  SessionUser,
  SparkLedgerItem,
  SparkSummary,
  TaskClaimItem,
  TaskPublic,
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
  { id: "aid", label: "助燃", icon: Users },
  { id: "bookmarks", label: "收藏", icon: Bookmark },
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
  const [editingProject, setEditingProject] = useState<ProjectPrivate | null>(null);
  const [activeClaim, setActiveClaim] = useState<TaskClaimItem | null>(null);
  const [bookmarks, setBookmarks] = useState<ProjectPublic[]>([]);
  const [myTasks, setMyTasks] = useState<TaskPublic[]>([]);
  const [displayName, setDisplayName] = useState(user.name);
  const [bio, setBio] = useState(user.bio ?? "");
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
        const [mine, sparkSummary, myClaims, pending, ledgerRows, saved, ownedTasks] =
          await Promise.all([
            api.myProjects(),
            api.sparks(),
            api.myClaims(),
            api.pendingReviews(),
            api.ledger(),
            api.myBookmarks(),
            api.myTasks(),
          ]);
        setMyProjects(mine.projects);
        setSparks(sparkSummary);
        setClaims(myClaims);
        setReviews(pending);
        setLedger(ledgerRows);
        setBookmarks(saved.projects);
        setMyTasks(ownedTasks);
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

  useEffect(() => {
    const refresh = () => void api.myProjects().then((data) => setMyProjects(data.projects));
    window.addEventListener("vibeember:project-submitted", refresh);
    return () => window.removeEventListener("vibeember:project-submitted", refresh);
  }, []);

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
    if (id === "bookmarks") return bookmarks.length;
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
              <span className="section-kicker">
                <UserRound size={15} /> 个人中心
              </span>
              <h1>概览</h1>
              <p>资料、火苗和待办分开放。公开主页会展示头像、昵称和简介。</p>
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
                <span>待处理助燃</span>
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
              <p className="form-hint">邮箱用于登录，不在社区卡片上公开。</p>
              <label>
                昵称
                <input
                  value={displayName}
                  maxLength={30}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </label>
              <label>
                简介
                <textarea
                  value={bio}
                  maxLength={160}
                  placeholder="一句话介绍你在场里做什么"
                  onChange={(event) => setBio(event.target.value)}
                />
              </label>
              <button
                type="button"
                className="upload-button"
                disabled={busy}
                onClick={() =>
                  void api
                    .updateMe({ name: displayName.trim(), bio })
                    .then(() => onNotify("资料已更新"))
                    .catch((error: unknown) =>
                      onNotify(error instanceof Error ? error.message : "保存失败"),
                    )
                }
              >
                保存资料
              </button>
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
              <p>提交后在这里跟踪审核进度。被驳回的可以改完再投；已上线产品可以发起或结束助燃。</p>
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
                  <div className="review-actions">
                    {project.status === "approved" && (
                      <button
                        type="button"
                        className="approve"
                        onClick={() => setCreatingFor(project)}
                      >
                        <Flame size={14} /> 发起助燃
                      </button>
                    )}
                    {project.status === "rejected" && (
                      <button type="button" onClick={() => setEditingProject(project)}>
                        修改后再投
                      </button>
                    )}
                    <span className={`status-pill ${project.status}`}>
                      {project.status === "approved"
                        ? "已上线"
                        : project.status === "rejected"
                          ? "已驳回"
                          : "审核中"}
                    </span>
                  </div>
                </article>
              ))}
              {myProjects.length === 0 && (
                <div className="panel-empty">你还没有提交产品，发布第一个吧。</div>
              )}
            </div>
          </>
        )}

        {tab === "aid" && (
          <>
            <header className="me-heading">
              <span className="section-kicker">
                <Users size={15} /> 助燃
              </span>
              <h1>助燃</h1>
              <p>
                可用火苗 {sparks?.available ?? 0}。先验收别人帮你的反馈，再看你领取和发起的助燃。
              </p>
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
                    <div className="review-actions">
                      <button onClick={() => setActiveClaim(item)}>
                        {item.status === "claimed"
                          ? "提交反馈"
                          : item.status === "rejected"
                            ? "查看驳回 / 举报"
                            : "查看进度"}
                      </button>
                    </div>
                  )}
                </article>
              ))}
              {myTasks
                .filter((task) => task.status === "open" || task.status === "full")
                .map((task) => (
                  <article key={task.id}>
                    <div>
                      <span>
                        我发起的 · {task.projectName} · 冻 {task.frozenAmount ?? 0}
                      </span>
                      <h4>{task.title}</h4>
                      <p>
                        {task.claimedCount}/{task.quota} 人领取 · {task.acceptedCount} 条已通过
                      </p>
                    </div>
                    <div className="review-actions">
                      <button
                        type="button"
                        onClick={() =>
                          void api
                            .closeTask(task.id)
                            .then(() => {
                              setMyTasks((rows) =>
                                rows.map((row) =>
                                  row.id === task.id ? { ...row, status: "closed" } : row,
                                ),
                              );
                              onNotify("助燃已结束，未用冻结已退回");
                              void api.sparks().then(setSparks);
                              void api.ledger().then(setLedger);
                            })
                            .catch((error: unknown) =>
                              onNotify(error instanceof Error ? error.message : "结束失败"),
                            )
                        }
                      >
                        结束助燃
                      </button>
                    </div>
                  </article>
                ))}
              {reviews.length === 0 && claims.length === 0 && myTasks.length === 0 && (
                <div className="panel-empty">还没有助燃记录。</div>
              )}
            </div>
          </>
        )}

        {tab === "bookmarks" && (
          <>
            <header className="me-heading">
              <span className="section-kicker">
                <Bookmark size={15} /> 收藏
              </span>
              <h1>我收藏的产品</h1>
              <p>在详情页或首页卡片点书签，就会出现在这里。</p>
            </header>
            <div className="submission-list mine me-list">
              {bookmarks.map((project) => (
                <article key={project.id}>
                  <div>
                    <span>{project.kindLabel}</span>
                    <h4>
                      <Link href={`/p/${project.id}`}>{project.name}</Link>
                    </h4>
                    <p>{project.tagline}</p>
                  </div>
                  <div className="review-actions">
                    <button
                      type="button"
                      onClick={() =>
                        void api.toggleBookmark(project.id).then(() => {
                          setBookmarks((rows) => rows.filter((row) => row.id !== project.id));
                        })
                      }
                    >
                      取消收藏
                    </button>
                  </div>
                </article>
              ))}
              {bookmarks.length === 0 && <div className="panel-empty">还没有收藏。</div>}
            </div>
          </>
        )}

        {tab === "ledger" && (
          <>
            <header className="me-heading">
              <span className="section-kicker">
                <Flame size={15} /> 火苗账本
              </span>
              <h1>火苗从哪来、花到哪</h1>
              <p>每一笔火苗的收入和支出都记在这里，可逐笔核对。</p>
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
              <p>审核新投稿，通过后项目将在社区公开展示。</p>
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
              <span className="section-kicker">
                <BookOpen size={15} /> 抽查举报
              </span>
              <h1>待处理抽查与举报</h1>
              <p>系统抽查用来追回不实反馈；用户举报用来改判被误驳的助燃。两套按钮不一样。</p>
            </header>
            <div className="submission-list mine me-list">
              {reports.map((item) => (
                <article key={item.id}>
                  <div>
                    <span>
                      {item.kind === "spot_check" ? "系统抽查" : `用户举报 · ${item.reporterName}`}{" "}
                      · {item.projectName} · {item.helperName} · {item.reward} 火苗
                    </span>
                    <h4>{item.taskTitle}</h4>
                    <p>{item.reason}</p>
                    {item.answers.map((answer, index) => (
                      <p key={index}>{answer}</p>
                    ))}
                    {item.screenshotUrl && (
                      <a href={item.screenshotUrl} target="_blank" rel="noreferrer">
                        查看使用截图
                      </a>
                    )}
                  </div>
                  <div className="review-actions">
                    {item.kind === "spot_check" ? (
                      <>
                        <button
                          onClick={() =>
                            void api
                              .resolveReport(item.id, "dismissed", "抽查通过，维持原判")
                              .then(() => {
                                setReports((rows) => rows.filter((row) => row.id !== item.id));
                                onNotify("抽查通过，维持原验收");
                              })
                          }
                        >
                          抽查通过
                        </button>
                        <button
                          onClick={() =>
                            void api
                              .resolveReport(item.id, "upheld", "抽查未通过，追回火苗")
                              .then(() => {
                                setReports((rows) => rows.filter((row) => row.id !== item.id));
                                onNotify("已追回不实反馈的火苗");
                              })
                          }
                        >
                          判定不实并追回
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() =>
                            void api
                              .resolveReport(item.id, "dismissed", "举报不成立，维持原判")
                              .then(() => {
                                setReports((rows) => rows.filter((row) => row.id !== item.id));
                                onNotify("已维持原判");
                              })
                          }
                        >
                          维持原判
                        </button>
                        <button
                          className="approve"
                          onClick={() =>
                            void api
                              .resolveReport(item.id, "upheld", "举报成立，从发起人支付赏金")
                              .then(() => {
                                setReports((rows) => rows.filter((row) => row.id !== item.id));
                                onNotify("已改判：从发起人账户支付赏金");
                              })
                          }
                        >
                          改判并支付
                        </button>
                      </>
                    )}
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
            void api.myTasks().then(setMyTasks);
          }}
        />
      )}
      {editingProject && (
        <SubmitModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onNotify={onNotify}
          onSubmitted={(message) => {
            setEditingProject(null);
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
        <p>产品、助燃验收和火苗账本都记在这个账号上。</p>
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
