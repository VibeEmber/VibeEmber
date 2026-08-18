"use client";

import { EmberMark } from "./ember-mark";

export function Footer() {
  return (
    <footer>
      <div className="footer-brand">
        <span className="brand-mark">
          <EmberMark size={18} />
        </span>
        <div>
          <b>星火场</b>
          <small>让好产品被第一批人看见。</small>
        </div>
      </div>
      <div className="footer-links">
        <a href="#discover">星火</a>
        <a href="#help">助燃</a>
        <a href="#how">社区公约</a>
        <a href="mailto:hello@vibeember.dev">联系我们</a>
      </div>
      <span>© 2026 星火场 · VibeEmber</span>
    </footer>
  );
}
