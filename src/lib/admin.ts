function adminTelegramIds(): number[] {
  const raw = (process.env.ADMIN_TELEGRAM_ID || '').trim();

  if (!raw) {
    return [];
  }

  return raw
    .split(/[,\s]+/)
    .map((value) => Number(value))
    .filter((id) => Number.isSafeInteger(id) && id > 0);
}

export function isAdminTelegramId(telegramId: number): boolean {
  if (!Number.isSafeInteger(telegramId) || telegramId <= 0) {
    return false;
  }

  return adminTelegramIds().includes(telegramId);
}
