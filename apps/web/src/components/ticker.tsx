"use client";

import { ArrowRight, Zap } from "lucide-react";

export function Ticker() {
  return (
    <section className="ticker" aria-label="最新社区动态">
      <span className="ticker-title">
        <Zap size={14} fill="currentColor" /> 刚刚发生
      </span>
      <p>
        <b>@鱼丸</b> 帮「方言星球」完成了内容校对
      </p>
      <i />
      <p>
        <b>「流光简历」</b> 达成 100 位真实用户
      </p>
      <a href="#help">
        查看动态 <ArrowRight size={15} />
      </a>
    </section>
  );
}
