'use client';

import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'ghost' | 'outline';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-gradient-to-l from-brand to-brand-strong text-white shadow-lg shadow-brand/25 disabled:from-app-surface-2 disabled:to-app-surface-2 disabled:text-app-muted disabled:shadow-none',
  ghost: 'bg-app-surface-2 text-app-text disabled:text-app-muted',
  outline: 'border border-app-border text-app-text disabled:text-app-muted',
};

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={`rounded-2xl px-5 py-3.5 text-sm font-bold transition-transform active:scale-[0.98] disabled:active:scale-100 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
