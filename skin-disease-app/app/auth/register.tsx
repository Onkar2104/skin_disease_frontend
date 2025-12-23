// app/auth/register.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";

import { User, Mail, Lock, Calendar, Droplet } from "lucide-react-native";

const isWeb = Platform.OS === "web";

type RegisterProps = {
  onSwitch?: () => void;
  onRegister?: (data: {
    name: string;
    email: string;
    pwd: string;
    age: string;
    gender: string;
    skinType: string;
  }) => void;
};

export default function RegisterScreen({ onSwitch, onRegister }: RegisterProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "Other">("Male");
  const [skinType, setSkinType] = useState("");

  const handleRegister = () => {
    // TODO: send data to Django API
    const data = { name, email, pwd, age, gender, skinType };
    console.log(data);
    if (onRegister) {
      onRegister(data);
      return;
    }
    // after successful registration -> fallback to login route
    router.replace("/auth/login");
  };

  const goToLogin = () => {
    if (onSwitch) {
      onSwitch();
      return;
    }
    router.replace("/auth/login");
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Fill in your details</Text>

          {/* Name */}
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputRow}>
            <User size={18} color="#94a3b8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputRow}>
            <Mail size={18} color="#94a3b8" style={styles.inputIcon} />
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

          {/* Password */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputRow}>
            <Lock size={18} color="#94a3b8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              value={pwd}
              onChangeText={setPwd}
            />
          </View>

          {/* Age + Gender */}
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Age</Text>
              <View style={styles.inputRow}>
                <Calendar size={18} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="25"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  value={age}
                  onChangeText={setAge}
                />
              </View>
            </View>

            <View style={styles.col}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderRow}>
                {["Male", "Female", "Other"].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderPill,
                      gender === g && styles.genderPillActive,
                    ]}
                    onPress={() => setGender(g as any)}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        gender === g && styles.genderTextActive,
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Skin type dropdown */}
          <Text style={styles.label}>Skin Type</Text>
          <View style={styles.pickerRow}>
            <Droplet size={18} color="#94a3b8" style={styles.inputIcon} />
            <Picker
              selectedValue={skinType}
              onValueChange={(v) => setSkinType(v)}
              style={styles.picker}
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
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={handleRegister}
          >
            <Text style={styles.primaryText}>Create Account</Text>
          </TouchableOpacity>

          <Text style={styles.switchText}>
            Already have an account?{"  "}
            <Text style={styles.switchLink} onPress={goToLogin}>
              Sign In
            </Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingVertical: 32,
    alignItems: "center",
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
  title: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  subtitle: { fontSize: 13, color: "#64748b", marginBottom: 8 },

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
    borderWidth: 2,          // ⬆ thicker
    borderColor: "#e2e8f0",
    paddingHorizontal: 14,
    height: 52,              // ⬆ taller
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#0f172a",
    borderWidth: 0,
    outlineStyle: "none" as any,  // remove inner border on web
    paddingVertical: 0,
  },

  row: { flexDirection: "row", gap: 12 },
  col: { flex: 1 },

  genderRow: {
    flexDirection: "row",
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    padding: 3,
  },
  genderPill: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  genderPillActive: { backgroundColor: "#0f766e" },
  genderText: { fontSize: 11, color: "#4b5563", fontWeight: "600" },
  genderTextActive: { color: "#ecfdf5" },

  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    paddingHorizontal: 8,
    height: 52,
    marginTop: 2,
  },
  picker: {
    flex: 1,
    height: 44,
  },

  primaryButton: {
    marginTop: 20,
    backgroundColor: "#0f766e",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },

  switchText: {
    textAlign: "center",
    marginTop: 18,
    fontSize: 13,
    color: "#6b7280",
  },
  switchLink: {
    color: "#0f766e",
    fontWeight: "700",
  },
});
