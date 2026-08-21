import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { buildMemberPdfHtml, buildPersonalDataPdfHtml } from "./pdf-template";
import { resolveEventDate } from "./hijri-occasions";
import { DocumentRecord, EventRecord, FamilyMember, PersonalData } from "../shared/personal-data";

async function imageDataUri(uri?: string) {
  if (!uri) return undefined;
  if (uri.startsWith("data:image")) return uri;
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const extension = uri.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/)?.[1]?.toLowerCase();
    const mimeType = extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg";
    return `data:${mimeType};base64,${base64}`;
  } catch {
    return undefined;
  }
}

async function collectDocumentImages(documents: DocumentRecord[]) {
  return Object.fromEntries((await Promise.all(documents.map(async (document) => [document.id, (await Promise.all((document.imageUris?.length ? document.imageUris : document.imageUri ? [document.imageUri] : []).map(imageDataUri))).filter((image): image is string => Boolean(image))] as const))).filter((entry) => entry[1].length));
}

export async function exportPersonalDataPdf(data: PersonalData) {
  const documentImages = await collectDocumentImages(data.documents);
  const html = buildPersonalDataPdfHtml(data, documentImages);
  if (Platform.OS === "web") {
    await Print.printAsync({ html });
    return { web: true };
  }
  const result = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri, { dialogTitle: "تصدير تقرير بياناتي", mimeType: "application/pdf", UTI: ".pdf" });
  return { uri: result.uri, web: false };
}

export async function exportMemberPdf(member: FamilyMember, documents: DocumentRecord[], events: EventRecord[]) {
  const documentImages = await collectDocumentImages(documents);
  const resolvedEvents = events.map((event) => ({ ...event, date: resolveEventDate(event) }));
  const html = buildMemberPdfHtml(member, documents, resolvedEvents, documentImages);
  if (Platform.OS === "web") {
    await Print.printAsync({ html });
    return { web: true };
  }
  const result = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri, { dialogTitle: `مشاركة ملف ${member.name}`, mimeType: "application/pdf", UTI: ".pdf" });
  return { uri: result.uri, web: false };
}
