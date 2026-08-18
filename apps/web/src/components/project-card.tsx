"use client";

import { ArrowRight, Bookmark, Heart, MessageCircle } from "lucide-react";
import type { DisplayProject } from "@/lib/types";

interface ProjectCardProps {
  project: DisplayProject;
  index: number;
  voted: boolean;
  onToggleVote: (id: number | string) => void;
}

export function ProjectCard({ project, index, voted, onToggleVote }: ProjectCardProps) {
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
        <span className="visual-caption">MADE WITH VIBE</span>
      </div>
      <div className="project-info">
        <div className="project-title-line">
          <div>
            <h3>
              {project.url ? (
                <a href={project.url} target="_blank" rel="noreferrer">
                  {project.name} <ArrowRight size={13} />
                </a>
              ) : (
                project.name
              )}
            </h3>
            <span>{project.category}</span>
          </div>
          <button
            className={voted ? "vote voted" : "vote"}
            onClick={() => onToggleVote(project.id)}
            aria-label={`为${project.name}点赞`}
          >
            <Heart size={17} fill={voted ? "currentColor" : "none"} />{" "}
            {project.votes + (voted && project.id !== 1 ? 1 : 0)}
          </button>
        </div>
        <p>{project.tagline}</p>
        <div className="project-meta">
          {project.makerAvatarUrl ? (
            <span className="maker-avatar">
              <img src={project.makerAvatarUrl} alt={project.maker} loading="lazy" />
            </span>
          ) : (
            <span className="maker-avatar">{project.avatar}</span>
          )}
          <span>{project.maker}</span>
          <span className="meta-spacer" />
          <MessageCircle size={15} />
          <span>{project.comments}</span>
          <Bookmark size={15} />
        </div>
      </div>
    </article>
  );
}
