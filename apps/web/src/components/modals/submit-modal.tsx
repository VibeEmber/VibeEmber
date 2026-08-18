"use client";
/* eslint-disable @next/next/no-img-element */

import { ArrowRight, ImagePlus, LoaderCircle, Rocket } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { api, UPLOAD_MAX_BYTES, uploadFile } from "@vibeember/shared";
import { CATEGORIES } from "@vibeember/shared";
import { Modal } from "../modal";

interface SubmitModalProps {
  onClose: () => void;
  onNotify: (message: string) => void;
  onSubmitted: (message: string) => void;
}

export function SubmitModal({ onClose, onNotify, onSubmitted }: SubmitModalProps) {
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logo, setLogo] = useState<{ key: string; publicUrl: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pickLogo = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    if (file.size > UPLOAD_MAX_BYTES) {
      onNotify("图片不能超过 2MB");
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadFile("logo", file);
      setLogo(uploaded);
      onNotify("Logo 已上传");
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "Logo 上传失败");
    } finally {
      setUploading(false);
    }
  };

  const submitProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setBusy(true);
    try {
      await api.createProject({
        name: String(values.get("name") ?? ""),
        tagline: String(values.get("tagline") ?? ""),
        url: String(values.get("url") ?? ""),
        category: String(values.get("category") ?? ""),
        helpNeeded: String(values.get("helpNeeded") ?? ""),
        logoKey: logo?.key,
      });
      form.reset();
      setLogo(null);
      onSubmitted("提交成功，项目已进入真实审核队列 🚀");
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
      <span className="section-kicker">发布作品</span>
      <h2 id="submit-title">让你的产品被看见</h2>
      <p>不用写商业计划书，讲清它对谁有用就好。</p>
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
        <div className="upload-field">
          <span className="logo-chip">
            {logo ? <img src={logo.publicUrl} alt="Logo 预览" /> : <ImagePlus size={18} />}
          </span>
          <div>
            <button
              type="button"
              className="upload-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "上传中…" : logo ? "更换 Logo" : "上传产品 Logo"}
            </button>
            <small>可选，PNG / JPG / WebP 且不超过 2MB；不上传则展示产品名首字</small>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(event) => void pickLogo(event.target.files?.[0])}
          />
        </div>
        <div className="form-row">
          <label>
            产品链接
            <input name="url" type="url" required maxLength={500} placeholder="https://" />
          </label>
          <label>
            产品类型
            <select name="category" required defaultValue="">
              <option value="" disabled>
                请选择
              </option>
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          现在最需要的帮助
          <textarea
            name="helpNeeded"
            required
            minLength={2}
            maxLength={300}
            placeholder="例如：希望 20 位用户体验组队功能并留下反馈…"
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
