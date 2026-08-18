"use client";

import { ArrowRight, ChevronRight, CircleHelp, Flame, Search, Star } from "lucide-react";
import { categoryFilters, leaderboard } from "@/data/fallback";
import { ProjectCard } from "./project-card";
import type { DisplayProject } from "@/lib/types";

interface DiscoverProps {
  projects: DisplayProject[];
  category: string;
  setCategory: (value: string) => void;
  voted: Array<number | string>;
  onToggleVote: (id: number | string) => void;
  onNotify: (message: string) => void;
  onOpenSearch: () => void;
}

export function Discover({
  projects,
  category,
  setCategory,
  voted,
  onToggleVote,
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
        <a href="#all">
          查看全部 <ArrowRight size={17} />
        </a>
      </div>
      <div className="category-row" role="tablist" aria-label="产品分类">
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

      <div className="project-layout">
        <div className="project-grid">
          {projects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              voted={voted.includes(project.id)}
              onToggleVote={onToggleVote}
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
              {leaderboard.map((user, index) => (
                <li key={user[0]}>
                  <span className={`rank rank-${index + 1}`}>{index + 1}</span>
                  <span className="leader-avatar">{user[3]}</span>
                  <div>
                    <b>{user[0]}</b>
                    <small>{user[1]}</small>
                  </div>
                  <strong>
                    {user[2]} <i>pts</i>
                  </strong>
                </li>
              ))}
            </ol>
            <button onClick={() => onNotify("已打开完整贡献榜")}>
              查看完整榜单 <ChevronRight size={16} />
            </button>
          </div>
          <div className="side-card idea-card">
            <div className="idea-icon">
              <CircleHelp size={23} />
            </div>
            <div>
              <span>开做之前，先搜一搜</span>
              <h3>别再重复造轮子</h3>
              <p>搜索 680+ 个真实产品和用户反馈，找到还没被解决的问题。</p>
              <button onClick={onOpenSearch}>
                查看赛道地图 <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
