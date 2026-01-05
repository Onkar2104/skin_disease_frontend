import { DJANGO_API } from "../constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ---------------- SEND OTP ---------------- */
export async function sendRegisterOtp(data: {
  email: string;
}) {
  const form = new FormData();
  form.append("email", data.email);

  const res = await fetch(
    `${DJANGO_API.BASE_URL}/api/auth/register/send-otp/`,
    {
      method: "POST",
      body: form,
    }
  );

  const json = await res.json();
  if (!res.ok) throw json;
  return json;
}

/* ---------------- VERIFY OTP ONLY ---------------- */
export async function verifyRegisterOtp(data: {
  email: string;
  otp: string;
}) {
  const form = new FormData();
  form.append("email", data.email);
  form.append("otp", data.otp);

  const res = await fetch(
    `${DJANGO_API.BASE_URL}/api/auth/register/verify-otp/`,
    {
      method: "POST",
      body: form,
    }
  );

  const json = await res.json();
  if (!res.ok) throw json;
  return json;
}

/* ---------------- FINAL REGISTER ---------------- */
export async function registerUser(data: {
  email: string;
  password: string;
  full_name: string;
  age: string;
  gender: string;
  skin_type: string;
}) {
  const res = await fetch(
    `${DJANGO_API.BASE_URL}/api/auth/register/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  const json = await res.json();
  if (!res.ok) throw json;
  return json;
}


/* ---------------- LOGIN ---------------- */
export async function loginUser(data: {
  email: string;
  password: string;
}) {
  const res = await fetch(`${DJANGO_API.BASE_URL}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) throw json;

  // 🔐 Store tokens
  await AsyncStorage.setItem("accessToken", json.access);
  await AsyncStorage.setItem("refreshToken", json.refresh);

  return json;
}

export async function logoutUser() {
  await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
}

export async function getAccessToken(): Promise<string> {
  const token = await AsyncStorage.getItem("accessToken");

  if (!token || token === "undefined" || token === "null") {
    throw new Error("Access token missing or invalid");
  }

  return token;
}