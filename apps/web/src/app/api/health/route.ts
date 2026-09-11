import { apiRoute } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export const GET = apiRoute(() => ({ ok: true, service: "vibe-ember-api" }));
