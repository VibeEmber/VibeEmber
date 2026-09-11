# VibeEmber 开发文档

> 返回 [社区介绍](../README.md) · [English README](../README.en.md)

面向 Vibe Coder、独立开发者和小型创业团队的产品首发互助社区（星火场 · VibeEmber）。

## 技术架构

**Next.js 全栈单应用**（App Router：客户端页面 + `/api/*` Route Handlers + Better-Auth），双部署形态：**Vercel Hobby（Serverless）** 或 **Docker Compose（自托管长驻）**。

```text
浏览器
  │
  ├─ 开发：Next.js :3000（页面 + /api 同一进程）
  │
  ├─ Vercel：单项目（/api 即 Route Handlers）
  │
  └─ Docker：Caddy :80/:443
             ├─ /storage/*  → minio:9000/{bucket}
             └─ /*（含 /api）→ web:3000
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
     PostgreSQL    S3 存储      SMTP
      （Neon/       （MinIO/     开发=Mailpit :1025
      自托管 PG     自有 S3)     生产=真实 SMTP
```

服务端代码在 `apps/web/src/lib/server/`（服务层为无装饰器类 + 模块级单例，无 DI 容器）；HTTP 层是 `apps/web/src/app/api/` 下的 Route Handlers，`apiRoute()` 包装器统一 Origin 校验、zod 校验、鉴权与错误信封 `{ error: "中文" }`。

**后台任务（无独立 worker）**：媒体加工（二维码生成、sharp 图片压缩）在触发请求内以后台方式执行——Vercel 上用 `waitUntil` 续到响应之后，长驻进程内 fire-and-forget。任务结算（超时取消 / 48h 自动验收 / 过期退款）由 `SettlementService` 承担，三种触发并存：任务/社区读接口懒触发（`SystemState` 表原子认领，5 分钟窗口）、Vercel Cron 每日一次（Hobby 频率上限）、长驻进程内每 10 分钟轮询（`src/instrumentation.ts`）。

标准端口（dev / prod 内部一致）：

| 服务                    | 端口        | 说明              |
| ----------------------- | ----------- | ----------------- |
| web（Next.js 16.3.1）   | 3000        | 页面 + 全部 /api  |
| PostgreSQL 17           | 5432        | Prisma ORM        |
| MinIO                   | 9000 / 9001 | S3 API / 控制台   |
| Mailpit（仅 dev）       | 1025 / 8025 | SMTP / 网页收件箱 |
| Caddy（仅 Docker prod） | 80 / 443    | 自动 TLS          |

## 仓库结构

```text
apps/web                  Next.js 16 全栈应用
  src/app/                页面 + api/* Route Handlers
  src/lib/server/         服务端库（auth / 服务层 / settlement / jobs / storage / mail…）
  src/instrumentation.ts  启动钩子（env 加载、dev 代理、长驻结算定时器）
  vercel.json             Vercel Cron 配置
packages/shared           类型、常量、zod schema、API 客户端
packages/database         Prisma schema / 迁移 / seed
packages/storage          S3 客户端（预签名、上传、公开 URL）
deploy/                   Dockerfile.web（runtime + migrate 两个阶段）与 Caddyfile
docker-compose.yml            开发基础设施
docker-compose.prod.yml       生产全栈（Docker 形态）
```

## 本地开发

前置：Node 24 LTS、pnpm 9.15、Docker。

```bash
pnpm install
cp .env.example .env          # 可选；代码内置了开发默认值
docker compose up -d          # postgres / minio / mailpit
pnpm db:migrate               # 首次会提示输入迁移名；已有迁移时直接 apply
pnpm db:seed
pnpm dev                      # 启动 web（页面 + /api 同一进程）+ 包 watch
```

`pnpm dev` 会先检查 3000 端口；如果已有开发服务仍在运行，会在构建前给出明确提示，避免重复启动多套 watcher。

验证码邮件：打开 [http://localhost:8025](http://localhost:8025)。
MinIO 控制台：[http://localhost:9001](http://localhost:9001)（账号 `vibe` / `vibeember-secret`）。

冒烟测试（web + 基础设施已启动）：

```bash
pnpm smoke
```

覆盖健康检查、公开项目、未登录拦截、邮箱 OTP（经 Mailpit 取码）、头像预签名直传、投稿审核、二维码生成（API 内联）。

## 认证

- Better-Auth：GitHub OAuth + 邮箱 OTP，**无密码登录**
- Session / Cookie / CSRF 由 Better-Auth 管理
- `BOOTSTRAP_ADMIN_EMAIL`（默认 `admin@vibeember.dev`）只在**首次注册**时引导出第一个管理员；已有用户的角色不随该变量变化
- **应用内角色管理**：管理员在个人中心「用户管理」标签页按昵称/邮箱搜索成员、授予或移除管理员权限（`GET /api/admin/users`、`PATCH /api/admin/users/[id]/role`）。护栏：不能修改自己的角色，保证社区始终至少保留一位操作中的管理员；被调整角色的用户会收到通知
- GitHub OAuth App 回调地址：`{BETTER_AUTH_URL}/api/auth/callback/github`
  - 开发：`http://localhost:3000/api/auth/callback/github`
  - 生产：`https://<对外域名>/api/auth/callback/github`

## 图片存储

头像、产品 Logo、产品二维码走 S3 兼容存储（开发默认 MinIO，云端用你自己的 S3 兼容服务）。

| 对象   | 键位                          | 说明                                      |
| ------ | ----------------------------- | ----------------------------------------- |
| 头像   | `avatars/{userId}-{rand}.ext` | 浏览器预签名直传，API 后台压成 256px WebP |
| Logo   | `logos/{userId}-{rand}.ext`   | 提交时绑定，API 后台压成 512px WebP       |
| 二维码 | `qr/{projectId}.png`          | 投稿/审核后 API 后台生成 PNG 写入         |

开发公开 URL：`http://localhost:9000/vibeember/{key}`  
Docker 生产公开 URL：`https://{CADDY_DOMAIN}/storage/{key}`（Caddy 反代 MinIO，不暴露 9000）  
Vercel 生产公开 URL：`S3_PUBLIC_URL` 直指你的 S3 服务公开域名（注意为桶配置允许 web 域名的 CORS PUT）

## 环境变量

见仓库根目录 `.env.example`。开发可以不建 `.env`（代码与 `packages/database/prisma/.env` 提供默认值）；生产必须复制并替换全部敏感值。

关键项：

- `DATABASE_URL` / `BETTER_AUTH_SECRET`（≥32 位随机） / `BETTER_AUTH_URL` / `WEB_URL`
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM`  
  开发默认 `localhost:1025`（Mailpit）；生产改为真实 SMTP（465/587，25 端口在云函数环境被封）
- `S3_ENDPOINT` / `S3_ACCESS_KEY` / `S3_SECRET_KEY` / `S3_BUCKET` / `S3_PUBLIC_URL`
- `CRON_SECRET`（仅 Vercel 需要）：Cron 调度凭据
- Docker 专用：`CADDY_DOMAIN` / `POSTGRES_PASSWORD`

## 生产部署（形态一：Vercel Hobby）

**单项目、一次部署**：一个 Vercel 项目承载页面与全部 `/api/*`，所有环境变量填在同一处，无跨项目配对依赖。

### 0. 外部服务准备

- **PostgreSQL**：推荐 [Neon](https://neon.tech) 免费层（Vercel 集成好、自带 PgBouncer 池化）；也可用自托管 PG（需公网可达 + SSL + 控制连接数）。注意 Neon 提供两种连接串，用途不同：
  - **运行时**（Vercel 环境变量）：pooler 端点（host 带 `-pooler`）+ `?pgbouncer=true&connection_limit=1`，应对 Serverless 多实例
  - **迁移**（本地 / GitHub Actions 的 `db:deploy`）：**直连串**（host 不带 `-pooler`、不加 pgbouncer 参数）——migrate 依赖 advisory lock，走 PgBouncer 事务池会失败
- **S3**：你自己的 S3 兼容服务；为桶配置 CORS（允许站点域名、PUT 方法、`Content-Type` 头）
- **SMTP**：你自己的 SMTP 服务器（465/587）

### 1. 数据库迁移（首次/每次新增迁移）

```bash
DATABASE_URL="<Neon 直连串>" pnpm db:deploy
DATABASE_URL="<同上>" pnpm db:seed   # 可选：演示数据
```

也可用 GitHub Actions 自动执行迁移：

1. 把改动推送到 GitHub（`.github/workflows/migrate.yml` 随仓库生效）
2. GitHub 仓库 → **Settings → Secrets and variables → Actions → Repository secrets → New repository secret**，Name 填 `DATABASE_URL`，Secret 填 **Neon 直连串**
3. 之后每次 push 到 main 自动跑；也可在 **Actions → Migrate → Run workflow** 手动触发
4. 未配置 secret 时 workflow 自动跳过，不会报错

### 2. 建 Vercel 项目（就一个）

- Root Directory：`apps/web`，Framework：Next.js（自动识别）
- 勾选 **Include source files outside of the Root Directory**（依赖 packages/*）
- Install Command：`pnpm install --frozen-lockfile`；Build Command：`pnpm -w run build:web`
- 环境变量（Production，全部填在这个项目）：`DATABASE_URL`、`WEB_URL` 与 `BETTER_AUTH_URL`（= 项目对外域名）、`BETTER_AUTH_SECRET`、`BOOTSTRAP_ADMIN_EMAIL`、`GITHUB_CLIENT_ID/SECRET`、`SMTP_HOST/PORT/USER/PASS`、`MAIL_FROM`、`S3_ENDPOINT/REGION/ACCESS_KEY/SECRET_KEY/BUCKET/PUBLIC_URL/FORCE_PATH_STYLE`、`CRON_SECRET`
- `apps/web/vercel.json` 已配置每日 Cron 调 `/api/cron/expire`（自动携带 `Authorization: Bearer ${CRON_SECRET}`）；重任务路由在代码里声明了 `maxDuration = 60`

### 3. GitHub OAuth App

回调地址填 `https://<域名>/api/auth/callback/github`。

### 4. 首次部署验证

```bash
curl https://<域名>/api/health     # /api 与页面同一部署，直出
curl https://<域名>/               # 首页
SMOKE_API=https://<域名>/api pnpm smoke  # OTP 环节因无 Mailpit 需手动验证
```

> 限制与取舍（Hobby）：Cron 每日一次——结算时效靠读接口懒触发补足（无人访问时最多延迟 24h）；内联媒体加工在 `waitUntil` 内完成（60s 上限）；无内存限流（Serverless 多实例下无共享存储，如需要可后续加数据库/IP 层限流）。

## 生产部署（形态二：Docker Compose 自托管）

全容器化，Caddy 接管 80/443 并自动申请证书（域名 DNS 需先解析到服务器）。

```bash
cp .env.example .env
# 编辑 .env：CADDY_DOMAIN、BETTER_AUTH_SECRET、GITHUB_*、SMTP_*、POSTGRES_PASSWORD
# 生产 BETTER_AUTH_URL / WEB_URL 在 compose 中会按 CADDY_DOMAIN 覆盖为 https://{domain}

docker compose -f docker-compose.prod.yml up -d --build
```

`migrate` 服务会在 web 启动前执行 `prisma migrate deploy`。媒体加工与任务结算内联在 web 进程内（启动即结算 + 每 10 分钟轮询），无需独立 worker。

如需改用外部 S3，去掉 compose 中的 minio / minio-init，并把 `S3_ENDPOINT` / `S3_PUBLIC_URL` 指到外部服务。

## 常用脚本

```bash
pnpm dev            # 全仓并行开发（web + 包 watch）
pnpm dev:web        # 仅 web（先构建公共包）
pnpm build          # 全仓构建
pnpm build:web      # Vercel 构建（公共包 + next build，产出页面与全部 API）
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

已实现：产品展示与搜索、GitHub / 邮箱 OTP 登录、项目投稿与审核、头像 / Logo / 截图上传、产品二维码生成、互助任务与火苗账本、清单验收、48 小时自动通过、抽查、本周真实互助结果、评论 / 收藏 / 通知。

后台任务内联在 API 内：二维码 / 图片加工在触发请求内后台执行；任务过期、领取超时和待验收超时自动通过由结算服务承担（读接口懒触发 + 每日 Cron + 长驻进程内 10 分钟轮询，三种触发按部署形态自动生效）。
