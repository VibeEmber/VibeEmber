"use client";

import { Flame, LoaderCircle, Rocket } from "lucide-react";
import { useMemo, useState } from "react";
import {
  FEEDBACK_TYPES,
  PROJECT_LIMITS,
  SPARK,
  api,
  type FeedbackType,
  type ProjectPrivate,
  type SparkSummary,
} from "@vibeember/shared";
import { Modal } from "../modal";

interface TaskCreateModalProps {
  project: ProjectPrivate;
  sparks: SparkSummary | null;
  onClose: () => void;
  onNotify: (message: string) => void;
  onCreated: () => void;
}

export function TaskCreateModal({
  project,
  sparks,
  onClose,
  onNotify,
  onCreated,
}: TaskCreateModalProps) {
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState(project.helpNeeded.slice(0, PROJECT_LIMITS.taskTitleMax));
  const [description, setDescription] = useState(project.helpNeeded);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("first_run");
  const [checklist, setChecklist] = useState("走完主流程\n说明卡住或惊喜的一步\n附上关键页截图");
  const [reward, setReward] = useState<number>(SPARK.defaultReward);
  const [quota, setQuota] = useState<number>(5);
  const [days, setDays] = useState<number>(5);
  const [allowPublicSnippet, setAllowPublicSnippet] = useState(false);

  const selected = FEEDBACK_TYPES.find((item) => item.id === feedbackType);
  const freeze = reward * quota;
  const available = sparks?.available ?? 0;
  const items = useMemo(
    () =>
      checklist
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    [checklist],
  );

  const submit = async () => {
    setBusy(true);
    try {
      await api.createTask({
        projectId: project.id,
        title,
        description,
        feedbackType,
        checklist: items,
        allowPublicSnippet,
        reward,
        quota,
        deadline: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
      });
      onCreated();
      onNotify(`助燃已发布，已冻结 ${freeze} 火苗`);
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "发布失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal titleId="task-create-title" onClose={onClose}>
      <span className="modal-icon">
        <Rocket size={24} />
      </span>
      <span className="section-kicker">发起助燃</span>
      <h2 id="task-create-title">{project.name}</h2>
      <p className="form-hint">有火苗也不一定能发。先选清反馈类型，写清别人要做什么。</p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <label>
          任务标题
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            minLength={PROJECT_LIMITS.taskTitleMin}
            maxLength={PROJECT_LIMITS.taskTitleMax}
            placeholder="希望别人具体帮你做什么"
          />
        </label>
        <label>
          任务说明（至少 {PROJECT_LIMITS.taskDescMin} 字）
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
            minLength={PROJECT_LIMITS.taskDescMin}
            maxLength={PROJECT_LIMITS.taskDescMax}
            style={{ minHeight: 90 }}
          />
        </label>
        <div>
          <span className="form-hint">想要的反馈类型</span>
          <div className="category-row" style={{ margin: "8px 0 0" }}>
            {FEEDBACK_TYPES.map((item) => (
              <button
                type="button"
                key={item.id}
                className={feedbackType === item.id ? "selected" : ""}
                onClick={() => setFeedbackType(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <small className="form-hint">{selected?.hint}</small>
        </div>
        <label>
          验收清单（每行一条，2–4 条）
          <textarea
            value={checklist}
            onChange={(event) => setChecklist(event.target.value)}
            style={{ minHeight: 80 }}
          />
        </label>
        <div className="form-row">
          <label>
            单人赏金
            <input
              type="number"
              min={SPARK.minReward}
              max={SPARK.maxReward}
              value={reward}
              onChange={(event) => setReward(Number(event.target.value))}
            />
          </label>
          <label>
            名额
            <input
              type="number"
              min={SPARK.minQuota}
              max={SPARK.maxQuota}
              value={quota}
              onChange={(event) => setQuota(Number(event.target.value))}
            />
          </label>
          <label>
            持续天数
            <input
              type="number"
              min={1}
              max={14}
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
            />
          </label>
        </div>
        <label className="check-row">
          <input
            type="checkbox"
            checked={allowPublicSnippet}
            onChange={(event) => setAllowPublicSnippet(event.target.checked)}
          />
          允许公开展示一句有效反馈
        </label>
        <div className="help-guide">
          <b>
            <Flame size={14} /> 将冻结 {freeze} 火苗
          </b>
          <small>可用 {available}。验收通过后支付给帮忙者；任务过期未用完的会退回。</small>
        </div>
        <button
          className="primary-button"
          type="submit"
          disabled={busy || available < freeze || items.length < 2}
        >
          {busy ? (
            <>
              <LoaderCircle className="spin" size={17} /> 发布中
            </>
          ) : (
            "发布助燃任务"
          )}
        </button>
      </form>
    </Modal>
  );
}
