import type { ReactNode } from 'react';

// Line-icon set for the inbox (Design System v2). Paths trace the 24×24 grid from
// the design source; rendered as inline SVG so no markup is injected.
export type InboxIconName =
  | 'inbox'
  | 'chevLeft'
  | 'chevRight'
  | 'chevDown'
  | 'search'
  | 'calendar'
  | 'x';

const PATHS: Record<InboxIconName, ReactNode> = {
  inbox: (
    <>
      <path d="M3 13l2.5-7A2 2 0 0 1 7.4 5h9.2a2 2 0 0 1 1.9 1.3L21 13v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M3 13h5l1.5 2.5h5L16 13h5" />
    </>
  ),
  chevLeft: <path d="M15 6l-6 6 6 6" />,
  chevRight: <path d="M9 6l6 6-6 6" />,
  chevDown: <path d="M6 9l6 6 6-6" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4-4" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </>
  ),
  x: <path d="M6 6l12 12M18 6L6 18" />,
};

export function InboxIcon({ name, size = 16 }: { name: InboxIconName; size?: number }): ReactNode {
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
