import { useRouter } from "expo-router";
import { FlatList, StyleSheet } from "react-native";

import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { RecordCard } from "@/components/record-card";
import { ScreenContainer } from "@/components/screen-container";
import { daysUntil, eventTimingLabel, sortByUpcoming } from "@/lib/date-utils";
import { resolveEventDate } from "@/lib/hijri-occasions";
import { usePersonalData } from "@/lib/personal-data-context";
import { EventRecord } from "@/shared/personal-data";

export default function EventsScreen() {
  const router = useRouter();
  const { data, isReady, memberName } = usePersonalData();
  if (!isReady) return <LoadingState />;
  const events = sortByUpcoming(data.events.map((event) => ({ ...event, date: resolveEventDate(event) })), "date");
  return (
    <ScreenContainer>
      <AppHeader actionIcon="add" onAction={() => router.push({ pathname: "/editor", params: { type: "event" } })} subtitle="مناسباتك ومواعيد عائلتك المهمة" title="الأحداث" />
      <FlatList
        contentContainerStyle={events.length ? styles.list : styles.emptyList}
        data={events}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState actionLabel="إضافة حدث" description="أضف مناسبة أو موعدًا مهمًا ليكون في متناولك عند الحاجة." icon="calendar-month" onAction={() => router.push({ pathname: "/editor", params: { type: "event" } })} title="لا توجد أحداث بعد" />}
        renderItem={({ item }) => <EventRow item={item} onPress={() => router.push({ pathname: "/editor", params: { type: "event", id: item.id } })} ownerName={memberName(item.memberId)} />}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

function EventRow({ item, ownerName, onPress }: { item: EventRecord; ownerName?: string; onPress: () => void }) {
  const days = daysUntil(item.date);
  const tone = days !== null && days < 0 ? "neutral" as const : days !== null && days <= 30 ? "warning" as const : "success" as const;
  return <RecordCard badge={eventTimingLabel(item.date)} badgeTone={tone} icon="calendar-month" onPress={onPress} subtitle={`${item.category}${item.hijriOccasionId ? " · هجري متكرر" : ""}${ownerName ? ` · ${ownerName}` : ""}`} title={item.title} />;
}

const styles = StyleSheet.create({ list: { gap: 10, paddingBottom: 24, paddingHorizontal: 20, paddingTop: 22 }, emptyList: { flexGrow: 1 } });
