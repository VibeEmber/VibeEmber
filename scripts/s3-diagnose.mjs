// S3 连通性诊断：pnpm s3:diagnose
// 读取仓库根 .env.vercel 中的 S3_*（或沿用已有环境变量），用生产同款 storage 代码链路测试：
// 1) SDK 直签 putObject（服务端路径）  2) 预签名 PUT（浏览器路径）
// 3) getObject 回读                    4) 公开 URL 匿名读（前端 <img> 路径）
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
for (const line of readFileSync(resolve(here, "../.env.vercel"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (match && !(match[1] in process.env)) {
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

const endpoint = process.env.S3_ENDPOINT ?? "";
const secret = process.env.S3_SECRET_KEY ?? "";
console.log("endpoint:", endpoint, "| bucket:", process.env.S3_BUCKET);
console.log(
  "accessKey 长度:",
  (process.env.S3_ACCESS_KEY ?? "").length,
  "| secret 长度:",
  secret.length,
  "| secret 含空白字符:",
  /\s/.test(secret),
  "| pathStyle:",
  process.env.S3_FORCE_PATH_STYLE ?? "1(默认)",
);

const { createStorage } = await import("../packages/storage/dist/index.js");
const storage = createStorage();
const key = `diagnose/probe-${Date.now()}.txt`;

console.log("\n[1] SDK 直签 putObject（服务端路径，jobs 图片加工用）…");
try {
  await storage.putObject(key, Buffer.from("ok"), "text/plain");
  console.log("    ✓ 成功——密钥有效，服务端签名正确");
} catch (error) {
  console.log("    ✗ 失败：", error.constructor.name, error.message.slice(0, 300));
  process.exit(1);
}

console.log("[2] getObject 回读…");
try {
  const got = await storage.getObject(key);
  console.log("    ✓ 成功，内容 =", got.toString());
} catch (error) {
  console.log("    ✗ 失败：", error.message.slice(0, 300));
}

console.log("\n[3] 预签名 PUT（浏览器直传路径）…");
const url = await storage.presignPut(key, "text/plain", 300);
const parsed = new URL(url);
console.log("    预签名 URL host:", parsed.host, "| path:", parsed.pathname);
const put = await fetch(url, {
  method: "PUT",
  headers: { "Content-Type": "text/plain" },
  body: "presign-ok",
  redirect: "manual",
});
console.log("    PUT 状态:", put.status, put.ok ? "✓ 成功" : "");
if (!put.ok) {
  console.log("    响应头:", JSON.stringify(Object.fromEntries(put.headers)));
  console.log("    响应体:", (await put.text()).slice(0, 500));
}

console.log("\n[4] 公开 URL 匿名读（前端图片路径）…");
const pub = await fetch(storage.publicUrl(key), { redirect: "manual" });
console.log("    GET", storage.publicUrl(key), "->", pub.status, pub.ok ? "✓" : "");
if (!pub.ok) console.log("    （需给桶设置匿名只读策略：mc anonymous set download）");

console.log("\n清理测试对象…");
try {
  await storage.deleteObject?.(key);
} catch {
  /* Storage 接口无 delete，忽略 */
}
console.log("诊断结束");
