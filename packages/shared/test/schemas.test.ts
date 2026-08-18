import { describe, expect, it } from "vitest";
import { projectCreateSchema, reviewSchema } from "../src/schemas";

const validProject = {
  name: "流光简历",
  tagline: "把普通经历，变成会讲故事的作品集",
  url: "https://example.com",
  category: "AI 工具",
  helpNeeded: "希望 20 位用户体验组队功能并留下反馈",
};

describe("projectCreateSchema", () => {
  it("accepts a valid project", () => {
    const result = projectCreateSchema.parse(validProject);
    expect(result.name).toBe("流光简历");
    expect(result.helpNeeded).toContain("反馈");
  });

  it("rejects a too-short tagline with the Chinese message", () => {
    const result = projectCreateSchema.safeParse({ ...validProject, tagline: "太短" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("一句话介绍");
    }
  });

  it("rejects categories outside the allowlist", () => {
    const result = projectCreateSchema.safeParse({ ...validProject, category: "金融" });
    expect(result.success).toBe(false);
  });

  it("rejects non-http(s) urls", () => {
    const result = projectCreateSchema.safeParse({ ...validProject, url: "ftp://example.com" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("HTTP(S)");
    }
  });

  it("falls back helpNeeded to the default copy when too short", () => {
    const result = projectCreateSchema.parse({ ...validProject, helpNeeded: "" });
    expect(result.helpNeeded).toBe("征集真实体验与反馈");
  });

  it("accepts an optional logo key under logos/ prefix", () => {
    const result = projectCreateSchema.safeParse({
      ...validProject,
      logoKey: "logos/abc123-deadbeef.png",
    });
    expect(result.success).toBe(true);
  });

  it("rejects logo keys outside logos/ prefix", () => {
    const result = projectCreateSchema.safeParse({
      ...validProject,
      logoKey: "avatars/abc123.png",
    });
    expect(result.success).toBe(false);
  });
});

describe("reviewSchema", () => {
  it("accepts approve without reason", () => {
    expect(reviewSchema.parse({ action: "approved" }).action).toBe("approved");
  });

  it("rejects reject without a meaningful reason", () => {
    const result = reviewSchema.safeParse({ action: "rejected", reason: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("驳回时请说明原因");
    }
  });

  it("accepts reject with a reason", () => {
    const result = reviewSchema.parse({ action: "rejected", reason: "介绍不够清晰" });
    expect(result.reason).toBe("介绍不够清晰");
  });
});
