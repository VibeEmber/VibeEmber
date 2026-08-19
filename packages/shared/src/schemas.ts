import { z } from "zod";
import {
  CREDIT,
  DESKTOP_PLATFORMS,
  HELP_NEEDED_FALLBACK,
  MINI_PROGRAM_PLATFORMS,
  PROJECT_KINDS,
  PROJECT_LIMITS,
  SOCIAL_PLATFORMS,
  SPARK,
  TOPICS,
  UPLOAD_CONTENT_TYPES,
  UPLOAD_KINDS,
} from "./constants.js";

const nameRange = `产品名称需要 ${PROJECT_LIMITS.nameMin}-${PROJECT_LIMITS.nameMax} 个字符`;
const taglineRange = `一句话介绍需要 ${PROJECT_LIMITS.taglineMin}-${PROJECT_LIMITS.taglineMax} 个字符`;
const helpRange = `所需帮助需要 ${PROJECT_LIMITS.helpNeededMin}-${PROJECT_LIMITS.helpNeededMax} 个字符`;
const nicknameRange = `昵称需要 ${PROJECT_LIMITS.nicknameMin}-${PROJECT_LIMITS.nicknameMax} 个字符`;

export const httpUrl = z
  .string()
  .trim()
  .min(1, "请输入有效的 HTTP(S) 链接")
  .max(PROJECT_LIMITS.urlMax, "请输入有效的 HTTP(S) 链接")
  .refine((value) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }, "请输入有效的 HTTP(S) 链接");

const objectKey = (prefix: string) =>
  z.string().regex(new RegExp(`^${prefix}/[A-Za-z0-9._-]+\\.(png|jpe?g|webp)$`), "图片文件无效");

const kindIds = PROJECT_KINDS.map((item) => item.id) as [string, ...string[]];

export const projectCreateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(PROJECT_LIMITS.nameMin, nameRange)
      .max(PROJECT_LIMITS.nameMax, nameRange),
    tagline: z
      .string()
      .trim()
      .min(PROJECT_LIMITS.taglineMin, taglineRange)
      .max(PROJECT_LIMITS.taglineMax, taglineRange),
    kind: z.enum(kindIds, { message: "请选择产品形态" }),
    topics: z.array(z.enum(TOPICS)).min(1, "请至少选一个话题").max(3, "话题最多选 3 个"),
    url: z.string().trim().max(PROJECT_LIMITS.urlMax).optional().default(""),
    extras: z
      .object({
        miniPlatform: z.enum(MINI_PROGRAM_PLATFORMS).optional(),
        iosUrl: z.string().trim().max(PROJECT_LIMITS.urlMax).optional(),
        androidUrl: z.string().trim().max(PROJECT_LIMITS.urlMax).optional(),
        packageName: z.string().trim().max(80).optional(),
        downloadUrl: z.string().trim().max(PROJECT_LIMITS.urlMax).optional(),
        desktopPlatforms: z.array(z.enum(DESKTOP_PLATFORMS)).optional(),
        socialPlatform: z.enum(SOCIAL_PLATFORMS).optional(),
        accountId: z.string().trim().max(80).optional(),
      })
      .optional()
      .default({}),
    helpNeeded: z
      .string()
      .trim()
      .max(PROJECT_LIMITS.helpNeededMax, helpRange)
      .transform((value) =>
        value.length < PROJECT_LIMITS.helpNeededMin ? HELP_NEEDED_FALLBACK : value,
      ),
    logoKey: objectKey("logos").nullish(),
    screenshotKeys: z.array(objectKey("screenshots")).max(4).optional().default([]),
    extraQrKey: objectKey("qrs").nullish(),
  })
  .superRefine((value, ctx) => {
    const extras = value.extras ?? {};
    if (value.kind === "web") {
      if (!httpUrl.safeParse(value.url).success) {
        ctx.addIssue({ code: "custom", path: ["url"], message: "Web 应用需要有效的产品链接" });
      }
    }
    if (value.kind === "mini_program") {
      if (!extras.miniPlatform) {
        ctx.addIssue({
          code: "custom",
          path: ["extras", "miniPlatform"],
          message: "请选择小程序平台",
        });
      }
      if (!value.extraQrKey) {
        ctx.addIssue({
          code: "custom",
          path: ["extraQrKey"],
          message: "小程序需要上传体验码 / 账号码",
        });
      }
    }
    if (value.kind === "mobile_app") {
      const iosOk = extras.iosUrl ? httpUrl.safeParse(extras.iosUrl).success : false;
      const androidOk = extras.androidUrl ? httpUrl.safeParse(extras.androidUrl).success : false;
      if (!iosOk && !androidOk) {
        ctx.addIssue({
          code: "custom",
          path: ["extras", "iosUrl"],
          message: "移动 App 至少需要一个商店链接",
        });
      }
    }
    if (value.kind === "desktop") {
      if (!extras.downloadUrl || !httpUrl.safeParse(extras.downloadUrl).success) {
        ctx.addIssue({
          code: "custom",
          path: ["extras", "downloadUrl"],
          message: "桌面应用需要有效的下载链接",
        });
      }
    }
    if (value.kind === "social") {
      if (!extras.socialPlatform) {
        ctx.addIssue({
          code: "custom",
          path: ["extras", "socialPlatform"],
          message: "请选择自媒体平台",
        });
      }
      if (!value.extraQrKey) {
        ctx.addIssue({ code: "custom", path: ["extraQrKey"], message: "自媒体需要上传账号码" });
      }
    }
  });
export type ProjectCreateInput = z.input<typeof projectCreateSchema>;
export type ProjectCreateData = z.output<typeof projectCreateSchema>;

export const reviewSchema = z
  .object({
    action: z.enum(["approved", "rejected"], { message: "审核操作无效" }),
    reason: z.string().trim().max(300).optional().default(""),
  })
  .refine((value) => value.action !== "rejected" || value.reason.length >= 2, {
    message: "驳回时请说明原因",
    path: ["reason"],
  });
export type ReviewInput = z.input<typeof reviewSchema>;

export const meUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(PROJECT_LIMITS.nicknameMin, nicknameRange)
    .max(PROJECT_LIMITS.nicknameMax, nicknameRange)
    .optional(),
  bio: z.string().trim().max(PROJECT_LIMITS.bioMax, "简介最多 160 字").optional(),
  avatarKey: objectKey("avatars").optional(),
});
export type MeUpdateInput = z.input<typeof meUpdateSchema>;

export const presignSchema = z.object({
  kind: z.enum(UPLOAD_KINDS),
  contentType: z
    .string()
    .refine(
      (value): value is (typeof UPLOAD_CONTENT_TYPES)[number] =>
        (UPLOAD_CONTENT_TYPES as readonly string[]).includes(value),
      "仅支持 PNG / JPEG / WebP 图片",
    ),
});
export type PresignInput = z.input<typeof presignSchema>;

export const adminListQuerySchema = z.enum(["pending", "approved", "rejected"]).default("pending");

export const taskCreateSchema = z.object({
  projectId: z.string().uuid("请选择有效项目"),
  title: z
    .string()
    .trim()
    .min(PROJECT_LIMITS.taskTitleMin, "任务标题太短")
    .max(PROJECT_LIMITS.taskTitleMax, "任务标题太长"),
  description: z
    .string()
    .trim()
    .min(PROJECT_LIMITS.taskDescMin, "请把任务说明写清楚")
    .max(PROJECT_LIMITS.taskDescMax, "任务说明太长"),
  reward: z.coerce
    .number()
    .int()
    .min(SPARK.minReward, `赏金至少 ${SPARK.minReward}`)
    .max(SPARK.maxReward, `赏金最多 ${SPARK.maxReward}`)
    .default(SPARK.defaultReward),
  quota: z.coerce.number().int().min(SPARK.minQuota).max(SPARK.maxQuota).default(5),
  deadline: z.string().datetime({ message: "请填写有效截止时间" }),
});
export type TaskCreateInput = z.input<typeof taskCreateSchema>;

export const claimSubmitSchema = z.object({
  feedback: z
    .string()
    .trim()
    .min(PROJECT_LIMITS.feedbackMin, `反馈至少 ${PROJECT_LIMITS.feedbackMin} 字`)
    .max(PROJECT_LIMITS.feedbackMax, "反馈太长"),
  screenshotKey: objectKey("screenshots").nullish(),
});
export type ClaimSubmitInput = z.input<typeof claimSubmitSchema>;

export const claimReviewSchema = z
  .object({
    action: z.enum(["accepted", "rejected"]),
    note: z.string().trim().max(300).optional().default(""),
  })
  .refine((value) => value.action !== "rejected" || value.note.length >= 2, {
    message: "驳回时请说明原因",
    path: ["note"],
  });
export type ClaimReviewInput = z.input<typeof claimReviewSchema>;

export const reportSchema = z.object({
  reason: z.string().trim().min(8, "请把举报原因写清楚").max(300),
});

export const commentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(PROJECT_LIMITS.commentMin, "评论太短")
    .max(PROJECT_LIMITS.commentMax, "评论太长"),
});

export const sparkAdjustSchema = z.object({
  userId: z.string().min(1),
  amount: z.coerce
    .number()
    .int()
    .refine((value) => value !== 0, "调整数量不能为 0"),
  memo: z.string().trim().min(2).max(120),
});

export const reportResolveSchema = z.object({
  action: z.enum(["upheld", "dismissed"]),
  resolution: z.string().trim().min(2).max(300),
});

export const creditBand = (score: number) => {
  if (score >= 85) return "稳";
  if (score >= CREDIT.minClaim) return "常";
  if (score >= CREDIT.freezeBelow) return "察";
  return "冻";
};
