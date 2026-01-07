import { Platform } from "react-native";
import { DJANGO_API } from "../constants/api";
import { getAccessToken } from "./auth";
import AsyncStorage from "@react-native-async-storage/async-storage";


export async function authFetch(path: string, options: RequestInit = {}) {
  const token = await AsyncStorage.getItem("accessToken");

  const headers: Record<string, string> = {
    ...(options.headers as any),
  };

  // ✅ Attach token ONLY if it exists
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${DJANGO_API.BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // ❌ DO NOT throw before request
  // Let caller handle 401
  return res;
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
