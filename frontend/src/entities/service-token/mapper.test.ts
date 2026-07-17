import { describe, expect, it } from 'vitest';
import {
  toIssuedServiceToken,
  toServiceToken,
  toServiceTokens,
} from '@/entities/service-token/mapper';

describe('service-token mappers', () => {
  it('maps a token DTO to the model (camelCase)', () => {
    expect(
      toServiceToken({
        id: 3,
        subject: 'service:records',
        label: 'Records',
        scopes: ['ingest:submissions'],
        created_by: 7,
        created_at: '2026-07-18 00:00:00',
        expires_at: '2027-07-18 00:00:00',
        revoked_at: null,
        status: 'active',
      }),
    ).toEqual({
      id: 3,
      subject: 'service:records',
      label: 'Records',
      scopes: ['ingest:submissions'],
      createdAt: '2026-07-18 00:00:00',
      expiresAt: '2027-07-18 00:00:00',
      revokedAt: null,
      status: 'active',
    });
  });

  it('carries the one-time plaintext token on issuance', () => {
    const issued = toIssuedServiceToken({
      id: 1,
      subject: 'service:records',
      label: 'r',
      scopes: ['ingest:submissions'],
      status: 'active',
      token: 'plain.jwt',
    });
    expect(issued.token).toBe('plain.jwt');
    expect(issued.status).toBe('active');
  });

  it('maps an empty list', () => {
    expect(toServiceTokens({ items: [] })).toEqual([]);
    expect(toServiceTokens({})).toEqual([]);
  });
});
