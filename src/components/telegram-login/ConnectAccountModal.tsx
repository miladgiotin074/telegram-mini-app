'use client';

import { createPortal } from 'react-dom';

import {
  closeHistoryOverlay,
  replaceHistoryOverlay,
  useHistoryOverlay,
} from '@/components/overlay/useHistoryOverlay';
import {
  CONNECT_MODAL_BODY,
  CONNECT_MODAL_CTA,
  CONNECT_MODAL_LATER,
  CONNECT_MODAL_TITLE,
} from '@/lib/chatGate';

function TelegramGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-7" aria-hidden>
      <path
        fill="currentColor"
        d="M21.5 3.4 2.7 10.6c-1.3.5-1.3 1.2-.2 1.5l4.8 1.5 11.2-7.1c.5-.3 1-.1.6.3l-9 8.6-.4 4.8c.5 0 .8-.2 1.1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.8-.8l3.1-14.8c.3-1.3-.5-1.9-1.5-1.5Z"
      />
    </svg>
  );
}

export function ConnectAccountModal({
  onConnect,
  onClose,
}: {
  onConnect: () => void;
  onClose: () => void;
}) {
  useHistoryOverlay(onClose);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[180] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="connect-account-title">
      <button
        type="button"
        aria-label="بستن"
        className="animate-backdrop-in absolute inset-0 bg-black/65 backdrop-blur-[2px]"
        onClick={closeHistoryOverlay}
      />

      <div className="animate-modal-in relative w-full max-w-sm overflow-hidden rounded-[28px] border border-white/10 bg-app-surface px-5 pb-5 pt-6 shadow-[0_-18px_50px_rgba(0,0,0,0.45)]">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-16 left-1/2 size-40 -translate-x-1/2 rounded-full bg-[#50A8EB]/25 blur-3xl"
        />

        <div className="relative flex flex-col items-center text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-[#50A8EB] text-white shadow-lg shadow-[#50A8EB]/40">
            <TelegramGlyph />
          </span>

          <h2 id="connect-account-title" className="mt-4 text-lg font-black text-app-text">
            {CONNECT_MODAL_TITLE}
          </h2>
          <p className="mt-2 text-[13px] leading-7 text-app-muted">{CONNECT_MODAL_BODY}</p>
        </div>

        <button
          type="button"
          onClick={() => {
            replaceHistoryOverlay();
            onConnect();
          }}
          className="relative mt-5 w-full rounded-2xl bg-[#50A8EB] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#50A8EB]/30 transition-transform active:scale-[0.98]"
        >
          {CONNECT_MODAL_CTA}
        </button>

        <button
          type="button"
          onClick={closeHistoryOverlay}
          className="mt-2 w-full py-2.5 text-sm font-bold text-app-muted transition-colors active:text-app-text"
        >
          {CONNECT_MODAL_LATER}
        </button>
      </div>
    </div>,
    document.body,
  );
}
