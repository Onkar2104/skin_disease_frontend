import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import {
  User,
  Mail,
  Lock,
  Calendar,
  Droplet,
  CheckCircle,
} from "lucide-react-native";
import { useRouter } from "expo-router";

import {
  registerUser,
  sendRegisterOtp,
  verifyRegisterOtp
} from "../../services/auth";


const isWeb = Platform.OS === "web";

export default function RegisterScreen() {
  const router = useRouter();

  /* ---------------- FORM STATES ---------------- */
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] =
    useState<"Male" | "Female" | "Other">("Male");
  const [skinType, setSkinType] = useState("");

  /* ---------------- OTP STATES ---------------- */
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  /* ---------------- TIMER ---------------- */
  const [timeLeft, setTimeLeft] = useState(0);

  /* ---------------- BANNERS ---------------- */
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isOtpValid = otp.length === 6;

  /* ---------------- AUTO CLEAR BANNER ---------------- */
  useEffect(() => {
    if (!error && !success) return;
    const t = setTimeout(() => {
      setError("");
      setSuccess("");
    }, 4000);
    return () => clearTimeout(t);
  }, [error, success]);

  /* ---------------- COUNTDOWN ---------------- */
  useEffect(() => {
    if (timeLeft <= 0 || isOtpVerified) return;

    const timer = setInterval(() => {
      setTimeLeft((v) => v - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isOtpVerified]);

  /* ---------------- SEND OTP ---------------- */
  const handleSendOtp = async () => {
    if (!isEmailValid || timeLeft > 0 || isOtpVerified) return;

    setError("");
    setSuccess("");
    setOtpLoading(true);

    try {
      await sendRegisterOtp({
        email,
      });

      setIsOtpSent(true);
      setTimeLeft(60);
      setSuccess("OTP sent to your email");
    } catch (err: any) {
      setError(err?.error || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  /* ---------------- VERIFY OTP ---------------- */
  const handleVerifyOtp = async () => {
  if (isOtpVerified || !isOtpValid) return;

  setError("");
  setVerifyLoading(true);

  try {
    await verifyRegisterOtp({
      email,
      otp,
    });

    setIsOtpVerified(true);
    setIsOtpSent(false);
    setTimeLeft(0);
    setSuccess("Email verified successfully ✅");
  } catch (err: any) {
    setError(err?.error || "Invalid OTP");
  } finally {
    setVerifyLoading(false);
  }
};


  /* ---------------- FINAL SUBMIT ---------------- */
  const handleRegister = async () => {
  if (!isOtpVerified) {
    setError("Please verify OTP first");
    return;
  }

  setSubmitLoading(true);
  setError("");

  try {
    await registerUser({
      email,
      password: pwd,
      full_name: name,
      age,
      gender,
      skin_type: skinType,
    });

    setSuccess("🎉 Account created successfully!");

    setTimeout(() => {
      router.replace("/auth/login");
    }, 1200);
  } catch (err: any) {
    setError(err?.error || "Registration failed");
  } finally {
    setSubmitLoading(false);
  }
};


  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        isWeb && styles.webCenter,
      ]}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Start your skincare journey</Text>

        {error ? <Banner text={error} type="error" /> : null}
        {success ? <Banner text={success} type="success" /> : null}

        <Input
          icon={<User size={18} />}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          editable={!isOtpVerified}
        />

        {/* EMAIL + VERIFY */}
        <View style={styles.row}>
          <Input
            style={{ flex: 1 }}
            icon={<Mail size={18} />}
            placeholder="Email"
            value={email}
            keyboardType="email-address"
            editable={!isOtpVerified}
            onChangeText={(t: string) => {
              setEmail(t);
              if (isOtpSent || isOtpVerified) {
                setIsOtpSent(false);
                setIsOtpVerified(false);
                setOtp("");
                setTimeLeft(0);
              }
            }}
          />

          <VerifyButton
            loading={otpLoading}
            disabled={!isEmailValid || timeLeft > 0 || isOtpVerified}
            label={
              !isOtpSent
                ? "Verify"
                : timeLeft > 0
                ? `RESEND (${timeLeft}s)`
                : "Resend"
            }
            onPress={handleSendOtp}
          />
        </View>

        {/* OTP + VERIFY */}
        {isOtpSent && !isOtpVerified && (
          <View style={styles.row}>
            <TextInput
              style={styles.otpInput}
              placeholder="Enter OTP"
              value={otp}
              keyboardType="numeric"
              maxLength={6}
              onChangeText={(t) => setOtp(t.replace(/\D/g, ""))}
            />

            <VerifyButton
              loading={verifyLoading}
              disabled={!isOtpValid}
              label="Verify"
              onPress={handleVerifyOtp}
            />
          </View>
        )}

        {isOtpSent && timeLeft > 0 && !isOtpVerified && (
          <Text style={styles.timerText}>{timeLeft}s remaining</Text>
        )}

        <Input
          icon={<Lock size={18} />}
          placeholder="Password"
          secureTextEntry
          value={pwd}
          onChangeText={setPwd}
          editable={isOtpVerified}
        />

        <Input
          icon={<Calendar size={18} />}
          placeholder="Age"
          keyboardType="numeric"
          value={age}
          onChangeText={setAge}
          editable={isOtpVerified}
        />

        <View style={styles.genderBox}>
          {["Male", "Female", "Other"].map((g) => (
            <TouchableOpacity
              key={g}
              disabled={!isOtpVerified}
              style={[
                styles.genderBtn,
                gender === g && styles.genderActive,
                !isOtpVerified && styles.disabled,
              ]}
              onPress={() => setGender(g as any)}
            >
              <Text
                style={
                  gender === g
                    ? styles.genderTextActive
                    : styles.genderText
                }
              >
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View
          style={[
            styles.pickerBox,
            !isOtpVerified && styles.disabled,
          ]}
        >
          <Droplet size={18} />
          <Picker
            enabled={isOtpVerified}
            selectedValue={skinType}
            onValueChange={setSkinType}
            style={{ flex: 1 }}
          >
            <Picker.Item label="Select skin type" value="" />
            <Picker.Item label="Normal" value="normal" />
            <Picker.Item label="Oily" value="oily" />
            <Picker.Item label="Dry" value="dry" />
            <Picker.Item label="Combination" value="combination" />
            <Picker.Item label="Sensitive" value="sensitive" />
          </Picker>
        </View>

        <TouchableOpacity
          style={[
            styles.submitBtn,
            (!isOtpVerified || submitLoading) && styles.disabled,
          ]}
          disabled={!isOtpVerified || submitLoading}
          onPress={handleRegister}
        >
          {submitLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Create Account</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

/* ---------------- COMPONENTS ---------------- */
function Input({ icon, style, editable = true, ...props }: any) {
  return (
    <View style={[styles.inputBox, !editable && styles.disabled, style]}>
      {icon}
      <TextInput style={styles.input} editable={editable} {...props} />
    </View>
  );
}

function VerifyButton({ loading, disabled, label, onPress }: any) {
  return (
    <TouchableOpacity
      style={[styles.verifyBtn, disabled && styles.disabled]}
      disabled={disabled}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.verifyText}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

function Banner({ text, type }: any) {
  return (
    <View
      style={[
        styles.banner,
        type === "error" ? styles.error : styles.success,
      ]}
    >
      <Text style={styles.bannerText}>{text}</Text>
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#f1f5f9",
  },
  webCenter: { alignItems: "center" },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 20,
  },

  title: { fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#64748b", marginBottom: 10 },

  banner: { padding: 10, borderRadius: 12, marginBottom: 10 },
  error: { backgroundColor: "#fee2e2" },
  success: { backgroundColor: "#dcfce7" },
  bannerText: { textAlign: "center", fontWeight: "700" },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 999,
    paddingHorizontal: 14,
    height: 54,
    marginBottom: 10,
  },

  input: {
    flex: 1,
    fontSize: 14,
    color: "#0f172a",
    borderWidth: 0,
    outlineStyle: "none" as any,
    paddingVertical: 0,
  },

  row: { flexDirection: "row", gap: 8, marginBottom: 10 },

  verifyBtn: {
    backgroundColor: "#0f766e",
    paddingHorizontal: 18,
    borderRadius: 999,
    justifyContent: "center",
  },

  verifyText: { color: "#fff", fontWeight: "800" },

  otpInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 54,
    fontSize: 16,
  },

  timerText: {
    textAlign: "center",
    color: "#0f766e",
    marginBottom: 8,
    fontWeight: "600",
  },

  genderBox: {
    flexDirection: "row",
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    padding: 4,
    marginBottom: 10,
  },

  genderBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
    borderRadius: 999,
  },

  genderActive: { backgroundColor: "#0f766e" },
  genderText: { color: "#4b5563" },
  genderTextActive: { color: "#fff", fontWeight: "700" },

  pickerBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 999,
    paddingHorizontal: 10,
    marginBottom: 10,
  },

  submitBtn: {
    backgroundColor: "#0f766e",
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  submitText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  disabled: { opacity: 0.5 },
});
