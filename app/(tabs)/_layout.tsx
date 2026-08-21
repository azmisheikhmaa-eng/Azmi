import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_CONFIG = [
  { name: "index", title: "الرئيسية", icon: "home" },
  { name: "family", title: "العائلة", icon: "groups" },
  { name: "documents", title: "الوثائق", icon: "description" },
  { name: "events", title: "الأحداث", icon: "calendar-month" },
] as const;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 9 : Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: styles.scene,
        tabBarActiveTintColor: "#0E7490",
        tabBarInactiveTintColor: "#829AB1",
        tabBarItemStyle: styles.item,
        tabBarLabelStyle: styles.label,
        tabBarStyle: [styles.tabBar, { height: 60 + bottomPadding, paddingBottom: bottomPadding }],
      }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused }) => (
              <MaterialIcons color={color} name={tab.icon} size={focused ? 25 : 23} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scene: { backgroundColor: "#F7FAFC" },
  tabBar: {
    backgroundColor: "#FFFFFF",
    borderTopColor: "#E6EEF4",
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 0,
    paddingTop: 8,
  },
  item: { paddingTop: 1 },
  label: { fontSize: 11, fontWeight: "700", writingDirection: "rtl" },
});
