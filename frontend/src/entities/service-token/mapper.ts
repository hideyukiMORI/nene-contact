import type {
  CreatedServiceTokenDto,
  ServiceTokenDto,
  ServiceTokenListDto,
} from '@/entities/service-token/api-types';
import { toServiceTokenId } from '@/entities/service-token/ids';
import type {
  IssuedServiceToken,
  ServiceScope,
  ServiceToken,
} from '@/entities/service-token/model';

export function toServiceToken(dto: ServiceTokenDto): ServiceToken {
  return {
    id: toServiceTokenId(dto.id),
    subject: dto.subject,
    label: dto.label,
    scopes: dto.scopes as ServiceScope[],
    createdAt: dto.created_at ?? '',
    expiresAt: dto.expires_at ?? '',
    revokedAt: dto.revoked_at ?? null,
    status: dto.status,
  };
}

export function toIssuedServiceToken(dto: CreatedServiceTokenDto): IssuedServiceToken {
  return { ...toServiceToken(dto), token: dto.token };
}

export function toServiceTokens(dto: ServiceTokenListDto): ServiceToken[] {
  return (dto.items ?? []).map(toServiceToken);
}
