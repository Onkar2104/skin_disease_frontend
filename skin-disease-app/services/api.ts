import { Platform } from "react-native";
import { DJANGO_API } from "../constants/api";

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

  const res = await fetch(DJANGO_API.PREDICT_URL, {
    method: "POST",
    body: form,
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }

  return res.json();
}
