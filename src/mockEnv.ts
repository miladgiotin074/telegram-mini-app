import { emitEvent, isTMA, mockTelegramEnv } from '@tma.js/sdk-react';

export async function mockEnv(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const isTma = await isTMA('complete');
  if (isTma) {
    return;
  }

  const themeParams = {
    accent_text_color: '#6ab2f2',
    bg_color: '#17212b',
    button_color: '#5288c1',
    button_text_color: '#ffffff',
    destructive_text_color: '#ec3942',
    header_bg_color: '#17212b',
    hint_color: '#708499',
    link_color: '#6ab3f3',
    secondary_bg_color: '#232e3c',
    section_bg_color: '#17212b',
    section_header_text_color: '#6ab3f3',
    subtitle_text_color: '#708499',
    text_color: '#f5f5f5',
  } as const;

  const noInsets = { left: 0, top: 0, bottom: 0, right: 0 } as const;

  mockTelegramEnv({
    onEvent(event, next) {
      if (event.name === 'web_app_request_theme') {
        return emitEvent('theme_changed', { theme_params: themeParams });
      }
      if (event.name === 'web_app_request_viewport') {
        return emitEvent('viewport_changed', {
          height: window.innerHeight,
          width: window.innerWidth,
          is_expanded: true,
          is_state_stable: true,
        });
      }
      if (event.name === 'web_app_request_content_safe_area') {
        return emitEvent('content_safe_area_changed', noInsets);
      }
      if (event.name === 'web_app_request_safe_area') {
        return emitEvent('safe_area_changed', noInsets);
      }
      next();
    },
    launchParams: new URLSearchParams([
      ['tgWebAppThemeParams', JSON.stringify(themeParams)],
      [
        'tgWebAppData',
        new URLSearchParams([
          ['auth_date', ((Date.now() / 1000) | 0).toString()],
          ['hash', 'dev-mock-hash'],
          ['signature', 'dev-mock-signature'],
          [
            'user',
            JSON.stringify({
              id: 1,
              first_name: 'Developer',
              username: 'dev_user',
              language_code: 'fa',
              // Mirrors the avatar a real client sends, so the profile screen
              // can be exercised locally.
              photo_url: 'https://telegram.org/img/t_logo.png',
            }),
          ],
        ]).toString(),
      ],
      ['tgWebAppVersion', '8.4'],
      ['tgWebAppPlatform', 'tdesktop'],
    ]),
  });

  console.info(
    'Telegram environment mocked for local development. This only runs in dev mode.',
  );
}
