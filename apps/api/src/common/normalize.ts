export function normalizeText(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
}

export function tooSimilar(a: string, b: string): boolean {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const shorter = left.length < right.length ? left : right;
  const longer = left.length < right.length ? right : left;
  return shorter.length >= 20 && longer.includes(shorter);
}
