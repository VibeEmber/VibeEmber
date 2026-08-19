"use client";

import { LayoutGrid } from "lucide-react";
import { SPARK_RULES } from "@vibeember/shared";
import { AddKindlingIcon, FanFlameIcon, PrairieFireIcon } from "./ember-stage-icons";

export function HowItWorks() {
  return (
    <section className="how-section section-wrap" id="how">
      <span className="section-kicker">
        <LayoutGrid size={16} /> 就这么简单
      </span>
      <h2>
        别让你的下一个好产品，
        <br />
        死在没人知道。
      </h2>
      <div className="steps">
        <div>
          <span>01</span>
          <div className="step-icon">
            <AddKindlingIcon />
          </div>
          <h3>添柴</h3>
          <p>把做好的作品放进场里，用 3 分钟讲清你为谁点亮了什么。</p>
        </div>
        <div>
          <span>02</span>
          <div className="step-icon">
            <FanFlameIcon />
          </div>
          <h3>助燃</h3>
          <p>试用别人的产品，按三问给出证据，帮下一簇火苗烧起来。</p>
        </div>
        <div>
          <span>03</span>
          <div className="step-icon lime">
            <PrairieFireIcon />
          </div>
          <h3>燎原</h3>
          <p>用火苗换首批真实用户与反馈，剩下的靠产品自己往外烧。</p>
        </div>
      </div>

      <div className="spark-rules" id="rules">
        <span className="section-kicker">火苗规则</span>
        <h3>只有这些行为能拿火苗，不打分</h3>
        <table>
          <thead>
            <tr>
              <th>行为</th>
              <th>火苗</th>
              <th>谁付钱</th>
              <th>条件</th>
            </tr>
          </thead>
          <tbody>
            {SPARK_RULES.map((rule) => (
              <tr key={rule.action}>
                <td>{rule.action}</td>
                <td>{rule.sparks}</td>
                <td>{rule.payer}</td>
                <td>{rule.condition}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          点赞、收藏、短评、只打开链接、复读产品介绍、互刷小号，都不给火苗。求助必须有可体验版本、写清说明、选好反馈类型。
          提交要有使用截图；发起人 48 小时不验收会自动通过，管理员抽查已通过样本。
        </p>
      </div>
    </section>
  );
}
