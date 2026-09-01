import { retrieveLaunchParams } from '@tma.js/sdk-react';

import { init } from '@/core/init';
import { mockEnv } from '@/mockEnv';

void mockEnv().then(() => {
  try {
    const launchParams = retrieveLaunchParams();
    const { tgWebAppPlatform: platform } = launchParams;
    const debug =
      (launchParams.tgWebAppStartParam || '').includes('debug') ||
      process.env.NODE_ENV === 'development';

    void init({
      debug,
      eruda: false,
      mockForMacOS: platform === 'macos',
    });
  } catch (error) {
    console.error('Telegram SDK init failed:', error);
  }
});
