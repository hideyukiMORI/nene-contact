import type { ReactNode } from 'react';

// Line-icon set for the contact-forms list (Design System v2). Paths trace the
// 24×24 grid from the design source; rendered as inline SVG so no markup is injected.
export type FormIconName = 'plus' | 'forms' | 'bell' | 'copy' | 'check';

const PATHS: Record<FormIconName, ReactNode> = {
  plus: <path d="M12 5v14M5 12h14" />,
  forms: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </>
  ),
  check: <path d="M4 12.5l5 5L20 6" />,
};

export function FormIcon({ name, size = 16 }: { name: FormIconName; size?: number }): ReactNode {
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
