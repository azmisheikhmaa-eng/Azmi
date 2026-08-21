import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { DocumentImageSize, pickPersistentImage } from "@/lib/local-media";

interface ImagePickerFieldProps {
  label: string;
  value?: string;
  onChange: (uri?: string) => void;
  kind: "member" | "document";
  onPreview?: () => void;
}

const DOCUMENT_SIZES: { id: DocumentImageSize; label: string }[] = [
  { id: "original", label: "الأصلي" },
  { id: "landscape", label: "أفقي" },
  { id: "portrait", label: "عمودي" },
  { id: "square", label: "مربع" },
];

export function ImagePickerField({ label, value, onChange, kind, onPreview }: ImagePickerFieldProps) {
  const [isPicking, setIsPicking] = useState(false);
  const [documentSize, setDocumentSize] = useState<DocumentImageSize>("landscape");
  const isMember = kind === "member";

  const chooseImage = async () => {
    try {
      setIsPicking(true);
      const uri = await pickPersistentImage(kind, isMember ? [1, 1] : [4, 3], isMember ? "square" : documentSize);
      if (uri) onChange(uri);
    } catch {
      Alert.alert("تعذر اختيار الصورة", "تأكد من السماح للتطبيق بالوصول إلى الصور ثم حاول مرة أخرى.");
    } finally {
      setIsPicking(false);
    }
  };

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TouchableOpacity accessibilityLabel={value && !isMember ? "معاينة صورة الوثيقة" : undefined} accessibilityRole={value && !isMember ? "button" : undefined} activeOpacity={value && !isMember ? 0.78 : 1} disabled={!value || isMember} onPress={onPreview} style={[styles.preview, isMember && styles.roundPreview]}>
          {value ? <Image source={{ uri: value }} style={[styles.previewImage, isMember && styles.roundPreview]} /> : <MaterialIcons color="#0E7490" name={isMember ? "person-outline" : "image-search"} size={isMember ? 28 : 26} />}
        </TouchableOpacity>
        <View style={styles.actions}>
          <TouchableOpacity accessibilityRole="button" activeOpacity={0.74} disabled={isPicking} onPress={chooseImage} style={[styles.chooseButton, isPicking && styles.buttonDisabled]}>
            <MaterialIcons color="#0E7490" name="add-photo-alternate" size={19} />
            <Text style={styles.chooseText}>{isPicking ? "جاري الفتح..." : value ? "تغيير الصورة" : "اختيار صورة"}</Text>
          </TouchableOpacity>
          {value ? <View style={styles.actionRow}>{!isMember ? <TouchableOpacity accessibilityRole="button" activeOpacity={0.74} onPress={onPreview} style={styles.previewButton}><MaterialIcons color="#0E7490" name="fullscreen" size={17} /><Text style={styles.previewText}>معاينة كاملة</Text></TouchableOpacity> : null}<TouchableOpacity accessibilityRole="button" activeOpacity={0.74} onPress={() => onChange(undefined)} style={styles.removeButton}><MaterialIcons color="#B91C1C" name="delete-outline" size={17} /><Text style={styles.removeText}>إزالة الصورة</Text></TouchableOpacity></View> : <Text style={styles.helper}>تُحفظ الصورة على هذا الجهاز فقط.</Text>}
        </View>
      </View>
      {!isMember ? <View style={styles.sizeRow}>{DOCUMENT_SIZES.map((size) => <TouchableOpacity accessibilityRole="button" activeOpacity={0.72} key={size.id} onPress={() => setDocumentSize(size.id)} style={[styles.sizeChip, documentSize === size.id && styles.sizeChipActive]}><Text style={[styles.sizeText, documentSize === size.id && styles.sizeTextActive]}>{size.label}</Text></TouchableOpacity>)}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: 19 },
  label: { color: "#334E68", fontSize: 14, fontWeight: "800", lineHeight: 21, marginBottom: 8, textAlign: "right", writingDirection: "rtl" },
  row: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 14, borderWidth: 1, flexDirection: "row-reverse", gap: 13, padding: 11 },
  preview: { alignItems: "center", backgroundColor: "#E6F6F8", borderRadius: 12, height: 68, justifyContent: "center", overflow: "hidden", width: 82 },
  roundPreview: { borderRadius: 34, width: 68 },
  previewImage: { height: "100%", width: "100%" },
  actions: { alignItems: "flex-start", flex: 1, gap: 6 },
  actionRow: { flexDirection: "row-reverse", gap: 10 },
  chooseButton: { alignItems: "center", backgroundColor: "#E6F6F8", borderRadius: 10, flexDirection: "row-reverse", gap: 6, minHeight: 36, paddingHorizontal: 11, paddingVertical: 7 },
  buttonDisabled: { opacity: 0.62 },
  chooseText: { color: "#0E7490", fontSize: 13, fontWeight: "800", writingDirection: "rtl" },
  removeButton: { alignItems: "center", flexDirection: "row-reverse", gap: 4, paddingVertical: 2 },
  removeText: { color: "#B91C1C", fontSize: 12, fontWeight: "700", writingDirection: "rtl" },
  previewButton: { alignItems: "center", flexDirection: "row-reverse", gap: 4, paddingVertical: 2 },
  previewText: { color: "#0E7490", fontSize: 12, fontWeight: "700", writingDirection: "rtl" },
  helper: { color: "#829AB1", fontSize: 11, lineHeight: 17, textAlign: "right", writingDirection: "rtl" },
  sizeRow: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 6, marginTop: 10 },
  sizeChip: { backgroundColor: "#EFF5F8", borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6 },
  sizeChipActive: { backgroundColor: "#0E7490" },
  sizeText: { color: "#486581", fontSize: 11, fontWeight: "800", writingDirection: "rtl" },
  sizeTextActive: { color: "#FFFFFF" },
});
