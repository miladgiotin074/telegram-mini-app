'use client';

import { usePathname } from 'next/navigation';
import type { PropsWithChildren } from 'react';

import { ChatsScreen } from '@/components/screens/ChatsScreen';
import { HomeScreen } from '@/components/screens/HomeScreen';

/**
 * Home and Chats stay mounted like native tabs. Changing the URL only toggles
 * visibility, so the switch is instant and scroll/state survive.
 */
export function TabHost({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isChats = pathname === '/chats';

  return (
    <>
      <div hidden={!isHome} inert={!isHome}>
        <HomeScreen active={isHome} />
      </div>
      <div hidden={!isChats} inert={!isChats}>
        <ChatsScreen active={isChats} />
      </div>
      {isHome || isChats ? null : children}
    </>
  );
}
