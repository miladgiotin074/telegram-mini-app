const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/** Rewrites ASCII digits as Persian ones so numbers match the RTL typography. */
export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
}

/** Compact follower-style count, e.g. 12400 -> «۱۲٫۴ هزار». */
export function formatCompact(value: number): string {
  if (value >= 1000) {
    const thousands = (value / 1000).toFixed(1).replace(/\.0$/, '');
    return `${toPersianDigits(thousands.replace('.', '٫'))} هزار`;
  }

  return toPersianDigits(value);
}
