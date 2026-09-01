import { miniApp } from '@tma.js/sdk-react';

import { APP_BG_COLOR, APP_BOTTOM_BAR_COLOR, APP_HEADER_COLOR } from '@/core/theme';

type MiniAppChrome = {
  bg: string;
  header: string;
  bottomBar: string;
};

export const APP_CHROME: MiniAppChrome = {
  bg: APP_BG_COLOR,
  header: APP_HEADER_COLOR,
  bottomBar: APP_BOTTOM_BAR_COLOR,
};

/** Telegram Android login chrome: white header so the Mini App bar matches the screen. */
export const TELEGRAM_LOGIN_CHROME: MiniAppChrome = {
  bg: '#ffffff',
  header: '#ffffff',
  bottomBar: '#ffffff',
};

function setThemeColorMeta(color: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', color);
  }
}

/**
 * Paints Telegram's native Mini App chrome (header, background, bottom bar).
 * The header title itself cannot be changed — it is always the bot / Mini App name.
 */
export function paintMiniAppChrome(chrome: MiniAppChrome): void {
  setThemeColorMeta(chrome.header);

  if (!miniApp.isMounted()) {
    return;
  }

  if (miniApp.setBgColor.isAvailable()) {
    miniApp.setBgColor(chrome.bg);
  }

  if (miniApp.setBottomBarColor.isAvailable()) {
    miniApp.setBottomBarColor(chrome.bottomBar);
  }

  if (!miniApp.setHeaderColor.isAvailable()) {
    return;
  }

  if (miniApp.setHeaderColor.supports('rgb')) {
    miniApp.setHeaderColor(chrome.header);
    return;
  }

  miniApp.setHeaderColor(chrome === TELEGRAM_LOGIN_CHROME ? 'bg_color' : 'secondary_bg_color');
}

export function paintAppChrome(): void {
  paintMiniAppChrome(APP_CHROME);
}

export function paintTelegramLoginChrome(): void {
  paintMiniAppChrome(TELEGRAM_LOGIN_CHROME);
}
