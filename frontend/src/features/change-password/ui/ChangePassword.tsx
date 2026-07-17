import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { ReactNode } from 'react';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import { AppError } from '@/shared/api/errors';
import { useI18n } from '@/shared/i18n';
import { Button, TextField } from '@/shared/ui';
import { useChangePassword } from '@/features/change-password/model/use-change-password';

const MIN_LENGTH = 8;

const schema = z
  .object({
    currentPassword: z.string().min(1, 'account.error.currentRequired'),
    newPassword: z.string().min(MIN_LENGTH, 'account.error.newMin'),
    confirmPassword: z.string().min(1, 'account.error.confirmRequired'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'account.error.mismatch',
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    path: ['newPassword'],
    message: 'account.error.same',
  });

type FormValues = z.infer<typeof schema>;

export function ChangePassword(): ReactNode {
  const { t } = useI18n();
  const { changePassword, isPending, isSuccess, error, reset: resetMutation } = useChangePassword();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      reset();
    } catch (e) {
      // Map a field-level 422 from the server back onto the form (e.g. wrong current password).
      if (e instanceof AppError && e.isValidation) {
        for (const fieldError of e.validationErrors) {
          if (fieldError.field === 'current_password') {
            setError('currentPassword', { message: 'account.error.currentIncorrect' });
          }
          if (fieldError.field === 'new_password') {
            setError('newPassword', { message: 'account.error.newInvalid' });
          }
        }
      }
    }
  });

  const generalError = error !== null && !error.isValidation ? t('common.error.generic') : null;

  const fieldError = (message: string | undefined): string | undefined =>
    message !== undefined ? t(message as MessageKey) : undefined;

  return (
    <form
      className="nc-form"
      onSubmit={(e) => {
        resetMutation();
        void onSubmit(e);
      }}
      noValidate
    >
      {generalError !== null ? (
        <div className="au-note" role="alert">
          {generalError}
        </div>
      ) : null}
      {isSuccess ? (
        <div className="au-note" role="status">
          {t('account.password.success')}
        </div>
      ) : null}

      <TextField
        label={t('account.password.current')}
        type="password"
        autoComplete="current-password"
        error={fieldError(errors.currentPassword?.message)}
        {...register('currentPassword')}
      />
      <TextField
        label={t('account.password.new')}
        type="password"
        autoComplete="new-password"
        error={fieldError(errors.newPassword?.message)}
        {...register('newPassword')}
      />
      <TextField
        label={t('account.password.confirm')}
        type="password"
        autoComplete="new-password"
        error={fieldError(errors.confirmPassword?.message)}
        {...register('confirmPassword')}
      />

      <Button type="submit" disabled={isPending}>
        {isPending ? t('account.password.submitting') : t('account.password.submit')}
      </Button>
    </form>
  );
}
