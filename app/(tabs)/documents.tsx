import { useRouter } from "expo-router";
import { FlatList, StyleSheet } from "react-native";

import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { RecordCard } from "@/components/record-card";
import { ScreenContainer } from "@/components/screen-container";
import { documentUrgency, documentUrgencyLabel, formatArabicDate, sortByUpcoming } from "@/lib/date-utils";
import { usePersonalData } from "@/lib/personal-data-context";
import { DocumentRecord } from "@/shared/personal-data";

const toneFor = (status: ReturnType<typeof documentUrgency>) => status === "expired" ? "error" as const : status === "soon" ? "warning" as const : status === "ok" ? "success" as const : "neutral" as const;

export default function DocumentsScreen() {
  const router = useRouter();
  const { data, isReady, memberName } = usePersonalData();
  if (!isReady) return <LoadingState />;
  const documents = sortByUpcoming(data.documents, "expiryDate");

  return (
    <ScreenContainer>
      <AppHeader actionIcon="add" onAction={() => router.push({ pathname: "/editor", params: { type: "document" } })} subtitle="احتفظ بتفاصيل وثائقك وتواريخها" title="الوثائق" />
      <FlatList
        contentContainerStyle={documents.length ? styles.list : styles.emptyList}
        data={documents}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState actionLabel="إضافة وثيقة" description="سجل هويتك أو جوازك أو رخصتك لتتابع تاريخ الانتهاء بسهولة." icon="description" onAction={() => router.push({ pathname: "/editor", params: { type: "document" } })} title="لا توجد وثائق بعد" />}
        renderItem={({ item }) => <DocumentRow item={item} onPress={() => router.push({ pathname: "/editor", params: { type: "document", id: item.id } })} onPreview={() => item.imageUri ? router.push({ pathname: "/image-preview" as any, params: { title: item.title, uri: item.imageUri } }) : undefined} ownerName={memberName(item.ownerId)} />}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

function DocumentRow({ item, ownerName, onPress, onPreview }: { item: DocumentRecord; ownerName?: string; onPress: () => void; onPreview: () => void }) {
  const status = documentUrgency(item.expiryDate);
  const imageUri = item.imageUris?.[0] ?? item.imageUri;
  const imageCount = item.imageUris?.length ?? (item.imageUri ? 1 : 0);
  const subtitle = item.expiryDate ? `ينتهي ${formatArabicDate(item.expiryDate)}${item.issuePlace ? ` · ${item.issuePlace}` : ""}${imageCount > 1 ? ` · ${imageCount} صور` : ""}${ownerName ? ` · ${ownerName}` : ""}` : `${item.type}${item.issuePlace ? ` · ${item.issuePlace}` : ""}${imageCount > 1 ? ` · ${imageCount} صور` : ""}${ownerName ? ` · ${ownerName}` : ""}`;
  return <RecordCard badge={documentUrgencyLabel(item.expiryDate)} badgeTone={toneFor(status)} icon="description" imageUri={imageUri} onImagePress={imageUri ? onPreview : undefined} onPress={onPress} subtitle={subtitle} title={item.title} />;
}

const styles = StyleSheet.create({ list: { gap: 10, paddingBottom: 24, paddingHorizontal: 20, paddingTop: 22 }, emptyList: { flexGrow: 1 } });
