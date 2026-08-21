"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ArrowRight, Bookmark, ExternalLink, Heart, MessageCircle } from "./spark-icons";
import type { DisplayProject } from "@/lib/types";

interface ProjectCardProps {
  project: DisplayProject;
  index: number;
  voted: boolean;
  onToggleVote: (id: number | string) => void;
  onToggleBookmark?: (id: number | string) => void;
}

export function ProjectCard({
  project,
  index,
  voted,
  onToggleVote,
  onToggleBookmark,
}: ProjectCardProps) {
  const detailHref = typeof project.id === "string" ? `/p/${project.id}` : undefined;

  return (
    <article
      className="project-card"
      style={{ "--delay": `${index * 45}ms` } as React.CSSProperties}
    >
      <div className="project-visual" style={{ background: project.color }}>
        <span className="project-number">0{index + 1}</span>
        {project.badge && <span className="project-badge">{project.badge}</span>}
        <div className="visual-rings" />
        {project.logoUrl ? (
          <div className="app-icon" style={{ background: "#fff" }}>
            <img src={project.logoUrl} alt={`${project.name} Logo`} loading="lazy" />
          </div>
        ) : (
          <div
            className="app-icon"
            style={{ background: project.accent, color: project.id === 1 ? "#171814" : "#fff" }}
          >
            {project.icon}
          </div>
        )}
        {project.qrUrl && (
          <span className="qr-badge">
            <img
              src={project.qrUrl}
              alt={`${project.name} 二维码`}
              loading="lazy"
              onError={(event) => {
                event.currentTarget.parentElement?.style.setProperty("display", "none");
              }}
            />
          </span>
        )}
        <span className="visual-caption">星火出品</span>
      </div>
      <div className="project-info">
        <div className="project-title-line">
          <div>
            <h3>
              {detailHref ? (
                <Link href={detailHref}>
                  {project.name} <ArrowRight size={13} />
                </Link>
              ) : (
                project.name
              )}
              {project.url && (
                <a
                  className="card-outlink"
                  href={project.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="直接打开产品"
                >
                  <ExternalLink size={12} />
                </a>
              )}
            </h3>
            <span>
              {project.category}
              {project.topics?.length ? ` · ${project.topics.join(" / ")}` : ""}
            </span>
          </div>
          <button
            className={voted ? "vote voted" : "vote"}
            onClick={() => onToggleVote(project.id)}
            aria-label={`为${project.name}点赞`}
          >
            <Heart size={17} fill={voted ? "currentColor" : "none"} /> {project.votes}
          </button>
        </div>
        <p>{project.tagline}</p>
        <div className="project-meta">
          {project.makerId ? (
            <Link className="maker-link" href={`/u/${project.makerId}`}>
              {project.makerAvatarUrl ? (
                <span className="maker-avatar">
                  <img src={project.makerAvatarUrl} alt={project.maker} loading="lazy" />
                </span>
              ) : (
                <span className="maker-avatar">{project.avatar}</span>
              )}
              {project.maker}
            </Link>
          ) : (
            <>
              <span className="maker-avatar">{project.avatar}</span>
              <span>{project.maker}</span>
            </>
          )}
          <span className="meta-spacer" />
          <MessageCircle size={15} />
          <span>{project.comments}</span>
          {onToggleBookmark ? (
            <button
              type="button"
              className={project.bookmarked ? "vote voted" : "vote"}
              aria-label={project.bookmarked ? "取消收藏" : "收藏"}
              onClick={() => onToggleBookmark(project.id)}
            >
              <Bookmark size={15} fill={project.bookmarked ? "currentColor" : "none"} />
            </button>
          ) : (
            <Bookmark size={15} />
          )}
        </div>
      </div>
    </article>
  );
}
