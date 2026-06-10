import { useId } from 'react';
import type { ReactNode } from 'react';

// 確定版ロゴ (brand/nene-mark.svg): a rounded square in the brand colour with the origami
// paper-plane glyph knocked out, so the background shows through the plane. Fill follows the
// theme brand token. Inline (no asset path) so it works under any base path.
export function BrandMark({ size = 30 }: { size?: number }): ReactNode {
  const maskId = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="NeNe Contact">
      <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="48" height="48">
        <rect x="0" y="0" width="48" height="48" fill="#fff" />
        <path d="M24 4 L6 40 L24 29 L42 40 Z" fill="#000" />
        <path d="M24 4 L24 29" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
      </mask>
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="12"
        fill="var(--ex-brand)"
        mask={`url(#${maskId})`}
      />
    </svg>
  );
}
