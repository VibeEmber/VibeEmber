"use client";
/* eslint-disable @next/next/no-img-element */

import { Check, Flame, ImagePlus, LoaderCircle, X } from "../spark-icons";
import { useRef, useState } from "react";
import { PROJECT_LIMITS, UPLOAD_MAX_BYTES, api, uploadFile } from "@vibeember/shared";
import type { TaskClaimItem } from "@vibeember/shared";
import { Modal } from "../modal";

interface TaskClaimModalProps {
  claim: TaskClaimItem;
  onClose: () => void;
  onNotify: (message: string) => void;
  onChanged?: () => void;
}

const STEPS = ["领取任务", "提交反馈", "发起人验收"];

function stepIndex(status: string): number {
  if (status === "claimed") return 0;
  if (status === "submitted") return 1;
  return 2;
}

export function TaskClaimModal({ claim, onClose, onNotify, onChanged }: TaskClaimModalProps) {
  const [status, setStatus] = useState(claim.status);
  const [answers, setAnswers] = useState<string[]>(
    claim.answers.length === 3 ? claim.answers : ["", "", ""],
  );
  const [screenshot, setScreenshot] = useState<{ key: string; publicUrl: string } | null>(
    claim.screenshotUrl ? { key: "", publicUrl: claim.screenshotUrl } : null,
  );
  const [busy, setBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const active = stepIndex(status);
  const failed = status === "rejected";
  const done = status === "accepted";
  const questions =
    claim.questions.length === 3
      ? claim.questions
      : ["你做了哪几步？", "卡在哪，或哪里觉得惊喜？", "会不会再打开？为什么？"];
  const joined = answers.join("").trim();
  const ready =
    Boolean(screenshot?.key || screenshot?.publicUrl) &&
    answers.every((item) => item.trim().length >= PROJECT_LIMITS.answerMin) &&
    joined.length >= PROJECT_LIMITS.feedbackMin;

  const pickScreenshot = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > UPLOAD_MAX_BYTES) {
      onNotify("截图不能超过 2MB");
      return;
    }
    try {
      setScreenshot(await uploadFile("screenshot", file));
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "截图上传失败");
    }
  };

  const submit = async () => {
    setBusy(true);
    try {
      if (!screenshot?.key) {
        onNotify("请上传一张使用截图");
        return;
      }
      await api.submitClaim(claim.id, {
        answers,
        screenshotKey: screenshot.key,
      });
      setStatus("submitted");
      onNotify("反馈已提交，等待发起人验收");
      onChanged?.();
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "提交失败");
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    setBusy(true);
    try {
      await api.cancelClaim(claim.id);
      setStatus("cancelled");
      onNotify("已取消领取");
      onChanged?.();
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "取消失败");
    } finally {
      setBusy(false);
    }
  };

  const report = async () => {
    setBusy(true);
    try {
      await api.reportClaim(claim.id, reportReason);
      setReportOpen(false);
      onNotify("举报已提交，管理员会尽快处理");
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "举报失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal titleId="claim-title" onClose={onClose}>
      <span className="modal-icon">
        <Flame size={24} />
      </span>
      <span className="section-kicker">助燃任务</span>
      <h2 id="claim-title">{claim.taskTitle}</h2>
      <p className="form-hint">
        {claim.projectName} · 截止提交 {new Date(claim.submitBy).toLocaleString("zh-CN")}
      </p>

      <div className="claim-steps">
        {STEPS.map((label, index) => (
          <div
            key={label}
            className={[
              "claim-step",
              index < active || done ? "done" : "",
              index === active && !done && !failed ? "on" : "",
              failed && index === 2 ? "fail" : "",
            ].join(" ")}
          >
            <span>
              {index < active || done ? (
                <Check size={12} />
              ) : failed && index === 2 ? (
                <X size={12} />
              ) : (
                index + 1
              )}
            </span>
            {label}
          </div>
        ))}
      </div>

      {status === "claimed" && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!ready) return;
            void submit();
          }}
        >
          {questions.map((question, index) => (
            <label key={question}>
              {question}（至少 {PROJECT_LIMITS.answerMin} 字）
              <textarea
                value={answers[index]}
                onChange={(event) =>
                  setAnswers((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? event.target.value : item,
                    ),
                  )
                }
                minLength={PROJECT_LIMITS.answerMin}
                maxLength={PROJECT_LIMITS.answerMax}
                style={{ minHeight: 72 }}
              />
            </label>
          ))}
          <div className="upload-field">
            <span className="logo-chip">
              {screenshot ? <img src={screenshot.publicUrl} alt="截图" /> : <ImagePlus size={18} />}
            </span>
            <div>
              <button
                type="button"
                className="upload-button"
                onClick={() => fileRef.current?.click()}
              >
                {screenshot ? "更换截图" : "上传使用截图（必填）"}
              </button>
              <small>没有截图不能提交。机器先核验字数和查重，再交给发起人按清单验收。</small>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={(event) => void pickScreenshot(event.target.files?.[0])}
            />
          </div>
          <div className="form-row">
            <button
              type="button"
              className="otp-resend"
              onClick={() => void cancel()}
              disabled={busy}
            >
              取消领取
            </button>
            <button className="primary-button" type="submit" disabled={busy || !ready}>
              {busy ? (
                <>
                  <LoaderCircle className="spin" size={17} /> 提交中
                </>
              ) : (
                "提交反馈，等待验收"
              )}
            </button>
          </div>
        </form>
      )}

      {status === "submitted" && (
        <div className="panel-empty" style={{ borderStyle: "solid" }}>
          反馈已提交，等待发起人验收。验收通过后火苗自动到账。
        </div>
      )}

      {status === "accepted" && (
        <div className="panel-empty" style={{ borderStyle: "solid", color: "#286640" }}>
          <Check size={16} /> 验收通过，火苗已入账，去发起助燃让别人帮你。
        </div>
      )}

      {status === "cancelled" && (
        <div className="panel-empty" style={{ borderStyle: "solid" }}>
          已取消该领取。
        </div>
      )}

      {status === "rejected" && (
        <div>
          <div className="panel-empty" style={{ borderStyle: "solid", color: "#b74c31" }}>
            发起人未通过：{claim.reviewNote || "未说明原因"}
          </div>
          {!reportOpen ? (
            <button type="button" className="otp-resend" onClick={() => setReportOpen(true)}>
              认为判得不公？举报给管理员
            </button>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (reportReason.trim().length >= 8) void report();
              }}
            >
              <label>
                举报原因（至少 8 字）
                <textarea
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value)}
                  minLength={8}
                  maxLength={300}
                  style={{ minHeight: 80 }}
                />
              </label>
              <button
                className="primary-button"
                type="submit"
                disabled={busy || reportReason.trim().length < 8}
              >
                提交举报
              </button>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
}
