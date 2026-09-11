import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export const { GET, POST } = toNextJsHandler(getAuth());
