import Link from "next/link";
import { AppChrome } from "@/components/app-chrome";
import { SITE } from "@vibeember/shared";

export default function CovenantPage() {
  return (
    <AppChrome>
      <main className="section-wrap covenant-page">
        <span className="section-kicker">星火场</span>
        <h1>社区公约</h1>
        <p className="covenant-lead">
          星火场是产品首发与冷启动互助社区。进场即表示你同意下面这些约定：真实体验，拒绝刷量。
        </p>

        <section>
          <h2>我们鼓励</h2>
          <ul>
            <li>发布自己真正参与制作的产品</li>
            <li>清楚说明产品现阶段的问题和需求</li>
            <li>给出可执行、有上下文的体验反馈</li>
            <li>尊重每一个还很粗糙的早期产品</li>
            <li>对产品、数据、合作关系和收益保持诚实</li>
          </ul>
        </section>

        <section>
          <h2>我们拒绝</h2>
          <ul>
            <li>恶意软件、诈骗、钓鱼和违法内容</li>
            <li>没有真实体验的批量点击与注册</li>
            <li>刷广告、刷好评、刷排名和其他虚假数据</li>
            <li>诱导或强迫参与者提供好评</li>
            <li>抄袭他人产品、素材、介绍或投稿</li>
            <li>泄露体验过程中接触到的隐私和测试数据</li>
          </ul>
        </section>

        <section>
          <h2>火苗怎么记</h2>
          <p>
            火苗只奖励真实体验。点赞、收藏、短评、只打开链接、复读产品介绍、互刷小号，都不给火苗。
            详细价目见首页
            <Link href="/#rules">火苗规则</Link>。
          </p>
        </section>

        <p className="form-hint">
          有问题可以写信到 <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
          ，或到{" "}
          <a href={SITE.github} target="_blank" rel="noreferrer">
            GitHub
          </a>{" "}
          提 Issue。 扫码入口在首页底部。
        </p>
      </main>
    </AppChrome>
  );
}
