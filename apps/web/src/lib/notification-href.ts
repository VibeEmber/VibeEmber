import type { NotificationItem } from "@vibeember/shared";

export function notificationHref(item: NotificationItem): string {
  if (item.refType === "project" && item.refId) return `/p/${item.refId}`;
  if (item.refType === "claim" || item.refType === "task") return "/me?tab=aid";
  return "/me";
}
