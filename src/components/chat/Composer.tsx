'use client';

import { useEffect, useRef, useState } from 'react';

import { useSession } from '@/components/SessionProvider';
import { ConnectAccountModal } from '@/components/telegram-login/ConnectAccountModal';
import { useTelegramLoginGate } from '@/components/telegram-login/TelegramLoginGate';
import { sendTextMessage, sendVoiceMessage } from '@/lib/api';
import type { ChatMessage } from '@/lib/types';

/** Longest voice note we accept, keeping the base64 payload manageable. */
const MAX_RECORDING_SEC = 120;

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[22px] rtl:-scale-x-100" aria-hidden>
      <path
        fill="currentColor"
        d="M1.101 21.757 23.8 12.028 1.101 2.3v7.908l16.044 1.82-16.044 1.82v7.909z"
      />
    </svg>
  );
}

function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('خواندن فایل صوتی ناموفق بود'));
    reader.readAsDataURL(blob);
  });
}

export function Composer({ onSent }: { onSent: (message: ChatMessage) => void }) {
  const { session } = useSession();
  const { openTelegramLogin } = useTelegramLoginGate();
  const verified = Boolean(session?.isVerified);
  const [connectOpen, setConnectOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  // Set while stopping so the recorder's onstop knows to drop the recording.
  const discardRef = useRef(false);

  useEffect(() => {
    if (!recording) {
      return;
    }

    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 250);

    return () => clearInterval(timer);
  }, [recording]);

  const releaseStream = () => {
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    recorderRef.current = null;
  };

  const sendText = async () => {
    const value = text.trim();
    if (!value || sending) {
      return;
    }

    if (!verified) {
      setConnectOpen(true);
      return;
    }

    setSending(true);
    setError(null);

    try {
      const { message } = await sendTextMessage(value);
      setText('');
      onSent(message);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'ارسال ناموفق بود');
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    if (!verified) {
      setConnectOpen(true);
      return;
    }

    setError(null);

    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('ضبط صدا در این دستگاه پشتیبانی نمی‌شود');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      chunksRef.current = [];
      discardRef.current = false;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const seconds = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });

        releaseStream();
        setRecording(false);
        setElapsed(0);

        if (discardRef.current || blob.size === 0) {
          return;
        }

        setSending(true);

        try {
          const dataUrl = await blobToDataUrl(blob);
          const { message } = await sendVoiceMessage(dataUrl, seconds);
          onSent(message);
        } catch (sendError) {
          setError(sendError instanceof Error ? sendError.message : 'ارسال ویس ناموفق بود');
        } finally {
          setSending(false);
        }
      };

      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      setElapsed(0);
      setRecording(true);
      recorder.start();
    } catch {
      setError('دسترسی به میکروفون داده نشد');
    }
  };

  const stopRecording = (discard: boolean) => {
    discardRef.current = discard;
    recorderRef.current?.stop();
  };

  useEffect(() => {
    if (recording && elapsed >= MAX_RECORDING_SEC) {
      stopRecording(false);
    }
  }, [recording, elapsed]);

  useEffect(() => releaseStream, []);

  return (
    <div className="border-t border-app-border bg-app-surface px-4 py-3">
      {error && <p className="mb-2 text-center text-[11px] text-brand-soft">{error}</p>}

      {recording ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => stopRecording(true)}
            className="text-xs text-app-muted"
          >
            انصراف
          </button>

          <div className="flex flex-1 items-center gap-2 rounded-2xl bg-app-surface-2 px-4 py-3">
            <span className="size-2 animate-pulse rounded-full bg-red-500" />
            <span className="text-xs text-app-muted">در حال ضبط…</span>
            <span className="ms-auto text-xs tabular-nums text-app-text" dir="ltr">
              {formatElapsed(elapsed)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => stopRecording(false)}
            aria-label="ارسال ویس"
            className="flex size-11 items-center justify-center rounded-full bg-brand text-white"
          >
            <SendIcon />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void sendText();
              }
            }}
            disabled={sending}
            className="flex-1 rounded-2xl bg-app-surface-2 px-4 py-3 text-sm text-app-text outline-none placeholder:text-app-muted disabled:opacity-60"
            placeholder="پیام خود را بنویسید…"
          />

          {text.trim() ? (
            <button
              type="button"
              onClick={sendText}
              disabled={sending}
              aria-label="ارسال"
              className="flex size-11 items-center justify-center rounded-full bg-brand text-white disabled:opacity-60"
            >
              <SendIcon />
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={sending}
              aria-label="ضبط ویس"
              className="flex size-11 items-center justify-center rounded-full bg-app-surface-2 text-lg text-app-text disabled:opacity-60"
            >
              🎤
            </button>
          )}
        </div>
      )}
      {connectOpen && (
        <ConnectAccountModal
          onConnect={() => {
            setConnectOpen(false);
            void openTelegramLogin({ next: '/chat' });
          }}
          onClose={() => setConnectOpen(false)}
        />
      )}
    </div>
  );
}
