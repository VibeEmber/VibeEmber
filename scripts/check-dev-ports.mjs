import { createServer } from "node:net";

const ignoredIpv6Errors = new Set(["EAFNOSUPPORT", "EADDRNOTAVAIL"]);

const ports = process.argv
  .slice(2)
  .filter((value) => value !== "--")
  .map((value) => Number.parseInt(value, 10));

if (
  ports.length === 0 ||
  ports.some((port) => !Number.isInteger(port) || port < 1 || port > 65535)
) {
  console.error("用法：node scripts/check-dev-ports.mjs <port...>");
  process.exitCode = 1;
} else {
  const unavailable = (await Promise.all(ports.map(checkPort))).filter(Boolean);

  if (unavailable.length > 0) {
    for (const { port, error } of unavailable) {
      const reason =
        error.code === "EADDRINUSE" ? "已被占用" : `不可用（${error.code ?? error.message}）`;
      console.error(`开发端口 ${port} ${reason}。已有开发服务可能仍在运行，请先复用或停止旧进程。`);
    }
    process.exitCode = 1;
  }
}

async function checkPort(port) {
  const ipv4Error = await probe(port, "0.0.0.0");
  if (ipv4Error) return { port, error: ipv4Error };

  const ipv6Error = await probe(port, "::");
  if (ipv6Error && !ignoredIpv6Errors.has(ipv6Error.code)) {
    return { port, error: ipv6Error };
  }

  return null;
}

function probe(port, host) {
  return new Promise((resolve) => {
    const server = createServer();

    server.once("error", resolve);
    server.listen({ host, port, exclusive: true }, () => {
      server.close(() => resolve(null));
    });
  });
}
