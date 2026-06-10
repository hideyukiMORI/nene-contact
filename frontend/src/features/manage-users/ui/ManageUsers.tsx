import { useState, type ReactNode } from 'react';
import {
  ASSIGNABLE_ROLES,
  USER_STATUSES,
  type AssignableRole,
  type User,
  type UserStatus,
} from '@/entities/user';
import { useI18n } from '@/shared/i18n';
import { Icon, Modal } from '@/shared/ui';
import { useUsers } from '@/features/manage-users/hooks/use-users';

const AVATAR_TONES = ['c1', 'c2', 'c3'] as const;

function RoleCell({
  user,
  onChange,
}: {
  user: User;
  onChange: (role: AssignableRole) => void;
}): ReactNode {
  const { t } = useI18n();
  if (user.role === 'superadmin') {
    return (
      <span className="us-role locked">
        <Icon name="shield" size={14} />
        {t('user.role.superadmin')}
      </span>
    );
  }
  return (
    <select
      className="us-role"
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

export function ManageUsers({ currentEmail }: { currentEmail?: string }): ReactNode {
  const { t } = useI18n();
  const { users, isLoading, error, createUser, isCreating, createError, updateUser, updateError } =
    useUsers();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AssignableRole>('editor');

  const onCreate = (): void => {
    void createUser({ email, password, role }).then(() => {
      setEmail('');
      setPassword('');
      setInviteOpen(false);
    });
  };

  return (
    <div className="fm-body">
      <div className="fm-head">
        <h1>{t('users.title')}</h1>
        <span className="c">{t('users.count', { n: String(users.length) })}</span>
        <span className="sp" />
        <button
          type="button"
          className="ex-btn"
          onClick={() => {
            setInviteOpen(true);
          }}
        >
          <Icon name="plus" size={14} />
          {t('users.invite')}
        </button>
      </div>

      {isLoading ? <div className="fm-card fm-state">{t('common.loading')}</div> : null}
      {error !== null ? (
        <div className="au-note" role="alert">
          {t('users.error')}
        </div>
      ) : null}
      {updateError !== null ? (
        <div className="au-note" role="alert">
          {t('users.updateError')}
        </div>
      ) : null}

      {!isLoading && error === null && users.length === 0 ? (
        <div className="fm-card fm-empty">
          <div className="e-ico">
            <Icon name="users" size={26} />
          </div>
          <h3>{t('users.empty')}</h3>
        </div>
      ) : null}

      {users.length > 0 ? (
        <div className="fm-card">
          <div className="tbl-wrap">
            <table className="fm-tbl">
              <thead>
                <tr>
                  <th>{t('users.column.email')}</th>
                  <th>{t('users.column.role')}</th>
                  <th>{t('users.column.status')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => {
                  const isSelf = currentEmail !== undefined && user.email === currentEmail;
                  const tone = isSelf ? 'brand' : AVATAR_TONES[i % AVATAR_TONES.length];
                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="us-mem">
                          <span className={`us-av ${tone ?? 'c1'}`}>
                            {(user.email.at(0) ?? '?').toUpperCase()}
                          </span>
                          <div>
                            <div className="t">
                              {user.email}
                              {isSelf ? <span className="us-you">{t('users.you')}</span> : null}
                            </div>
                          </div>
                        </div>
                      </td>
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
                          className="us-role"
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {inviteOpen ? (
        <Modal
          title={t('users.invite')}
          subtitle={t('users.inviteSub')}
          icon={<Icon name="users" size={19} />}
          onClose={() => {
            setInviteOpen(false);
          }}
          foot={
            <>
              <button
                type="button"
                className="ex-btn ghost"
                onClick={() => {
                  setInviteOpen(false);
                }}
              >
                {t('common.close')}
              </button>
              <button type="button" className="ex-btn" disabled={isCreating} onClick={onCreate}>
                <Icon name="send" size={14} />
                {isCreating ? t('users.creating') : t('users.create')}
              </button>
            </>
          }
        >
          {createError !== null ? (
            <div className="au-note" role="alert">
              {t('users.createError')}
            </div>
          ) : null}
          <div className="md-field">
            <label className="l" htmlFor="invite-email">
              {t('users.email')}
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
            />
          </div>
          <div className="md-field">
            <label className="l" htmlFor="invite-password">
              {t('users.password')}
            </label>
            <input
              id="invite-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
            />
          </div>
          <div className="md-field">
            <label className="l" htmlFor="invite-role">
              {t('users.role')}
            </label>
            <select
              id="invite-role"
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
        </Modal>
      ) : null}
    </div>
  );
}
