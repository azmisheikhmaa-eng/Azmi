import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { DateField } from "@/components/date-field";
import { ImagePickerField } from "@/components/image-picker-field";
import { DocumentImageGalleryField } from "@/components/document-image-gallery-field";
import { isValidDay } from "@/lib/date-utils";
import { HIJRI_OCCASIONS, nextHijriOccasionDate, resolveEventDate } from "@/lib/hijri-occasions";
import { usePersonalData } from "@/lib/personal-data-context";
import { DocumentRecord, EventRecord, FamilyMember, Gender, HijriOccasionId, MaritalStatus, RecordKind } from "@/shared/personal-data";

const RELATIONS = ["أنا", "زوج/زوجة", "ابن", "ابنة", "والد", "والدة", "أخ/أخت", "آخر"];
const DOCUMENT_TYPES = ["الهوية الوطنية", "جواز السفر", "رخصة القيادة", "إقامة", "تأمين", "وثيقة أخرى"];
const EVENT_TYPES = ["موعد", "عيد ميلاد", "ذكرى زواج", "مناسبة عائلية", "مناسبة هجرية", "تذكير شخصي", "أخرى"];
const GENDERS: Gender[] = ["ذكر", "أنثى", "غير محدد"];
const RELIGIONS = ["الإسلام", "المسيحية", "اليهودية", "ديانة أخرى"];
const MARITAL_STATUSES: MaritalStatus[] = ["أعزب", "متزوج", "مطلق", "أرمل"];

const COPY: Record<RecordKind, { title: string; mainLabel: string; placeholder: string; save: string }> = {
  member: { title: "فرد من العائلة", mainLabel: "الاسم", placeholder: "مثال: سارة أحمد", save: "حفظ الفرد" },
  document: { title: "وثيقة", mainLabel: "اسم الوثيقة", placeholder: "مثال: جواز سفر سارة", save: "حفظ الوثيقة" },
  event: { title: "حدث مهم", mainLabel: "عنوان الحدث", placeholder: "مثال: موعد الطبيب", save: "حفظ الحدث" },
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isRecordKind(value?: string): value is RecordKind {
  return value === "member" || value === "document" || value === "event";
}

export default function EditorScreen() {
  const params = useLocalSearchParams<{ type?: string; id?: string; memberId?: string }>();
  const router = useRouter();
  const { data, upsertMember, upsertDocument, upsertEvent, deleteMember, deleteDocument, deleteEvent } = usePersonalData();
  const typeParam = getSingleParam(params.type);
  const editingId = getSingleParam(params.id);
  const suggestedMemberId = getSingleParam(params.memberId);
  const type: RecordKind = isRecordKind(typeParam) ? typeParam : "member";
  const editingRecord = useMemo(() => {
    if (!editingId) return undefined;
    if (type === "member") return data.members.find((item) => item.id === editingId);
    if (type === "document") return data.documents.find((item) => item.id === editingId);
    return data.events.find((item) => item.id === editingId);
  }, [data, editingId, type]);

  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("");
  const [number, setNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [memberId, setMemberId] = useState<string | undefined>();
  const [notes, setNotes] = useState("");
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [hijriOccasionId, setHijriOccasionId] = useState<HijriOccasionId | undefined>();
  const [gender, setGender] = useState<Gender | undefined>();
  const [religion, setReligion] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus | undefined>();
  const [nationality, setNationality] = useState("");
  const [birthdayReminder, setBirthdayReminder] = useState(false);
  const [marriageDate, setMarriageDate] = useState("");
  const [marriageReminder, setMarriageReminder] = useState(false);
  const [issuePlace, setIssuePlace] = useState("");
  const [annualReminder, setAnnualReminder] = useState(false);

  useEffect(() => {
    if (!editingRecord) return;
    if (type === "member") {
      const member = editingRecord as FamilyMember;
      setTitle(member.name);
      setKind(member.relation);
      setTargetDate(member.birthDate ?? "");
      setNotes(member.notes ?? "");
      setPhotoUri(member.photoUri);
      setPhone(member.phone ?? "");
      setEmail(member.email ?? "");
      setAddress(member.address ?? "");
      setGender(member.gender);
      setReligion(member.religion ?? "");
      setBirthPlace(member.birthPlace ?? "");
      setNationalId(member.nationalId ?? "");
      setMaritalStatus(member.maritalStatus);
      setNationality(member.nationality ?? "");
      setBirthdayReminder(member.birthdayReminder === true);
      setMarriageDate(member.marriageDate ?? "");
      setMarriageReminder(member.marriageReminder === true);
      return;
    }
    if (type === "document") {
      const document = editingRecord as DocumentRecord;
      setTitle(document.title);
      setKind(document.type);
      setNumber(document.number ?? "");
      setIssueDate(document.issueDate ?? "");
      setTargetDate(document.expiryDate ?? "");
      setMemberId(document.ownerId);
      setNotes(document.notes ?? "");
      setImageUris(document.imageUris?.length ? document.imageUris : document.imageUri ? [document.imageUri] : []);
      setIssuePlace(document.issuePlace ?? "");
      return;
    }
    const event = editingRecord as EventRecord;
    setTitle(event.title);
    setKind(event.category);
    setTargetDate(resolveEventDate(event));
    setHijriOccasionId(event.hijriOccasionId);
    setAnnualReminder(event.annualReminder === true);
    setMemberId(event.memberId);
    setNotes(event.notes ?? "");
  }, [editingRecord, type]);

  useEffect(() => {
    if (type === "document" && !editingId && suggestedMemberId) setMemberId(suggestedMemberId);
  }, [editingId, suggestedMemberId, type]);

  const save = () => {
    const cleanedTitle = title.trim();
    if (!cleanedTitle) {
      Alert.alert("أكمل البيانات", `أدخل ${COPY[type].mainLabel} للمتابعة.`);
      return;
    }
    if ((type === "event" && !targetDate.trim()) || (targetDate.trim() && !isValidDay(targetDate.trim())) || (type === "member" && marriageDate.trim() && !isValidDay(marriageDate.trim()))) {
      Alert.alert("تاريخ غير صالح", "اكتب التاريخ بصيغة YYYY-MM-DD، مثل 2026-08-15.");
      return;
    }
    if (type === "member") {
      upsertMember({ id: editingId, name: cleanedTitle, relation: kind || "فرد من العائلة", birthDate: targetDate.trim() || undefined, notes: notes.trim() || undefined, photoUri, phone: phone.trim() || undefined, email: email.trim() || undefined, address: address.trim() || undefined, gender, religion: religion || undefined, birthPlace: birthPlace.trim() || undefined, nationalId: nationalId.trim() || undefined, maritalStatus, nationality: nationality.trim() || undefined, birthdayReminder: Boolean(targetDate.trim()) && birthdayReminder, marriageDate: marriageDate.trim() || undefined, marriageReminder: Boolean(marriageDate.trim()) && marriageReminder });
      router.replace("/family");
      return;
    }
    if (type === "document") {
      upsertDocument({ id: editingId, title: cleanedTitle, type: kind || "وثيقة أخرى", number: number.trim() || undefined, ownerId: memberId, issueDate: issueDate.trim() || undefined, expiryDate: targetDate.trim() || undefined, notes: notes.trim() || undefined, imageUri: imageUris[0], imageUris: imageUris.length ? imageUris : undefined, issuePlace: issuePlace.trim() || undefined });
      router.replace("/documents");
      return;
    }
    upsertEvent({ id: editingId, title: cleanedTitle, category: kind || "أخرى", date: hijriOccasionId ? nextHijriOccasionDate(hijriOccasionId) ?? targetDate.trim() : targetDate.trim(), hijriOccasionId, annualReminder: !hijriOccasionId && annualReminder, memberId, notes: notes.trim() || undefined });
    router.replace("/events");
  };

  const remove = () => {
    if (!editingId) return;
    Alert.alert("حذف السجل؟", "لا يمكن التراجع عن هذا الإجراء بعد الحذف.", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: () => {
          if (type === "member") {
            deleteMember(editingId);
            router.replace("/family");
          } else if (type === "document") {
            deleteDocument(editingId);
            router.replace("/documents");
          } else {
            deleteEvent(editingId);
            router.replace("/events");
          }
        },
      },
    ]);
  };

  const selectOptions = type === "member" ? RELATIONS : type === "document" ? DOCUMENT_TYPES : EVENT_TYPES;
  const showOwner = type === "document" || type === "event";
  const dateLabel = type === "member" ? "تاريخ الميلاد (اختياري)" : type === "document" ? "تاريخ الانتهاء (اختياري)" : "تاريخ الحدث";
  const kindLabel = type === "member" ? "صلة القرابة" : type === "document" ? "نوع الوثيقة" : "نوع الحدث";
  const isEditing = Boolean(editingId && editingRecord);
  const applyHijriOccasion = (id: HijriOccasionId) => {
    const occasion = HIJRI_OCCASIONS[id];
    setHijriOccasionId(id);
    setTitle(occasion.title);
    setKind("مناسبة هجرية");
    setTargetDate(nextHijriOccasionDate(id) ?? "");
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} onPress={() => router.back()} style={styles.closeButton}>
            <MaterialIcons color="#334E68" name="close" size={23} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? `تعديل ${COPY[type].title}` : `إضافة ${COPY[type].title}`}</Text>
          <View style={styles.closeSpacer} />
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <LabeledInput label={COPY[type].mainLabel} onChangeText={setTitle} placeholder={COPY[type].placeholder} value={title} />
          <Text style={styles.fieldLabel}>{kindLabel}</Text>
          <View style={styles.chips}>
            {selectOptions.map((option) => (
              <TouchableOpacity accessibilityRole="button" activeOpacity={0.72} key={option} onPress={() => { setKind(option); if (type === "event" && ["عيد ميلاد", "ذكرى زواج"].includes(option)) setAnnualReminder(true); }} style={[styles.chip, kind === option && styles.chipActive]}>
                <Text style={[styles.chipText, kind === option && styles.chipTextActive]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {type === "event" ? <View style={styles.occasionSection}><Text style={styles.fieldLabel}>مناسبات هجرية متكررة</Text><Text style={styles.occasionHelp}>يُحدّث التطبيق تاريخ المناسبة تلقائيًا كل عام هجريًا.</Text><View style={styles.chips}>{(Object.keys(HIJRI_OCCASIONS) as HijriOccasionId[]).map((id) => <TouchableOpacity accessibilityRole="button" activeOpacity={0.72} key={id} onPress={() => applyHijriOccasion(id)} style={[styles.chip, hijriOccasionId === id && styles.chipActive]}><Text style={[styles.chipText, hijriOccasionId === id && styles.chipTextActive]}>{HIJRI_OCCASIONS[id].title}</Text></TouchableOpacity>)}</View></View> : null}
          {type === "member" ? <ImagePickerField kind="member" label="الصورة الشخصية (اختيارية)" onChange={setPhotoUri} value={photoUri} /> : null}
          {type === "member" ? <><Text style={styles.fieldLabel}>الجنس (اختياري)</Text><View style={styles.chips}>{GENDERS.map((option) => <TouchableOpacity accessibilityRole="button" activeOpacity={0.72} key={option} onPress={() => setGender(option)} style={[styles.chip, gender === option && styles.chipActive]}><Text style={[styles.chipText, gender === option && styles.chipTextActive]}>{option}</Text></TouchableOpacity>)}</View><Text style={styles.fieldLabel}>الحالة الاجتماعية (اختيارية)</Text><View style={styles.chips}>{MARITAL_STATUSES.map((option) => <TouchableOpacity accessibilityRole="button" activeOpacity={0.72} key={option} onPress={() => setMaritalStatus(option)} style={[styles.chip, maritalStatus === option && styles.chipActive]}><Text style={[styles.chipText, maritalStatus === option && styles.chipTextActive]}>{option}</Text></TouchableOpacity>)}</View><Text style={styles.fieldLabel}>الديانة (اختيارية)</Text><View style={styles.chips}>{RELIGIONS.map((option) => <TouchableOpacity accessibilityRole="button" activeOpacity={0.72} key={option} onPress={() => setReligion(option)} style={[styles.chip, religion === option && styles.chipActive]}><Text style={[styles.chipText, religion === option && styles.chipTextActive]}>{option}</Text></TouchableOpacity>)}</View><LabeledInput label="الجنسية (اختيارية)" onChangeText={setNationality} placeholder="مثال: سعودي" value={nationality} /><LabeledInput label="مكان الولادة (اختياري)" onChangeText={setBirthPlace} placeholder="مثال: المدينة المنورة" value={birthPlace} /><LabeledInput keyboardType="number-pad" label="الرقم الوطني (اختياري)" onChangeText={setNationalId} placeholder="يُحفظ محلياً ولا يظهر في القائمة" value={nationalId} /></> : null}
          {type === "member" ? <LabeledInput autoComplete="tel" keyboardType="phone-pad" label="رقم الهاتف (اختياري)" onChangeText={setPhone} placeholder="مثال: 0501234567" value={phone} /> : null}
          {type === "member" ? <LabeledInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" label="البريد الإلكتروني (اختياري)" onChangeText={setEmail} placeholder="مثال: name@example.com" value={email} /> : null}
          {type === "member" ? <LabeledInput label="العنوان (اختياري)" multiline onChangeText={setAddress} placeholder="مثال: الرياض، حي النخيل" value={address} /> : null}
          {type === "document" ? <LabeledInput label="رقم الوثيقة (اختياري)" onChangeText={setNumber} placeholder="مثال: 1234567890" value={number} /> : null}
          {type === "document" ? <LabeledInput label="مكان إصدار الوثيقة (اختياري)" onChangeText={setIssuePlace} placeholder="مثال: الرياض" value={issuePlace} /> : null}
          {type === "document" ? <DocumentImageGalleryField images={imageUris} onChange={setImageUris} onPreview={(uri, position) => router.push({ pathname: "/image-preview" as any, params: { title: `${title || "صورة الوثيقة"} · ${position + 1}`, uri } })} /> : null}
          {type === "document" ? <DateField defaultCalendar={data.settings.defaultCalendar} label="تاريخ الإصدار (اختياري)" onChange={setIssueDate} value={issueDate} /> : null}
          <DateField defaultCalendar={data.settings.defaultCalendar} label={dateLabel} onChange={(value) => { setTargetDate(value); if (type === "event") setHijriOccasionId(undefined); }} required={type === "event"} value={targetDate} />
          {type === "member" ? <><View style={styles.annualReminderCard}><View style={styles.annualReminderCopy}><Text style={styles.annualReminderTitle}>تذكير بعيد الميلاد</Text><Text style={styles.annualReminderText}>{targetDate ? "يذكّرك التطبيق قبل عيد الميلاد بسبعة أيام ويوم واحد." : "اختر تاريخ الميلاد أولاً لتفعيل هذا التذكير."}</Text></View><Switch accessibilityLabel="تشغيل تذكير عيد الميلاد" disabled={!targetDate} onValueChange={setBirthdayReminder} thumbColor="#FFFFFF" trackColor={{ false: "#CBD5E1", true: "#0E7490" }} value={birthdayReminder} /></View><DateField defaultCalendar={data.settings.defaultCalendar} label="تاريخ الزواج (اختياري)" onChange={setMarriageDate} value={marriageDate} /><View style={styles.annualReminderCard}><View style={styles.annualReminderCopy}><Text style={styles.annualReminderTitle}>تذكير ذكرى الزواج</Text><Text style={styles.annualReminderText}>{marriageDate ? "يذكّرك التطبيق قبل ذكرى الزواج بسبعة أيام ويوم واحد." : "اختر تاريخ الزواج أولاً لتفعيل هذا التذكير."}</Text></View><Switch accessibilityLabel="تشغيل تذكير ذكرى الزواج" disabled={!marriageDate} onValueChange={setMarriageReminder} thumbColor="#FFFFFF" trackColor={{ false: "#CBD5E1", true: "#0E7490" }} value={marriageReminder} /></View></> : null}
          {type === "event" ? <View style={styles.annualReminderCard}><View style={styles.annualReminderCopy}><Text style={styles.annualReminderTitle}>تذكير سنوي تلقائي</Text><Text style={styles.annualReminderText}>للميلاد والزواج والمناسبات المتكررة كل عام.</Text></View><Switch accessibilityLabel="تشغيل التذكير السنوي" onValueChange={setAnnualReminder} thumbColor="#FFFFFF" trackColor={{ false: "#CBD5E1", true: "#0E7490" }} value={annualReminder} /></View> : null}
          {showOwner ? (
            <View>
              <Text style={styles.fieldLabel}>{type === "document" ? "صاحب الوثيقة (اختياري)" : "ربط بفرد من العائلة (اختياري)"}</Text>
              {data.members.length ? (
                <View style={styles.memberChoices}>
                  <TouchableOpacity accessibilityRole="button" activeOpacity={0.72} onPress={() => setMemberId(undefined)} style={[styles.memberChoice, !memberId && styles.memberChoiceActive]}>
                    <Text style={[styles.memberChoiceText, !memberId && styles.memberChoiceTextActive]}>بدون ربط</Text>
                  </TouchableOpacity>
                  {data.members.map((member) => (
                    <TouchableOpacity accessibilityRole="button" activeOpacity={0.72} key={member.id} onPress={() => setMemberId(member.id)} style={[styles.memberChoice, memberId === member.id && styles.memberChoiceActive]}>
                      <View style={[styles.memberDot, { backgroundColor: member.color }]} />
                      <Text style={[styles.memberChoiceText, memberId === member.id && styles.memberChoiceTextActive]}>{member.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.helperText}>أضف فردًا من تبويب العائلة لتتمكن من ربط السجل به.</Text>
              )}
            </View>
          ) : null}
          <LabeledInput label="ملاحظات (اختياري)" multiline onChangeText={setNotes} placeholder="أضف أي تفاصيل مفيدة" value={notes} />
          <TouchableOpacity accessibilityRole="button" activeOpacity={0.82} onPress={save} style={styles.saveButton}>
            <MaterialIcons color="#FFFFFF" name="check" size={20} />
            <Text style={styles.saveText}>{isEditing ? "حفظ التعديلات" : COPY[type].save}</Text>
          </TouchableOpacity>
          {isEditing ? (
            <TouchableOpacity accessibilityRole="button" activeOpacity={0.78} onPress={remove} style={styles.deleteButton}>
              <MaterialIcons color="#B91C1C" name="delete-outline" size={19} />
              <Text style={styles.deleteText}>حذف هذا السجل</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function LabeledInput({ label, multiline = false, ...props }: { label: string; multiline?: boolean } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput multiline={multiline} placeholderTextColor="#9FB3C8" style={[styles.input, multiline && styles.textarea]} textAlign="right" {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { alignItems: "center", flexDirection: "row-reverse", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8 },
  closeButton: { alignItems: "center", backgroundColor: "#EFF5F8", borderRadius: 17, height: 40, justifyContent: "center", width: 40 },
  closeSpacer: { height: 40, width: 40 },
  headerTitle: { color: "#102A43", fontSize: 18, fontWeight: "800", lineHeight: 27, writingDirection: "rtl" },
  scrollContent: { paddingBottom: 30, paddingHorizontal: 20, paddingTop: 28 },
  inputGroup: { marginBottom: 19 },
  fieldLabel: { color: "#334E68", fontSize: 14, fontWeight: "800", lineHeight: 21, marginBottom: 8, textAlign: "right", writingDirection: "rtl" },
  input: { backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 13, borderWidth: 1, color: "#102A43", fontSize: 15, lineHeight: 22, minHeight: 48, paddingHorizontal: 14, paddingVertical: 12, writingDirection: "rtl" },
  textarea: { minHeight: 95, textAlignVertical: "top" },
  chips: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  occasionSection: { marginTop: -4 },
  occasionHelp: { color: "#829AB1", fontSize: 12, lineHeight: 18, marginBottom: 8, textAlign: "right", writingDirection: "rtl" },
  annualReminderCard: { alignItems: "center", backgroundColor: "#F8FCFD", borderColor: "#D9E2EC", borderRadius: 13, borderWidth: 1, flexDirection: "row-reverse", gap: 12, marginBottom: 19, padding: 13 },
  annualReminderCopy: { flex: 1 },
  annualReminderTitle: { color: "#243B53", fontSize: 13, fontWeight: "800", textAlign: "right", writingDirection: "rtl" },
  annualReminderText: { color: "#627D98", fontSize: 11, lineHeight: 17, marginTop: 2, textAlign: "right", writingDirection: "rtl" },
  chip: { backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  chipActive: { backgroundColor: "#0E7490", borderColor: "#0E7490" },
  chipText: { color: "#486581", fontSize: 13, fontWeight: "700", writingDirection: "rtl" },
  chipTextActive: { color: "#FFFFFF" },
  memberChoices: { gap: 8, marginBottom: 20 },
  memberChoice: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 13, borderWidth: 1, flexDirection: "row-reverse", gap: 9, paddingHorizontal: 13, paddingVertical: 11 },
  memberChoiceActive: { backgroundColor: "#E6F6F8", borderColor: "#0E7490" },
  memberDot: { borderRadius: 6, height: 12, width: 12 },
  memberChoiceText: { color: "#486581", flex: 1, fontSize: 14, fontWeight: "700", textAlign: "right", writingDirection: "rtl" },
  memberChoiceTextActive: { color: "#0E7490" },
  helperText: { color: "#829AB1", fontSize: 13, lineHeight: 20, marginBottom: 19, textAlign: "right", writingDirection: "rtl" },
  saveButton: { alignItems: "center", backgroundColor: "#0E7490", borderRadius: 15, flexDirection: "row-reverse", gap: 8, justifyContent: "center", marginTop: 6, minHeight: 52, paddingHorizontal: 20 },
  saveText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800", lineHeight: 22, writingDirection: "rtl" },
  deleteButton: { alignItems: "center", alignSelf: "center", flexDirection: "row-reverse", gap: 7, justifyContent: "center", marginTop: 16, paddingHorizontal: 16, paddingVertical: 10 },
  deleteText: { color: "#B91C1C", fontSize: 14, fontWeight: "800", writingDirection: "rtl" },
});
