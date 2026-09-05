import { AuthError, requireUser } from '@/server/auth';
import { isAdminTelegramId } from '@/lib/admin';
import type { UserDoc } from '@/server/models/User';

export async function requireAdmin(request: Request): Promise<UserDoc> {
  const user = await requireUser(request);

  if (!isAdminTelegramId(user.telegramId)) {
    throw new AuthError('دسترسی غیرمجاز', 403);
  }

  return user;
}
