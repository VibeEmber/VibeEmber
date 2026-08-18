"use client";

import { LayoutGrid } from "lucide-react";
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
          <p>试用别人的产品，给出有价值的反馈，帮下一簇火苗烧起来。</p>
        </div>
        <div>
          <span>03</span>
          <div className="step-icon lime">
            <PrairieFireIcon />
          </div>
          <h3>燎原</h3>
          <p>换取首批真实用户与反馈，剩下的靠产品自己往外烧。</p>
        </div>
      </div>
    </section>
  );
}
