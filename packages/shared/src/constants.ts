export const PROJECT_KINDS = [
  { id: "web", label: "Web 应用" },
  { id: "mini_program", label: "小程序" },
  { id: "mobile_app", label: "移动 App" },
  { id: "desktop", label: "桌面应用" },
  { id: "social", label: "自媒体" },
] as const;

export type ProjectKind = (typeof PROJECT_KINDS)[number]["id"];

export const PROJECT_KIND_LABELS: Record<ProjectKind, string> = {
  web: "Web 应用",
  mini_program: "小程序",
  mobile_app: "移动 App",
  desktop: "桌面应用",
  social: "自媒体",
};

export const TOPICS = ["教育", "游戏", "效率", "娱乐", "AI", "生活方式", "工具", "其他"] as const;
export type Topic = (typeof TOPICS)[number];

/** @deprecated 仅用于兼容旧筛选文案 */
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

export const MINI_PROGRAM_PLATFORMS = ["微信", "支付宝"] as const;
export const SOCIAL_PLATFORMS = ["公众号", "小红书", "抖音", "微博"] as const;
export const DESKTOP_PLATFORMS = ["Windows", "macOS", "Linux"] as const;

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
  bioMax: 160,
  commentMin: 2,
  commentMax: 500,
  feedbackMin: 40,
  feedbackMax: 800,
  taskTitleMin: 4,
  taskTitleMax: 40,
  taskDescMin: 10,
  taskDescMax: 400,
} as const;

export const HELP_NEEDED_FALLBACK = "征集真实体验与反馈";

export const SPARK = {
  signupBonus: 20,
  defaultReward: 10,
  minReward: 5,
  maxReward: 50,
  minQuota: 1,
  maxQuota: 30,
  claimHours: 24,
} as const;

export const CREDIT = {
  default: 70,
  acceptDelta: 5,
  rejectDelta: -8,
  timeoutDelta: -2,
  reportUpheldOwnerDelta: -10,
  minClaim: 40,
  freezeBelow: 30,
  freezeDays: 7,
  maxOpenClaims: 2,
} as const;

export const UPLOAD_KINDS = ["avatar", "logo", "screenshot", "qr"] as const;
export type UploadKind = (typeof UPLOAD_KINDS)[number];

export const UPLOAD_CONTENT_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const UPLOAD_MAX_BYTES = 2 * 1024 * 1024;

export const CONTENT_TYPE_EXT: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

export const UPLOAD_PREFIX: Record<UploadKind, string> = {
  avatar: "avatars",
  logo: "logos",
  screenshot: "screenshots",
  qr: "qrs",
};
