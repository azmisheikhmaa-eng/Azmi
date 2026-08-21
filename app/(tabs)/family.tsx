import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { Alert, FlatList, Image, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { ScreenContainer } from "@/components/screen-container";
import { formatArabicDate } from "@/lib/date-utils";
import { usePersonalData } from "@/lib/personal-data-context";
import { FamilyMember } from "@/shared/personal-data";

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("") || "؟";
}

export default function FamilyScreen() {
  const router = useRouter();
  const { data, isReady } = usePersonalData();
  if (!isReady) return <LoadingState />;

  return (
    <ScreenContainer>
      <AppHeader actionIcon="person-add" onAction={() => router.push({ pathname: "/editor", params: { type: "member" } })} subtitle="الأشخاص المهمون في حياتك" title="العائلة" />
      <FlatList
        contentContainerStyle={data.members.length ? styles.list : styles.emptyList}
        data={data.members}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState actionLabel="إضافة فرد من العائلة" description="أضف أفراد عائلتك لربط الوثائق والأحداث بهم بسهولة." icon="groups" onAction={() => router.push({ pathname: "/editor", params: { type: "member" } })} title="عائلتك تبدأ من هنا" />}
        renderItem={({ item }) => <MemberRow item={item} onPress={() => router.push({ pathname: "/member-detail", params: { id: item.id } })} />}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

function MemberRow({ item, onPress }: { item: FamilyMember; onPress: () => void }) {
  const details = item.birthDate ? `${item.relation} · ${formatArabicDate(item.birthDate)}` : item.relation;
  const contact = item.phone ?? item.email;
  const profile = [item.gender, item.religion, item.birthPlace].filter(Boolean).join(" · ");
  const sms = async () => {
    if (!item.phone) return;
    try { await Linking.openURL(`sms:${item.phone.replace(/[^0-9+]/g, "")}${Platform.OS === "ios" ? "&" : "?"}body=${encodeURIComponent(`مرحبًا ${item.name}، `)}`); } catch { Alert.alert("تعذر فتح الرسائل", "تأكد من توفر تطبيق الرسائل على الجهاز."); }
  };
  const whatsapp = async () => {
    const phone = item.phone?.replace(/[^0-9+]/g, "");
    const international = phone?.startsWith("+") ? phone.slice(1) : phone?.startsWith("00") ? phone.slice(2) : undefined;
    if (!international) { Alert.alert("استخدم الرقم الدولي", "للمراسلة عبر واتساب، احفظ رقم الهاتف بالصيغة الدولية، مثل +9665XXXXXXXX."); return; }
    try { await Linking.openURL(`https://wa.me/${international}?text=${encodeURIComponent(`مرحبًا ${item.name}، `)}`); } catch { Alert.alert("تعذر فتح واتساب", "تأكد من تثبيت واتساب ثم حاول مرة أخرى."); }
  };
  const call = async () => {
    const phone = item.phone?.replace(/[^0-9+]/g, "");
    if (!phone) return;
    try { await Linking.openURL(`tel:${phone}`); } catch { Alert.alert("تعذر إجراء الاتصال", "تأكد من أن الجهاز يدعم الاتصال الهاتفي ثم حاول مرة أخرى."); }
  };
  return (
    <View style={styles.card}><TouchableOpacity accessibilityRole="button" activeOpacity={0.76} onPress={onPress} style={styles.mainRow}><View style={[styles.avatar, { backgroundColor: item.color }]}>{item.photoUri ? <Image source={{ uri: item.photoUri }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{initials(item.name)}</Text>}</View><View style={styles.copy}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.details}>{details}</Text>
        {profile ? <Text numberOfLines={1} style={styles.profile}>{profile}</Text> : null}
        {contact ? <Text numberOfLines={1} style={styles.contact}>{contact}</Text> : null}
      </View><MaterialIcons color="#9FB3C8" name="chevron-left" size={22} /></TouchableOpacity>{item.phone ? <View style={styles.actions}><TouchableOpacity accessibilityLabel={`اتصال بـ ${item.name}`} accessibilityRole="button" activeOpacity={0.74} onPress={call} style={styles.call}><MaterialIcons color="#7C3AED" name="phone" size={17} /><Text style={styles.callText}>اتصال</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" activeOpacity={0.74} onPress={whatsapp} style={styles.whatsapp}><MaterialIcons color="#15803D" name="chat" size={17} /><Text style={styles.whatsappText}>واتساب</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" activeOpacity={0.74} onPress={sms} style={styles.sms}><MaterialIcons color="#0E7490" name="sms" size={17} /><Text style={styles.smsText}>رسالة SMS</Text></TouchableOpacity></View> : null}</View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10, paddingBottom: 24, paddingHorizontal: 20, paddingTop: 22 },
  emptyList: { flexGrow: 1 },
  card: { backgroundColor: "#FFFFFF", borderColor: "#E6EEF4", borderRadius: 17, borderWidth: 1, padding: 13 },
  mainRow: { alignItems: "center", flexDirection: "row-reverse", gap: 12 },
  avatar: { alignItems: "center", borderRadius: 22, height: 44, justifyContent: "center", width: 44 },
  avatarImage: { borderRadius: 22, height: 44, width: 44 },
  avatarText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800", writingDirection: "rtl" },
  copy: { flex: 1 },
  name: { color: "#243B53", fontSize: 15, fontWeight: "800", lineHeight: 21, textAlign: "right", writingDirection: "rtl" },
  details: { color: "#829AB1", fontSize: 12, lineHeight: 18, marginTop: 2, textAlign: "right", writingDirection: "rtl" },
  profile: { color: "#627D98", fontSize: 11, lineHeight: 17, marginTop: 1, textAlign: "right", writingDirection: "rtl" },
  contact: { color: "#0E7490", fontSize: 12, lineHeight: 18, marginTop: 1, textAlign: "right", writingDirection: "rtl" },
  actions: { flexDirection: "row-reverse", gap: 8, marginRight: 56, marginTop: 10 },
  call: { alignItems: "center", backgroundColor: "#F5F3FF", borderRadius: 10, flexDirection: "row-reverse", gap: 5, paddingHorizontal: 10, paddingVertical: 7 },
  callText: { color: "#7C3AED", fontSize: 11, fontWeight: "800", writingDirection: "rtl" },
  whatsapp: { alignItems: "center", backgroundColor: "#F0FDF4", borderRadius: 10, flexDirection: "row-reverse", gap: 5, paddingHorizontal: 10, paddingVertical: 7 },
  whatsappText: { color: "#15803D", fontSize: 11, fontWeight: "800", writingDirection: "rtl" },
  sms: { alignItems: "center", backgroundColor: "#E6F6F8", borderRadius: 10, flexDirection: "row-reverse", gap: 5, paddingHorizontal: 10, paddingVertical: 7 },
  smsText: { color: "#0E7490", fontSize: 11, fontWeight: "800", writingDirection: "rtl" },
});
