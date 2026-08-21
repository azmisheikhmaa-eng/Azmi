import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ReactNode } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface RecordCardProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor?: string;
  iconBackground?: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeTone?: "neutral" | "success" | "warning" | "error";
  onPress: () => void;
  rightSlot?: ReactNode;
  imageUri?: string;
  onImagePress?: () => void;
}

export function RecordCard({ icon, iconColor = "#0E7490", iconBackground = "#E6F6F8", title, subtitle, badge, badgeTone = "neutral", onPress, rightSlot, imageUri, onImagePress }: RecordCardProps) {
  return (
    <View style={styles.card}>
      <TouchableOpacity accessibilityLabel={imageUri ? "معاينة صورة الوثيقة" : undefined} accessibilityRole="button" activeOpacity={0.76} onPress={onImagePress ?? onPress} style={[styles.iconBox, { backgroundColor: iconBackground }]}>
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.thumbnail} /> : <MaterialIcons color={iconColor} name={icon} size={23} />}
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" activeOpacity={0.76} onPress={onPress} style={styles.pressArea}><View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.title}>{title}</Text>
          {badge ? <Text style={[styles.badge, badgeTone === "success" && styles.badgeSuccess, badgeTone === "warning" && styles.badgeWarning, badgeTone === "error" && styles.badgeError]}>{badge}</Text> : null}
        </View>
        <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text>
      </View>{rightSlot ?? <MaterialIcons color="#9FB3C8" name="chevron-left" size={22} />}</TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#E6EEF4", borderRadius: 17, borderWidth: 1, flexDirection: "row-reverse", gap: 11, padding: 13 },
  pressArea: { alignItems: "center", flex: 1, flexDirection: "row-reverse", gap: 11, minWidth: 0 },
  iconBox: { alignItems: "center", borderRadius: 14, height: 46, justifyContent: "center", width: 46 },
  thumbnail: { borderRadius: 14, height: 46, width: 46 },
  copy: { flex: 1, minWidth: 0 },
  titleRow: { alignItems: "center", flexDirection: "row-reverse", gap: 8, justifyContent: "space-between" },
  title: { color: "#243B53", flex: 1, fontSize: 15, fontWeight: "800", lineHeight: 21, textAlign: "right", writingDirection: "rtl" },
  subtitle: { color: "#829AB1", fontSize: 12, lineHeight: 18, marginTop: 1, textAlign: "right", writingDirection: "rtl" },
  badge: { backgroundColor: "#EEF4F7", borderRadius: 9, color: "#627D98", fontSize: 10, fontWeight: "800", overflow: "hidden", paddingHorizontal: 7, paddingVertical: 4, writingDirection: "rtl" },
  badgeSuccess: { backgroundColor: "#DCFCE7", color: "#15803D" },
  badgeWarning: { backgroundColor: "#FEF3C7", color: "#B45309" },
  badgeError: { backgroundColor: "#FEE2E2", color: "#B91C1C" },
});
