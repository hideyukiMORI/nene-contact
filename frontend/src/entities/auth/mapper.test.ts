import { describe, expect, it } from 'vitest';
import { toSession } from '@/entities/auth/mapper';

describe('toSession', () => {
  it('maps the login DTO to a session model', () => {
    const session = toSession({
      token: 'jwt-abc',
      role: 'admin',
      email: 'admin@example.com',
      org_id: 7,
      expires_at: '2026-06-04T00:00:00Z',
    });

    expect(session).toEqual({
      token: 'jwt-abc',
      email: 'admin@example.com',
      role: 'admin',
      orgId: 7,
    });
  });

  it('defaults missing email and org_id (superadmin has no org)', () => {
    const session = toSession({ token: 'jwt', role: 'superadmin' });

    expect(session.email).toBe('');
    expect(session.orgId).toBeNull();
    expect(session.role).toBe('superadmin');
  });
});
