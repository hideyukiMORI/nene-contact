import { describe, expect, it } from 'vitest';
import { toUpdateUserDto, toUser, toUsers } from '@/entities/user/mapper';

describe('user mappers', () => {
  it('maps a user DTO to the model', () => {
    expect(toUser({ id: 2, email: 'op@example.com', role: 'editor', status: 'active' })).toEqual({
      id: 2,
      email: 'op@example.com',
      role: 'editor',
      status: 'active',
    });
  });

  it('maps an empty list', () => {
    expect(toUsers({ items: [] })).toEqual([]);
  });

  it('builds a partial update, omitting absent fields', () => {
    expect(toUpdateUserDto({ status: 'disabled' })).toEqual({ status: 'disabled' });
    expect(toUpdateUserDto({ role: 'admin' })).not.toHaveProperty('status');
  });
});
