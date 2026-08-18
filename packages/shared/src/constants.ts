/** 产品类型全集（与提交表单下拉一致） */
export const CATEGORIES = [
  "AI 工具",
  "微信小程序",
  "Web 应用",
  "移动 App",
  "教育",
  "生活方式",
  "浏览器插件",
  "其他",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** 表单/接口共用的长度限制（与 API 校验保持一致） */
export const PROJECT_LIMITS = {
  nameMin: 2,
  nameMax: 40,
  taglineMin: 6,
  taglineMax: 100,
  urlMax: 500,
  helpNeededMin: 2,
  helpNeededMax: 300,
  nicknameMin: 2,
  nicknameMax: 30,
  emailMax: 180,
} as const;

export const HELP_NEEDED_FALLBACK = "征集真实体验与反馈";

/** 可上传图片的类型与规则 */
export const UPLOAD_KINDS = ["avatar", "logo"] as const;
export type UploadKind = (typeof UPLOAD_KINDS)[number];

export const UPLOAD_CONTENT_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const UPLOAD_MAX_BYTES = 2 * 1024 * 1024;

export const CONTENT_TYPE_EXT: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};
