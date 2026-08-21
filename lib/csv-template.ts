import { PersonalData } from "../shared/personal-data";

function escapeCsv(value: string | number | undefined) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildPersonalDataCsv(data: PersonalData) {
  const rows: (string | number | undefined)[][] = [["القسم", "العنوان أو الاسم", "النوع أو الصلة", "التاريخ", "بيانات إضافية", "التواصل"]];
  data.members.forEach((member) => rows.push(["العائلة", member.name, member.relation, member.birthDate, [member.gender, member.religion, member.birthPlace].filter(Boolean).join(" · "), member.phone ?? member.email]));
  data.documents.forEach((document) => rows.push(["الوثائق", document.title, document.type, document.expiryDate, [document.number, document.issuePlace, `${document.imageUris?.length ?? (document.imageUri ? 1 : 0)} صورة`].filter(Boolean).join(" · "), ""]));
  data.events.forEach((event) => rows.push(["الأحداث", event.title, event.category, event.date, event.hijriOccasionId ? "هجري متكرر" : event.annualReminder ? "تذكير سنوي" : "", ""]));
  return `\uFEFF${rows.map((row) => row.map(escapeCsv).join(",")).join("\n")}`;
}
