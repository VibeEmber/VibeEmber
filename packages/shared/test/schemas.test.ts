import { describe, expect, it } from "vitest";
import { claimSubmitSchema, projectCreateSchema, reviewSchema } from "../src/schemas";

const validProject = {
  name: "流光简历",
  tagline: "把普通经历，变成会讲故事的作品集",
  url: "https://example.com",
  kind: "web",
  topics: ["效率"],
  helpNeeded: "希望 20 位用户体验组队功能并留下反馈",
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

  it("falls back helpNeeded", () => {
    const result = projectCreateSchema.parse({ ...validProject, helpNeeded: "" });
    expect(result.helpNeeded).toBe("征集真实体验与反馈");
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
  it("rejects short feedback", () => {
    const result = claimSubmitSchema.safeParse({ feedback: "太短了" });
    expect(result.success).toBe(false);
  });
});
