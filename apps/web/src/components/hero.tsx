"use client";

import { ArrowRight, Check, ChevronRight, MessageCircle, Sparkles } from "lucide-react";
import { EmberMark } from "./ember-mark";

interface HeroProps {
  onOpenSubmit: () => void;
}

export function Hero({ onOpenSubmit }: HeroProps) {
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
            <span>林</span>
            <span>J</span>
            <span>麦</span>
            <span>V</span>
          </div>
          <strong>2,086</strong>
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
        <article className="float-card card-a">
          <span className="mini-icon coral">饭</span>
          <div>
            <b>饭搭子</b>
            <small>获得 6 位新用户</small>
          </div>
          <em>+6</em>
        </article>
        <article className="float-card card-b">
          <span className="mini-icon blue">T</span>
          <div>
            <b>TabTab</b>
            <small>收到新反馈</small>
          </div>
          <MessageCircle size={17} />
        </article>
        <article className="float-card card-c">
          <span className="mini-icon green">言</span>
          <div>
            <b>方言星球</b>
            <small>达成里程碑</small>
          </div>
          <Check size={16} />
        </article>
        <div className="spark spark-a">✦</div>
        <div className="spark spark-b">✦</div>
        <div className="spark spark-c">·</div>
        <div className="board-stats">
          <div>
            <b>168</b>
            <span>本周新作品</span>
          </div>
          <div>
            <b>3,429</b>
            <span>真实体验</span>
          </div>
        </div>
      </div>
    </section>
  );
}
