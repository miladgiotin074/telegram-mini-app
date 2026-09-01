'use client';

import { useEffect } from 'react';

export function ErrorPage({ error }: { error: Error }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-app-bg px-6 text-center">
      <h1 className="text-lg font-bold text-app-text">خطایی رخ داد</h1>
      <p className="selectable text-sm leading-6 text-app-muted">{error.message}</p>
    </div>
  );
}
