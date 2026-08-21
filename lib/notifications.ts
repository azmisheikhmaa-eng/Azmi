import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { DocumentRecord, EventRecord, FamilyMember } from "@/shared/personal-data";
import { resolveEventDate } from "@/lib/hijri-occasions";
import { nextAnnualOccurrence } from "@/lib/annual-reminders";

const CHANNEL_ID = "bayanaati-reminders";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

function parseDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return undefined;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 9);
  if (date.getFullYear() !== Number(match[1]) || date.getMonth() !== Number(match[2]) - 1 || date.getDate() !== Number(match[3])) return undefined;
  return date;
}

async function prepareNotifications() {
  if (Platform.OS === "web") return false;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      importance: Notifications.AndroidImportance.HIGH,
      name: "تذكيرات بياناتي",
      vibrationPattern: [0, 180, 120, 180],
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.status === "granted") return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === "granted";
}

export async function enableLocalReminders() {
  try {
    return await prepareNotifications();
  } catch {
    return false;
  }
}

export async function clearLocalReminders() {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // تتوفر هذه العملية فقط على منصات الإشعارات المحلية.
  }
}

async function scheduleReminder(triggerDate: Date, title: string, body: string, recordId: string) {
  if (triggerDate.getTime() <= Date.now()) return;
  await Notifications.scheduleNotificationAsync({
    content: { body, data: { recordId }, sound: true, title },
    trigger: { channelId: CHANNEL_ID, date: triggerDate, type: Notifications.SchedulableTriggerInputTypes.DATE },
  });
}

export async function syncLocalReminders(documents: DocumentRecord[], events: EventRecord[], members: FamilyMember[], enabled: boolean, annualRemindersEnabled = true) {
  if (Platform.OS === "web") return;
  await clearLocalReminders();
  if (!enabled || !(await enableLocalReminders())) return;

  for (const document of documents) {
    if (!document.expiryDate) continue;
    const expiry = parseDate(document.expiryDate);
    if (!expiry) continue;
    for (const daysBefore of [30, 7, 1]) {
      const trigger = new Date(expiry);
      trigger.setDate(trigger.getDate() - daysBefore);
      await scheduleReminder(trigger, "تذكير بوثيقة", `تنتهي صلاحية «${document.title}» خلال ${daysBefore === 1 ? "يوم واحد" : `${daysBefore} أيام`}.`, document.id);
    }
  }

  for (const event of events) {
    const resolvedDate = event.hijriOccasionId ? resolveEventDate(event) : event.annualReminder && annualRemindersEnabled ? nextAnnualOccurrence(event.date)?.toISOString().slice(0, 10) ?? event.date : event.date;
    const eventDate = parseDate(resolvedDate);
    if (!eventDate) continue;
    for (const daysBefore of [7, 1]) {
      const trigger = new Date(eventDate);
      trigger.setDate(trigger.getDate() - daysBefore);
      await scheduleReminder(trigger, "تذكير بحدث", `موعد «${event.title}» بعد ${daysBefore === 1 ? "يوم واحد" : `${daysBefore} أيام`}.`, event.id);
    }
  }

  if (!annualRemindersEnabled) return;
  for (const member of members) {
    const occasions = [
      { date: member.birthDate, enabled: member.birthdayReminder === true, id: `birthday-${member.id}`, title: "تذكير بعيد ميلاد", body: `عيد ميلاد «${member.name}»` },
      { date: member.marriageDate, enabled: member.marriageReminder === true, id: `marriage-${member.id}`, title: "تذكير بذكرى الزواج", body: `ذكرى زواج «${member.name}»` },
    ];
    for (const occasion of occasions) {
      if (!occasion.enabled || !occasion.date) continue;
      const nextDate = nextAnnualOccurrence(occasion.date);
      if (!nextDate) continue;
      for (const daysBefore of [7, 1]) {
        const trigger = new Date(nextDate);
        trigger.setDate(trigger.getDate() - daysBefore);
        await scheduleReminder(trigger, occasion.title, `${occasion.body} بعد ${daysBefore === 1 ? "يوم واحد" : `${daysBefore} أيام`}.`, occasion.id);
      }
    }
  }
}
