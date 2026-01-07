import React, { useState } from "react";
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
import { User, Mail, Lock, Phone } from "lucide-react-native";
import { useRouter } from "expo-router";

import { registerUser } from "../../services/auth";

const isWeb = Platform.OS === "web";

export default function RegisterScreen() {
  const router = useRouter();

  /* ---------------- FORM STATES ---------------- */
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ---------------- SUBMIT ---------------- */
  const handleRegister = async () => {
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await registerUser({
        full_name: fullName,
        email,
        phone,
        password,
        confirm_password: confirmPassword,
      });

      router.replace("/auth/login");
    } catch (err: any) {
      setError(
        err?.email ||
        err?.phone ||
        err?.confirm_password ||
        err?.error ||
        "Registration failed"
      );
    } finally {
      setLoading(false);
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
        <Text style={styles.subtitle}>Register to continue</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Input
          icon={<User size={18} />}
          placeholder="Full Name"
          value={fullName}
          onChangeText={setFullName}
        />

        <Input
          icon={<Mail size={18} />}
          placeholder="Email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Input
          icon={<Phone size={18} />}
          placeholder="Phone Number"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <Input
          icon={<Lock size={18} />}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Input
          icon={<Lock size={18} />}
          placeholder="Confirm Password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.disabled]}
          disabled={loading}
          onPress={handleRegister}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.switchText}>
          Already have an account?{" "}
          <Text
            style={styles.switchLink}
            onPress={() => router.replace("/auth/login")}
          >
            Login
          </Text>
        </Text>
      </View>
    </ScrollView>
  );
}

/* ---------------- COMPONENTS ---------------- */
function Input({ icon, style, ...props }: any) {
  return (
    <View style={[styles.inputBox, style]}>
      {icon}
      <TextInput style={styles.input} {...props} />
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
  subtitle: { color: "#64748b", marginBottom: 16 },

  errorText: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "600",
  },

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
    marginLeft: 8,
    color: "#0f172a",
    borderWidth: 0,
    outlineStyle: "none" as any,
  },

  submitBtn: {
    backgroundColor: "#0f766e",
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },

  switchText: {
    marginTop: 16,
    textAlign: "center",
    color: "#64748b",
  },

  switchLink: {
    color: "#0f766e",
    fontWeight: "800",
  },

  disabled: {
    opacity: 0.6,
  },
});
