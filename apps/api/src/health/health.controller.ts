import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  check(): { ok: boolean; service: string } {
    return { ok: true, service: "vibe-ember-api" };
  }
}
