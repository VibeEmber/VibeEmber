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
  helpNeededMin: 20,
  helpNeededMax: 300,
  nicknameMin: 2,
  nicknameMax: 30,
  emailMax: 180,
  bioMax: 160,
  commentMin: 2,
  commentMax: 500,
  feedbackMin: 40,
  feedbackMax: 800,
  answerMin: 10,
  answerMax: 400,
  taskTitleMin: 8,
  taskTitleMax: 40,
  taskDescMin: 40,
  taskDescMax: 400,
  screenshotMin: 1,
  screenshotMax: 4,
  checklistMin: 2,
  checklistMax: 4,
} as const;

export const HELP_NEEDED_FALLBACK = "征集真实体验与反馈";

export const FEEDBACK_TYPES = [
  {
    id: "first_run",
    label: "首次使用",
    hint: "走完一遍主流程，写下卡点和会不会再打开",
    questions: ["你实际做了哪几步？", "卡在哪，或哪里觉得惊喜？", "会不会再打开？为什么？"],
  },
  {
    id: "bug_hunt",
    label: "找问题",
    hint: "按步骤复现，对照期望和实际结果",
    questions: ["怎么复现？", "你期望发生什么？", "实际发生了什么？"],
  },
  {
    id: "onboarding",
    label: "新手引导",
    hint: "看第一屏能不能明白这是干什么的",
    questions: ["第一眼明白这是干什么的吗？", "哪一句没看懂？", "下一步你想做什么？"],
  },
  {
    id: "copy_review",
    label: "文案体验",
    hint: "指出一句有用的和一句空的",
    questions: ["哪句对你有用？", "哪句是空话？", "你会怎么改其中一句？"],
  },
  {
    id: "invite_user",
    label: "带来用户",
    hint: "邀请别人来体验，并提交对方使用证据",
    questions: ["你邀请了谁来体验？", "对方做了什么？", "他们最直接的反应是什么？"],
  },
] as const;

export type FeedbackType = (typeof FEEDBACK_TYPES)[number]["id"];

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  first_run: "首次使用",
  bug_hunt: "找问题",
  onboarding: "新手引导",
  copy_review: "文案体验",
  invite_user: "带来用户",
};

export const REJECT_REASONS = [
  { id: "no_evidence", label: "没有有效截图" },
  { id: "not_used", label: "看不出真实使用" },
  { id: "off_brief", label: "没回答指定反馈类型" },
  { id: "duplicate", label: "与自己历史反馈重复" },
  { id: "abuse", label: "广告 / 攻击 / 灌水" },
] as const;

export type RejectReason = (typeof REJECT_REASONS)[number]["id"];

export const REJECT_REASON_LABELS: Record<RejectReason, string> = {
  no_evidence: "没有有效截图",
  not_used: "看不出真实使用",
  off_brief: "没回答指定反馈类型",
  duplicate: "与自己历史反馈重复",
  abuse: "广告 / 攻击 / 灌水",
};

export const SPARK = {
  signupBonus: 20,
  defaultReward: 10,
  minReward: 5,
  maxReward: 50,
  minQuota: 1,
  maxQuota: 30,
  claimHours: 24,
  reviewHours: 48,
  spotCheckRate: 0.1,
  maxOpenTasksPerProject: 1,
} as const;

export const SPARK_RULES = [
  { action: "新用户注册", sparks: "+20", payer: "系统", condition: "每个账号一次" },
  {
    action: "完成真实体验报告",
    sparks: "+任务赏金（5–50）",
    payer: "发起人冻结款",
    condition: "清单验收通过，或 48 小时未验收自动通过",
  },
  {
    action: "有效反馈",
    sparks: "含在赏金里",
    payer: "发起人冻结款",
    condition: "结构化三问 + 使用截图通过核验",
  },
  {
    action: "成功带来用户",
    sparks: "+该任务赏金",
    payer: "发起人冻结款",
    condition: "任务类型为「带来用户」，提交邀请/到访证据且确认通过",
  },
  { action: "管理员纠错", sparks: "±N", payer: "系统", condition: "举报成立补发，或抽查追回" },
] as const;

export const SPARK_TYPE_LABELS: Record<string, string> = {
  signup_bonus: "注册赠送",
  task_freeze: "发起助燃冻结",
  task_unfreeze: "验收支付",
  task_reward: "完成助燃",
  task_refund: "任务退回",
  admin_adjust: "管理员调整",
};

export const CLAIM_STATUS_LABELS: Record<string, string> = {
  claimed: "待提交反馈",
  submitted: "等待验收",
  accepted: "已通过",
  rejected: "未通过",
  cancelled: "已取消",
};

export const SITE = {
  name: "星火场",
  github: "https://github.com/VibeEmber/VibeEmber",
  contactEmail: "hello@vibember.dev",
  communityQr: "/community-qr.svg",
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
