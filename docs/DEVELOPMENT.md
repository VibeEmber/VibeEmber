# VibeEmber 开发文档

> 返回 [社区介绍](../README.md) · [English README](../README.en.md)

面向 Vibe Coder、独立开发者和小型创业团队的产品首发互助社区（星火场 · VibeEmber）。

## 技术架构

```text
浏览器
  │
  ├─ 开发：Next.js :3000  ──rewrite /api/*──►  NestJS :4000
  │
  └─ 生产：Caddy :80/:443
           ├─ /api/*      → api:4000
           ├─ /storage/*  → minio:9000/{bucket}
           └─ /*          → web:3000
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   PostgreSQL    MinIO/S3    SMTP
     :5432        :9000     开发=Mailpit :1025
                              生产=真实 SMTP
        ▲
        └── pg-boss 队列（worker 消费 qr.generate / image.process）
```

标准端口（dev / prod 内部一致）：

| 服务                  | 端口        | 说明                  |
| --------------------- | ----------- | --------------------- |
| web（Next.js 16.3.1） | 3000        | App Router，Turbopack |
| api（NestJS 11）      | 4000        | 全局前缀 `/api`       |
| worker                | 无          | pg-boss 消费者        |
| PostgreSQL 17         | 5432        | Prisma ORM            |
| MinIO                 | 9000 / 9001 | S3 API / 控制台       |
| Mailpit（仅 dev）     | 1025 / 8025 | SMTP / 网页收件箱     |
| Caddy（仅 prod）      | 80 / 443    | 自动 TLS              |

## 仓库结构

```text
apps/web          Next.js 16 前端
apps/api          NestJS 11 + Better-Auth + 业务接口
apps/worker       pg-boss 队列（二维码 / 图片压缩）
packages/shared   类型、常量、zod schema、API 客户端
packages/database Prisma schema / 迁移 / seed
packages/storage  S3 客户端（预签名、上传、公开 URL）
deploy/           Dockerfile 与 Caddyfile
docker-compose.yml            开发基础设施
docker-compose.prod.yml       生产全栈
```

## 本地开发

前置：Node 24 LTS、pnpm 9.15、Docker。

```bash
pnpm install
cp .env.example .env          # 可选；代码内置了开发默认值
docker compose up -d          # postgres / minio / mailpit
pnpm db:migrate               # 首次会提示输入迁移名；已有迁移时直接 apply
pnpm db:seed
pnpm dev                      # 并行启动 web / api / worker / 包 watch
```

单独启动：

```bash
pnpm --filter @vibeember/api start
pnpm --filter @vibeember/worker start
pnpm --filter @vibeember/web dev
```

验证码邮件：打开 [http://localhost:8025](http://localhost:8025)。
MinIO 控制台：[http://localhost:9001](http://localhost:9001)（账号 `vibe` / `vibeember-secret`）。

冒烟测试（api + worker + 基础设施已启动）：

```bash
pnpm smoke
```

覆盖健康检查、公开项目、未登录拦截、邮箱 OTP（经 Mailpit 取码）、头像预签名直传、投稿审核、worker 生成二维码。

## 认证

- Better-Auth：GitHub OAuth + 邮箱 OTP，**无密码登录**
- Session / Cookie / CSRF 由 Better-Auth 管理
- `BOOTSTRAP_ADMIN_EMAIL`（默认 `admin@vibeember.dev`）首次登录自动成为管理员
- GitHub OAuth App 回调地址：`{BETTER_AUTH_URL}/api/auth/callback/github`
  - 开发：`http://localhost:4000/api/auth/callback/github`
  - 生产：`https://{CADDY_DOMAIN}/api/auth/callback/github`

## 图片存储

头像、产品 Logo、产品二维码走 S3 兼容存储（开发默认 MinIO）。

| 对象   | 键位                          | 说明                                      |
| ------ | ----------------------------- | ----------------------------------------- |
| 头像   | `avatars/{userId}-{rand}.ext` | 浏览器预签名直传，worker 压成 256px WebP  |
| Logo   | `logos/{userId}-{rand}.ext`   | 提交时绑定，worker 压成 512px WebP        |
| 二维码 | `qr/{projectId}.png`          | 提交后入队 `qr.generate`，worker 写入 PNG |

开发公开 URL：`http://localhost:9000/vibeember/{key}`  
生产公开 URL：`https://{CADDY_DOMAIN}/storage/{key}`（Caddy 反代 MinIO，不暴露 9000）

## 环境变量

见仓库根目录 `.env.example`。开发可以不建 `.env`（代码与 `packages/database/prisma/.env` 提供默认值）；生产必须复制并替换全部敏感值。

关键项：

- `DATABASE_URL` / `BETTER_AUTH_SECRET`（≥32 位随机） / `BETTER_AUTH_URL` / `WEB_URL`
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM`  
  开发默认 `localhost:1025`（Mailpit）；生产改为真实 SMTP
- `S3_ENDPOINT` / `S3_ACCESS_KEY` / `S3_SECRET_KEY` / `S3_BUCKET` / `S3_PUBLIC_URL`
- 生产专用：`CADDY_DOMAIN` / `POSTGRES_PASSWORD`

## 生产部署

全容器化，Caddy 接管 80/443 并自动申请证书（域名 DNS 需先解析到服务器）。

```bash
cp .env.example .env
# 编辑 .env：CADDY_DOMAIN、BETTER_AUTH_SECRET、GITHUB_*、SMTP_*、POSTGRES_PASSWORD
# 生产 BETTER_AUTH_URL / WEB_URL 在 compose 中会按 CADDY_DOMAIN 覆盖为 https://{domain}

docker compose -f docker-compose.prod.yml up -d --build
```

`migrate` 服务会在 api / worker 启动前执行 `prisma migrate deploy`。

如需改用外部 S3，去掉 compose 中的 minio / minio-init，并把 `S3_ENDPOINT` / `S3_PUBLIC_URL` 指到外部服务。

## 常用脚本

```bash
pnpm dev            # 全仓并行开发
pnpm build          # 全仓构建
pnpm lint           # ESLint
pnpm lint:fix       # ESLint 自动修复
pnpm format         # Prettier 统一格式化
pnpm format:check   # Prettier 检查（不写回）
pnpm test           # 目前为 packages/shared 的 zod 单测
pnpm typecheck      # 各包 tsc --noEmit
pnpm check          # 质量门禁：format + lint + typecheck + test
pnpm db:migrate     # prisma migrate dev
pnpm db:deploy      # prisma migrate deploy（生产）
pnpm db:seed
pnpm smoke
pnpm infra:up       # docker compose up -d --wait
pnpm infra:down
```

## 质量门禁与提交规范

本地 Git hooks（[Husky](https://typicode.github.io/husky/)）：

| Hook         | 做什么                                            |
| ------------ | ------------------------------------------------- |
| `pre-commit` | lint-staged：Prettier 格式化暂存文件，再跑 ESLint |
| `commit-msg` | commitlint：Conventional Commits                  |
| `pre-push`   | `pnpm check`（format + lint + typecheck + test）  |

CI：`.github/workflows/ci.yml` 在 `main` 的 push / PR 上跑同样的 `pnpm check`。

编辑器建议启用 Format on Save，并选用 Prettier 作为默认格式化工具。仓库根目录 `.prettierrc.json` 为唯一风格来源。

提交标题格式：

```text
<type>(<optional-scope>): <subject>
```

允许的 type：`feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert`。

主题可用中文，整行不超过 100 字。例如：

```text
feat(web): 星火场 Logo 替换页头火箭
fix(api): Verification 表补 updatedAt
docs: 增加中英文 README
```

clone 后执行一次 `pnpm install`，`prepare` 会安装 husky。

## 已实现 / 未实现

已实现：产品展示与搜索、GitHub / 邮箱 OTP 登录、项目投稿与审核、头像 / Logo 上传、产品二维码生成。

未实现（界面仍是原型）：互助任务验收、火苗积分账本、评论 / 收藏 / 通知。
