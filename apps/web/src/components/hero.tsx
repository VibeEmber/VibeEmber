"use client";

import { ArrowRight, Check, ChevronRight, MessageCircle, Sparkles } from "lucide-react";
import type { CommunityWeek } from "@vibeember/shared";
import { EmberMark } from "./ember-mark";

interface HeroProps {
  week: CommunityWeek | null;
  onOpenSubmit: () => void;
}

export function Hero({ week, onOpenSubmit }: HeroProps) {
  const cases = week?.cases ?? [];
  const memberCount = week?.memberCount ?? 0;
  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <div className="eyebrow">
          <Sparkles size={15} /> 为 Vibe Coder 而生的产品首发社区
        </div>
        <h1>
          好产品，
          <br />
          <em>不该从 0 个用户</em>开始。
        </h1>
        <p>
          发布你的作品，换取真实体验和有用反馈。
          <br className="desktop-only" />
          先把微光添进场里，再把星火烧成燎原。
        </p>
        <div className="hero-actions">
          <button className="primary-button" onClick={onOpenSubmit}>
            发布我的产品 <ArrowRight size={18} />
          </button>
          <a className="text-button" href="#help">
            先帮别人一把 <ChevronRight size={17} />
          </a>
        </div>
        <div className="hero-proof">
          <div className="avatar-stack">
            {(week?.helpers.slice(0, 4) ?? []).map((helper) => (
              <span key={helper.userId}>{helper.name.slice(0, 1)}</span>
            ))}
            {(week?.helpers.length ?? 0) === 0 && <span>火</span>}
          </div>
          <strong>{memberCount || "--"}</strong>
          <span>位独立开发者已入场</span>
        </div>
      </div>

      <div className="hero-board" aria-label="社区实时动态">
        <div className="board-top">
          <span>
            <i /> 星火实况
          </span>
          <small>LIVE</small>
        </div>
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="center-rocket">
          <EmberMark size={36} />
          <span>星火正旺</span>
        </div>
        {cases[0] ? (
          <article className="float-card card-a">
            <span className="mini-icon coral">{cases[0].projectName.slice(0, 1)}</span>
            <div>
              <b>{cases[0].projectName}</b>
              <small>本周获得 {cases[0].acceptedCount} 条有效反馈</small>
            </div>
            <em>+{cases[0].acceptedCount}</em>
          </article>
        ) : (
          <article className="float-card card-a">
            <span className="mini-icon coral">火</span>
            <div>
              <b>本周互助还在攒火</b>
              <small>完成一次真实体验就会出现在这里</small>
            </div>
          </article>
        )}
        {cases[1] ? (
          <article className="float-card card-b">
            <span className="mini-icon blue">{cases[1].projectName.slice(0, 1)}</span>
            <div>
              <b>{cases[1].projectName}</b>
              <small>{cases[1].snippet || "收到新的有效反馈"}</small>
            </div>
            <MessageCircle size={17} />
          </article>
        ) : (
          <article className="float-card card-b">
            <span className="mini-icon blue">助</span>
            <div>
              <b>先帮别人一把</b>
              <small>按清单提交，火苗才入账</small>
            </div>
            <MessageCircle size={17} />
          </article>
        )}
        {cases[2] ? (
          <article className="float-card card-c">
            <span className="mini-icon green">{cases[2].projectName.slice(0, 1)}</span>
            <div>
              <b>{cases[2].projectName}</b>
              <small>本周 {cases[2].acceptedCount} 人真实用过</small>
            </div>
            <Check size={16} />
          </article>
        ) : (
          <article className="float-card card-c">
            <span className="mini-icon green">验</span>
            <div>
              <b>验收只看清单</b>
              <small>不打分，通过就给赏金</small>
            </div>
            <Check size={16} />
          </article>
        )}
        <div className="spark spark-a">✦</div>
        <div className="spark spark-b">✦</div>
        <div className="spark spark-c">·</div>
        <div className="board-stats">
          <div>
            <b>{week?.helpedProjectCount ?? 0}</b>
            <span>本周被帮助产品</span>
          </div>
          <div>
            <b>{week?.acceptedCount ?? 0}</b>
            <span>有效反馈</span>
          </div>
        </div>
      </div>
    </section>
  );
}
