export interface HijriDate {
  year: number;
  month: number;
  day: number;
}

export const HIJRI_MONTHS = ["محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"];

const DAY_MS = 24 * 60 * 60 * 1000;
const hijriFormatter = new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura-nu-latn", {
  day: "numeric",
  month: "numeric",
  timeZone: "UTC",
  year: "numeric",
});

function toUtcNoon(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12));
}

function compareHijri(left: HijriDate, right: HijriDate) {
  if (left.year !== right.year) return left.year - right.year;
  if (left.month !== right.month) return left.month - right.month;
  return left.day - right.day;
}

export function getHijriDate(date: Date): HijriDate {
  const parts = hijriFormatter.formatToParts(toUtcNoon(date));
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
  return { day: values.day, month: values.month - 1, year: values.year };
}

export function gregorianDateFromHijri(target: HijriDate) {
  const estimatedGregorianYear = Math.floor((target.year - 1) * 0.970224 + 622);
  let low = Date.UTC(estimatedGregorianYear - 2, 0, 1, 12);
  let high = Date.UTC(estimatedGregorianYear + 2, 11, 31, 12);

  while (low <= high) {
    const middle = low + Math.floor((high - low) / (2 * DAY_MS)) * DAY_MS;
    const candidate = new Date(middle);
    const comparison = compareHijri(getHijriDate(candidate), target);
    if (comparison === 0) return candidate;
    if (comparison < 0) low = middle + DAY_MS;
    else high = middle - DAY_MS;
  }

  return undefined;
}

export function hijriMonthDays(year: number, month: number) {
  const first = gregorianDateFromHijri({ year, month, day: 1 });
  const nextMonth = month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };
  const next = gregorianDateFromHijri({ ...nextMonth, day: 1 });
  if (!first || !next) return 29;
  return Math.round((next.getTime() - first.getTime()) / DAY_MS);
}

export function hijriFirstDayOffset(year: number, month: number) {
  const first = gregorianDateFromHijri({ year, month, day: 1 });
  return first ? (first.getUTCDay() + 1) % 7 : 0;
}
