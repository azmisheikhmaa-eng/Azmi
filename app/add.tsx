import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";

const OPTIONS = [
  { type: "member", title: "فرد من العائلة", description: "اسم، صلة قرابة، وملاحظات", icon: "person-add" },
  { type: "document", title: "وثيقة", description: "هوية، جواز، رخصة، أو غيرها", icon: "description" },
  { type: "event", title: "حدث مهم", description: "موعد، مناسبة، أو ذكرى", icon: "calendar-month" },
] as const;

export default function AddScreen() {
  const router = useRouter();
  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} onPress={() => router.back()} style={styles.closeButton}>
          <MaterialIcons color="#334E68" name="close" size={23} />
        </TouchableOpacity>
        <Text style={styles.title}>إضافة جديدة</Text>
        <View style={styles.closeSpacer} />
      </View>
      <View style={styles.content}>
        <Text style={styles.description}>اختر نوع السجل الذي تريد إضافته إلى حياتك.</Text>
        <View style={styles.options}>
          {OPTIONS.map((option) => (
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.76}
              key={option.type}
              onPress={() => router.replace({ pathname: "/editor", params: { type: option.type } })}
              style={styles.option}
            >
              <View style={styles.optionIcon}><MaterialIcons color="#0E7490" name={option.icon} size={25} /></View>
              <View style={styles.optionCopy}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              <MaterialIcons color="#9FB3C8" name="chevron-left" size={24} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", flexDirection: "row-reverse", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8 },
  closeButton: { alignItems: "center", backgroundColor: "#EFF5F8", borderRadius: 17, height: 40, justifyContent: "center", width: 40 },
  closeSpacer: { height: 40, width: 40 },
  title: { color: "#102A43", fontSize: 18, fontWeight: "800", lineHeight: 27, writingDirection: "rtl" },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 34 },
  description: { color: "#627D98", fontSize: 15, lineHeight: 23, textAlign: "right", writingDirection: "rtl" },
  options: { gap: 12, marginTop: 22 },
  option: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#E6EEF4", borderRadius: 18, borderWidth: 1, flexDirection: "row-reverse", gap: 13, padding: 15 },
  optionIcon: { alignItems: "center", backgroundColor: "#E6F6F8", borderRadius: 15, height: 50, justifyContent: "center", width: 50 },
  optionCopy: { flex: 1 },
  optionTitle: { color: "#243B53", fontSize: 16, fontWeight: "800", lineHeight: 24, textAlign: "right", writingDirection: "rtl" },
  optionDescription: { color: "#829AB1", fontSize: 12, lineHeight: 18, marginTop: 2, textAlign: "right", writingDirection: "rtl" },
});
