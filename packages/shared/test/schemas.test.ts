import { describe, expect, it } from "vitest";
import {
  claimSubmitSchema,
  projectCreateSchema,
  reviewSchema,
  taskCreateSchema,
} from "../src/schemas";

const validProject = {
  name: "流光简历",
  tagline: "把普通经历，变成会讲故事的作品集",
  url: "https://example.com",
  kind: "web",
  topics: ["效率"],
  helpNeeded: "希望 20 位用户体验组队功能并留下反馈",
  screenshotKeys: ["screenshots/demo.webp"],
};

describe("projectCreateSchema", () => {
  it("accepts a valid web project", () => {
    const result = projectCreateSchema.parse(validProject);
    expect(result.name).toBe("流光简历");
    expect(result.kind).toBe("web");
  });

  it("rejects a too-short tagline", () => {
    const result = projectCreateSchema.safeParse({ ...validProject, tagline: "太短" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid kind", () => {
    const result = projectCreateSchema.safeParse({ ...validProject, kind: "金融" });
    expect(result.success).toBe(false);
  });

  it("requires qr for mini program", () => {
    const result = projectCreateSchema.safeParse({
      ...validProject,
      kind: "mini_program",
      extras: { miniPlatform: "微信" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects short helpNeeded", () => {
    const result = projectCreateSchema.safeParse({ ...validProject, helpNeeded: "" });
    expect(result.success).toBe(false);
  });

  it("requires a product screenshot", () => {
    const result = projectCreateSchema.safeParse({ ...validProject, screenshotKeys: [] });
    expect(result.success).toBe(false);
  });
});

describe("reviewSchema", () => {
  it("accepts approve without reason", () => {
    expect(reviewSchema.parse({ action: "approved" }).action).toBe("approved");
  });

  it("rejects reject without reason", () => {
    const result = reviewSchema.safeParse({ action: "rejected", reason: "" });
    expect(result.success).toBe(false);
  });
});

describe("claimSubmitSchema", () => {
  it("rejects short answers", () => {
    const result = claimSubmitSchema.safeParse({
      answers: ["太短了", "还是短", "依旧短"],
      screenshotKey: "screenshots/demo.webp",
    });
    expect(result.success).toBe(false);
  });

  it("requires a screenshot", () => {
    const result = claimSubmitSchema.safeParse({
      answers: [
        "我打开首页走完了登录和创建房间",
        "组队确认页不知道下一步点哪里",
        "会再打开，因为真的能解决晚饭问题",
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe("taskCreateSchema", () => {
  it("requires feedback type and checklist", () => {
    const result = taskCreateSchema.safeParse({
      projectId: "10000000-0000-4000-8000-000000000001",
      title: "体验一下",
      description: "请认真体验",
      reward: 10,
      quota: 5,
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    });
    expect(result.success).toBe(false);
  });
});
