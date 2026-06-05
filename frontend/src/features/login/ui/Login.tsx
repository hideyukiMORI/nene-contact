import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { ReactNode } from 'react';
import type { Session } from '@/entities/auth';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import { useI18n } from '@/shared/i18n';
import { Alert } from '@/shared/ui';
import { useLogin } from '@/features/login/hooks/use-login';
import { LoginIcon } from '@/features/login/ui/icons';

const schema = z.object({
  email: z.string().min(1, 'login.error.emailRequired'),
  password: z.string().min(1, 'login.error.passwordRequired'),
});

type FormValues = z.infer<typeof schema>;

export function Login({
  onAuthenticated,
}: {
  onAuthenticated: (session: Session) => void;
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
      {submitError !== null ? <Alert>{submitError}</Alert> : null}

      <div className="field">
        <label className="label" htmlFor="login-email">
          {t('login.email')}
        </label>
        <input
          id="login-email"
          className="input"
          type="email"
          autoComplete="username"
          aria-invalid={errors.email !== undefined}
          {...register('email')}
        />
        {errors.email?.message !== undefined ? (
          <span className="field-error">{t(errors.email.message as MessageKey)}</span>
        ) : null}
      </div>

      <div className="field">
        <label className="label" htmlFor="login-password">
          {t('login.password')}
        </label>
        <input
          id="login-password"
          className="input"
          type="password"
          autoComplete="current-password"
          aria-invalid={errors.password !== undefined}
          {...register('password')}
        />
        {errors.password?.message !== undefined ? (
          <span className="field-error">{t(errors.password.message as MessageKey)}</span>
        ) : null}
      </div>

      <button
        className="btn btn-primary btn-block btn-lg auth-submit"
        type="submit"
        disabled={isPending}
      >
        {isPending ? t('login.submitting') : t('login.submit')}
        <LoginIcon name="chevRight" size={16} />
      </button>
    </form>
  );
}
