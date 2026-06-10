import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { ReactNode } from 'react';
import type { Session } from '@/entities/auth';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import { useI18n } from '@/shared/i18n';
import { useLogin } from '@/features/login/hooks/use-login';

const schema = z.object({
  email: z.string().min(1, 'login.error.emailRequired'),
  password: z.string().min(1, 'login.error.passwordRequired'),
});

type FormValues = z.infer<typeof schema>;

export function Login({
  onAuthenticated,
  onForgot,
}: {
  onAuthenticated: (session: Session) => void;
  onForgot?: () => void;
}): ReactNode {
  const { t } = useI18n();
  const { login, isPending, error } = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      onAuthenticated(await login(values));
    } catch {
      // Error surfaced via the mutation's `error` (AppError); nothing to do here.
    }
  });

  const submitError =
    error !== null
      ? error.isUnauthorized
        ? t('login.error.invalid')
        : t('common.error.generic')
      : null;

  return (
    <form
      onSubmit={(e) => {
        void onSubmit(e);
      }}
      noValidate
    >
      {submitError !== null ? (
        <div className="au-note" role="alert">
          {submitError}
        </div>
      ) : null}

      <div className="au-field">
        <label className="l" htmlFor="login-email">
          {t('login.email')}
        </label>
        <input
          id="login-email"
          className="au-inp"
          type="email"
          autoComplete="username"
          placeholder={t('auth.emailPh')}
          aria-invalid={errors.email !== undefined}
          {...register('email')}
        />
        {errors.email?.message !== undefined ? (
          <span className="au-err">{t(errors.email.message as MessageKey)}</span>
        ) : null}
      </div>

      <div className="au-field">
        <div className="au-lrow">
          <label className="l" htmlFor="login-password">
            {t('login.password')}
          </label>
          {onForgot !== undefined ? (
            <button type="button" className="au-link" onClick={onForgot}>
              {t('auth.forgot')}
            </button>
          ) : null}
        </div>
        <input
          id="login-password"
          className="au-inp"
          type="password"
          autoComplete="current-password"
          aria-invalid={errors.password !== undefined}
          {...register('password')}
        />
        {errors.password?.message !== undefined ? (
          <span className="au-err">{t(errors.password.message as MessageKey)}</span>
        ) : null}
      </div>

      <button className="au-btn" type="submit" disabled={isPending}>
        {isPending ? t('login.submitting') : t('login.submit')}
      </button>
    </form>
  );
}
