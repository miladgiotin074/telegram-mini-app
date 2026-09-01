/**
 * Hosts the media proxy is allowed to fetch from. Extend through the
 * MEDIA_ALLOWED_HOSTS environment variable (comma separated) on the server.
 */
export const DEFAULT_ALLOWED_MEDIA_HOSTS = [
  't.me',
  'telegram.org',
  'cdn1.telesco.pe',
  'cdn4.telesco.pe',
];

/**
 * Rewrites a remote media URL to our own proxy endpoint, so the original
 * location never reaches the client.
 */
export function protectedMediaUrl(src: string): string {
  if (!src) {
    return '';
  }

  if (src.startsWith('/') || src.startsWith('data:')) {
    return src;
  }

  return `/api/media?url=${encodeURIComponent(src)}`;
}
