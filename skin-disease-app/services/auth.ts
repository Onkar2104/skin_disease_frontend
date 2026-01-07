import { DJANGO_API } from "../constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ---------------- SEND OTP ---------------- */
export async function sendRegisterOtp(data: {
  email: string;
}) {
  const form = new FormData();
  form.append("email", data.email);

  const res = await fetch(
    `${DJANGO_API.BASE_URL}/api/auth/otp/email/send/`,
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
    `${DJANGO_API.BASE_URL}/api/auth/register/verify/`,
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
  full_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
}) {
  const res = await fetch(
    `${DJANGO_API.BASE_URL}/api/auth/register/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

  // ✅ SINGLE SOURCE OF TRUTH
  await AsyncStorage.multiSet([
    ["accessToken", json.access],
    ["refreshToken", json.refresh],
    ["user", JSON.stringify(json.user ?? {})],
  ]);

  return json;
}

export async function logoutUser() {
  await AsyncStorage.multiRemove([
    "accessToken",
    "refreshToken",
    "user",
  ]);
}


export async function getAccessToken(): Promise<string> {
  const token = await AsyncStorage.getItem("accessToken");

  if (!token || token === "undefined" || token === "null") {
    throw new Error("Access token missing or invalid");
  }

  return token;
}