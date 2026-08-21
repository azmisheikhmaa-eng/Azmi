import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { PersonalData } from "../shared/personal-data";
import { buildPersonalDataCsv } from "./csv-template";

export { buildPersonalDataCsv } from "./csv-template";

export async function exportPersonalDataCsv(data: PersonalData) {
  const csv = buildPersonalDataCsv(data);
  if (Platform.OS === "web") {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "bayanaati-records.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    return { web: true };
  }
  if (!FileSystem.cacheDirectory) throw new Error("لا يتوفر مجلد مؤقت للتصدير.");
  const uri = `${FileSystem.cacheDirectory}bayanaati-records-${Date.now()}.csv`;
  await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { dialogTitle: "تصدير سجلات بياناتي", mimeType: "text/csv", UTI: "public.comma-separated-values-text" });
  return { uri, web: false };
}
