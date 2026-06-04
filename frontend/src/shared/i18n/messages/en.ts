import type { MessageCatalog } from '@/shared/i18n/messages/ja';

// en is a Partial of the authoritative ja catalog; missing keys fall back to ja.
export const en: Partial<MessageCatalog> = {
  'common.appName': 'NeNe Contact Admin',
  'common.loading': 'Loading…',
  'common.retry': 'Retry',
  'common.signOut': 'Sign out',
  'common.error.generic': 'Something went wrong. Please try again later.',
  'login.title': 'Sign in',
  'login.email': 'Email',
  'login.password': 'Password',
  'login.submit': 'Sign in',
  'login.submitting': 'Signing in…',
  'login.error.invalid': 'Incorrect email or password.',
  'login.error.emailRequired': 'Email is required.',
  'login.error.passwordRequired': 'Password is required.',
  'home.title': 'Dashboard',
  'home.welcome': 'Welcome, {email}.',
  'home.role': 'Role: {role}',
  'home.placeholder': 'Form management and the inbox arrive in the next slices.',
};
