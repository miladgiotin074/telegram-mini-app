'use client';

import { createPortal } from 'react-dom';

import { closeHistoryOverlay, useHistoryOverlay } from '@/components/overlay/useHistoryOverlay';

export function AdminConfirmModal({
  title,
  body,
  confirmLabel,
  busy = false,
  onConfirm,
  onClose,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useHistoryOverlay(onClose);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[180] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-confirm-title"
    >
      <button
        type="button"
        aria-label="بستن"
        className="animate-backdrop-in absolute inset-0 bg-black/65 backdrop-blur-[2px]"
        onClick={busy ? undefined : closeHistoryOverlay}
      />

      <div className="animate-modal-in relative w-full max-w-sm overflow-hidden rounded-[28px] border border-white/10 bg-app-surface px-5 pb-5 pt-6 shadow-[0_-18px_50px_rgba(0,0,0,0.45)]">
        <h2 id="admin-confirm-title" className="text-lg font-black text-app-text">
          {title}
        </h2>
        <p className="mt-2 text-[13px] leading-7 text-app-muted">{body}</p>

        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          className="mt-5 w-full rounded-2xl bg-brand px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand/30 transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'در حال قطع…' : confirmLabel}
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={closeHistoryOverlay}
          className="mt-2 w-full py-2.5 text-sm font-bold text-app-muted transition-colors active:text-app-text disabled:opacity-50"
        >
          انصراف
        </button>
      </div>
    </div>,
    document.body,
  );
}
