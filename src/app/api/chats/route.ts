import { NextResponse } from 'next/server';

import { isComposing } from '@/server/chatTiming';
import { requireUser } from '@/server/auth';
import { errorResponse } from '@/server/http';
import { Message, type MessageDoc } from '@/server/models/Message';
import { Profile, type ProfileDoc } from '@/server/models/Profile';
import { conversationReadAt } from '@/server/models/User';
import { ensureProfilesSeeded } from '@/server/seed';

type LeanMessage = MessageDoc & { _id: unknown };

/** Conversation list for the chats tab, newest activity first. */
export async function GET(request: Request) {
  try {
    const user = await requireUser(request);

    await ensureProfilesSeeded();

    const now = new Date();

    const delivered = await Message.find({
      telegramId: user.telegramId,
      deliverAt: { $lte: now },
    })
      .sort({ deliverAt: 1 })
      .lean<LeanMessage[]>();

    if (delivered.length === 0) {
      return NextResponse.json({ chats: [] });
    }

    // Later messages overwrite earlier ones, leaving the latest per conversation.
    const latest = new Map<string, LeanMessage>();
    delivered.forEach((message) => latest.set(message.profileSlug, message));

    const slugs = [...latest.keys()];

    const [profiles, counts] = await Promise.all([
      Profile.find({ slug: { $in: slugs } }).lean<ProfileDoc[]>(),
      Promise.all(
        slugs.map(async (slug) => {
          const readAt = conversationReadAt(user, slug);
          const unreadFilter = {
            telegramId: user.telegramId,
            profileSlug: slug,
            sender: 'profile' as const,
            deliverAt: readAt ? { $lte: now, $gt: readAt } : { $lte: now },
          };

          const [pendingCount, unread, next] = await Promise.all([
            Message.countDocuments({
              telegramId: user.telegramId,
              profileSlug: slug,
              deliverAt: { $gt: now },
            }),
            Message.countDocuments(unreadFilter),
            Message.findOne({
              telegramId: user.telegramId,
              profileSlug: slug,
              deliverAt: { $gt: now },
            })
              .sort({ deliverAt: 1 })
              .select('type composeAt deliverAt')
              .lean<Pick<MessageDoc, 'type' | 'composeAt' | 'deliverAt'>>(),
          ]);

          const composing = Boolean(next && isComposing(next, now));
          const activity = composing
            ? next?.type === 'voice'
              ? 'recording'
              : next?.type === 'video'
                ? 'sending'
                : 'typing'
            : null;

          return {
            pending: pendingCount,
            unread,
            activity,
          };
        }),
      ),
    ]);

    const profileBySlug = new Map(profiles.map((profile) => [profile.slug, profile]));

    const chats = slugs
      .map((slug, index) => {
        const profile = profileBySlug.get(slug);
        const message = latest.get(slug);

        if (!profile || !message) {
          return null;
        }

        return {
          slug,
          name: profile.name,
          photo: profile.photo ?? '',
          lastMessage: {
            type: message.type as 'text' | 'voice' | 'video',
            text: message.text ?? '',
            fromMe: message.sender === 'user',
            sentAt: new Date(message.deliverAt).toISOString(),
          },
          pending: counts[index].pending,
          unread: counts[index].unread,
          activity: counts[index].activity,
        };
      })
      .filter((chat): chat is NonNullable<typeof chat> => chat !== null)
      .sort((a, b) => b.lastMessage.sentAt.localeCompare(a.lastMessage.sentAt));

    return NextResponse.json({ chats });
  } catch (error) {
    return errorResponse(error);
  }
}
