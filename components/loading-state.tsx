import { ActivityIndicator, StyleSheet, View } from "react-native";

export function LoadingState() {
  return (
    <View style={styles.container}>
      <ActivityIndicator color="#0E7490" size="small" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", flex: 1, justifyContent: "center" },
});
