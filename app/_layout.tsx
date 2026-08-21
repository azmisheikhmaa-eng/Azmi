import "@/global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { ThemeProvider } from "@/lib/theme-provider";
import { PersonalDataProvider } from "@/lib/personal-data-context";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <PersonalDataProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="add" options={{ presentation: "modal" }} />
          <Stack.Screen name="editor" options={{ presentation: "modal" }} />
          <Stack.Screen name="settings" options={{ presentation: "modal" }} />
          <Stack.Screen name="image-preview" options={{ presentation: "modal", animation: "fade" }} />
        </Stack>
      </PersonalDataProvider>
    </ThemeProvider>
  );
}
