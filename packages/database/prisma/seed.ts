import { config } from "dotenv";

for (const candidate of [".env", "prisma/.env", "../../.env"]) {
  config({ path: candidate, quiet: true });
}

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BOOTSTRAP_ADMIN_EMAIL = (
  process.env.BOOTSTRAP_ADMIN_EMAIL ?? "admin@vibeember.dev"
).toLowerCase();
const day = 24 * 60 * 60 * 1000;
const now = Date.now();

const seedUsers = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    email: BOOTSTRAP_ADMIN_EMAIL,
    name: "星火场管理员",
    role: "admin",
  },
  {
    id: "00000000-0000-4000-8000-000000000011",
    email: "chuan@example.com",
    name: "阿川",
    role: "member",
  },
  {
    id: "00000000-0000-4000-8000-000000000012",
    email: "lin@example.com",
    name: "林同学",
    role: "member",
  },
  {
    id: "00000000-0000-4000-8000-000000000013",
    email: "jensen@example.com",
    name: "Jensen",
    role: "member",
  },
  {
    id: "00000000-0000-4000-8000-000000000014",
    email: "mumian@example.com",
    name: "木棉",
    role: "member",
  },
  {
    id: "00000000-0000-4000-8000-000000000015",
    email: "laomai@example.com",
    name: "老麦",
    role: "member",
  },
  {
    id: "00000000-0000-4000-8000-000000000016",
    email: "weila@example.com",
    name: "薇拉",
    role: "member",
  },
] as const;

const seedProjects = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    ownerId: "00000000-0000-4000-8000-000000000011",
    name: "流光简历",
    tagline: "把普通经历，变成会讲故事的作品集",
    url: "https://demo.vibeember.dev/liuguang-resume",
    kind: "web" as const,
    topics: ["AI", "效率"],
    helpNeeded: "征集 20 位求职者体验 AI 改写功能并反馈效果",
    approvedAt: new Date(now - 1 * day),
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    ownerId: "00000000-0000-4000-8000-000000000012",
    name: "饭搭子",
    tagline: "不再纠结吃什么，也找到一起吃的人",
    url: "https://demo.vibeember.dev/fandouzi",
    kind: "mini_program" as const,
    topics: ["生活方式"],
    helpNeeded: "征集 30 位上海用户体验组队吃饭功能",
    approvedAt: new Date(now - 2 * day),
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    ownerId: "00000000-0000-4000-8000-000000000013",
    name: "TabTab",
    tagline: "用 AI 把你的 100 个浏览器标签变成知识库",
    url: "https://demo.vibeember.dev/tabtab",
    kind: "desktop" as const,
    topics: ["效率", "AI"],
    helpNeeded: "安装插件，完成 10 分钟真实体验并留下建议",
    approvedAt: new Date(now - 3 * day),
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    ownerId: "00000000-0000-4000-8000-000000000014",
    name: "方言星球",
    tagline: "每天 3 分钟，学会一句家乡话",
    url: "https://demo.vibeember.dev/fangyan-planet",
    kind: "web" as const,
    topics: ["教育"],
    helpNeeded: "寻找 8 位广东话母语者校对入门内容",
    approvedAt: new Date(now - 4 * day),
  },
  {
    id: "10000000-0000-4000-8000-000000000005",
    ownerId: "00000000-0000-4000-8000-000000000015",
    name: "Billow",
    tagline: "自由职业者的极简记账与报价助手",
    url: "https://demo.vibeember.dev/billow",
    kind: "web" as const,
    topics: ["效率"],
    helpNeeded: "征集 15 位自由职业者试用报价模板功能",
    approvedAt: new Date(now - 5 * day),
  },
  {
    id: "10000000-0000-4000-8000-000000000006",
    ownerId: "00000000-0000-4000-8000-000000000016",
    name: "周末去哪",
    tagline: "给城市里不想做攻略的人一个答案",
    url: "https://demo.vibeember.dev/weekend-go",
    kind: "mobile_app" as const,
    topics: ["生活方式"],
    helpNeeded: "征集 20 位同城用户测试一键生成周末计划",
    approvedAt: new Date(now - 6 * day),
  },
];

async function main(): Promise<void> {
  for (const user of seedUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role },
      create: { ...user, emailVerified: true },
    });
    await prisma.sparkAccount.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, balance: 40, frozen: 0, lifetimeEarned: 40 },
    });
  }

  for (const project of seedProjects) {
    const createdAt = new Date(project.approvedAt.getTime() - 12 * 60 * 60 * 1000);
    await prisma.project.upsert({
      where: { id: project.id },
      update: { kind: project.kind, topics: [...project.topics] },
      create: {
        ...project,
        status: "approved",
        rejectionReason: "",
        qrKey: `qr/${project.id}.png`,
        createdAt,
        updatedAt: project.approvedAt,
      },
    });
  }

  await prisma.task.upsert({
    where: { id: "20000000-0000-4000-8000-000000000001" },
    update: {},
    create: {
      id: "20000000-0000-4000-8000-000000000001",
      projectId: "10000000-0000-4000-8000-000000000002",
      ownerId: "00000000-0000-4000-8000-000000000012",
      title: "体验组队吃饭并留下卡点",
      description: "打开饭搭子，完成一次组队流程，写下你卡住或惊喜的地方。",
      reward: 10,
      quota: 8,
      frozenAmount: 80,
      deadline: new Date(now + 5 * day),
    },
  });

  console.log("Seed 完成：用户、项目、样例任务已就绪。");
}

main()
  .catch((error) => {
    console.error("Seed 失败：", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
