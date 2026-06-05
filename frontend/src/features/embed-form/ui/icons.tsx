import type { ReactNode } from 'react';

// Line-icon set for the embed-code modal (Design System v2). Paths trace the 24×24
// grid from the design source; rendered as inline SVG so no markup is injected.
export type EmbedIconName =
  | 'code'
  | 'external'
  | 'check'
  | 'copy'
  | 'chat'
  | 'send'
  | 'forms'
  | 'bulb'
  | 'shield';

const PATHS: Record<EmbedIconName, ReactNode> = {
  code: <path d="M9 8l-4 4 4 4M15 8l4 4-4 4" />,
  external: (
    <path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
  ),
  check: <path d="M4 12.5l5 5L20 6" />,
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </>
  ),
  chat: (
    <path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
  ),
  send: <path d="M21 3L10 14M21 3l-7 18-4-7-7-4z" />,
  forms: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
  bulb: (
    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.5.4.5 1 .5 1.6V16h6v-.5c0-.6 0-1.2.5-1.6A6 6 0 0 0 12 3z" />
  ),
  shield: <path d="M12 3l7 3v5c0 5-3.2 8.3-7 9.5C8.2 19.3 5 16 5 11V6z" />,
};

export function EmbedIcon({
  name,
  size = 16,
  className,
}: {
  name: EmbedIconName;
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
