import { DJANGO_API } from "../constants/api";

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

/* ---------------- VERIFY OTP + CREATE USER ---------------- */
export async function verifyRegisterOtp(data: {
  email: string;
  otp: string;
  full_name: string;
  password: string;
  age: string;
  gender: string;
  skin_type: string;
}) {
  const form = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      form.append(key, value);
    }
  });

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
