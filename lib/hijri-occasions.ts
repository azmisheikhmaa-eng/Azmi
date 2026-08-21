import { getHijriDate, gregorianDateFromHijri, HijriDate } from "./hijri-calendar";
import { EventRecord, HijriOccasionId } from "../shared/personal-data";

export const HIJRI_OCCASIONS: Record<HijriOccasionId, { day: number; month: number; title: string }> = {
  ramadan: { day: 1, month: 8, title: "بداية شهر رمضان" },
  eidAlFitr: { day: 1, month: 9, title: "عيد الفطر المبارك" },
  eidAlAdha: { day: 10, month: 11, title: "عيد الأضحى المبارك" },
};

function toDateValue(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function localNoon(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

function localNoonFromUtc(date: Date) {
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12);
}

function occurrenceForYear(occasion: HijriDate, year: number) {
  const date = gregorianDateFromHijri({ ...occasion, year });
  return date ? localNoonFromUtc(date) : undefined;
}

export function nextHijriOccasionDate(id: HijriOccasionId, reference = new Date()) {
  const occasion = HIJRI_OCCASIONS[id];
  const currentHijri = getHijriDate(reference);
  const target: HijriDate = { day: occasion.day, month: occasion.month, year: currentHijri.year };
  const referenceDay = localNoon(reference);
  const currentYearOccurrence = occurrenceForYear(target, target.year);
  const next = currentYearOccurrence && currentYearOccurrence.getTime() >= referenceDay.getTime() ? currentYearOccurrence : occurrenceForYear(target, target.year + 1);
  return next ? toDateValue(next) : undefined;
}

export function resolveEventDate(event: Pick<EventRecord, "date" | "hijriOccasionId">, reference = new Date()) {
  return event.hijriOccasionId ? nextHijriOccasionDate(event.hijriOccasionId, reference) ?? event.date : event.date;
}
