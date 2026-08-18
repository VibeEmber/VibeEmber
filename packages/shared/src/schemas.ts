import { z } from "zod";
import {
  CATEGORIES,
  HELP_NEEDED_FALLBACK,
  PROJECT_LIMITS,
  UPLOAD_CONTENT_TYPES,
  UPLOAD_KINDS,
} from "./constants.js";

const nameRange = `产品名称需要 ${PROJECT_LIMITS.nameMin}-${PROJECT_LIMITS.nameMax} 个字符`;
const taglineRange = `一句话介绍需要 ${PROJECT_LIMITS.taglineMin}-${PROJECT_LIMITS.taglineMax} 个字符`;
const helpRange = `所需帮助需要 ${PROJECT_LIMITS.helpNeededMin}-${PROJECT_LIMITS.helpNeededMax} 个字符`;
const nicknameRange = `昵称需要 ${PROJECT_LIMITS.nicknameMin}-${PROJECT_LIMITS.nicknameMax} 个字符`;

const httpUrl = z
  .string()
  .trim()
  .min(1, "请输入有效的 HTTP(S) 产品链接")
  .max(PROJECT_LIMITS.urlMax, "请输入有效的 HTTP(S) 产品链接")
  .refine((value) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }, "请输入有效的 HTTP(S) 产品链接");

const objectKey = (prefix: "avatars" | "logos") =>
  z.string().regex(new RegExp(`^${prefix}/[A-Za-z0-9._-]+\\.(png|jpe?g|webp)$`), "图片文件无效");

export const projectCreateSchema = z.object({
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
  url: httpUrl,
  category: z
    .string()
    .refine(
      (value): value is (typeof CATEGORIES)[number] =>
        (CATEGORIES as readonly string[]).includes(value),
      "请选择有效的产品类型",
    ),
  helpNeeded: z
    .string()
    .trim()
    .max(PROJECT_LIMITS.helpNeededMax, helpRange)
    .transform((value) =>
      value.length < PROJECT_LIMITS.helpNeededMin ? HELP_NEEDED_FALLBACK : value,
    ),
  logoKey: objectKey("logos").nullish(),
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
