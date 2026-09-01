import { NextResponse } from 'next/server';

import { requireUser } from '@/server/auth';
import { errorResponse } from '@/server/http';
import { Message } from '@/server/models/Message';
import { TelegramLoginAttempt } from '@/server/models/TelegramLoginAttempt';
import { Upload } from '@/server/models/Upload';
import { User } from '@/server/models/User';

/**
 * Wipes everything stored for the caller, including onboarding answers. The
 * user document is recreated blank on the next request, so reopening the app
 * replays the journey from the very first screen.
 */
export async function DELETE(request: Request) {
  try {
    const user = await requireUser(request);

    await Promise.all([
      Message.deleteMany({ telegramId: user.telegramId }),
      Upload.deleteMany({ telegramId: user.telegramId }),
      TelegramLoginAttempt.deleteMany({ telegramId: user.telegramId }),
      User.deleteOne({ telegramId: user.telegramId }),
    ]);

    return NextResponse.json({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
