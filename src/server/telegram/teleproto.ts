import { createRequire } from 'node:module';
import path from 'node:path';

/**
 * Next.js may bundle `teleproto` separately from the copy the library itself
 * `require`s, which breaks `instanceof Session` inside TelegramClient.
 * Resolving from the project root uses Node's module cache instead.
 */
const requireTeleproto = createRequire(path.join(process.cwd(), 'package.json'));
const loaded = requireTeleproto('teleproto') as typeof import('teleproto');

export const Api = loaded.Api;

export type TelegramClient = import('teleproto').TelegramClient;
export const TelegramClient: typeof import('teleproto').TelegramClient = loaded.TelegramClient;

export const sessions = loaded.sessions;
export const errors = loaded.errors;
export const helpers = loaded.helpers;
export const mtprotoPassword = loaded.password;
