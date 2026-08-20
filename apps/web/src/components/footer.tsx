"use client";

import Link from "next/link";
import { useState } from "react";
import { SITE } from "@vibeember/shared";
import { EmberMark } from "./ember-mark";
import { GithubIcon } from "./github-icon";

export function Footer() {
  const [showQr, setShowQr] = useState(false);
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
        <Link href="/#discover">看星火</Link>
        <Link href="/#help">助燃</Link>
        <Link href="/covenant">社区公约</Link>
        <a href={SITE.github} target="_blank" rel="noreferrer">
          GitHub
        </a>
        <button type="button" className="footer-link-button" onClick={() => setShowQr(true)}>
          加入星火场
        </button>
        <a href={`mailto:${SITE.contactEmail}`}>联系我们</a>
      </div>
      <span>© 2026 星火场 · VibeEmber</span>
      {showQr && (
        <div className="modal-backdrop" onClick={() => setShowQr(false)}>
          <div
            className="submit-modal community-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              type="button"
              aria-label="关闭"
              onClick={() => setShowQr(false)}
            >
              ×
            </button>
            <span className="section-kicker">进场</span>
            <h2>加入星火场</h2>
            <p>扫码进群，发布真实作品、互相助燃。二维码先占位，群建好再换成正式码。</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SITE.communityQr} alt="星火场社群二维码" width={180} height={180} />
            <div className="community-actions">
              <a className="primary-button" href={SITE.github} target="_blank" rel="noreferrer">
                <GithubIcon size={16} /> GitHub
              </a>
              <a className="text-button" href={`mailto:${SITE.contactEmail}`}>
                {SITE.contactEmail}
              </a>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
