/** Idle gap after a message (or before the first one) with no typing indicator. */
export function idleDurationMs(isFirst: boolean): number {
  if (isFirst) {
    return randomBetween(1500, 3000);
  }

  return randomBetween(3000, 7000);
}

/** How long the partner appears to type or record before the message lands. */
export function composeDurationMs(item: {
  type: string;
  text?: string;
  durationSec?: number;
}): number {
  if (item.type === 'voice') {
    const recorded = (item.durationSec ?? 4) * 1000;
    return Math.min(Math.max(recorded + 600, 2500), 8000);
  }

  if (item.type === 'video') {
    return randomBetween(2500, 4500);
  }

  const chars = (item.text ?? '').length;
  const typed = Math.round(chars * (100 + Math.random() * 50));
  return Math.min(Math.max(typed, 1200), 5500);
}

export function isComposing(
  message: { composeAt?: Date | string | null; deliverAt: Date | string },
  now: Date,
): boolean {
  const deliverAt = new Date(message.deliverAt).getTime();

  if (Number.isNaN(deliverAt) || deliverAt <= now.getTime()) {
    return false;
  }

  if (message.composeAt) {
    const composeAt = new Date(message.composeAt).getTime();
    return !Number.isNaN(composeAt) && composeAt <= now.getTime();
  }

  // Older rows had no composeAt; only show activity shortly before delivery.
  return now.getTime() >= deliverAt - 2500;
}

function randomBetween(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}
