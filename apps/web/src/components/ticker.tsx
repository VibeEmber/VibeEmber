"use client";

import { ArrowRight, Zap } from "lucide-react";
import type { CommunityWeek } from "@vibeember/shared";

interface TickerProps {
  week: CommunityWeek | null;
}

export function Ticker({ week }: TickerProps) {
  const first = week?.recent[0];
  const second = week?.cases[0];
  return (
    <section className="ticker" aria-label="最新社区动态">
      <span className="ticker-title">
        <Zap size={14} fill="currentColor" /> 刚刚发生
      </span>
      <p>
        {first ? (
          <>
            <b>@{first.helperName}</b> 帮「{first.projectName}」完成了{first.feedbackTypeLabel}
          </>
        ) : (
          "本周互助还在攒火，完成一次真实体验就会出现在这里。"
        )}
      </p>
      <i />
      <p>
        {second ? (
          <>
            <b>「{second.projectName}」</b> 本周获得 {second.acceptedCount} 条有效反馈
          </>
        ) : (
          "先帮别人一把，再用火苗让自己的产品燎原。"
        )}
      </p>
      <a href="#help">
        去助燃厅 <ArrowRight size={15} />
      </a>
    </section>
  );
}
