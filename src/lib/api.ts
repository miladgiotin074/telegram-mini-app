import { retrieveRawInitData } from '@tma.js/sdk-react';

import type { ChatListItem, ChatMessage, Gender, MatchProfile, Session } from '@/lib/types';

function authHeader(): string {
  try {
    return `tma ${retrieveRawInitData() || ''}`;
  } catch {
    return 'tma ';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // FormData sets its own multipart boundary, so the JSON header must be omitted.
  const isFormData = init?.body instanceof FormData;

  const response = await fetch(path, {
    ...init,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      Authorization: authHeader(),
      ...init?.headers,
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error((payload as { error?: string }).error || 'درخواست ناموفق بود');
  }

  return payload as T;
}

export function fetchSession() {
  return request<{ session: Session }>('/api/session');
}

/** Locks the Mini App to Telegram login until the account is connected. */
export function requireTelegramLogin() {
  return request<{ session: Session }>('/api/telegram-login/require', {
    method: 'POST',
  });
}

export function submitOnboarding(gender: Gender) {
  return request<{ session: Session }>('/api/onboarding', {
    method: 'POST',
    body: JSON.stringify({ gender, isAdultConfirmed: true }),
  });
}

export function findMatch() {
  return request<{ profile: MatchProfile; session: Session }>('/api/match', {
    method: 'POST',
  });
}

export function startChat() {
  return request<{ profile: MatchProfile }>('/api/chat/start', { method: 'POST' });
}

export function fetchMessages() {
  return request<{
    profile: MatchProfile | null;
    messages: ChatMessage[];
    pending: number;
    nextType: 'text' | 'voice' | 'video' | null;
    canReply: boolean;
  }>('/api/chat/messages');
}

export function fetchChats() {
  return request<{ chats: ChatListItem[] }>('/api/chats');
}

export function markChatRead() {
  return request<{ ok: boolean }>('/api/chat/read', { method: 'POST' });
}

export function sendTextMessage(text: string) {
  return request<{ message: ChatMessage }>('/api/chat/send', {
    method: 'POST',
    body: JSON.stringify({ type: 'text', text }),
  });
}

export function sendVoiceMessage(audioUrl: string, durationSec: number) {
  return request<{ message: ChatMessage }>('/api/chat/send', {
    method: 'POST',
    body: JSON.stringify({ type: 'voice', audioUrl, durationSec }),
  });
}

export function uploadPost(file: File) {
  const body = new FormData();
  body.append('file', file);

  return request<{ session: Session }>('/api/posts', { method: 'POST', body });
}

export function deletePost(order: number) {
  return request<{ session: Session }>(`/api/posts?order=${order}`, {
    method: 'DELETE',
  });
}

export function resetJourney() {
  return request<{ session: Session }>('/api/reset', { method: 'POST' });
}

/** Removes the account entirely so the flow can be replayed from scratch. */
export function deleteAccount() {
  return request<{ deleted: boolean }>('/api/account', { method: 'DELETE' });
}
