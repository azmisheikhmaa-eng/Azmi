import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Image, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { RecordCard } from "@/components/record-card";
import { ScreenContainer } from "@/components/screen-container";
import { daysUntil, documentUrgency, documentUrgencyLabel, eventTimingLabel, formatArabicDate, sortByUpcoming } from "@/lib/date-utils";
import { resolveEventDate } from "@/lib/hijri-occasions";
import { exportMemberPdf } from "@/lib/pdf-export";
import { usePersonalData } from "@/lib/personal-data-context";
import { DocumentRecord, EventRecord } from "@/shared/personal-data";

type DetailTab = "documents" | "events";

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("") || "؟";
}

function toneFor(status: ReturnType<typeof documentUrgency>) {
  return status === "expired" ? "error" as const : status === "soon" ? "warning" as const : status === "ok" ? "success" as const : "neutral" as const;
}

export default function MemberDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const { data, isReady } = usePersonalData();
  const [activeTab, setActiveTab] = useState<DetailTab>("documents");
  const [isExporting, setIsExporting] = useState(false);
  const member = data.members.find((item) => item.id === id);

  if (!isReady) return null;
  if (!member) return <ScreenContainer><EmptyState actionLabel="العودة إلى العائلة" description="قد يكون هذا الفرد قد حُذف أو لم يعد متاحاً." icon="person-off" onAction={() => router.replace("/family")} title="لا توجد بيانات لهذا الفرد" /></ScreenContainer>;

  const documents = sortByUpcoming(data.documents.filter((document) => document.ownerId === member.id), "expiryDate");
  const events = sortByUpcoming(data.events.filter((event) => event.memberId === member.id).map((event) => ({ ...event, date: resolveEventDate(event) })), "date");
  const personalItems = [
    { label: "صلة القرابة", value: member.relation },
    { label: "الجنس", value: member.gender },
    { label: "الحالة الاجتماعية", value: member.maritalStatus },
    { label: "الجنسية", value: member.nationality },
    { label: "الديانة", value: member.religion },
    { label: "تاريخ الميلاد", value: member.birthDate ? formatArabicDate(member.birthDate) : undefined },
    { label: "مكان الولادة", value: member.birthPlace },
    { label: "الرقم الوطني", value: member.nationalId },
  ].filter((item) => Boolean(item.value));
  const contactItems = [
    { label: "رقم الهاتف", value: member.phone },
    { label: "البريد الإلكتروني", value: member.email },
    { label: "العنوان", value: member.address },
  ].filter((item) => Boolean(item.value));

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportMemberPdf(member, documents, events);
      if (!result.web) Alert.alert("تم إعداد ملف PDF", "اختر الآن وسيلة المشاركة المناسبة من القائمة الظاهرة.");
    } catch {
      Alert.alert("تعذر إنشاء الملف", "حاول مرة أخرى بعد التأكد من السماح بمشاركة الملفات.");
    } finally {
      setIsExporting(false);
    }
  };

  const makeCall = async () => {
    const phone = member.phone?.replace(/[^0-9+]/g, "");
    if (!phone) { Alert.alert("تنبيه", "لا يوجد رقم هاتف لهذا العضو."); return; }
    try { await Linking.openURL(`tel:${phone}`); } catch { Alert.alert("تعذّر إجراء الاتصال", "تأكد من أن الجهاز يدعم الاتصال الهاتفي ثم حاول مرة أخرى."); }
  };

  const sendWhatsApp = async () => {
    const phone = member.phone?.replace(/[^0-9+]/g, "");
    const international = phone?.startsWith("+") ? phone.slice(1) : phone?.startsWith("00") ? phone.slice(2) : undefined;
    if (!international) { Alert.alert("استخدم الرقم الدولي", "للمراسلة عبر واتساب، احفظ رقم الهاتف بالصيغة الدولية، مثل +9665XXXXXXXX."); return; }
    try { await Linking.openURL(`https://wa.me/${international}?text=${encodeURIComponent(`مرحبًا ${member.name}، `)}`); } catch { Alert.alert("تعذّر فتح واتساب", "تأكد من تثبيت واتساب ثم حاول مرة أخرى."); }
  };

  const sendSms = async () => {
    const phone = member.phone?.replace(/[^0-9+]/g, "");
    if (!phone) { Alert.alert("تنبيه", "لا يوجد رقم هاتف لهذا العضو."); return; }
    try { await Linking.openURL(`sms:${phone}${Platform.OS === "ios" ? "&" : "?"}body=${encodeURIComponent(`مرحبًا ${member.name}، `)}`); } catch { Alert.alert("تعذّر فتح الرسائل", "تأكد من توفر تطبيق الرسائل على الجهاز."); }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="العودة" accessibilityRole="button" activeOpacity={0.72} onPress={() => router.back()} style={styles.headerButton}><MaterialIcons color="#334E68" name="arrow-forward" size={22} /></TouchableOpacity>
        <Text style={styles.headerTitle}>بيانات الفرد</Text>
        <TouchableOpacity accessibilityLabel="تعديل بيانات الفرد" accessibilityRole="button" activeOpacity={0.72} onPress={() => router.push({ pathname: "/editor", params: { id: member.id, type: "member" } })} style={styles.headerButton}><MaterialIcons color="#0E7490" name="edit" size={20} /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: member.color }]}>{member.photoUri ? <Image source={{ uri: member.photoUri }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{initials(member.name)}</Text>}</View>
          <Text style={styles.name}>{member.name}</Text>
          <Text style={styles.relation}>{member.relation}</Text>
          <TouchableOpacity accessibilityLabel="مشاركة ملف الفرد بصيغة PDF" accessibilityRole="button" activeOpacity={0.78} disabled={isExporting} onPress={handleExport} style={[styles.shareButton, isExporting && styles.shareButtonDisabled]}>
            <MaterialIcons color="#0E7490" name="picture-as-pdf" size={18} />
            <Text style={styles.shareButtonText}>{isExporting ? "جارٍ إعداد الملف…" : "مشاركة ملف PDF"}</Text>
          </TouchableOpacity>
        </View>

        {personalItems.length ? <DetailSection icon="person-outline" title="البيانات الشخصية" items={personalItems} /> : null}
        {contactItems.length ? <DetailSection icon="contact-phone" title="بيانات الاتصال" items={contactItems} /> : null}
        {member.phone ? <View style={styles.contactActions}><TouchableOpacity accessibilityLabel={`اتصال بـ ${member.name}`} accessibilityRole="button" activeOpacity={0.74} onPress={makeCall} style={styles.callButton}><MaterialIcons color="#7C3AED" name="phone" size={17} /><Text style={styles.callButtonText}>اتصال</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" activeOpacity={0.74} onPress={sendWhatsApp} style={styles.whatsappButton}><MaterialIcons color="#15803D" name="chat" size={17} /><Text style={styles.whatsappButtonText}>واتساب</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" activeOpacity={0.74} onPress={sendSms} style={styles.smsButton}><MaterialIcons color="#0E7490" name="sms" size={17} /><Text style={styles.smsButtonText}>رسالة SMS</Text></TouchableOpacity></View> : null}
        {(member.birthDate || member.marriageDate) ? <View style={styles.section}><View style={styles.sectionTitleRow}><MaterialIcons color="#0E7490" name="event-repeat" size={20} /><Text style={styles.sectionTitle}>التذكيرات السنوية</Text></View>{member.birthDate ? <ReminderRow enabled={member.birthdayReminder === true} label="عيد الميلاد" value={formatArabicDate(member.birthDate)} /> : null}{member.marriageDate ? <ReminderRow enabled={member.marriageReminder === true} label="ذكرى الزواج" value={formatArabicDate(member.marriageDate)} /> : null}</View> : null}

        <View style={styles.tabs}>
          <TabButton active={activeTab === "documents"} count={documents.length} label="الوثائق" onPress={() => setActiveTab("documents")} />
          <TabButton active={activeTab === "events"} count={events.length} label="الأحداث" onPress={() => setActiveTab("events")} />
        </View>

        {activeTab === "documents" ? <DocumentsTab documents={documents} memberId={member.id} memberName={member.name} router={router} /> : <EventsTab events={events} memberId={member.id} memberName={member.name} router={router} />}
      </ScrollView>
    </ScreenContainer>
  );
}

function TabButton({ active, count, label, onPress }: { active: boolean; count: number; label: string; onPress: () => void }) {
  return <TouchableOpacity accessibilityRole="tab" accessibilityState={{ selected: active }} activeOpacity={0.76} onPress={onPress} style={[styles.tabButton, active && styles.tabButtonActive]}><Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text><View style={[styles.tabCount, active && styles.tabCountActive]}><Text style={[styles.tabCountText, active && styles.tabCountTextActive]}>{count}</Text></View></TouchableOpacity>;
}

function DocumentsTab({ documents, memberId, memberName, router }: { documents: DocumentRecord[]; memberId: string; memberName: string; router: ReturnType<typeof useRouter> }) {
  return <View style={styles.tabContent}><View style={styles.listHeader}><View><Text style={styles.sectionTitle}>وثائق {memberName}</Text><Text style={styles.sectionHint}>{documents.length ? `${documents.length} وثيقة مرتبطة` : "لا توجد وثائق مرتبطة بعد"}</Text></View><TouchableOpacity accessibilityRole="button" activeOpacity={0.76} onPress={() => router.push({ pathname: "/editor", params: { memberId, type: "document" } })} style={styles.addButton}><MaterialIcons color="#FFFFFF" name="add" size={17} /><Text style={styles.addButtonText}>وثيقة</Text></TouchableOpacity></View>{documents.length ? <View style={styles.records}>{documents.map((document) => { const imageUri = document.imageUris?.[0] ?? document.imageUri; const imageCount = document.imageUris?.length ?? (document.imageUri ? 1 : 0); const subtitle = document.expiryDate ? `ينتهي ${formatArabicDate(document.expiryDate)}${document.issuePlace ? ` · ${document.issuePlace}` : ""}${imageCount > 1 ? ` · ${imageCount} صور` : ""}` : `${document.type}${document.issuePlace ? ` · ${document.issuePlace}` : ""}${imageCount > 1 ? ` · ${imageCount} صور` : ""}`; return <RecordCard badge={documentUrgencyLabel(document.expiryDate)} badgeTone={toneFor(documentUrgency(document.expiryDate))} icon="description" imageUri={imageUri} key={document.id} onImagePress={imageUri ? () => router.push({ pathname: "/image-preview" as any, params: { title: document.title, uri: imageUri } }) : undefined} onPress={() => router.push({ pathname: "/editor", params: { id: document.id, type: "document" } })} subtitle={subtitle} title={document.title} />; })}</View> : <EmptyTab icon="folder-open" text="اربط الوثيقة بالفرد عند إضافتها لتظهر هنا." />}</View>;
}

function EventsTab({ events, memberId, memberName, router }: { events: EventRecord[]; memberId: string; memberName: string; router: ReturnType<typeof useRouter> }) {
  return <View style={styles.tabContent}><View style={styles.listHeader}><View><Text style={styles.sectionTitle}>أحداث {memberName}</Text><Text style={styles.sectionHint}>{events.length ? `${events.length} حدث مرتبط` : "لا توجد أحداث مرتبطة بعد"}</Text></View><TouchableOpacity accessibilityRole="button" activeOpacity={0.76} onPress={() => router.push({ pathname: "/editor", params: { memberId, type: "event" } })} style={styles.addButton}><MaterialIcons color="#FFFFFF" name="add" size={17} /><Text style={styles.addButtonText}>حدث</Text></TouchableOpacity></View>{events.length ? <View style={styles.records}>{events.map((event) => { const days = daysUntil(event.date); const tone = days !== null && days < 0 ? "neutral" as const : days !== null && days <= 30 ? "warning" as const : "success" as const; return <RecordCard badge={eventTimingLabel(event.date)} badgeTone={tone} icon="calendar-month" key={event.id} onPress={() => router.push({ pathname: "/editor", params: { id: event.id, type: "event" } })} subtitle={`${event.category}${event.hijriOccasionId ? " · هجري متكرر" : ""}`} title={event.title} />; })}</View> : <EmptyTab icon="event-note" text="أضف مناسبة أو موعداً لهذا الفرد ليظهر هنا." />}</View>;
}

function EmptyTab({ icon, text }: { icon: keyof typeof MaterialIcons.glyphMap; text: string }) {
  return <View style={styles.emptyTab}><MaterialIcons color="#9FB3C8" name={icon} size={28} /><Text style={styles.emptyTabText}>{text}</Text></View>;
}

function DetailSection({ icon, title, items }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; items: Array<{ label: string; value?: string }> }) {
  return <View style={styles.section}><View style={styles.sectionTitleRow}><MaterialIcons color="#0E7490" name={icon} size={20} /><Text style={styles.sectionTitle}>{title}</Text></View>{items.map((item) => <View key={item.label} style={styles.detailRow}><Text style={styles.detailValue}>{item.value}</Text><Text style={styles.detailLabel}>{item.label}</Text></View>)}</View>;
}

function ReminderRow({ enabled, label, value }: { enabled: boolean; label: string; value: string }) {
  return <View style={styles.reminderRow}><View style={[styles.reminderDot, { backgroundColor: enabled ? "#DCFCE7" : "#EEF2F6" }]}><MaterialIcons color={enabled ? "#15803D" : "#829AB1"} name={enabled ? "notifications-active" : "notifications-off"} size={16} /></View><View style={styles.reminderCopy}><Text style={styles.reminderLabel}>{label}</Text><Text style={styles.reminderValue}>{value}</Text></View><Text style={[styles.reminderStatus, enabled && styles.reminderStatusActive]}>{enabled ? "مفعّل" : "غير مفعّل"}</Text></View>;
}

const styles = StyleSheet.create({
  header: { alignItems: "center", flexDirection: "row-reverse", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8 },
  headerButton: { alignItems: "center", backgroundColor: "#EFF5F8", borderRadius: 17, height: 40, justifyContent: "center", width: 40 },
  headerTitle: { color: "#102A43", fontSize: 18, fontWeight: "800", lineHeight: 27, writingDirection: "rtl" },
  content: { gap: 16, paddingBottom: 32, paddingHorizontal: 20, paddingTop: 24 },
  profileCard: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#E6EEF4", borderRadius: 22, borderWidth: 1, padding: 22 },
  avatar: { alignItems: "center", borderRadius: 43, height: 86, justifyContent: "center", width: 86 },
  avatarImage: { borderRadius: 43, height: 86, width: 86 },
  avatarText: { color: "#FFFFFF", fontSize: 25, fontWeight: "800", writingDirection: "rtl" },
  name: { color: "#102A43", fontSize: 21, fontWeight: "800", lineHeight: 30, marginTop: 12, textAlign: "center", writingDirection: "rtl" },
  relation: { color: "#627D98", fontSize: 14, lineHeight: 21, marginTop: 1, textAlign: "center", writingDirection: "rtl" },
  shareButton: { alignItems: "center", backgroundColor: "#E6F6F8", borderColor: "#BDE7EC", borderRadius: 11, borderWidth: 1, flexDirection: "row-reverse", gap: 6, marginTop: 16, paddingHorizontal: 14, paddingVertical: 10 },
  shareButtonDisabled: { opacity: 0.6 },
  shareButtonText: { color: "#0E7490", fontSize: 13, fontWeight: "800", writingDirection: "rtl" },
  section: { backgroundColor: "#FFFFFF", borderColor: "#E6EEF4", borderRadius: 18, borderWidth: 1, overflow: "hidden", paddingHorizontal: 15, paddingVertical: 14 },
  sectionTitleRow: { alignItems: "center", flexDirection: "row-reverse", gap: 7, marginBottom: 9 },
  sectionTitle: { color: "#243B53", fontSize: 15, fontWeight: "800", lineHeight: 22, textAlign: "right", writingDirection: "rtl" },
  detailRow: { borderTopColor: "#EEF2F6", borderTopWidth: 1, flexDirection: "row-reverse", gap: 14, justifyContent: "space-between", paddingVertical: 10 },
  detailLabel: { color: "#829AB1", fontSize: 12, fontWeight: "700", textAlign: "right", writingDirection: "rtl" },
  detailValue: { color: "#334E68", flex: 1, fontSize: 13, lineHeight: 19, textAlign: "left", writingDirection: "rtl" },
  reminderRow: { alignItems: "center", borderTopColor: "#EEF2F6", borderTopWidth: 1, flexDirection: "row-reverse", gap: 10, paddingVertical: 10 },
  reminderDot: { alignItems: "center", borderRadius: 16, height: 32, justifyContent: "center", width: 32 },
  reminderCopy: { flex: 1 },
  reminderLabel: { color: "#334E68", fontSize: 13, fontWeight: "800", textAlign: "right", writingDirection: "rtl" },
  reminderValue: { color: "#829AB1", fontSize: 11, lineHeight: 17, marginTop: 1, textAlign: "right", writingDirection: "rtl" },
  reminderStatus: { color: "#829AB1", fontSize: 11, fontWeight: "800", writingDirection: "rtl" },
  reminderStatusActive: { color: "#15803D" },
  tabs: { backgroundColor: "#EEF5F7", borderRadius: 14, flexDirection: "row-reverse", gap: 5, padding: 5 },
  tabButton: { alignItems: "center", borderRadius: 10, flex: 1, flexDirection: "row-reverse", gap: 7, justifyContent: "center", minHeight: 42 },
  tabButtonActive: { backgroundColor: "#FFFFFF", shadowColor: "#102A43", shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  tabText: { color: "#627D98", fontSize: 13, fontWeight: "800", writingDirection: "rtl" },
  tabTextActive: { color: "#0E7490" },
  tabCount: { alignItems: "center", backgroundColor: "#D9E2EC", borderRadius: 10, height: 20, justifyContent: "center", minWidth: 20, paddingHorizontal: 4 },
  tabCountActive: { backgroundColor: "#E6F6F8" },
  tabCountText: { color: "#627D98", fontSize: 10, fontWeight: "800" },
  tabCountTextActive: { color: "#0E7490" },
  tabContent: { gap: 12 },
  listHeader: { alignItems: "center", flexDirection: "row-reverse", justifyContent: "space-between", marginTop: 4 },
  sectionHint: { color: "#829AB1", fontSize: 12, lineHeight: 18, marginTop: 1, textAlign: "right", writingDirection: "rtl" },
  addButton: { alignItems: "center", backgroundColor: "#0E7490", borderRadius: 11, flexDirection: "row-reverse", gap: 4, paddingHorizontal: 11, paddingVertical: 8 },
  addButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800", writingDirection: "rtl" },
  records: { gap: 9 },
  emptyTab: { alignItems: "center", backgroundColor: "#F8FCFD", borderColor: "#E6EEF4", borderRadius: 17, borderStyle: "dashed", borderWidth: 1, gap: 7, padding: 22 },
  emptyTabText: { color: "#627D98", fontSize: 13, lineHeight: 20, textAlign: "center", writingDirection: "rtl" },
  contactActions: { flexDirection: "row-reverse", gap: 8, justifyContent: "center" },
  callButton: { alignItems: "center", backgroundColor: "#F5F3FF", borderRadius: 11, flexDirection: "row-reverse", gap: 5, paddingHorizontal: 14, paddingVertical: 9 },
  callButtonText: { color: "#7C3AED", fontSize: 12, fontWeight: "800", writingDirection: "rtl" },
  whatsappButton: { alignItems: "center", backgroundColor: "#F0FDF4", borderRadius: 11, flexDirection: "row-reverse", gap: 5, paddingHorizontal: 14, paddingVertical: 9 },
  whatsappButtonText: { color: "#15803D", fontSize: 12, fontWeight: "800", writingDirection: "rtl" },
  smsButton: { alignItems: "center", backgroundColor: "#E6F6F8", borderRadius: 11, flexDirection: "row-reverse", gap: 5, paddingHorizontal: 14, paddingVertical: 9 },
  smsButtonText: { color: "#0E7490", fontSize: 12, fontWeight: "800", writingDirection: "rtl" },
});
