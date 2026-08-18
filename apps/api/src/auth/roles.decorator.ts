import { SetMetadata } from "@nestjs/common";
import type { UserRole } from "@vibeember/shared";

export const ROLES_KEY = "vibe:roles";

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
