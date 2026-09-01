import {
  backButton,
  closingBehavior,
  emitEvent,
  init as initSDK,
  initData,
  miniApp,
  mockTelegramEnv,
  retrieveLaunchParams,
  setDebug,
  swipeBehavior,
  themeParams,
  type ThemeParams,
  viewport,
} from '@tma.js/sdk-react';

import { APP_CHROME, paintMiniAppChrome } from '@/core/miniAppChrome';

/**
 * Paints the native Telegram chrome with our own palette. Colors are sent as
 * explicit RGB values, which also stops Telegram from repainting them whenever
 * the user switches theme.
 */
function applyAppTheme(): void {
  paintMiniAppChrome(APP_CHROME);
}

export async function init(options: {
  debug: boolean;
  eruda: boolean;
  mockForMacOS: boolean;
}): Promise<void> {
  setDebug(options.debug);
  initSDK();

  if (options.eruda) {
    void import('eruda').then(({ default: eruda }) => {
      eruda.init();
      eruda.position({ x: window.innerWidth - 50, y: 0 });
    });
  }

  if (options.mockForMacOS) {
    let firstThemeSent = false;
    mockTelegramEnv({
      onEvent(event, next) {
        if (event.name === 'web_app_request_theme') {
          let tp: Partial<ThemeParams> = {};
          if (firstThemeSent) {
            tp = themeParams.state as Partial<ThemeParams>;
          } else {
            firstThemeSent = true;
            const lp = retrieveLaunchParams();
            tp = (lp.tgWebAppThemeParams || {}) as Partial<ThemeParams>;
          }
          return emitEvent('theme_changed', { theme_params: tp as Record<string, `#${string}`> });
        }

        if (event.name === 'web_app_request_safe_area') {
          return emitEvent('safe_area_changed', {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
          });
        }

        next();
      },
    });
  }

  backButton.mount();
  initData.restore();

  try {
    closingBehavior.mount();
    if (closingBehavior.enableConfirmation.isAvailable()) {
      closingBehavior.enableConfirmation();
    }
  } catch {
    // closingBehavior not available outside Telegram
  }

  try {
    miniApp.mount();
    applyAppTheme();
  } catch {
    // miniApp not available outside Telegram
  }

  try {
    await viewport.mount();
    viewport.bindCssVars();

    if (viewport.expand.isAvailable()) {
      viewport.expand();
    }

    applyAppTheme();
  } catch {
    // viewport not available outside Telegram
  }

  try {
    swipeBehavior.mount();
    if (swipeBehavior.disableVertical.isAvailable()) {
      swipeBehavior.disableVertical();
    }
  } catch {
    // swipeBehavior not available outside Telegram
  }
}
