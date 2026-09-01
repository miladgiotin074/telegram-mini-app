/**
 * Heuristics for bidirectional (BiDi) text in an RTL application.
 *
 * When `dir="rtl"` is set on the document, the Unicode BiDi algorithm still
 * reorders *runs* of left-to-right characters (Latin letters, digits, @, URLs…)
 * relative to surrounding RTL text. That is why `@milad` can render as
 * `milad@` visually — the `@` is not "wrong", it is placed according to mixed
 * direction rules unless we isolate the LTR run.
 */

const RTL_CHAR = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const LTR_CHAR = /[A-Za-z0-9]/;

/** True when the string should be displayed as an isolated LTR run. */
export function isPredominantlyLtr(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) {
    return false;
  }

  // Handles @handle, emails, URLs, codes, version strings, etc.
  if (/^[@#$/]|:\/\/|[A-Za-z0-9][\w.-]*@/.test(trimmed)) {
    return true;
  }

  let ltr = 0;
  let rtl = 0;

  for (const char of trimmed) {
    if (LTR_CHAR.test(char)) {
      ltr += 1;
    } else if (RTL_CHAR.test(char)) {
      rtl += 1;
    }
  }

  if (ltr === 0) {
    return false;
  }

  return rtl === 0 || ltr >= rtl;
}

export function stripAtPrefix(username: string): string {
  return username.replace(/^@+/, '');
}

export function atUsername(username: string): string {
  return `@${stripAtPrefix(username)}`;
}
