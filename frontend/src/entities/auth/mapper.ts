import type { LoginResponseDto } from '@/entities/auth/api-types';
import type { Session } from '@/entities/auth/model';

// snake_case wire DTO → typed Session model (frontend-standards §E). No field renaming in
// transport; mapping happens here.
export function toSession(dto: LoginResponseDto): Session {
  return {
    token: dto.token,
    email: dto.email ?? '',
    role: dto.role,
    orgId: dto.org_id ?? null,
  };
}
