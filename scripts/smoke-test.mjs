/**
 * Exercises the full user journey against a running dev server.
 * Usage: node scripts/smoke-test.mjs [baseUrl]
 */
const BASE = process.argv[2] || 'http://localhost:3000';

const initData = new URLSearchParams([
  ['auth_date', String((Date.now() / 1000) | 0)],
  ['hash', 'smoke-test-hash'],
  ['signature', 'smoke-test-signature'],
  ['user', JSON.stringify({ id: 999001, first_name: 'Smoke', username: 'smoke_tester' })],
]).toString();

async function call(path, options = {}) {
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      Authorization: `tma ${initData}`,
    },
  });

  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}

/** Smallest valid PNG, used to exercise the upload endpoint. */
const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
  'base64',
);

function pngFile(name) {
  const form = new FormData();
  form.append('file', new Blob([PNG_BYTES], { type: 'image/png' }), name);
  return form;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function check(label, condition, detail) {
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${label}`);
  if (!condition) {
    console.log('      ', JSON.stringify(detail));
    process.exitCode = 1;
  }
}

const reset = await call('/api/reset', { method: 'POST' });
check('reset', reset.status === 200, reset);

const session = await call('/api/session');
check('session', session.status === 200 && session.body.session?.telegramId === 999001, session);

const onboarding = await call('/api/onboarding', {
  method: 'POST',
  body: JSON.stringify({ gender: 'male', isAdultConfirmed: true }),
});
check('onboarding', onboarding.body.session?.gender === 'male', onboarding);

const upload = await call('/api/posts', { method: 'POST', body: pngFile('a.png') });
check(
  'user can upload a post',
  upload.status === 200 && upload.body.session?.posts?.length === 1,
  upload.body.session?.posts,
);

const uploadedUrl = upload.body.session?.posts?.[0]?.url;
const mediaResponse = await fetch(`${BASE}${uploadedUrl}`);
const mediaBytes = Buffer.from(await mediaResponse.arrayBuffer());
check(
  'uploaded media is served back byte for byte',
  mediaResponse.status === 200 &&
    mediaResponse.headers.get('content-type') === 'image/png' &&
    mediaBytes.equals(PNG_BYTES),
  {
    status: mediaResponse.status,
    type: mediaResponse.headers.get('content-type'),
    expected: PNG_BYTES.length,
    received: mediaBytes.length,
  },
);

const ranged = await fetch(`${BASE}${uploadedUrl}`, { headers: { Range: 'bytes=0-9' } });
const rangedBytes = Buffer.from(await ranged.arrayBuffer());
check(
  'media supports range requests',
  ranged.status === 206 &&
    rangedBytes.equals(PNG_BYTES.subarray(0, 10)) &&
    ranged.headers.get('content-range') === `bytes 0-9/${PNG_BYTES.length}`,
  {
    status: ranged.status,
    length: rangedBytes.length,
    contentRange: ranged.headers.get('content-range'),
  },
);

const removed = await call('/api/posts?order=1', { method: 'DELETE' });
check(
  'user can delete a post',
  removed.status === 200 && removed.body.session?.posts?.length === 0,
  removed.body.session?.posts,
);

const match = await call('/api/match', { method: 'POST' });
check('match returns opposite gender', match.body.profile?.gender === 'female', match);
console.log('       matched with:', match.body.profile?.name);

const start = await call('/api/chat/start', { method: 'POST' });
check('chat start', start.status === 200, start);

await sleep(10000);

const firstWave = await call('/api/chat/messages');
const firstDelivered = firstWave.body.messages?.length ?? 0;
const firstPending = firstWave.body.pending ?? 0;
check(
  'at least one scripted message has arrived',
  firstDelivered >= 1 && firstPending === 7 - firstDelivered,
  { firstDelivered, firstPending },
);

const chatsBeforeRead = await call('/api/chats');
const unreadBefore = chatsBeforeRead.body.chats?.[0]?.unread;
check(
  'unread badge matches delivered messages, not remaining script',
  unreadBefore === firstDelivered,
  { unreadBefore, firstDelivered, chat: chatsBeforeRead.body.chats?.[0] },
);

const marked = await call('/api/chat/read', { method: 'POST' });
check('mark chat read', marked.status === 200, marked);

const chatsAfterRead = await call('/api/chats');
check(
  'opening the chat clears the unread badge',
  chatsAfterRead.body.chats?.[0]?.unread === 0,
  chatsAfterRead.body.chats?.[0],
);

let delivered = 0;
let pending = 0;
let sawRecording = false;

// Idle gaps plus compose time now span well over a minute.
for (let attempt = 0; attempt < 60; attempt += 1) {
  const messages = await call('/api/chat/messages');
  delivered = messages.body.messages?.length ?? 0;
  pending = messages.body.pending ?? 0;
  const next = messages.body.nextType ?? null;
  sawRecording = sawRecording || next === 'voice';
  console.log(
    `       t+${attempt * 2}s  delivered=${delivered} pending=${pending} next=${next}`,
  );

  if (pending === 0 && delivered > 0) {
    break;
  }
  await sleep(2000);
}

check('a voice note is announced before it arrives', sawRecording, sawRecording);

check('all scripted messages delivered', delivered === 7 && pending === 0, { delivered, pending });

const idempotent = await call('/api/chat/start', { method: 'POST' });
const after = await call('/api/chat/messages');
check(
  'chat start is idempotent',
  idempotent.status === 200 && after.body.messages.length === delivered,
  after.body.messages?.length,
);

check('reply is unlocked', after.body.canReply === true, after.body.canReply);

const sentText = await call('/api/chat/send', {
  method: 'POST',
  body: JSON.stringify({ type: 'text', text: 'سلام، تست ارسال' }),
});
check(
  'user can send a text message',
  sentText.status === 200 && sentText.body.message?.sender === 'user',
  sentText.body.message?.text,
);

const sentVoice = await call('/api/chat/send', {
  method: 'POST',
  body: JSON.stringify({
    type: 'voice',
    audioUrl: 'data:audio/webm;base64,AAAA',
    durationSec: 4,
  }),
});
check(
  'user can send a voice message',
  sentVoice.status === 200 && sentVoice.body.message?.type === 'voice',
  sentVoice.body.message?.durationSec,
);

const rejected = await call('/api/chat/send', {
  method: 'POST',
  body: JSON.stringify({ type: 'voice', audioUrl: 'https://example.com/a.mp3' }),
});
check('non-audio payloads are rejected', rejected.status === 400, rejected.status);

await call('/api/reset', { method: 'POST' });
console.log('\ndone');
