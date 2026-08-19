"use client";
/* eslint-disable @next/next/no-img-element */

import { ArrowRight, ImagePlus, LoaderCircle, Rocket } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import {
  MINI_PROGRAM_PLATFORMS,
  PROJECT_KINDS,
  SOCIAL_PLATFORMS,
  TOPICS,
  UPLOAD_MAX_BYTES,
  api,
  uploadFile,
  type ProjectKind,
} from "@vibeember/shared";
import { Modal } from "../modal";

interface SubmitModalProps {
  onClose: () => void;
  onNotify: (message: string) => void;
  onSubmitted: (message: string) => void;
}

export function SubmitModal({ onClose, onNotify, onSubmitted }: SubmitModalProps) {
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState<ProjectKind>("web");
  const [topics, setTopics] = useState<Array<(typeof TOPICS)[number]>>(["效率"]);
  const [logo, setLogo] = useState<{ key: string; publicUrl: string } | null>(null);
  const [qr, setQr] = useState<{ key: string; publicUrl: string } | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLInputElement>(null);

  const pick = async (kindName: "logo" | "qr", file?: File) => {
    if (!file) return;
    if (file.size > UPLOAD_MAX_BYTES) return onNotify("图片不能超过 2MB");
    try {
      const uploaded = await uploadFile(kindName, file);
      if (kindName === "logo") setLogo(uploaded);
      else setQr(uploaded);
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "上传失败");
    }
  };

  const toggleTopic = (topic: (typeof TOPICS)[number]) => {
    setTopics((current) =>
      current.includes(topic)
        ? current.filter((item) => item !== topic)
        : current.length >= 3
          ? current
          : [...current, topic],
    );
  };

  const submitProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await api.createProject({
        name: String(values.get("name") ?? ""),
        tagline: String(values.get("tagline") ?? ""),
        kind,
        topics,
        url: String(values.get("url") ?? ""),
        extras: {
          miniPlatform: (String(values.get("miniPlatform") || "") || undefined) as
            (typeof MINI_PROGRAM_PLATFORMS)[number] | undefined,
          iosUrl: String(values.get("iosUrl") || "") || undefined,
          androidUrl: String(values.get("androidUrl") || "") || undefined,
          downloadUrl: String(values.get("downloadUrl") || "") || undefined,
          socialPlatform: (String(values.get("socialPlatform") || "") || undefined) as
            (typeof SOCIAL_PLATFORMS)[number] | undefined,
          accountId: String(values.get("accountId") || "") || undefined,
        },
        helpNeeded: String(values.get("helpNeeded") ?? ""),
        logoKey: logo?.key,
        extraQrKey: qr?.key,
      });
      onSubmitted("提交成功，项目已进入审核队列");
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "提交失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal titleId="submit-title" onClose={onClose}>
      <span className="modal-icon">
        <Rocket size={24} />
      </span>
      <span className="section-kicker">添柴</span>
      <h2 id="submit-title">让你的产品被看见</h2>
      <div className="help-guide">
        <b>发布之后怎么获得帮助？</b>
        <ol>
          <li>提交后进入审核，通过即在首页公开展示</li>
          <li>
            在「个人中心 · 我的投稿」对<b>已上线项目</b>发起助燃任务
          </li>
          <li>发起时按「赏金 × 名额」冻结火苗，验收通过后支付给帮忙者</li>
        </ol>
        <small>
          门槛：需要一个已通过审核的项目；注册赠送 20 火苗，不够可先去
          <a href="#help" onClick={onClose}>
            助燃厅
          </a>
          帮别人赚火苗。
        </small>
      </div>
      <form onSubmit={submitProject}>
        <label>
          产品名称
          <input name="name" required minLength={2} maxLength={40} placeholder="例如：饭搭子" />
        </label>
        <label>
          一句话介绍
          <input
            name="tagline"
            required
            minLength={6}
            maxLength={100}
            placeholder="你帮用户解决了什么问题？"
          />
        </label>
        <label>
          产品形态
          <select value={kind} onChange={(event) => setKind(event.target.value as ProjectKind)}>
            {PROJECT_KINDS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <div>
          <span className="form-hint">话题（最多 3 个）</span>
          <div className="category-row" style={{ margin: "8px 0 0" }}>
            {TOPICS.map((topic) => (
              <button
                type="button"
                key={topic}
                className={topics.includes(topic) ? "selected" : ""}
                onClick={() => toggleTopic(topic)}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
        {(kind === "web" || kind === "desktop") && (
          <label>
            {kind === "web" ? "产品链接" : "下载链接"}
            <input
              name={kind === "web" ? "url" : "downloadUrl"}
              type="url"
              required
              maxLength={500}
              placeholder="https://"
            />
          </label>
        )}
        {kind === "mini_program" && (
          <>
            <label>
              小程序平台
              <select name="miniPlatform" required defaultValue="微信">
                {MINI_PROGRAM_PLATFORMS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </>
        )}
        {kind === "mobile_app" && (
          <div className="form-row">
            <label>
              iOS 链接
              <input name="iosUrl" type="url" placeholder="https://" />
            </label>
            <label>
              Android 链接
              <input name="androidUrl" type="url" placeholder="https://" />
            </label>
          </div>
        )}
        {kind === "social" && (
          <>
            <label>
              平台
              <select name="socialPlatform" required defaultValue="公众号">
                {SOCIAL_PLATFORMS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              账号 / 主页
              <input name="accountId" placeholder="账号 ID 或主页链接" />
            </label>
          </>
        )}
        <div className="upload-field">
          <span className="logo-chip">
            {logo ? <img src={logo.publicUrl} alt="Logo" /> : <ImagePlus size={18} />}
          </span>
          <div>
            <button
              type="button"
              className="upload-button"
              onClick={() => logoRef.current?.click()}
            >
              {logo ? "更换 Logo" : "上传 Logo"}
            </button>
            <small>可选，PNG / JPG / WebP，≤2MB</small>
          </div>
          <input
            ref={logoRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(e) => void pick("logo", e.target.files?.[0])}
          />
        </div>
        {(kind === "mini_program" || kind === "social") && (
          <div className="upload-field">
            <span className="logo-chip">
              {qr ? <img src={qr.publicUrl} alt="二维码" /> : <ImagePlus size={18} />}
            </span>
            <div>
              <button
                type="button"
                className="upload-button"
                onClick={() => qrRef.current?.click()}
              >
                {qr ? "更换二维码" : "上传二维码"}
              </button>
              <small>小程序 / 自媒体必传账号码或体验码</small>
            </div>
            <input
              ref={qrRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={(e) => void pick("qr", e.target.files?.[0])}
            />
          </div>
        )}
        <label>
          现在最需要的帮助
          <textarea
            name="helpNeeded"
            required
            minLength={2}
            maxLength={300}
            placeholder="例如：希望 20 位用户体验组队功能…"
          />
        </label>
        <button className="primary-button" type="submit" disabled={busy}>
          {busy ? (
            <>
              <LoaderCircle className="spin" size={17} /> 正在提交
            </>
          ) : (
            <>
              提交审核 <ArrowRight size={17} />
            </>
          )}
        </button>
      </form>
    </Modal>
  );
}
