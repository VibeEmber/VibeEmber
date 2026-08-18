/** 把 Node 原始 headers 记录转换为标准 Headers（Better-Auth 需要） */
export function toWebHeaders(raw: Record<string, unknown>): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") {
      headers.set(key, value);
    } else if (Array.isArray(value)) {
      headers.set(key, value.filter((item): item is string => typeof item === "string").join(", "));
    }
  }
  return headers;
}
