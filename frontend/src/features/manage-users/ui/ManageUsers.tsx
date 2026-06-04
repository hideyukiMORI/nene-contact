import { useState, type ReactNode } from 'react';
import {
  ASSIGNABLE_ROLES,
  USER_STATUSES,
  type AssignableRole,
  type User,
  type UserStatus,
} from '@/entities/user';
import { useI18n } from '@/shared/i18n';
import { Alert, Button, TextField } from '@/shared/ui';
import { useUsers } from '@/features/manage-users/hooks/use-users';

function RoleCell({
  user,
  onChange,
}: {
  user: User;
  onChange: (role: AssignableRole) => void;
}): ReactNode {
  const { t } = useI18n();
  if (user.role === 'superadmin') {
    return <span>{t('user.role.superadmin')}</span>;
  }
  return (
    <select
      className="nc-input"
      aria-label={t('users.column.role')}
      value={user.role}
      onChange={(e) => {
        onChange(e.target.value as AssignableRole);
      }}
    >
      {ASSIGNABLE_ROLES.map((role) => (
        <option key={role} value={role}>
          {t(`user.role.${role}`)}
        </option>
      ))}
    </select>
  );
}

export function ManageUsers(): ReactNode {
  const { t } = useI18n();
  const { users, isLoading, error, createUser, isCreating, createError, updateUser, updateError } =
    useUsers();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AssignableRole>('editor');

  const onCreate = (): void => {
    void createUser({ email, password, role }).then(() => {
      setEmail('');
      setPassword('');
    });
  };

  return (
    <div className="nc-section">
      {isLoading ? <p>{t('common.loading')}</p> : null}
      {error !== null ? <Alert>{t('users.error')}</Alert> : null}
      {updateError !== null ? <Alert>{t('users.updateError')}</Alert> : null}
      {!isLoading && error === null && users.length === 0 ? (
        <p className="nc-muted">{t('users.empty')}</p>
      ) : null}

      {users.length > 0 ? (
        <table className="nc-table">
          <thead>
            <tr>
              <th>{t('users.column.email')}</th>
              <th>{t('users.column.role')}</th>
              <th>{t('users.column.status')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>
                  <RoleCell
                    user={user}
                    onChange={(nextRole) => {
                      updateUser(user.id, { role: nextRole });
                    }}
                  />
                </td>
                <td>
                  <select
                    className="nc-input"
                    aria-label={t('users.column.status')}
                    value={user.status}
                    onChange={(e) => {
                      updateUser(user.id, { status: e.target.value as UserStatus });
                    }}
                  >
                    {USER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {t(`user.status.${status}`)}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      <fieldset className="nc-fieldset">
        <legend>{t('users.add')}</legend>
        <TextField
          type="email"
          label={t('users.email')}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
          }}
        />
        <TextField
          type="password"
          label={t('users.password')}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
          }}
        />
        <div className="nc-field">
          <label className="nc-label" htmlFor="nc-new-role">
            {t('users.role')}
          </label>
          <select
            id="nc-new-role"
            className="nc-input"
            value={role}
            onChange={(e) => {
              setRole(e.target.value as AssignableRole);
            }}
          >
            {ASSIGNABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {t(`user.role.${r}`)}
              </option>
            ))}
          </select>
        </div>
        {createError !== null ? <Alert>{t('users.createError')}</Alert> : null}
        <Button type="button" disabled={isCreating} onClick={onCreate}>
          {isCreating ? t('users.creating') : t('users.create')}
        </Button>
      </fieldset>
    </div>
  );
}
