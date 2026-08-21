import { describe, expect, it } from "vitest";

import { EMPTY_PERSONAL_DATA, PersonalData } from "../shared/personal-data";
import { daysUntil, documentUrgency, isValidDay } from "../lib/date-utils";
import { getHijriDate, gregorianDateFromHijri, hijriMonthDays } from "../lib/hijri-calendar";
import { formatDualArabicDate } from "../lib/date-utils";
import { nextHijriOccasionDate, resolveEventDate } from "../lib/hijri-occasions";
import { nextAnnualOccurrence } from "../lib/annual-reminders";
import { buildMemberPdfHtml, buildPersonalDataPdfHtml } from "../lib/pdf-template";
import { buildPersonalDataCsv } from "../lib/csv-template";

describe("date utilities", () => {
  it("يتحقق من صيغة التاريخ الفعلية", () => {
    expect(isValidDay("2026-08-15")).toBe(true);
    expect(isValidDay("2026-02-30")).toBe(false);
    expect(isValidDay("15-08-2026")).toBe(false);
  });

  it("يحافظ على صحة التاريخ المحلي في المناطق الزمنية الشرقية", () => {
    const originalTimezone = process.env.TZ;
    process.env.TZ = "Asia/Riyadh";
    expect(isValidDay("2026-08-15")).toBe(true);
    process.env.TZ = originalTimezone;
  });

  it("يحسب الأيام حتى التاريخ ويصنف انتهاء الوثائق", () => {
    const reference = new Date("2026-08-15T12:00:00");
    expect(daysUntil("2026-08-15", reference)).toBe(0);
    expect(daysUntil("2026-08-22", reference)).toBe(7);
    expect(documentUrgency("2026-08-14")).toBe("expired");
    expect(documentUrgency("2026-08-30")).toBe("soon");
    expect(documentUrgency("2030-01-01")).toBe("ok");
  });
});

describe("personal data model", () => {
  it("يبدأ بمجموعات محلية فارغة ومنفصلة", () => {
    expect(EMPTY_PERSONAL_DATA.members).toEqual([]);
    expect(EMPTY_PERSONAL_DATA.documents).toEqual([]);
    expect(EMPTY_PERSONAL_DATA.events).toEqual([]);
  });
});

describe("التقويم الهجري", () => {
  it("يحول تاريخًا ميلاديًا إلى الهجري ويعيده إلى اليوم الميلادي نفسه", () => {
    const original = new Date(2026, 7, 15, 12);
    const hijri = getHijriDate(original);
    const restored = gregorianDateFromHijri(hijri);

    expect(restored).toBeDefined();
    expect(restored?.getUTCFullYear()).toBe(2026);
    expect(restored?.getUTCMonth()).toBe(7);
    expect(restored?.getUTCDate()).toBe(15);
  });

  it("يحسب طول الشهر الهجري بين 29 و30 يومًا", () => {
    const hijri = getHijriDate(new Date(2026, 7, 15, 12));
    expect(hijriMonthDays(hijri.year, hijri.month)).toBeGreaterThanOrEqual(29);
    expect(hijriMonthDays(hijri.year, hijri.month)).toBeLessThanOrEqual(30);
  });

  it("يعرض التاريخين ويحسب الموعد القادم للمناسبة الهجرية", () => {
    const reference = new Date(2026, 7, 15, 12);
    const nextRamadan = nextHijriOccasionDate("ramadan", reference);
    expect(nextRamadan).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(formatDualArabicDate(nextRamadan, "hijri").split("\n")).toHaveLength(2);
    expect(resolveEventDate({ date: "2025-01-01", hijriOccasionId: "ramadan" }, reference)).toBe(nextRamadan);
  });

  it("يحسب الموعد السنوي التالي ويجهز تقرير PDF بالنص والصورة", () => {
    const upcoming = nextAnnualOccurrence("2000-08-20", new Date(2026, 7, 15, 12));
    expect(upcoming?.getFullYear()).toBe(2026);
    const data: PersonalData = { ...EMPTY_PERSONAL_DATA, members: [{ id: "m1", name: "سارة", relation: "ابنة", color: "#0E7490", createdAt: "2026-01-01", gender: "أنثى" }], documents: [{ id: "d1", title: "جواز سفر", type: "جواز السفر", createdAt: "2026-01-01", issuePlace: "الرياض", imageUris: ["file://passport.jpg"] }] };
    const html = buildPersonalDataPdfHtml(data, { d1: ["data:image/jpeg;base64,AA=="] });
    expect(html).toContain("مكان الإصدار");
    expect(html).toContain("data:image/jpeg;base64,AA==");
    expect(buildPersonalDataCsv(data)).toContain("جواز سفر");
  });

  it("ينشئ ملف PDF خاصًا بالفرد ببياناته ووثائقه وأحداثه المرتبطة", () => {
    const member = { id: "m1", name: "سارة", relation: "ابنة", color: "#0E7490", createdAt: "2026-01-01", maritalStatus: "أعزب" as const, nationality: "سعودية" };
    const documents = [{ id: "d1", title: "جواز سفر", type: "جواز السفر", createdAt: "2026-01-01", ownerId: "m1" }];
    const events = [{ id: "e1", title: "عيد الميلاد", category: "عيد ميلاد", date: "2026-08-20", createdAt: "2026-01-01", memberId: "m1", annualReminder: true }];
    const html = buildMemberPdfHtml(member, documents, events, { d1: ["data:image/jpeg;base64,AA=="] });
    expect(html).toContain("ملف سارة");
    expect(html).toContain("الحالة الاجتماعية");
    expect(html).toContain("سعودية");
    expect(html).toContain("عيد الميلاد");
    expect(html).toContain("data:image/jpeg;base64,AA==");
  });
});
