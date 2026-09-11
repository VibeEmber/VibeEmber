// 开发栈冒烟测试：node scripts/smoke.mjs
// 前置：docker compose up -d && pnpm db:migrate && pnpm db:seed && web 已启动
// 覆盖：健康检查、公开项目、未登录鉴权、邮箱 OTP 全链路（经 Mailpit 收件）、头像预签名、投稿审核、二维码生成
const API = process.env.SMOKE_API ?? "http://localhost:3000/api";
const MAILPIT = process.env.SMOKE_MAILPIT ?? "http://localhost:8025";
const TEST_EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL ?? "admin@vibeember.dev";
const ORIGIN = process.env.WEB_URL ?? "http://localhost:3000";

let passed = 0;
let failed = 0;

function ok(name) {
  passed += 1;
  console.log(`  ✓ ${name}`);
}

function fail(name, detail) {
  failed += 1;
  console.error(`  ✗ ${name}\n    ${detail}`);
}

async function waitFor(name, fn, { timeoutMs = 20000, intervalMs = 1000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
  throw new Error(`${name} 超时：${lastError?.message ?? "unknown"}`);
}

function apiFetch(path, init = {}) {
  const headers = {
    Origin: ORIGIN,
    ...(init.headers ?? {}),
  };
  return fetch(`${API}${path}`, { ...init, headers });
}

async function main() {
  console.log("VibeEmber 冒烟测试");
  console.log(`  API: ${API}`);
  console.log(`  Mailpit: ${MAILPIT}\n`);

  try {
    const health = await waitFor("API 就绪", async () => {
      const res = await apiFetch("/health");
      if (!res.ok) throw new Error(`status ${res.status}`);
      return res.json();
    });
    if (health.ok === true) ok(`健康检查（${health.service}）`);
    else fail("健康检查", JSON.stringify(health));
  } catch (error) {
    fail("健康检查", error.message);
  }

  try {
    const res = await apiFetch("/projects");
    const data = await res.json();
    if (res.ok && data.projects?.length >= 6) {
      const withQrKey = data.projects.filter((p) => p.qrUrl).length;
      ok(`公开项目列表（${data.projects.length} 条，${withQrKey} 条带二维码 URL）`);
    } else {
      fail(
        "公开项目列表",
        `期望 ≥6 条，实际 ${data.projects?.length ?? 0}（是否已运行 pnpm db:seed？）`,
      );
    }
  } catch (error) {
    fail("公开项目列表", error.message);
  }

  try {
    const res = await apiFetch("/projects/mine");
    const data = await res.json();
    if (res.status === 401 && data.error) ok(`未登录拦截（${data.error}）`);
    else fail("未登录拦截", `status ${res.status}`);
  } catch (error) {
    fail("未登录拦截", error.message);
  }

  let cookie = "";
  try {
    const sendRes = await apiFetch("/auth/email-otp/send-verification-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: TEST_EMAIL, type: "sign-in" }),
    });
    if (!sendRes.ok)
      throw new Error(`发送验证码失败 status ${sendRes.status} ${await sendRes.text()}`);

    const otp = await waitFor("Mailpit 收到验证码邮件", async () => {
      const res = await fetch(`${MAILPIT}/api/v1/messages`);
      if (!res.ok) throw new Error(`mailpit status ${res.status}`);
      const data = await res.json();
      const hit = data.messages?.find((m) => m.To?.some((t) => t.Address === TEST_EMAIL));
      if (!hit) throw new Error("未找到收件");
      const detail = await (await fetch(`${MAILPIT}/api/v1/message/${hit.ID}`)).json();
      const text = detail.Text ?? "";
      const code = text.match(/\b(\d{6})\b/)?.[1];
      if (!code) throw new Error("邮件中未找到 6 位验证码");
      return code;
    });

    const loginRes = await apiFetch("/auth/sign-in/email-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: TEST_EMAIL, otp }),
    });
    if (!loginRes.ok)
      throw new Error(`OTP 登录失败 status ${loginRes.status} ${await loginRes.text()}`);
    const setCookie = loginRes.headers.getSetCookie?.() ?? loginRes.headers.get("set-cookie") ?? "";
    cookie = Array.isArray(setCookie)
      ? setCookie.map((item) => item.split(";")[0]).join("; ")
      : String(setCookie).split(";")[0];
    if (!cookie) throw new Error("登录响应未携带会话 Cookie");
    ok("邮箱 OTP 登录全链路（发送 → Mailpit 收件 → 验证码登录）");

    const meRes = await apiFetch("/projects/mine", { headers: { cookie } });
    const meData = await meRes.json();
    if (meRes.ok) ok(`登录态访问业务接口（我的投稿 ${meData.projects?.length ?? 0} 条）`);
    else fail("登录态访问业务接口", `status ${meRes.status} ${JSON.stringify(meData)}`);

    const presignRes = await apiFetch("/uploads/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ kind: "avatar", contentType: "image/png" }),
    });
    const presignData = await presignRes.json();
    if (presignRes.ok && presignData.url && presignData.key?.startsWith("avatars/")) {
      ok(`头像预签名直传（key=${presignData.key}）`);
    } else {
      fail("头像预签名直传", `status ${presignRes.status} ${JSON.stringify(presignData)}`);
    }

    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );
    const putRes = await fetch(presignData.url, {
      method: "PUT",
      headers: { "Content-Type": "image/png" },
      body: png,
    });
    if (putRes.ok) {
      const publicRes = await fetch(presignData.publicUrl);
      if (publicRes.ok) ok("MinIO 直传 + 公开读取（S3 链路）");
      else fail("MinIO 公开读取", `status ${publicRes.status}`);
    } else {
      fail("MinIO 直传", `status ${putRes.status}`);
    }

    const shotPresignRes = await apiFetch("/uploads/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ kind: "screenshot", contentType: "image/png" }),
    });
    const shotPresign = await shotPresignRes.json();
    if (!shotPresignRes.ok || !shotPresign.key)
      throw new Error(`截图预签名失败 ${JSON.stringify(shotPresign)}`);
    const shotPut = await fetch(shotPresign.url, {
      method: "PUT",
      headers: { "Content-Type": "image/png" },
      body: png,
    });
    if (!shotPut.ok) throw new Error(`截图上传失败 ${shotPut.status}`);

    const createRes = await apiFetch("/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({
        name: "冒烟测试产品",
        tagline: "用来验证投稿审核与二维码生成",
        url: "https://example.com/smoke-test",
        kind: "web",
        topics: ["工具"],
        helpNeeded:
          "需要 10 位真实用户完成首次使用体验，并按三问留下可执行的真实反馈，帮助验证核心流程是否顺畅",
        screenshotKeys: [shotPresign.key],
      }),
    });
    const created = await createRes.json();
    if (!createRes.ok) throw new Error(`投稿失败 ${createRes.status} ${JSON.stringify(created)}`);
    ok(`提交项目（id=${created.id}）`);

    const reviewRes = await apiFetch(`/admin/projects/${created.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ action: "approved" }),
    });
    if (!reviewRes.ok) throw new Error(`审核失败 ${reviewRes.status} ${await reviewRes.text()}`);
    ok("管理员审核通过");

    await waitFor("API 内联生成二维码", async () => {
      const res = await fetch(`http://localhost:9000/vibeember/qr/${created.id}.png`);
      if (!res.ok) throw new Error(`qr status ${res.status}`);
      return true;
    });
    ok("API 已内联生成产品二维码并写入 MinIO");
  } catch (error) {
    fail("OTP/上传/审核链路", error.message);
  }

  try {
    const listRes = await apiFetch("/admin/users?q=", { headers: { cookie } });
    const listData = await listRes.json();
    if (!listRes.ok || !Array.isArray(listData.users)) {
      throw new Error(`用户列表失败 ${listRes.status} ${JSON.stringify(listData)}`);
    }
    const self = listData.users.find((item) => item.email === TEST_EMAIL);
    const target = listData.users.find(
      (item) => item.role === "member" && item.email !== TEST_EMAIL,
    );
    if (!self || !target) throw new Error("种子用户不足（是否已运行 pnpm db:seed？）");
    ok(`管理员用户列表（${listData.users.length} 位成员）`);

    const selfRes = await apiFetch(`/admin/users/${self.id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ role: "member" }),
    });
    if (selfRes.status === 400) ok("修改自己角色的请求被拦截");
    else fail("修改自己角色的请求被拦截", `status ${selfRes.status}`);

    const promoteRes = await apiFetch(`/admin/users/${target.id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ role: "admin" }),
    });
    const promoted = await promoteRes.json();
    if (promoteRes.ok && promoted.role === "admin") ok(`成员已设为管理员（${target.email}）`);
    else fail("成员已设为管理员", `${promoteRes.status} ${JSON.stringify(promoted)}`);

    const demoteRes = await apiFetch(`/admin/users/${target.id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ role: "member" }),
    });
    const demoted = await demoteRes.json();
    if (demoteRes.ok && demoted.role === "member") ok("管理员权限已移除，还原为成员");
    else fail("管理员权限已移除", `${demoteRes.status} ${JSON.stringify(demoted)}`);
  } catch (error) {
    fail("用户角色管理", error.message);
  }

  console.log(`\n结果：${passed} 通过，${failed} 失败`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("冒烟测试异常：", error);
  process.exit(1);
});
