// app/auth/login.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Mail, Lock, Activity as ActivityIcon } from "lucide-react-native";
import { useRouter } from "expo-router";
import { loginUser } from "../../services/auth";

import AsyncStorage from "@react-native-async-storage/async-storage";


export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

 const handleLogin = async () => {
  if (!email || !password) {
    setError("Email and password required");
    return;
  }

  setLoading(true);
  setError("");

  try {
    const res = await loginUser({ email, password });

    await AsyncStorage.multiSet([
      ["accessToken", res.access],
      ["refreshToken", res.refresh],
      ["user", JSON.stringify(res.user)],
    ]);

    router.replace("/"); // go to home
  } catch (err: any) {
    setError(err?.error || err?.detail || "Invalid email or password");
  } finally {
    setLoading(false);
  }
};

  const goToRegister = () => {
    router.replace("/auth/register");
  };

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        {/* Logo / title */}
        <View style={styles.logoBox}>
          <View style={styles.iconCircle}>
            <ActivityIcon size={36} color="#0f766e" />
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to continue your skin health journey
          </Text>
        </View>

        {/* Email */}
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputRow}>
          <Mail size={20} color="#94a3b8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="john@example.com"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {error ? (
          <Text style={{ color: "#dc2626", marginTop: 8, fontSize: 12 }}>
            {error}
          </Text>
        ) : null}


        {/* Password */}
        <Text style={styles.label}>Password</Text>
        <View style={styles.inputRow}>
          <Lock size={20} color="#94a3b8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <View style={styles.forgotRow}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            loading && { opacity: 0.6 }
          ]}
          disabled={loading}
          onPress={handleLogin}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>


        <Text style={styles.switchText}>
          Don&apos;t have an account?{"  "}
          <Text style={styles.switchLink} onPress={goToRegister}>
            Sign Up
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  card: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  logoBox: { alignItems: "center", marginBottom: 24 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  title: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginTop: 4,
  },

  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 12,
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 2,          // ⬆ thicker border
    borderColor: "#e2e8f0",
    paddingHorizontal: 14,
    height: 52,              // ⬆ taller field
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#0f172a",
    // remove inner border on web:
    borderWidth: 0,
    outlineStyle: "none" as any,
    paddingVertical: 0,
  },
  forgotRow: { marginTop: 6, alignItems: "flex-end" },
  forgotText: { fontSize: 11, fontWeight: "700", color: "#0f766e" },

  primaryButton: {
    marginTop: 18,
    backgroundColor: "#0f766e",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  switchText: {
    marginTop: 18,
    textAlign: "center",
    fontSize: 13,
    color: "#64748b",
  },
  switchLink: {
    color: "#0f766e",
    fontWeight: "700",
  },
});
