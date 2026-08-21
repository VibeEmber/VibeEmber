"use client";

import { ArrowRight, Check, Clock3, Flame, Target, Users } from "./spark-icons";
import { useEffect, useState } from "react";
import {
  api,
  type CommunityWeek,
  type SparkSummary,
  type TaskClaimItem,
  type TaskPublic,
} from "@vibeember/shared";

interface HelpSectionProps {
  loggedIn: boolean;
  week: CommunityWeek | null;
  onNotify: (message: string) => void;
  onNeedAuth: () => void;
  onOpenClaim: (claim: TaskClaimItem) => void;
  onOpenLedger: () => void;
}

export function HelpSection({
  loggedIn,
  week,
  onNotify,
  onNeedAuth,
  onOpenClaim,
  onOpenLedger,
}: HelpSectionProps) {
  const [tasks, setTasks] = useState<TaskPublic[]>([]);
  const [sparks, setSparks] = useState<SparkSummary | null>(null);
  const [myClaims, setMyClaims] = useState<TaskClaimItem[]>([]);

  const reload = async () => {
    try {
      setTasks(await api.listTasks());
      if (loggedIn) {
        setSparks(await api.sparks());
        setMyClaims(await api.myClaims());
      } else {
        setSparks(null);
        setMyClaims([]);
      }
    } catch {
      /* keep previous */
    }
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const tasks = await api.listTasks();
        if (cancelled) return;
        setTasks(tasks);
        if (loggedIn) {
          setSparks(await api.sparks());
          setMyClaims(await api.myClaims());
        } else {
          setSparks(null);
          setMyClaims([]);
        }
      } catch {
        /* keep previous */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  const claim = async (task: TaskPublic) => {
    if (!loggedIn) {
      onNeedAuth();
      return;
    }
    try {
      const res = await api.claimTask(task.id);
      onNotify("助燃已领取，24 小时内提交反馈");
      await reload();
      onOpenClaim({
        id: res.id,
        taskId: task.id,
        taskTitle: task.title,
        projectName: task.projectName,
        userId: "",
        userName: "我",
        userAvatarUrl: null,
        status: "claimed",
        feedback: "",
        answers: ["", "", ""],
        questions: task.questions,
        checklist: task.checklist,
        feedbackType: task.feedbackType,
        screenshotUrl: null,
        reviewNote: "",
        autoAccepted: false,
        claimedAt: new Date().toISOString(),
        submitBy: res.submitBy,
        submittedAt: null,
      });
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "领取失败");
    }
  };

  const activeClaims = myClaims.filter(
    (item) => item.status === "claimed" || item.status === "submitted",
  );

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
            <strong>{sparks ? sparks.available : "--"}</strong>
            <button onClick={onOpenLedger}>
              {sparks ? `账本 · 冻 ${sparks.frozen}` : "+赚火苗"}
            </button>
          </div>
        </div>

        {loggedIn && activeClaims.length > 0 && (
          <div className="my-claims-strip">
            <b>我的进行中任务</b>
            {activeClaims.map((item) => (
              <button key={item.id} onClick={() => onOpenClaim(item)}>
                {item.status === "claimed" ? "待提交反馈" : "等待验收"} · {item.taskTitle}
                <ArrowRight size={13} />
              </button>
            ))}
          </div>
        )}

        <div className="task-list">
          {tasks.map((task) => (
            <article className="task-card" key={task.id}>
              <div className="task-icon" style={{ background: "#fff0bb" }}>
                燃
              </div>
              <div className="task-main">
                <div className="task-name">
                  <b>{task.projectName}</b>
                  <span>{task.feedbackTypeLabel}</span>
                  <span>{task.reward} 火苗</span>
                </div>
                <h3>{task.title}</h3>
                <p className="task-desc">{task.description}</p>
                <div className="progress-row">
                  <div className="progress-track">
                    <i
                      style={{ width: `${(task.claimedCount / Math.max(task.quota, 1)) * 100}%` }}
                    />
                  </div>
                  <span>
                    {task.claimedCount}/{task.quota} 人
                  </span>
                </div>
              </div>
              <div className="task-time">
                <Clock3 size={15} />
                {new Date(task.deadline).toLocaleDateString("zh-CN")} 截止
              </div>
              <div className="reward">
                <Flame size={15} fill="currentColor" /> +{task.reward}
              </div>
              <button disabled={task.status !== "open"} onClick={() => void claim(task)}>
                {task.status === "open" ? (
                  <>
                    去助燃 <ArrowRight size={16} />
                  </>
                ) : (
                  <>
                    <Check size={16} /> 已满员
                  </>
                )}
              </button>
            </article>
          ))}
          {tasks.length === 0 && (
            <div className="panel-empty" style={{ color: "#c9cbc5" }}>
              暂时没有开放中的助燃任务。
            </div>
          )}
        </div>
        <div className="help-footer">
          <span>
            <Target size={17} />
            {week
              ? `本周已产生 ${week.acceptedCount} 条有效反馈，${week.helpedProjectCount} 个产品被真实用过。`
              : "按三问提交真实反馈并附截图，发起人按清单验收后才记火苗。"}
          </span>
        </div>
      </div>
    </section>
  );
}
