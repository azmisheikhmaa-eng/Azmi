export type RecordKind = "member" | "document" | "event";
export type CalendarKind = "gregorian" | "hijri";
export type HijriOccasionId = "ramadan" | "eidAlFitr" | "eidAlAdha";
export type Gender = "ذكر" | "أنثى" | "غير محدد";
export type MaritalStatus = "أعزب" | "متزوج" | "مطلق" | "أرمل";

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  birthDate?: string;
  photoUri?: string;
  phone?: string;
  email?: string;
  address?: string;
  gender?: Gender;
  religion?: string;
  birthPlace?: string;
  nationalId?: string;
  maritalStatus?: MaritalStatus;
  nationality?: string;
  birthdayReminder?: boolean;
  marriageDate?: string;
  marriageReminder?: boolean;
  notes?: string;
  color: string;
  createdAt: string;
}

export interface DocumentRecord {
  id: string;
  title: string;
  type: string;
  number?: string;
  ownerId?: string;
  issueDate?: string;
  expiryDate?: string;
  imageUri?: string;
  imageUris?: string[];
  issuePlace?: string;
  notes?: string;
  createdAt: string;
}

export interface EventRecord {
  id: string;
  title: string;
  category: string;
  date: string;
  hijriOccasionId?: HijriOccasionId;
  annualReminder?: boolean;
  memberId?: string;
  notes?: string;
  createdAt: string;
}

export interface PersonalData {
  members: FamilyMember[];
  documents: DocumentRecord[];
  events: EventRecord[];
  settings: {
    notificationsEnabled: boolean;
    defaultCalendar: CalendarKind;
    annualRemindersEnabled: boolean;
  };
}

export const EMPTY_PERSONAL_DATA: PersonalData = { members: [], documents: [], events: [], settings: { notificationsEnabled: false, defaultCalendar: "gregorian", annualRemindersEnabled: true } };

export const MEMBER_COLORS = ["#0E7490", "#7C3AED", "#C2410C", "#15803D", "#BE185D", "#1D4ED8"];
