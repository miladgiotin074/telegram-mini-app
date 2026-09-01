export const SEARCH_COACH_KEY = 'tma.searchCoachSeen';

export function hasSeenSearchCoach(): boolean {
  try {
    return window.localStorage.getItem(SEARCH_COACH_KEY) === '1';
  } catch {
    return false;
  }
}

export function markSearchCoachSeen(): void {
  try {
    window.localStorage.setItem(SEARCH_COACH_KEY, '1');
  } catch {
    // Private mode can block storage; the coach then only lasts this visit.
  }
}

export function clearSearchCoach(): void {
  try {
    window.localStorage.removeItem(SEARCH_COACH_KEY);
  } catch {
    // Ignore.
  }
}
