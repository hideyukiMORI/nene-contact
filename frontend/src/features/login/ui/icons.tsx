import type { ReactNode } from 'react';

// Line-icon set for the login screen (Design System v2). Paths trace the 24×24
// grid from the design source; rendered as inline SVG so no markup is injected.
export type LoginIconName = 'send' | 'forms' | 'code' | 'inbox' | 'chevRight';

const PATHS: Record<LoginIconName, ReactNode> = {
  send: <path d="M21 3L10 14M21 3l-7 18-4-7-7-4z" />,
  forms: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
  code: <path d="M9 8l-4 4 4 4M15 8l4 4-4 4" />,
  inbox: (
    <>
      <path d="M3 13l2.5-7A2 2 0 0 1 7.4 5h9.2a2 2 0 0 1 1.9 1.3L21 13v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M3 13h5l1.5 2.5h5L16 13h5" />
    </>
  ),
  chevRight: <path d="M9 6l6 6-6 6" />,
};

export function LoginIcon({ name, size = 20 }: { name: LoginIconName; size?: number }): ReactNode {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
