import type { ReactNode } from 'react';

// Line-icon set for the dashboard (Design System v2). Paths trace the 24×24 grid
// from the design source; rendered as inline SVG so no markup is injected.
export type DashIconName = 'forms' | 'inbox' | 'mail' | 'check' | 'chevRight' | 'user';

const PATHS: Record<DashIconName, ReactNode> = {
  forms: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
  inbox: (
    <>
      <path d="M3 13l2.5-7A2 2 0 0 1 7.4 5h9.2a2 2 0 0 1 1.9 1.3L21 13v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M3 13h5l1.5 2.5h5L16 13h5" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M4 7l8 6 8-6" />
    </>
  ),
  check: <path d="M4 12.5l5 5L20 6" />,
  chevRight: <path d="M9 6l6 6-6 6" />,
  user: (
    <>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </>
  ),
};

export function DashIcon({ name, size = 16 }: { name: DashIconName; size?: number }): ReactNode {
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
