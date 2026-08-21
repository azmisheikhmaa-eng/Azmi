import { getHijriDate, HIJRI_MONTHS } from "./hijri-calendar";
import { CalendarKind } from "../shared/personal-data";

export type DateUrgency = "ok" | "soon" | "expired" | "unknown";

const DAY_MS = 24 * 60 * 60 * 1000;

function dayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseLocalDay(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return undefined;
  return date;
}

export function isValidDay(value: string) {
  return Boolean(parseLocalDay(value));
}

export function daysUntil(value: string, reference = new Date()) {
  const target = parseLocalDay(value);
  if (!target) return null;
  return Math.round((dayStart(target).getTime() - dayStart(reference).getTime()) / DAY_MS);
}

export function documentUrgency(expiryDate?: string): DateUrgency {
  if (!expiryDate) return "unknown";
  const days = daysUntil(expiryDate);
  if (days === null) return "unknown";
  if (days < 0) return "expired";
  if (days <= 30) return "soon";
  return "ok";
}

export function documentUrgencyLabel(expiryDate?: string) {
  const urgency = documentUrgency(expiryDate);
  if (urgency === "expired") return "منتهية";
  if (urgency === "soon") return "قريبة الانتهاء";
  if (urgency === "ok") return "سارية";
  return "بلا تاريخ";
}

export function eventTimingLabel(value: string) {
  const days = daysUntil(value);
  if (days === null) return "بدون تاريخ صالح";
  if (days === 0) return "اليوم";
  if (days === 1) return "غدًا";
  if (days > 1 && days <= 30) return `بعد ${days} أيام`;
  if (days < 0) return "انتهى";
  return formatArabicDate(value);
}

export function formatArabicDate(value?: string) {
  const date = value ? parseLocalDay(value) : undefined;
  if (!date) return "غير محدد";
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", { day: "numeric", month: "short", year: "numeric" }).format(
    date,
  );
}

export function formatHijriArabicDate(value?: string) {
  const date = value ? parseLocalDay(value) : undefined;
  if (!date) return "غير محدد";
  const hijri = getHijriDate(date);
  return `${hijri.day} ${HIJRI_MONTHS[hijri.month]} ${hijri.year} هـ`;
}

export function formatDualArabicDate(value?: string, primary: CalendarKind = "gregorian") {
  if (!value || !isValidDay(value)) return "غير محدد";
  const gregorian = formatArabicDate(value);
  const hijri = formatHijriArabicDate(value);
  return primary === "hijri" ? `${hijri}\n${gregorian}` : `${gregorian}\n${hijri}`;
}

export function sortByUpcoming<T extends { date?: string; expiryDate?: string }>(records: T[], dateKey: "date" | "expiryDate") {
  return [...records].sort((a, b) => {
    const first = a[dateKey] ? daysUntil(a[dateKey] as string) : Number.POSITIVE_INFINITY;
    const second = b[dateKey] ? daysUntil(b[dateKey] as string) : Number.POSITIVE_INFINITY;
    const firstValue = first === null ? Number.POSITIVE_INFINITY : first < 0 ? Number.POSITIVE_INFINITY / 2 + Math.abs(first) : first;
    const secondValue = second === null ? Number.POSITIVE_INFINITY : second < 0 ? Number.POSITIVE_INFINITY / 2 + Math.abs(second) : second;
    return firstValue - secondValue;
  });
}
