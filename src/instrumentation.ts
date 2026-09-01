export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  const { registerTelegramBotInfra } = await import('@/server/telegram/registerBot');

  try {
    await registerTelegramBotInfra();
  } catch (error) {
    console.error('Telegram webhook setup failed', error);
  }
}
