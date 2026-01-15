import { Platform } from "react-native";
import { DJANGO_API } from "../constants/api";
import { getAccessToken } from "./auth";
import AsyncStorage from "@react-native-async-storage/async-storage";


export async function authFetch(
  path: string,
  options: RequestInit = {}
) {
  const token = await AsyncStorage.getItem("accessToken");

  // 🔴 CRITICAL: never allow silent unauthenticated calls
  if (!token || token === "null" || token === "undefined") {
    throw new Error("Access token missing");
  }

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
    Authorization: `Bearer ${token}`,
  };

  // ❌ DO NOT set Content-Type for FormData
  if (
    !(options.body instanceof FormData) &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(`${DJANGO_API.BASE_URL}${path}`, {
    ...options,
    headers,
  });
}


// Predict Skin Disease
export async function predictSkinDisease({
  uri,
  name = "photo.jpg",
  type = "image/jpeg",
}: {
  uri: string;
  name?: string;
  type?: string;
}) {
  const form = new FormData();

  if (Platform.OS === "web") {
    const response = await fetch(uri);
    const blob = await response.blob();
    form.append("image", blob, name);
  } else {
    // @ts-ignore
    form.append("image", { uri, name, type });
  }

  const res = await fetch(
    `${DJANGO_API.PREDICT_URL}`,
    {
      method: "POST",
      body: form,
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }

  return res.json();
}
