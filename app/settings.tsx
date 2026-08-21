import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { usePersonalData } from "@/lib/personal-data-context";
import { exportPersonalDataPdf } from "@/lib/pdf-export";
import { exportPersonalDataCsv } from "@/lib/csv-export";

export default function SettingsScreen() {
  const router = useRouter();
  const { clearData, data, setAnnualRemindersEnabled, setDefaultCalendar, setNotificationsEnabled } = usePersonalData();
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const totalRecords = data.members.length + data.documents.length + data.events.length;
  const clearEverything = () => {
    Alert.alert("مسح جميع البيانات؟", "سيؤدي هذا إلى حذف أفراد العائلة والوثائق والأحداث من هذا الجهاز، ولا يمكن التراجع عن الإجراء.", [
      { text: "إلغاء", style: "cancel" },
      { text: "مسح البيانات", style: "destructive", onPress: () => { clearData(); router.replace("/"); } },
    ]);
  };
  const updateNotifications = async (enabled: boolean) => {
    const wasUpdated = await setNotificationsEnabled(enabled);
    if (!wasUpdated && enabled) {
      Alert.alert(Platform.OS === "web" ? "الإشعارات على الهاتف" : "إذن الإشعارات مطلوب", Platform.OS === "web" ? "ستتوفر الإشعارات المحلية عند فتح التطبيق على هاتف iOS أو Android." : "اسمح بالإشعارات من إعدادات الجهاز لتلقي تذكيرات الوثائق والأحداث.");
    }
  };
  const exportPdf = async () => {
    try { setIsExporting(true); const result = await exportPersonalDataPdf(data); Alert.alert("تم تجهيز التقرير", result.web ? "يمكنك اختيار حفظ التقرير كملف PDF من نافذة الطباعة في المتصفح." : "تم فتح قائمة المشاركة لحفظ أو إرسال ملف PDF."); } catch { Alert.alert("تعذر التصدير", "تعذر إنشاء ملف PDF الآن. حاول مرة أخرى."); } finally { setIsExporting(false); }
  };
  const exportCsv = async () => {
    try { setIsExportingCsv(true); const result = await exportPersonalDataCsv(data); Alert.alert("تم تجهيز CSV", result.web ? "تم تنزيل ملف CSV. يمكنك فتحه في Excel أو Google Sheets." : "تم فتح قائمة المشاركة لحفظ أو إرسال ملف CSV."); } catch { Alert.alert("تعذر التصدير", "تعذر إنشاء ملف CSV الآن. حاول مرة أخرى."); } finally { setIsExportingCsv(false); }
  };
  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} onPress={() => router.back()} style={styles.closeButton}><MaterialIcons color="#334E68" name="close" size={23} /></TouchableOpacity>
        <Text style={styles.title}>الخصوصية والبيانات</Text>
        <View style={styles.closeSpacer} />
      </View>
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.icon}><MaterialIcons color="#0E7490" name="lock-outline" size={26} /></View>
          <Text style={styles.cardTitle}>بياناتك تحت سيطرتك</Text>
          <Text style={styles.cardText}>يحفظ «بياناتي» بياناتك على جهازك فقط. لا يتطلب التطبيق حسابًا ولا يرسل معلوماتك إلى خدمة خارجية.</Text>
        </View>
        <View style={styles.notificationCard}>
          <View style={styles.notificationCopy}><Text style={styles.notificationTitle}>التنبيهات والإشعارات</Text><Text style={styles.notificationText}>تذكيرات محلية للوثائق قبل 30 و7 ويوم واحد، وللأحداث قبل 7 أيام ويوم واحد.</Text></View>
          <Switch accessibilityLabel="تشغيل التنبيهات والإشعارات" onValueChange={updateNotifications} thumbColor="#FFFFFF" trackColor={{ false: "#CBD5E1", true: "#0E7490" }} value={data.settings.notificationsEnabled} />
        </View>
        <View style={styles.calendarCard}>
          <View style={styles.notificationCopy}><Text style={styles.notificationTitle}>التقويم الافتراضي</Text><Text style={styles.notificationText}>يُفتح منتقي التاريخ بالتقويم الذي تختاره، مع بقاء التاريخين ظاهرين معًا.</Text></View>
          <View style={styles.calendarChoices}>
            <TouchableOpacity accessibilityRole="button" activeOpacity={0.72} onPress={() => setDefaultCalendar("hijri")} style={[styles.calendarChoice, data.settings.defaultCalendar === "hijri" && styles.calendarChoiceActive]}><Text style={[styles.calendarChoiceText, data.settings.defaultCalendar === "hijri" && styles.calendarChoiceTextActive]}>هجري</Text></TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" activeOpacity={0.72} onPress={() => setDefaultCalendar("gregorian")} style={[styles.calendarChoice, data.settings.defaultCalendar === "gregorian" && styles.calendarChoiceActive]}><Text style={[styles.calendarChoiceText, data.settings.defaultCalendar === "gregorian" && styles.calendarChoiceTextActive]}>ميلادي</Text></TouchableOpacity>
          </View>
        </View>
        <View style={styles.notificationCard}><View style={styles.notificationCopy}><Text style={styles.notificationTitle}>تذكيرات الميلاد والزواج</Text><Text style={styles.notificationText}>تُجدول التذكيرات التي فعّلتها من بيانات كل فرد ومن المناسبات المتكررة.</Text></View><Switch accessibilityLabel="تشغيل تذكيرات الميلاد والزواج" onValueChange={setAnnualRemindersEnabled} thumbColor="#FFFFFF" trackColor={{ false: "#CBD5E1", true: "#0E7490" }} value={data.settings.annualRemindersEnabled} /></View>
        <TouchableOpacity accessibilityRole="button" activeOpacity={0.75} disabled={isExporting} onPress={exportPdf} style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}><MaterialIcons color="#FFFFFF" name="picture-as-pdf" size={21} /><Text style={styles.exportText}>{isExporting ? "جاري تجهيز PDF..." : "تصدير السجلات والصور إلى PDF"}</Text></TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" activeOpacity={0.75} disabled={isExportingCsv} onPress={exportCsv} style={[styles.csvButton, isExportingCsv && styles.exportButtonDisabled]}><MaterialIcons color="#0E7490" name="table-view" size={21} /><Text style={styles.csvText}>{isExportingCsv ? "جاري تجهيز CSV..." : "تصدير السجلات إلى CSV"}</Text></TouchableOpacity>
        <View style={styles.recordLine}><Text style={styles.recordLabel}>السجلات المحفوظة</Text><Text style={styles.recordValue}>{totalRecords}</Text></View>
        <TouchableOpacity accessibilityRole="button" activeOpacity={0.75} disabled={!totalRecords} onPress={clearEverything} style={[styles.dangerButton, !totalRecords && styles.dangerButtonDisabled]}>
          <MaterialIcons color={totalRecords ? "#B91C1C" : "#9FB3C8"} name="delete-outline" size={20} />
          <Text style={[styles.dangerText, !totalRecords && styles.dangerTextDisabled]}>مسح كل البيانات المحلية</Text>
        </TouchableOpacity>
        <View style={styles.note}><MaterialIcons color="#829AB1" name="info-outline" size={19} /><Text style={styles.noteText}>استخدم هذا الخيار فقط عند الرغبة في البدء من جديد على هذا الجهاز.</Text></View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", flexDirection: "row-reverse", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8 },
  closeButton: { alignItems: "center", backgroundColor: "#EFF5F8", borderRadius: 17, height: 40, justifyContent: "center", width: 40 },
  closeSpacer: { height: 40, width: 40 },
  title: { color: "#102A43", fontSize: 18, fontWeight: "800", lineHeight: 27, writingDirection: "rtl" },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 35 },
  card: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#E6EEF4", borderRadius: 21, borderWidth: 1, padding: 24 },
  icon: { alignItems: "center", backgroundColor: "#E6F6F8", borderRadius: 23, height: 54, justifyContent: "center", width: 54 },
  cardTitle: { color: "#243B53", fontSize: 18, fontWeight: "800", lineHeight: 27, marginTop: 14, textAlign: "center", writingDirection: "rtl" },
  cardText: { color: "#627D98", fontSize: 14, lineHeight: 23, marginTop: 7, textAlign: "center", writingDirection: "rtl" },
  recordLine: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#E6EEF4", borderRadius: 15, borderWidth: 1, flexDirection: "row-reverse", justifyContent: "space-between", marginTop: 16, paddingHorizontal: 15, paddingVertical: 14 },
  notificationCard: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#E6EEF4", borderRadius: 15, borderWidth: 1, flexDirection: "row-reverse", gap: 14, marginTop: 16, padding: 15 },
  notificationCopy: { flex: 1 },
  calendarCard: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#E6EEF4", borderRadius: 15, borderWidth: 1, flexDirection: "row-reverse", gap: 10, marginTop: 12, padding: 15 },
  calendarChoices: { flexDirection: "row-reverse", gap: 5 },
  calendarChoice: { backgroundColor: "#EFF5F8", borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7 },
  calendarChoiceActive: { backgroundColor: "#0E7490" },
  calendarChoiceText: { color: "#486581", fontSize: 12, fontWeight: "800", writingDirection: "rtl" },
  calendarChoiceTextActive: { color: "#FFFFFF" },
  exportButton: { alignItems: "center", backgroundColor: "#0E7490", borderRadius: 15, flexDirection: "row-reverse", gap: 8, justifyContent: "center", marginTop: 16, minHeight: 52, paddingHorizontal: 16 },
  exportButtonDisabled: { opacity: 0.62 },
  exportText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800", writingDirection: "rtl" },
  csvButton: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#0E7490", borderRadius: 15, borderWidth: 1, flexDirection: "row-reverse", gap: 8, justifyContent: "center", marginTop: 10, minHeight: 50, paddingHorizontal: 16 },
  csvText: { color: "#0E7490", fontSize: 14, fontWeight: "800", writingDirection: "rtl" },
  notificationTitle: { color: "#243B53", fontSize: 14, fontWeight: "800", textAlign: "right", writingDirection: "rtl" },
  notificationText: { color: "#627D98", fontSize: 12, lineHeight: 18, marginTop: 3, textAlign: "right", writingDirection: "rtl" },
  recordLabel: { color: "#486581", fontSize: 14, fontWeight: "700", writingDirection: "rtl" },
  recordValue: { color: "#0E7490", fontSize: 18, fontWeight: "800" },
  dangerButton: { alignItems: "center", backgroundColor: "#FFF5F5", borderColor: "#FECACA", borderRadius: 15, borderWidth: 1, flexDirection: "row-reverse", gap: 8, justifyContent: "center", marginTop: 16, minHeight: 50 },
  dangerButtonDisabled: { backgroundColor: "#F8FAFC", borderColor: "#E6EEF4" },
  dangerText: { color: "#B91C1C", fontSize: 14, fontWeight: "800", writingDirection: "rtl" },
  dangerTextDisabled: { color: "#9FB3C8" },
  note: { alignItems: "flex-start", flexDirection: "row-reverse", gap: 8, marginTop: 18, paddingHorizontal: 6 },
  noteText: { color: "#829AB1", flex: 1, fontSize: 12, lineHeight: 19, textAlign: "right", writingDirection: "rtl" },
});
