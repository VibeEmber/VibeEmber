"use client";

import { ArrowRight, Check, Clock3, Flame, Target, Users } from "lucide-react";
import { helpTasks } from "@/data/fallback";

interface HelpSectionProps {
  joined: number[];
  setJoined: React.Dispatch<React.SetStateAction<number[]>>;
  onNotify: (message: string) => void;
}

export function HelpSection({ joined, setJoined, onNotify }: HelpSectionProps) {
  return (
    <section className="help-section" id="help">
      <div className="section-wrap">
        <div className="section-heading light">
          <div>
            <span className="section-kicker">
              <Users size={16} /> 助燃厅
            </span>
            <h2>今天助一把，明天火更旺</h2>
            <p>完成真实体验任务获得火苗，用火苗让自己的产品燎原。</p>
          </div>
          <div className="flame-balance">
            <span>
              <Flame size={18} fill="currentColor" /> 我的火苗
            </span>
            <strong>120</strong>
            <button onClick={() => onNotify("快去完成一个体验任务吧")}>+赚火苗</button>
          </div>
        </div>
        <div className="task-list">
          {helpTasks.map((task, index) => (
            <article className="task-card" key={task.name}>
              <div className="task-icon" style={{ background: task.color }}>
                {task.icon}
              </div>
              <div className="task-main">
                <div className="task-name">
                  <b>{task.name}</b>
                  <span>真实体验</span>
                </div>
                <h3>{task.title}</h3>
                <div className="progress-row">
                  <div className="progress-track">
                    <i style={{ width: `${task.progress}%` }} />
                  </div>
                  <span>
                    {task.current}/{task.total} 人
                  </span>
                </div>
              </div>
              <div className="task-time">
                <Clock3 size={15} />
                {task.time}
              </div>
              <div className="reward">
                <Flame size={15} fill="currentColor" /> +{task.reward}
              </div>
              <button
                className={joined.includes(index) ? "joined" : ""}
                onClick={() => {
                  setJoined((all) => (all.includes(index) ? all : [...all, index]));
                  onNotify(
                    joined.includes(index)
                      ? "你已经领取过这个任务"
                      : "任务已领取，去产品页完成体验吧",
                  );
                }}
              >
                {joined.includes(index) ? (
                  <>
                    <Check size={16} /> 已领取
                  </>
                ) : (
                  <>
                    去帮忙 <ArrowRight size={16} />
                  </>
                )}
              </button>
            </article>
          ))}
        </div>
        <div className="help-footer">
          <span>
            <Target size={17} /> 所有任务都要求真实体验与有效反馈，拒绝机器刷量。
          </span>
          <a href="#all-tasks">
            浏览全部 36 个任务 <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
