import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { CalendarKind, EMPTY_PERSONAL_DATA, FamilyMember, DocumentRecord, EventRecord, MEMBER_COLORS, PersonalData } from "@/shared/personal-data";
import { clearLocalReminders, enableLocalReminders, syncLocalReminders } from "@/lib/notifications";

const STORAGE_KEY = "@hayati/personal-data/v1";

type MemberInput = Omit<FamilyMember, "id" | "createdAt" | "color"> & { id?: string };
type DocumentInput = Omit<DocumentRecord, "id" | "createdAt"> & { id?: string };
type EventInput = Omit<EventRecord, "id" | "createdAt"> & { id?: string };

interface PersonalDataContextValue {
  data: PersonalData;
  isReady: boolean;
  upsertMember: (input: MemberInput) => void;
  upsertDocument: (input: DocumentInput) => void;
  upsertEvent: (input: EventInput) => void;
  deleteMember: (id: string) => void;
  deleteDocument: (id: string) => void;
  deleteEvent: (id: string) => void;
  clearData: () => void;
  setNotificationsEnabled: (enabled: boolean) => Promise<boolean>;
  setDefaultCalendar: (calendar: CalendarKind) => void;
  setAnnualRemindersEnabled: (enabled: boolean) => void;
  memberName: (id?: string) => string | undefined;
}

const PersonalDataContext = createContext<PersonalDataContextValue | undefined>(undefined);

function createId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function PersonalDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PersonalData>(EMPTY_PERSONAL_DATA);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!stored) return;
        const parsed = JSON.parse(stored) as Partial<PersonalData>;
        setData({
          members: Array.isArray(parsed.members) ? parsed.members : [],
          documents: Array.isArray(parsed.documents) ? parsed.documents : [],
          events: Array.isArray(parsed.events) ? parsed.events : [],
          settings: { notificationsEnabled: parsed.settings?.notificationsEnabled === true, defaultCalendar: parsed.settings?.defaultCalendar === "hijri" ? "hijri" : "gregorian", annualRemindersEnabled: parsed.settings?.annualRemindersEnabled !== false },
        });
      })
      .catch(() => setData(EMPTY_PERSONAL_DATA))
      .finally(() => setIsReady(true));
  }, []);

  const commit = useCallback((next: PersonalData) => {
    setData(next);
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const upsertMember = useCallback((input: MemberInput) => {
    setData((current) => {
      const isEditing = Boolean(input.id);
      const existing = current.members.find((member) => member.id === input.id);
      const member: FamilyMember = {
        ...input,
        id: input.id ?? createId("member"),
        color: existing?.color ?? MEMBER_COLORS[current.members.length % MEMBER_COLORS.length],
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      };
      const next = {
        ...current,
        members: isEditing ? current.members.map((item) => (item.id === member.id ? member : item)) : [member, ...current.members],
      };
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const upsertDocument = useCallback((input: DocumentInput) => {
    setData((current) => {
      const existing = current.documents.find((document) => document.id === input.id);
      const document: DocumentRecord = { ...input, id: input.id ?? createId("document"), createdAt: existing?.createdAt ?? new Date().toISOString() };
      const next = { ...current, documents: input.id ? current.documents.map((item) => (item.id === document.id ? document : item)) : [document, ...current.documents] };
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const upsertEvent = useCallback((input: EventInput) => {
    setData((current) => {
      const existing = current.events.find((event) => event.id === input.id);
      const event: EventRecord = { ...input, id: input.id ?? createId("event"), createdAt: existing?.createdAt ?? new Date().toISOString() };
      const next = { ...current, events: input.id ? current.events.map((item) => (item.id === event.id ? event : item)) : [event, ...current.events] };
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteMember = useCallback((id: string) => {
    setData((current) => {
      const next = { ...current, members: current.members.filter((member) => member.id !== id), documents: current.documents.map((document) => document.ownerId === id ? { ...document, ownerId: undefined } : document), events: current.events.map((event) => event.memberId === id ? { ...event, memberId: undefined } : event) };
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteDocument = useCallback((id: string) => {
    setData((current) => {
      const next = { ...current, documents: current.documents.filter((document) => document.id !== id) };
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setData((current) => {
      const next = { ...current, events: current.events.filter((event) => event.id !== id) };
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isReady) return;
    void syncLocalReminders(data.documents, data.events, data.members, data.settings.notificationsEnabled, data.settings.annualRemindersEnabled);
  }, [data.documents, data.events, data.members, data.settings.notificationsEnabled, data.settings.annualRemindersEnabled, isReady]);

  const setNotificationsEnabled = useCallback(async (enabled: boolean) => {
    if (enabled && !(await enableLocalReminders())) return false;
    if (!enabled) await clearLocalReminders();
    setData((current) => {
      const next = { ...current, settings: { ...current.settings, notificationsEnabled: enabled } };
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    return true;
  }, []);

  const setDefaultCalendar = useCallback((calendar: CalendarKind) => {
    setData((current) => {
      const next = { ...current, settings: { ...current.settings, defaultCalendar: calendar } };
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setAnnualRemindersEnabled = useCallback((enabled: boolean) => {
    setData((current) => {
      const next = { ...current, settings: { ...current.settings, annualRemindersEnabled: enabled } };
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearData = useCallback(() => {
    void clearLocalReminders();
    commit(EMPTY_PERSONAL_DATA);
  }, [commit]);
  const memberName = useCallback((id?: string) => data.members.find((member) => member.id === id)?.name, [data.members]);

  const value = useMemo(() => ({ data, isReady, upsertMember, upsertDocument, upsertEvent, deleteMember, deleteDocument, deleteEvent, clearData, setNotificationsEnabled, setDefaultCalendar, setAnnualRemindersEnabled, memberName }), [data, isReady, upsertMember, upsertDocument, upsertEvent, deleteMember, deleteDocument, deleteEvent, clearData, setNotificationsEnabled, setDefaultCalendar, setAnnualRemindersEnabled, memberName]);

  return <PersonalDataContext.Provider value={value}>{children}</PersonalDataContext.Provider>;
}

export function usePersonalData() {
  const context = useContext(PersonalDataContext);
  if (!context) throw new Error("usePersonalData must be used within PersonalDataProvider");
  return context;
}
