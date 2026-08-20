"use client";

import { ArrowRight, ChevronRight, CircleHelp, Flame, Search, Star } from "lucide-react";
import { PROJECT_KINDS, type CommunityWeek } from "@vibeember/shared";
import { categoryFilters } from "@/data/fallback";
import { ProjectCard } from "./project-card";
import type { DisplayProject } from "@/lib/types";

interface DiscoverProps {
  projects: DisplayProject[];
  total: number;
  category: string;
  setCategory: (value: string) => void;
  kind: string;
  setKind: (value: string) => void;
  resetFilters: () => void;
  voted: Array<number | string>;
  onToggleVote: (id: number | string) => void;
  onToggleBookmark: (id: number | string) => void;
  week: CommunityWeek | null;
  onNotify: (message: string) => void;
  onOpenSearch: () => void;
}

export function Discover({
  projects,
  total,
  category,
  setCategory,
  kind,
  setKind,
  resetFilters,
  voted,
  onToggleVote,
  onToggleBookmark,
  week,
  onNotify,
  onOpenSearch,
}: DiscoverProps) {
  return (
    <section className="discover section-wrap" id="discover">
      <div className="section-heading">
        <div>
          <span className="section-kicker">
            <Flame size={16} /> 星火在场
          </span>
          <h2>这些星火，刚刚燃起来</h2>
        </div>
        <button
          type="button"
          className="text-button"
          onClick={() => {
            resetFilters();
            document.getElementById("discover")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          查看全部（{total}） <ArrowRight size={17} />
        </button>
      </div>

      <div className="category-row" role="tablist" aria-label="产品形态">
        <button className={kind === "全部" ? "selected" : ""} onClick={() => setKind("全部")}>
          全部形态
        </button>
        {PROJECT_KINDS.map((item) => (
          <button
            key={item.id}
            className={kind === item.label ? "selected" : ""}
            onClick={() => setKind(item.label)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="category-row" role="tablist" aria-label="话题">
        {categoryFilters.map((item) => (
          <button
            key={item}
            className={category === item ? "selected" : ""}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <p className="count-note">
        {kind === "全部" && category === "全部"
          ? "展示全部产品"
          : `${kind === "全部" ? "" : kind}${category === "全部" ? "" : " · " + category}`}
        ，共 {projects.length} 个结果
      </p>

      <div className="project-layout">
        <div className="project-grid">
          {projects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              voted={voted.includes(project.id)}
              onToggleVote={onToggleVote}
              onToggleBookmark={onToggleBookmark}
            />
          ))}
          {projects.length === 0 && (
            <div className="empty-state">
              <Search size={28} />
              <h3>还没有匹配的产品</h3>
              <p>换个词试试，或者做第一个发布它的人。</p>
            </div>
          )}
        </div>

        <aside className="sidebar">
          <div className="side-card contribution-card">
            <span className="section-kicker">
              <Star size={15} /> 本周贡献榜
            </span>
            <h3>先伸手的人，值得被看见</h3>
            <ol>
              {(week?.helpers ?? []).map((user, index) => (
                <li key={user.userId}>
                  <span className={`rank rank-${index + 1}`}>{index + 1}</span>
                  <span className="leader-avatar">{user.name.slice(0, 1)}</span>
                  <div>
                    <b>{user.name}</b>
                    <small>本周有效助燃</small>
                  </div>
                  <strong>
                    {user.acceptedCount} <i>次</i>
                  </strong>
                </li>
              ))}
            </ol>
            {(week?.helpers.length ?? 0) === 0 && (
              <p className="form-hint">本周还没有被验收通过的助燃。</p>
            )}
            <button onClick={() => onNotify("榜单按本周验收通过次数排序")}>
              按真实验收计次 <ChevronRight size={16} />
            </button>
          </div>
          <div className="side-card idea-card">
            <div className="idea-icon">
              <CircleHelp size={23} />
            </div>
            <div>
              <span>开做之前，先搜一搜</span>
              <h3>别再重复造轮子</h3>
              <p>搜索真实产品和用户反馈，找到还没被解决的问题。</p>
              <button onClick={onOpenSearch}>
                搜索已有产品 <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
