// ja is the authoritative catalog: it defines the MessageCatalog shape (ADR 0011).
export const ja = {
  'common.appName': 'NeNe Contact 管理',
  'common.loading': '読み込み中…',
  'common.retry': '再試行',
  'common.signOut': 'ログアウト',
  'common.error.generic': 'エラーが発生しました。時間をおいて再度お試しください。',
  'login.title': 'ログイン',
  'login.email': 'メールアドレス',
  'login.password': 'パスワード',
  'login.submit': 'ログイン',
  'login.submitting': 'ログイン中…',
  'login.error.invalid': 'メールアドレスまたはパスワードが正しくありません。',
  'login.error.emailRequired': 'メールアドレスを入力してください。',
  'login.error.passwordRequired': 'パスワードを入力してください。',
  'home.title': 'ダッシュボード',
  'home.welcome': 'ようこそ、{email} さん。',
  'home.role': 'ロール: {role}',
  'home.placeholder': '受信箱は次のスライスで追加されます。',
  'nav.dashboard': 'ダッシュボード',
  'nav.forms': 'フォーム',
  'contactForms.title': 'お問い合わせフォーム',
  'contactForms.empty': 'フォームがまだありません。',
  'contactForms.error': 'フォームを読み込めませんでした。',
  'contactForms.column.name': '名前',
  'contactForms.column.key': '公開キー',
  'contactForms.column.locales': '言語',
  'contactForms.column.status': '状態',
} as const;

export type MessageKey = keyof typeof ja;
export type MessageCatalog = Record<MessageKey, string>;
