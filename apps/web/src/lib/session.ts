"use client";

import type { SessionUser } from "@vibeember/shared";
import { authClient } from "./auth-client";

/** 会话 hook：role/image 等 additionalFields 一并返回 */
export function useAppSession(): { user: SessionUser | null; isPending: boolean } {
  const { data: session, isPending } = authClient.useSession();
  const user = (session?.user ?? null) as SessionUser | null;
  return { user, isPending };
}
