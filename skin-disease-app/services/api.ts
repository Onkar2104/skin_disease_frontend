import { Platform } from "react-native";
import { DJANGO_API } from "../constants/api";
import { getAccessToken } from "./auth";

export async function authFetch(url: string, options: any = {}) {
  const token = await getAccessToken();

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
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
    // ✅ WEB: convert image URL to Blob
    const response = await fetch(uri);
    const blob = await response.blob();
    form.append("image", blob, name);
  } else {
    // ✅ ANDROID / IOS
    // @ts-ignore
    form.append("image", { uri, name, type });
  }

  const res = await authFetch(DJANGO_API.PREDICT_URL, {
    method: "POST",
    body: form,
  });


  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }

  return res.json();
}
