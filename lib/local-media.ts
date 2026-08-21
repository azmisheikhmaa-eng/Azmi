import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

export type DocumentImageSize = "original" | "landscape" | "portrait" | "square";

function extensionFromUri(uri: string) {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
  return match?.[1]?.toLowerCase() ?? "jpg";
}

export async function pickPersistentImage(prefix: "member" | "document", aspect: [number, number], size: DocumentImageSize = "landscape") {
  const selectedAspect = size === "portrait" ? [3, 4] as [number, number] : size === "square" ? [1, 1] as [number, number] : aspect;
  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: size !== "original",
    aspect: selectedAspect,
    base64: Platform.OS === "web",
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: size === "original" ? 1 : 0.85,
  });

  if (result.canceled) return undefined;

  const asset = result.assets[0];
  if (Platform.OS === "web") {
    if (asset.base64) return `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`;
    return asset.uri;
  }

  const directory = FileSystem.documentDirectory ? `${FileSystem.documentDirectory}bayanaati-media/` : undefined;
  if (!directory) return asset.uri;

  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const destination = `${directory}${prefix}-${Date.now()}.${extensionFromUri(asset.uri)}`;
  await FileSystem.copyAsync({ from: asset.uri, to: destination });
  return destination;
}
