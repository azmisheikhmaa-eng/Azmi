import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { AppHeader } from "@/components/app-header";
import { LoadingState } from "@/components/loading-state";
import { RecordCard } from "@/components/record-card";
import { ScreenContainer } from "@/components/screen-container";
import { daysUntil, documentUrgency, documentUrgencyLabel, eventTimingLabel } from "@/lib/date-utils";
import { resolveEventDate } from "@/lib/hijri-occasions";
import { usePersonalData } from "@/lib/personal-data-context";

type Priority = { id: string; type: "document" | "event"; title: string; subtitle: string; badge: string; tone: "warning" | "error" | "success" };

export default function HomeScreen() {
  const router = useRouter();
  const { data, isReady } = usePersonalData();
  if (!isReady) return <LoadingState />;

  const priority: Priority[] = [
    ...data.documents
      .filter((document) => ["expired", "soon"].includes(documentUrgency(document.expiryDate)))
      .map((document) => ({ id: document.id, type: "document" as const, title: document.title, subtitle: document.type, badge: documentUrgencyLabel(document.expiryDate), tone: documentUrgency(document.expiryDate) === "expired" ? "error" as const : "warning" as const })),
    ...data.events.map((event) => ({ ...event, date: resolveEventDate(event) }))
      .filter((event) => { const days = daysUntil(event.date); return days !== null && days >= 0 && days <= 30; })
      .map((event) => ({ id: event.id, type: "event" as const, title: event.title, subtitle: `${event.category}${event.hijriOccasionId ? " · هجري متكرر" : ""}`, badge: eventTimingLabel(event.date), tone: "warning" as const })),
  ].slice(0, 4);

  return (
    <ScreenContainer containerClassName="bg-background">
      <AppHeader actionIcon="settings" onAction={() => router.push("/settings")} subtitle="كل ما يهمك في مكان واحد" title="بياناتي" />
      <FlatList
        contentContainerStyle={styles.content}
        data={priority}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        ListFooterComponent={<QuickActions onSelect={(type) => router.push({ pathname: "/editor", params: { type } })} />}
        ListHeaderComponent={<DashboardHeader documents={data.documents.length} events={data.events.length} members={data.members.length} hasPriority={Boolean(priority.length)} />}
        ListEmptyComponent={<View style={styles.clearState}><MaterialIcons color="#0E7490" name="task-alt" size={28} /><Text style={styles.clearTitle}>كل شيء هادئ الآن</Text><Text style={styles.clearText}>ستظهر الوثائق القريبة من الانتهاء والأحداث القادمة هنا.</Text></View>}
        renderItem={({ item }) => <RecordCard badge={item.badge} badgeTone={item.tone} icon={item.type === "document" ? "description" : "calendar-month"} onPress={() => router.push({ pathname: "/editor", params: { type: item.type, id: item.id } })} subtitle={item.subtitle} title={item.title} />}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

function DashboardHeader({ members, documents, events, hasPriority }: { members: number; documents: number; events: number; hasPriority: boolean }) {
  return (
    <View>
      <View style={styles.welcomeCard}>
        <View style={styles.cardIcon}><MaterialIcons color="#FFFFFF" name="verified-user" size={27} /></View>
        <View style={styles.welcomeCopy}><Text style={styles.welcomeTitle}>نظّم تفاصيلك براحة</Text><Text style={styles.welcomeText}>بياناتك ووثائقك ومواعيد عائلتك محفوظة محليًا وبسهولة.</Text></View>
      </View>
      <View style={styles.stats}>
        <Stat icon="groups" label="العائلة" value={members} />
        <Stat icon="description" label="الوثائق" value={documents} />
        <Stat icon="calendar-month" label="الأحداث" value={events} />
      </View>
      {hasPriority ? <Text style={styles.sectionTitle}>تحتاج انتباهك</Text> : null}
    </View>
  );
}

function Stat({ icon, label, value }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; value: number }) {
  return <View style={styles.stat}><MaterialIcons color="#0E7490" name={icon} size={18} /><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function QuickActions({ onSelect }: { onSelect: (type: "member" | "document" | "event") => void }) {
  return (
    <View style={styles.quickSection}>
      <Text style={styles.sectionTitle}>إضافة سريعة</Text>
      <View style={styles.quickRow}>
        <QuickAction icon="person-add" label="فرد" onPress={() => onSelect("member")} />
        <QuickAction icon="description" label="وثيقة" onPress={() => onSelect("document")} />
        <QuickAction icon="calendar-month" label="حدث" onPress={() => onSelect("event")} />
      </View>
    </View>
  );
}

function QuickAction({ icon, label, onPress }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; onPress: () => void }) {
  return <TouchableOpacity accessibilityRole="button" activeOpacity={0.75} onPress={onPress} style={styles.quickAction}><View style={styles.quickIcon}><MaterialIcons color="#0E7490" name={icon} size={22} /></View><Text style={styles.quickLabel}>{label}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  content: { gap: 10, paddingBottom: 25, paddingHorizontal: 20, paddingTop: 22 },
  welcomeCard: { alignItems: "center", backgroundColor: "#0E7490", borderRadius: 22, flexDirection: "row-reverse", gap: 14, padding: 18 },
  cardIcon: { alignItems: "center", backgroundColor: "#0A5C70", borderRadius: 17, height: 52, justifyContent: "center", width: 52 },
  welcomeCopy: { flex: 1 },
  welcomeTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "800", lineHeight: 26, textAlign: "right", writingDirection: "rtl" },
  welcomeText: { color: "#DDF6FA", fontSize: 13, lineHeight: 20, marginTop: 3, textAlign: "right", writingDirection: "rtl" },
  stats: { flexDirection: "row-reverse", gap: 9, marginTop: 12 },
  stat: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#E6EEF4", borderRadius: 15, borderWidth: 1, flex: 1, gap: 3, paddingVertical: 11 },
  statValue: { color: "#243B53", fontSize: 18, fontWeight: "800", lineHeight: 22 },
  statLabel: { color: "#829AB1", fontSize: 11, fontWeight: "700", writingDirection: "rtl" },
  sectionTitle: { color: "#243B53", fontSize: 16, fontWeight: "800", lineHeight: 23, marginTop: 19, textAlign: "right", writingDirection: "rtl" },
  clearState: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#E6EEF4", borderRadius: 18, borderWidth: 1, marginTop: 12, padding: 23 },
  clearTitle: { color: "#243B53", fontSize: 16, fontWeight: "800", lineHeight: 23, marginTop: 8, writingDirection: "rtl" },
  clearText: { color: "#829AB1", fontSize: 13, lineHeight: 20, marginTop: 2, textAlign: "center", writingDirection: "rtl" },
  quickSection: { marginTop: 9 },
  quickRow: { flexDirection: "row-reverse", gap: 9, marginTop: 12 },
  quickAction: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#E6EEF4", borderRadius: 16, borderWidth: 1, flex: 1, gap: 6, paddingVertical: 13 },
  quickIcon: { alignItems: "center", backgroundColor: "#E6F6F8", borderRadius: 13, height: 38, justifyContent: "center", width: 38 },
  quickLabel: { color: "#486581", fontSize: 12, fontWeight: "800", writingDirection: "rtl" },
});
