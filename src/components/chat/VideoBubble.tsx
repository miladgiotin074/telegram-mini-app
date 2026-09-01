'use client';

/** In-chat video bubble. Tapping plays inline, like a native messenger. */
export function VideoBubble({ src, label }: { src: string; label: string }) {
  return (
    <video
      src={src}
      controls
      playsInline
      preload="metadata"
      aria-label={label}
      className="block max-h-72 w-full bg-black object-cover"
      onContextMenu={(event) => event.preventDefault()}
    />
  );
}
