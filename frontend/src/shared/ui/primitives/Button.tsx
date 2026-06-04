import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function Button({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>): ReactNode {
  return (
    <button className="nc-button" {...props}>
      {children}
    </button>
  );
}
