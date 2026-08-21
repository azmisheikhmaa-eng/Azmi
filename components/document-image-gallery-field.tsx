import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { DocumentImageSize, pickPersistentImage } from "@/lib/local-media";

interface DocumentImageGalleryFieldProps {
  images: string[];
  onChange: (images: string[]) => void;
  onPreview: (uri: string, position: number) => void;
}

const SIZES: { id: DocumentImageSize; label: string }[] = [
  { id: "original", label: "الأصلي" },
  { id: "landscape", label: "أفقي" },
  { id: "portrait", label: "عمودي" },
  { id: "square", label: "مربع" },
];

export function DocumentImageGalleryField({ images, onChange, onPreview }: DocumentImageGalleryFieldProps) {
  const [isPicking, setIsPicking] = useState(false);
  const [size, setSize] = useState<DocumentImageSize>("landscape");
  const addImage = async () => {
    try {
      setIsPicking(true);
      const uri = await pickPersistentImage("document", [4, 3], size);
      if (uri) onChange([...images, uri]);
    } catch {
      Alert.alert("تعذر اختيار الصورة", "تأكد من السماح للتطبيق بالوصول إلى الصور ثم حاول مرة أخرى.");
    } finally {
      setIsPicking(false);
    }
  };
  return <View style={styles.group}>
    <Text style={styles.label}>صور الوثيقة (اختيارية)</Text>
    <Text style={styles.helper}>أضف أكثر من صورة للوجهين أو الصفحات، ثم اضغط على أي صورة لمعاينتها كاملة.</Text>
    <View style={styles.sizeRow}>{SIZES.map((option) => <TouchableOpacity accessibilityRole="button" activeOpacity={0.72} key={option.id} onPress={() => setSize(option.id)} style={[styles.sizeChip, size === option.id && styles.sizeChipActive]}><Text style={[styles.sizeText, size === option.id && styles.sizeTextActive]}>{option.label}</Text></TouchableOpacity>)}</View>
    <TouchableOpacity accessibilityRole="button" activeOpacity={0.75} disabled={isPicking} onPress={addImage} style={[styles.addButton, isPicking && styles.disabled]}><MaterialIcons color="#0E7490" name="add-photo-alternate" size={20} /><Text style={styles.addText}>{isPicking ? "جاري الفتح..." : "إضافة صورة للوثيقة"}</Text></TouchableOpacity>
    {images.length ? <ScrollView contentContainerStyle={styles.gallery} horizontal showsHorizontalScrollIndicator={false}>{images.map((uri, index) => <View key={`${uri}-${index}`} style={styles.imageItem}><TouchableOpacity accessibilityLabel={`معاينة الصورة ${index + 1}`} accessibilityRole="button" activeOpacity={0.78} onPress={() => onPreview(uri, index)}><Image source={{ uri }} style={styles.image} /><View style={styles.counter}><Text style={styles.counterText}>{index + 1}</Text></View></TouchableOpacity><TouchableOpacity accessibilityLabel={`إزالة الصورة ${index + 1}`} accessibilityRole="button" activeOpacity={0.74} onPress={() => onChange(images.filter((_, itemIndex) => itemIndex !== index))} style={styles.remove}><MaterialIcons color="#FFFFFF" name="close" size={15} /></TouchableOpacity></View>)}</ScrollView> : null}
  </View>;
}

const styles = StyleSheet.create({
  group: { marginBottom: 19 }, label: { color: "#334E68", fontSize: 14, fontWeight: "800", lineHeight: 21, marginBottom: 4, textAlign: "right", writingDirection: "rtl" }, helper: { color: "#829AB1", fontSize: 11, lineHeight: 17, textAlign: "right", writingDirection: "rtl" }, sizeRow: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 6, marginTop: 10 }, sizeChip: { backgroundColor: "#EFF5F8", borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6 }, sizeChipActive: { backgroundColor: "#0E7490" }, sizeText: { color: "#486581", fontSize: 11, fontWeight: "800", writingDirection: "rtl" }, sizeTextActive: { color: "#FFFFFF" }, addButton: { alignItems: "center", backgroundColor: "#E6F6F8", borderRadius: 12, flexDirection: "row-reverse", gap: 7, justifyContent: "center", marginTop: 10, minHeight: 45 }, disabled: { opacity: 0.62 }, addText: { color: "#0E7490", fontSize: 13, fontWeight: "800", writingDirection: "rtl" }, gallery: { flexDirection: "row-reverse", gap: 10, paddingTop: 12 }, imageItem: { height: 100, position: "relative", width: 118 }, image: { backgroundColor: "#EFF5F8", borderColor: "#D9E2EC", borderRadius: 10, borderWidth: 1, height: 92, width: 118 }, remove: { alignItems: "center", backgroundColor: "#B91C1C", borderRadius: 13, height: 26, justifyContent: "center", position: "absolute", right: -5, top: -5, width: 26 }, counter: { alignItems: "center", backgroundColor: "rgba(16,42,67,0.72)", borderRadius: 8, bottom: 8, height: 20, justifyContent: "center", left: 8, minWidth: 20, paddingHorizontal: 5, position: "absolute" }, counterText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
});
