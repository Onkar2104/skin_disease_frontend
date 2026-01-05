import { Platform } from "react-native";
import { DJANGO_API } from "../constants/api";
import { getAccessToken } from "./auth";
import AsyncStorage from "@react-native-async-storage/async-storage";


export async function authFetch(path: string, options: RequestInit = {}) {
  const token = await AsyncStorage.getItem("accessToken");

  if (!token) {
    throw new Error("No access token found");
  }

  return fetch(`${DJANGO_API.BASE_URL}${path}`, {
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
