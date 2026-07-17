import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { ReactNode } from 'react';
import type { Session } from '@/entities/auth';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import { useLogin } from '@/features/login/model/use-login';

const schema = z.object({
  email: z.string().min(1, 'login.error.emailRequired'),
  password: z.string().min(1, 'login.error.passwordRequired'),
});

type FormValues = z.infer<typeof schema>;

// The DirAC form kit (.lpf): eyebrow + serif title + sub, icon-led inputs with a vermillion
// focus ring, a password show/hide toggle, a remember checkbox, and the primary button. Only
// `login` is wired to the API; the Google SSO, 「お忘れですか？」 and 新規登録 are non-functional
// placeholders (operator accounts are issued via tools/create-user.php — no self-serve signup).
export function Login({
  onAuthenticated,
}: {
  onAuthenticated: (session: Session) => void;
}): ReactNode {
  const { t } = useI18n();
  const { login, isPending, error } = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
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
      className="lpf"
      onSubmit={(e) => {
        void onSubmit(e);
      }}
      noValidate
    >
      <div className="lpf__eyebrow">{t('login.welcome')}</div>
      <h1 className="lpf__h1">{t('login.title')}</h1>
      <p className="lpf__sub">{t('login.subtitle')}</p>

      {submitError !== null ? (
        <div className="au-note" role="alert">
          {submitError}
        </div>
      ) : null}

      <div className="lpf__field">
        <div className="lpf__lrow">
          <label className="lpf__label" htmlFor="login-email">
            {t('login.email')}
          </label>
        </div>
        <div className="lpf__inwrap">
          <input
            id="login-email"
            className="lpf__input"
            type="email"
            autoComplete="username"
            placeholder={t('auth.emailPh')}
            aria-invalid={errors.email !== undefined}
            {...register('email')}
          />
          <Icon name="mail" size={17} />
        </div>
        {errors.email?.message !== undefined ? (
          <span className="lpf__err">{t(errors.email.message as MessageKey)}</span>
        ) : null}
      </div>

      <div className="lpf__field">
        <div className="lpf__lrow">
          <label className="lpf__label" htmlFor="login-password">
            {t('login.password')}
          </label>
          <span className="lpf__link">{t('auth.forgot')}</span>
        </div>
        <div className="lpf__inwrap">
          <input
            id="login-password"
            className="lpf__input"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder={t('auth.passwordPh')}
            aria-invalid={errors.password !== undefined}
            {...register('password')}
          />
          <Icon name="lock" size={17} />
          <button
            type="button"
            className="lpf__eye"
            onClick={() => {
              setShowPassword((s) => !s);
            }}
            aria-label={t('auth.showPassword')}
          >
            <Icon name="eye" size={17} />
          </button>
        </div>
        {errors.password?.message !== undefined ? (
          <span className="lpf__err">{t(errors.password.message as MessageKey)}</span>
        ) : null}
      </div>

      <button
        type="button"
        className="lpf__remember"
        aria-pressed={remember}
        onClick={() => {
          setRemember((r) => !r);
        }}
      >
        <span className={remember ? 'lpf__cb on' : 'lpf__cb'} aria-hidden="true">
          <Icon name="check" size={12} />
        </span>
        <span>{t('auth.remember')}</span>
      </button>

      <button className="lpf__btn" type="submit" disabled={isPending}>
        {isPending ? t('login.submitting') : t('login.submit')}
        <Icon name="chevRight" size={17} />
      </button>

      <div className="lpf__div">{t('auth.or')}</div>

      <button type="button" className="lpf__sso">
        <Icon name="globe" size={17} />
        {t('auth.google')}
      </button>

      <div className="lpf__foot">
        {t('auth.noAccount')} <span className="k">{t('auth.signupLink')}</span>
      </div>
    </form>
  );
}
