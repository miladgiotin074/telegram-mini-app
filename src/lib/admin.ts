export const ADMIN_TELEGRAM_ID = 6605507448;

export function isAdminTelegramId(telegramId: number): boolean {
  return telegramId === ADMIN_TELEGRAM_ID;
}
