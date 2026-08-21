import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  actionIcon?: keyof typeof MaterialIcons.glyphMap;
  onAction?: () => void;
  children?: ReactNode;
}

export function AppHeader({ title, subtitle, actionIcon, onAction, children }: AppHeaderProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {actionIcon && onAction ? (
          <TouchableOpacity
            accessibilityLabel={title === "حياتي" ? "الإعدادات" : "إجراء إضافي"}
            accessibilityRole="button"
            activeOpacity={0.68}
            onPress={onAction}
            style={styles.iconButton}
          >
            <MaterialIcons color="#0E7490" name={actionIcon} size={22} />
          </TouchableOpacity>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  topRow: {
    alignItems: "flex-start",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    color: "#102A43",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 39,
    textAlign: "right",
    writingDirection: "rtl",
  },
  subtitle: {
    color: "#627D98",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 2,
    textAlign: "right",
    writingDirection: "rtl",
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "#E6F6F8",
    borderRadius: 18,
    height: 42,
    justifyContent: "center",
    marginRight: 12,
    width: 42,
  },
});
