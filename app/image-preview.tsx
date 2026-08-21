import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export default function ImagePreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ uri?: string; title?: string }>();
  const uri = first(params.uri);
  const title = first(params.title) ?? "صورة الوثيقة";
  return <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-foreground"><View style={styles.header}><TouchableOpacity accessibilityRole="button" activeOpacity={0.72} onPress={() => router.back()} style={styles.close}><MaterialIcons color="#FFFFFF" name="close" size={24} /></TouchableOpacity><Text numberOfLines={1} style={styles.title}>{title}</Text><View style={styles.spacer} /></View><View style={styles.content}>{uri ? <Image resizeMode="contain" source={{ uri }} style={styles.image} /> : <Text style={styles.missing}>لا توجد صورة متاحة للمعاينة.</Text>}</View></ScreenContainer>;
}

const styles = StyleSheet.create({ header: { alignItems: "center", flexDirection: "row-reverse", justifyContent: "space-between", paddingHorizontal: 18, paddingTop: 8 }, close: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.16)", borderRadius: 18, height: 40, justifyContent: "center", width: 40 }, title: { color: "#FFFFFF", flex: 1, fontSize: 16, fontWeight: "800", marginHorizontal: 14, textAlign: "center", writingDirection: "rtl" }, spacer: { height: 40, width: 40 }, content: { alignItems: "center", flex: 1, justifyContent: "center", padding: 18 }, image: { height: "100%", width: "100%" }, missing: { color: "#FFFFFF", fontSize: 15, writingDirection: "rtl" } });
