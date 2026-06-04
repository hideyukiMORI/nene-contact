import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { ReactNode } from 'react';
import type { Session } from '@/entities/auth';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import { useI18n } from '@/shared/i18n';
import { Alert, Button, TextField } from '@/shared/ui';
import { useLogin } from '@/features/login/hooks/use-login';

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
      <h1>{t('login.title')}</h1>
      {submitError !== null ? <Alert>{submitError}</Alert> : null}
      <TextField
        type="email"
        label={t('login.email')}
        autoComplete="username"
        error={
          errors.email?.message !== undefined ? t(errors.email.message as MessageKey) : undefined
        }
        {...register('email')}
      />
      <TextField
        type="password"
        label={t('login.password')}
        autoComplete="current-password"
        error={
          errors.password?.message !== undefined
            ? t(errors.password.message as MessageKey)
            : undefined
        }
        {...register('password')}
      />
      <Button type="submit" disabled={isPending}>
        {isPending ? t('login.submitting') : t('login.submit')}
      </Button>
    </form>
  );
}
