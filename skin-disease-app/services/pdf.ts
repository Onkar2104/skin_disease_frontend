import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { DJANGO_API } from "../constants/api";

export async function downloadScanPDF(scanId: number) {
  const token = await AsyncStorage.getItem("accessToken");
  if (!token) throw new Error("No auth token");

  const url = `${DJANGO_API.BASE_URL}/api/scans/${scanId}/pdf/`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to download PDF");
  }

  const blob = await res.blob();

  // 🌐 WEB
  if (Platform.OS === "web") {
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `scan_${scanId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
    return;
  }

  // 📱 MOBILE (Expo)
  const base64 = await blobToBase64(blob);
  const fileUri = `${(FileSystem as any).documentDirectory}scan_${scanId}.pdf`; // Type assertion to bypass TS error

  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: 'base64',
  });

  alert("PDF saved to device");
}

// helper
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const data = reader.result as string;
      resolve(data.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
