import type { ReactNode } from 'react';

// Line-icon set for the notification-channels screen (Design System v2). Paths trace
// the 24×24 grid from the design source; rendered as inline SVG so no markup is injected.
export type ChannelIconName =
  | 'arrowLeft'
  | 'bell'
  | 'plus'
  | 'info'
  | 'mail'
  | 'slack'
  | 'chat'
  | 'code';

const PATHS: Record<ChannelIconName, ReactNode> = {
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <circle cx="12" cy="8" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M4 7l8 6 8-6" />
    </>
  ),
  slack: (
    <>
      <rect x="10" y="3" width="4" height="11" rx="2" />
      <rect x="10" y="14" width="4" height="7" rx="2" />
      <rect x="3" y="10" width="11" height="4" rx="2" />
      <rect x="14" y="10" width="7" height="4" rx="2" />
    </>
  ),
  chat: (
    <path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
  ),
  code: <path d="M9 8l-4 4 4 4M15 8l4 4-4 4" />,
};

export function ChannelIcon({
  name,
  size = 16,
  className,
}: {
  name: ChannelIconName;
  size?: number;
  className?: string;
}): ReactNode {
  return (
    <svg
      className={className}
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
