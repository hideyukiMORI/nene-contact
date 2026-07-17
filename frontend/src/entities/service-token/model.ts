import type { ServiceTokenId } from '@/entities/service-token/ids';

export type ServiceScope = 'ingest:submissions';
export type ServiceTokenStatus = 'active' | 'revoked';

export const SERVICE_SCOPES: ServiceScope[] = ['ingest:submissions'];

/** UI read model for a service token (metadata only — the value is never returned by list). */
export interface ServiceToken {
  id: ServiceTokenId;
  subject: string;
  label: string;
  scopes: ServiceScope[];
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  status: ServiceTokenStatus;
}

/** A token plus its one-time plaintext value, returned only on issuance. */
export interface IssuedServiceToken extends ServiceToken {
  token: string;
}

export interface IssueServiceTokenInput {
  label: string;
  scopes: ServiceScope[];
}
