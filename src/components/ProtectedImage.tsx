'use client';

import type { CSSProperties } from 'react';

import { protectedMediaUrl } from '@/lib/media';

export interface ProtectedImageProps {
  src: string;
  label?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Renders media as a CSS background behind a transparent shield, so there is no
 * `<img src>` in the DOM, no drag handle and no long-press "save image" menu.
 * Remote URLs are served through our proxy, hiding the original location.
 */
export function ProtectedImage({ src, label, className, style }: ProtectedImageProps) {
  const url = protectedMediaUrl(src);

  return (
    <div
      role="img"
      aria-label={label}
      className={className}
      style={{
        backgroundImage: url ? `url("${url}")` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        ...style,
      }}
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
      draggable={false}
    >
      <span aria-hidden className="block h-full w-full" />
    </div>
  );
}
