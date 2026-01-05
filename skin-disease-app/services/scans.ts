import AsyncStorage from "@react-native-async-storage/async-storage";
import { DJANGO_API } from "../constants/api";
import { Platform } from "react-native";
import { authFetch } from "./api";


export async function fetchScans() {
  const res = await authFetch("/api/scans/", { method: "GET" });

  if (!res.ok) {
    throw new Error(`Failed to fetch scans: ${res.status}`);
  }

  const data = await res.json();

  // DRF pagination support
  if (Array.isArray(data)) {
    return data;
  }

  if (data.results) {
    return data.results;
  }

  if (data.data) {
    return data.data;
  }

  return [];
}


export async function deleteScan(scanId: number) {
  const res = await authFetch(`/api/scans/${scanId}/`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Failed to delete scan");
  }
}



export async function saveScanToBackend(scan: any, imageUri: string) {
  const token = await AsyncStorage.getItem("accessToken");
//   console.log("ACCESS TOKEN BEING SENT:", token);
  if (!token) throw new Error("No token");

  const formData = new FormData();

  formData.append("diagnosis", scan.diagnosis);
  formData.append("confidence", scan.confidence);
  formData.append("severity", scan.severity);
  formData.append("advice", scan.advice);
  formData.append("is_safe", scan.isSafe ? "true" : "false");

  // 🔥 PLATFORM-SPECIFIC IMAGE HANDLING
  if (Platform.OS === "web") {
    // ✅ Convert blob URL to File
    const blob = await fetch(imageUri).then(res => res.blob());

    const file = new File([blob], "scan.jpg", {
      type: blob.type || "image/jpeg",
    });

    formData.append("image", file);
  } else {
    // ✅ Mobile (Android / iOS)
    formData.append("image", {
      uri: imageUri,
      name: "scan.jpg",
      type: "image/jpeg",
    } as any);
  }

  const res = await fetch(`${DJANGO_API.BASE_URL}/api/scans/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // ❌ DO NOT SET Content-Type
    },
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    // console.log("SAVE SCAN ERROR:", data);
    throw data;
  }

  return data;
}