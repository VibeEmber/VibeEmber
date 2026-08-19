"use client";
/* eslint-disable @next/next/no-img-element */

import { ArrowRight, Bookmark, Check, Flame, Heart, MessageCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@vibeember/shared";
import type { CommentItem, ProjectPublic } from "@vibeember/shared";
import { useAppSession } from "@/lib/session";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAppSession();
  const [project, setProject] = useState<ProjectPublic | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [detail, commentList] = await Promise.all([
        api.getProject(params.id),
        api.comments(params.id),
      ]);
      setProject(detail.project);
      setComments(commentList.comments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    }
  }, [params.id]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [detail, commentList] = await Promise.all([
          api.getProject(params.id),
          api.comments(params.id),
        ]);
        if (cancelled) return;
        setProject(detail.project);
        setComments(commentList.comments);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "加载失败");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const needLogin = () => setError("登录后才能操作");

  const toggleVote = async () => {
    if (!user) return needLogin();
    try {
      const res = await api.toggleVote(project!.id);
      setProject((current) =>
        current
          ? { ...current, voted: res.voted, voteCount: current.voteCount + (res.voted ? 1 : -1) }
          : current,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    }
  };

  const toggleBookmark = async () => {
    if (!user) return needLogin();
    try {
      const res = await api.toggleBookmark(project!.id);
      setProject((current) =>
        current
          ? {
              ...current,
              bookmarked: res.bookmarked,
              bookmarkCount: current.bookmarkCount + (res.bookmarked ? 1 : -1),
            }
          : current,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    }
  };

  const postComment = async () => {
    if (!user) return needLogin();
    if (commentBody.trim().length < 2) return;
    setBusy(true);
    try {
      await api.addComment(project!.id, commentBody);
      setCommentBody("");
      const list = await api.comments(params.id);
      setComments(list.comments);
      setProject((current) =>
        current ? { ...current, commentCount: current.commentCount + 1 } : current,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "评论失败");
    } finally {
      setBusy(false);
    }
  };

  if (!project) {
    return (
      <main>
        <SiteHeader
          user={user}
          search=""
          setSearch={() => undefined}
          showSearch={false}
          setShowSearch={() => undefined}
          onOpenSubmit={() => undefined}
          onOpenAccount={() => undefined}
        />
        <div className="section-wrap" style={{ padding: "80px 24px" }}>
          {error || "加载中…"}
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main>
      <SiteHeader
        user={user}
        search=""
        setSearch={() => undefined}
        showSearch={false}
        setShowSearch={() => undefined}
        onOpenSubmit={() => undefined}
        onOpenAccount={() => undefined}
      />
      <div className="section-wrap detail-wrap">
        <div className="detail-hero">
          {project.logoUrl ? (
            <span className="detail-logo">
              <img src={project.logoUrl} alt={`${project.name} Logo`} />
            </span>
          ) : (
            <span className="detail-logo">{project.name.slice(0, 1)}</span>
          )}
          <div className="detail-hero-copy">
            <div className="detail-topics">
              <span className="status-pill approved">{project.kindLabel}</span>
              {project.topics.map((topic) => (
                <span key={topic} className="status-pill pending">
                  {topic}
                </span>
              ))}
            </div>
            <h1>{project.name}</h1>
            <p>{project.tagline}</p>
            <a className="detail-maker" href={`/u/${project.makerId}`}>
              {project.makerAvatarUrl ? (
                <img src={project.makerAvatarUrl} alt={project.maker} />
              ) : (
                <span>{project.maker.slice(0, 1)}</span>
              )}
              {project.maker} · {new Date(project.createdAt).toLocaleDateString("zh-CN")}
            </a>
          </div>
        </div>

        <div className="detail-actions">
          {project.url && (
            <a className="primary-button" href={project.url} target="_blank" rel="noreferrer">
              打开产品 <ArrowRight size={16} />
            </a>
          )}
          <button
            className={project.voted ? "vote voted" : "vote"}
            onClick={() => void toggleVote()}
          >
            <Heart size={16} fill={project.voted ? "currentColor" : "none"} /> {project.voteCount}
          </button>
          <button
            className={project.bookmarked ? "vote voted" : "vote"}
            onClick={() => void toggleBookmark()}
          >
            <Bookmark size={16} fill={project.bookmarked ? "currentColor" : "none"} />{" "}
            {project.bookmarkCount}
          </button>
          <span className="vote">
            <MessageCircle size={16} /> {project.commentCount}
          </span>
        </div>

        <section className="detail-section">
          <h3>现在最需要的帮助</h3>
          <p>{project.helpNeeded}</p>
          <Link className="text-button" href="/#help">
            发起 / 参与助燃 <Flame size={14} />
          </Link>
        </section>

        {(project.qrUrl || project.extraQrUrl || project.screenshotUrls.length > 0) && (
          <section className="detail-section">
            <h3>二维码与截图</h3>
            <div className="detail-assets">
              {(project.extraQrUrl || project.qrUrl) && (
                <span className="detail-qr">
                  <img
                    src={project.extraQrUrl || project.qrUrl || ""}
                    alt={`${project.name} 二维码`}
                    onError={(event) => {
                      event.currentTarget.parentElement?.style.setProperty("display", "none");
                    }}
                  />
                  <small>扫码 {project.kindLabel === "小程序" ? "进小程序" : "关注"}</small>
                </span>
              )}
              {project.screenshotUrls.map((url) => (
                <img
                  key={url}
                  className="detail-shot"
                  src={url}
                  alt={`${project.name} 截图`}
                  loading="lazy"
                />
              ))}
            </div>
          </section>
        )}

        <section className="detail-section">
          <h3>评论（{comments.length}）</h3>
          <div className="detail-comment-form">
            <textarea
              value={commentBody}
              onChange={(event) => setCommentBody(event.target.value)}
              placeholder={user ? "写下你的真实看法（2-500 字）" : "登录后评论"}
              maxLength={500}
            />
            <button className="primary-button" onClick={() => void postComment()} disabled={busy}>
              {busy ? "发送中" : "发表评论"}
            </button>
          </div>
          <div className="submission-list mine">
            {comments.map((comment) => (
              <article key={comment.id}>
                <div>
                  <a className="detail-maker" href={`/u/${comment.userId}`}>
                    {comment.userAvatarUrl ? (
                      <img src={comment.userAvatarUrl} alt={comment.userName} />
                    ) : (
                      <span>{comment.userName.slice(0, 1)}</span>
                    )}
                    <b>{comment.userName}</b>
                  </a>
                  <p>{comment.body}</p>
                  <small>{new Date(comment.createdAt).toLocaleString("zh-CN")}</small>
                </div>
              </article>
            ))}
            {comments.length === 0 && <div className="panel-empty">还没有评论，坐第一排。</div>}
          </div>
        </section>

        {error && (
          <div
            className="toast"
            style={{ position: "static", transform: "none", marginBottom: 20 }}
          >
            <Check size={17} />
            {error}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
