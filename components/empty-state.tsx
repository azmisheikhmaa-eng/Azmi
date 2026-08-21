import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface EmptyStateProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <MaterialIcons color="#0E7490" name={icon} size={30} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <TouchableOpacity accessibilityRole="button" activeOpacity={0.8} onPress={onAction} style={styles.button}>
        <Text style={styles.buttonText}>{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 36,
    paddingTop: 20,
  },
  iconCircle: {
    alignItems: "center",
    backgroundColor: "#E6F6F8",
    borderRadius: 36,
    height: 72,
    justifyContent: "center",
    width: 72,
  },
  title: {
    color: "#102A43",
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 29,
    marginTop: 16,
    textAlign: "center",
    writingDirection: "rtl",
  },
  description: {
    color: "#627D98",
    fontSize: 15,
    lineHeight: 23,
    marginTop: 6,
    textAlign: "center",
    writingDirection: "rtl",
  },
  button: {
    backgroundColor: "#0E7490",
    borderRadius: 14,
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
    writingDirection: "rtl",
  },
});
