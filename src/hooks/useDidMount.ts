import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * @return True once rendering happens on the client. Telegram Mini Apps rely on
 * `window`, so SDK-dependent trees must wait for this.
 */
export function useDidMount(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
