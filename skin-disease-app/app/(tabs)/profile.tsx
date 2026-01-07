import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Switch,
    Image,
    Alert,
    Modal,
    FlatList,
    ActivityIndicator,
    Platform,
    KeyboardAvoidingView,
    Animated,
    Easing,
    SafeAreaView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
    Camera,
    Edit3,
    Save,
    User,
    Mail,
    Phone,
    Calendar,
    MapPin,
    ShieldCheck,
    CheckCircle2,
    XCircle,
    ChevronDown,
    MessageCircle,
    Smartphone
} from 'lucide-react-native';

import { authFetch } from "@/services/api";
import { red } from 'react-native-reanimated/lib/typescript/Colors';
import DateTimePicker from "@react-native-community/datetimepicker";

// --- Constants ---
const COLORS = {
    primary: '#0f766e',
    primaryLight: '#ccfbf1',
    secondary: '#f0f9ff',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#e2e8f0',
    background: '#f8fafc',
    white: '#ffffff',
    error: '#ef4444',
    success: '#10b981',
};

const MOCK_COUNTRIES = [
    { code: '+91', name: 'India', flag: '🇮🇳' },
    { code: '+1', name: 'USA', flag: '🇺🇸' },
    { code: '+44', name: 'UK', flag: '🇬🇧' },
    { code: '+971', name: 'UAE', flag: '🇦🇪' },
];

const SKIN_TYPES = ['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const GENDERS = ['Male', 'Female', 'Other'];

const parseDOB = (dob: string) => {
  const [d, m, y] = dob.split("/");
  return new Date(Number(y), Number(m) - 1, Number(d));
};

type FormData = {
    profilePhoto: string | null;
    fullName: string;
    email: string;
    countryCode: string;
    phone: string;
    isWhatsappSame: boolean;
    whatsappNumber: string;
    emergencyContact: string;
    dob: string;
    age: string;
    gender: string;
    skinType: string;
    bloodGroup: string;
    area: string;
    city: string;
    taluka: string;
    district: string;
    state: string;
    country: string;
    pincode: string;
    insuranceName: string;
    insuranceNumber: string;
};

// --- Helper Components (MOVED OUTSIDE) ---

const SectionHeader = ({ title, icon: Icon }: { title: string, icon: any }) => (
    <View style={styles.sectionHeader}>
        <View style={styles.sectionIconBox}>
            <Icon size={18} color={COLORS.primary} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
    </View>
);

const TextInputField = React.memo(({
    label,
    value,
    onChangeText,
    placeholder,
    icon: Icon,
    keyboardType = 'default',
    editable = true,
    rightElement,
}: any) => {
    return (
        <View style={[styles.inputGroup, !editable && styles.disabledGroup]}>
            <Text style={styles.label}>{label}</Text>

            <View style={[styles.inputContainer, !editable && styles.disabledInput]}>
                {Icon && (
                    <Icon size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                )}

                <TextInput
                    style={[styles.input, !editable && styles.disabledText]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    editable={editable}
                    keyboardType={keyboardType}
                    placeholderTextColor={COLORS.textMuted}
                    // Important for avoiding focus loss issues on some Android versions
                    blurOnSubmit={false}
                    underlineColorAndroid="transparent"
                />

                {rightElement}
            </View>
        </View>
    );
});

// --- OTP Component ---
const OtpVerificationSection = ({
  isVisible,
  isVerifying,
  onVerify,
  onCancel,
  error,
}: {
  isVisible: boolean;
  isVerifying: boolean;
  onVerify: (otp: string) => void;
  onCancel: () => void;
  error?: string;
}) => {
  const [otp, setOtp] = useState("");
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isVisible ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();

    if (isVisible) setOtp("");
  }, [isVisible]);

  if (!isVisible) return null; // ⭐ IMPORTANT

  return (
    <Animated.View
      style={[
        styles.otpContainer,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [-8, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.otpInner}>
        <View style={styles.otpHeader}>
          <Text style={styles.otpTitle}>Enter Verification Code</Text>
          <TouchableOpacity onPress={onCancel}>
            <XCircle size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <TextInput
          style={[styles.otpSingleInput, error && styles.otpInputError]}
          keyboardType="numeric"
          maxLength={6}
          autoFocus
          value={otp}
          onChangeText={(t) => setOtp(t.replace(/\D/g, ""))}
        />

        {error && <Text style={styles.otpErrorText}>{error}</Text>}

        <TouchableOpacity
          style={styles.otpVerifyBtn}
          onPress={() => onVerify(otp)}
          disabled={isVerifying || otp.length !== 6}
        >
          {isVerifying ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.otpVerifyBtnText}>Verify OTP</Text>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// --- Main Screen ---

export default function UserProfileScreen() {
    // --- State ---
    const [isEditing, setIsEditing] = useState(false);
    const [loadingAddress, setLoadingAddress] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);


    // Form Data
    const [form, setForm] = useState<FormData>({
        profilePhoto: null,
        fullName: 'Arjun Mehta',
        email: 'arjun.mehta@example.com',
        countryCode: '+91',
        phone: '9876543210',
        isWhatsappSame: false,
        whatsappNumber: '',
        emergencyContact: '',
        dob: '15/08/1995',
        age: '29',
        gender: 'Male',
        skinType: 'Normal',
        bloodGroup: 'B+',
        area: 'Shivaji Nagar',
        city: 'Pune',
        taluka: 'Pune City',
        district: 'Pune',
        state: 'Maharashtra',
        country: 'India',
        pincode: '411005',
        insuranceName: '',
        insuranceNumber: '',
    });

    // Verification States
    const [emailVerified, setEmailVerified] = useState(false);
    const [phoneVerified, setPhoneVerified] = useState(false);
    const [showEmailOtp, setShowEmailOtp] = useState(false);
    const [showPhoneOtp, setShowPhoneOtp] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [otpError, setOtpError] = useState("");

    // Modal States
    const [showCountryPicker, setShowCountryPicker] = useState(false);

    // --- Logic & Effects ---

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const res = await authFetch("/api/auth/profile/");
                const data = await res.json();
                setForm(prev => ({
                    ...prev,
                    fullName: data.full_name,
                    email: data.email,
                    phone: data.phone || "",
                }));
                setEmailVerified(data.email_verified);
                setPhoneVerified(data.phone_verified);
            } catch {
                Alert.alert("Error", "Failed to load profile");
            }
        };
        loadProfile();
    }, []);

    // 1. Auto-Calculate Age
    useEffect(() => {
        if (form.dob.length === 10) {
            const parts = form.dob.split('/');
            if (parts.length === 3) {
                const d = parseInt(parts[0]);
                const m = parseInt(parts[1]) - 1;
                const y = parseInt(parts[2]);
                if (!isNaN(y)) {
                    const birth = new Date(y, m, d);
                    const now = new Date();
                    let age = now.getFullYear() - birth.getFullYear();
                    const monthDiff = now.getMonth() - birth.getMonth();
                    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
                        age--;
                    }
                    setForm(prev => ({ ...prev, age: age.toString() }));
                }
            }
        }
    }, [form.dob]);

    // 2. WhatsApp Auto-Fill
    useEffect(() => {
        if (form.isWhatsappSame) {
            setForm(prev => ({ ...prev, whatsappNumber: prev.phone }));
        }
    }, [form.isWhatsappSame, form.phone]);

    // 3. Address Auto-Fill (Mock API)
    useEffect(() => {
        if (form.pincode.length === 6 && isEditing) {
            const fetchAddress = async () => {
                setLoadingAddress(true);
                try {
                    await new Promise(r => setTimeout(r, 1200));
                    if (form.pincode === '411005') {
                        setForm(prev => ({
                            ...prev,
                            city: 'Pune',
                            district: 'Pune',
                            state: 'Maharashtra',
                            country: 'India',
                            taluka: 'Shivajinagar',
                            area: 'Jangali Maharaj Road'
                        }));
                    } else {
                        setForm(prev => ({
                            ...prev,
                            city: 'New Delhi',
                            district: 'New Delhi',
                            state: 'Delhi',
                            country: 'India',
                            taluka: 'Central',
                            area: 'Connaught Place'
                        }));
                    }
                } catch (e) {
                    Alert.alert("Error", "Failed to fetch address details.");
                } finally {
                    setLoadingAddress(false);
                }
            };
            fetchAddress();
        }
    }, [form.pincode]);

    // --- Handlers ---

    const handleImagePick = async () => {
        if (!isEditing) return;
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });
        if (!res.canceled) {
            setForm(prev => ({ ...prev, profilePhoto: res.assets[0].uri }));
        }
    };

    const handleVerify = async (type: 'email' | 'phone', otpCode: string) => {
        if (otpCode.length !== 6) {
            Alert.alert("Invalid OTP", "Please enter a 6-digit code.");
            return;
        }
        try {
            setIsVerifyingOtp(true);
            if (type === "email") {
                const res = await authFetch("/api/auth/otp/email/verify/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ otp: otpCode }),
                });
                if (!res.ok) throw new Error();
                setEmailVerified(true);
                setShowEmailOtp(false);
            }
            if (type === "phone") {
                const res = await authFetch("/api/auth/otp/phone/verify/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ otp: otpCode }),
                });
                if (!res.ok) throw new Error();
                setPhoneVerified(true);
                setShowPhoneOtp(false);
            }
            Alert.alert("Success", "Verified successfully");
        } catch {
            setOtpError("Invalid or expired OTP. Please try again.");
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    const handleSave = async () => {
        try {
            const res = await authFetch("/api/auth/profile/update/", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    full_name: form.fullName,
                    phone: form.phone,
                    gender: form.gender,
                    blood_group: form.bloodGroup,
                }),
            });
            if (!res.ok) throw new Error();
            Alert.alert("Success", "Profile updated");
            setIsEditing(false);
        } catch {
            Alert.alert("Error", "Failed to update profile");
        }
    };

    const toggleEdit = () => {
        if (isEditing) {
            setIsEditing(false);
            setShowEmailOtp(false);
            setShowPhoneOtp(false);
        } else {
            setIsEditing(true);
        }
    };

    const updateForm = React.useCallback((key: string, value: any) => {
        setForm(prev => ({ ...prev, [key]: value }));
    }, []);

    // NOTE: Render Helpers (TextInputField, SectionHeader) removed from here
    // and placed outside the component to prevent re-rendering issues.

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Profile</Text>
                <TouchableOpacity
                    style={[styles.iconBtn, isEditing && styles.activeIconBtn]}
                    onPress={toggleEdit}
                >
                    {isEditing ? <XCircle size={22} color={COLORS.white} /> : <Edit3 size={22} color={COLORS.primary} />}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={styles.container}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 120 }}
                >
                    {/* Photo Section */}
                    <View style={styles.photoSection}>
                        <TouchableOpacity onPress={handleImagePick} disabled={!isEditing}>
                            <View style={[styles.avatarContainer, isEditing && styles.avatarEditable]}>
                                {form.profilePhoto ? (
                                    <Image source={{ uri: form.profilePhoto }} style={styles.avatar} />
                                ) : (
                                    <User size={48} color={COLORS.textMuted} />
                                )}
                                {isEditing && (
                                    <View style={styles.cameraBadge}>
                                        <Camera size={14} color="#FFF" />
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.userName}>{form.fullName}</Text>
                        <Text style={styles.userRole}>Patient ID: #883920</Text>
                    </View>

                    {/* 1. Personal Details */}
                    <View style={styles.card}>
                        <SectionHeader title="Personal Details" icon={User} />

                        <TextInputField
                            label="Full Name"
                            value={form.fullName}
                            editable={isEditing}
                            onChangeText={(t: string) => updateForm('fullName', t)}
                            icon={User}
                        />

                        {/* Email Field with Verification */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <View style={[styles.inputContainer, !isEditing && styles.disabledInput]}>
                                <Mail size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, !isEditing && styles.disabledText]}
                                    value={form.email}
                                    onChangeText={(t) => updateForm('email', t)}
                                    editable={isEditing}
                                    keyboardType="email-address"
                                />
                                {emailVerified ? (
                                    <CheckCircle2 size={20} color={COLORS.success} />
                                ) : (
                                    <TouchableOpacity
                                        onPress={async () => {
                                            await authFetch("/api/auth/otp/email/send/", { method: "POST" });
                                            setShowEmailOtp(true);
                                        }}
                                        disabled={showEmailOtp}
                                    >
                                        <Text style={styles.verifyText}>Verify</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <OtpVerificationSection
                            isVisible={showEmailOtp}
                            isVerifying={isVerifyingOtp}
                            onVerify={(code) => handleVerify('email', code)}
                            onCancel={() => setShowEmailOtp(false)}
                            error={otpError}
                        />

                        {/* Phone Field with Verification */}
                        <Text style={styles.label}>Mobile Number</Text>
                        <View style={styles.phoneRow}>
                            <TouchableOpacity
                                style={[styles.countrySelect, !isEditing && styles.disabledInput]}
                                onPress={() => isEditing && setShowCountryPicker(true)}
                            >
                                <Text style={styles.inputText}>{form.countryCode}</Text>
                                <ChevronDown size={16} color={COLORS.textMuted} />
                            </TouchableOpacity>

                            <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }, !isEditing && styles.disabledInput]}>
                                <Smartphone size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, !isEditing && styles.disabledText]}
                                    value={form.phone}
                                    onChangeText={(t) => updateForm('phone', t)}
                                    editable={isEditing}
                                    keyboardType="phone-pad"
                                />
                                {phoneVerified ? (
                                    <CheckCircle2 size={20} color={COLORS.success} />
                                ) : (
                                    <TouchableOpacity
                                        onPress={async () => {
                                            await authFetch("/api/auth/otp/phone/send/", { method: "POST" });
                                            setShowPhoneOtp(true);
                                        }}
                                        disabled={showPhoneOtp}
                                    >
                                        <Text style={styles.verifyText}>Verify</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <OtpVerificationSection
                            isVisible={showPhoneOtp}
                            isVerifying={isVerifyingOtp}
                            onVerify={(code) => handleVerify('phone', code)}
                            onCancel={() => setShowPhoneOtp(false)}
                            error={otpError}
                        />

                        {/* WhatsApp Switch */}
                        <View style={styles.switchRow}>
                            <View style={styles.row}>
                                <MessageCircle size={20} color={COLORS.success} style={{ marginRight: 8 }} />
                                <Text style={styles.switchLabel}>Same number for WhatsApp?</Text>
                            </View>
                            <Switch
                                value={form.isWhatsappSame}
                                onValueChange={(val) => updateForm('isWhatsappSame', val)}
                                trackColor={{ false: '#cbd5e1', true: '#99f6e4' }}
                                thumbColor={form.isWhatsappSame ? COLORS.primary : '#f1f5f9'}
                                disabled={!isEditing}
                            />
                        </View>

                        {!form.isWhatsappSame && (
                            <TextInputField
                                label="WhatsApp Number"
                                value={form.whatsappNumber}
                                onChangeText={(t: string) => updateForm('whatsappNumber', t)}
                                icon={MessageCircle}
                                keyboardType="phone-pad"
                            />
                        )}

                        <TextInputField
                            label="Emergency Contact"
                            value={form.emergencyContact}
                            onChangeText={(t: string) => updateForm('emergencyContact', t)}
                            icon={Phone}
                            keyboardType="phone-pad"
                        />
                    </View>

                    {/* 2. Additional Info */}
                    <View style={styles.card}>
                        <SectionHeader title="Additional Information" icon={Calendar} />

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <Text style={styles.label}>Date of Birth</Text>

                                <TouchableOpacity
                                    onPress={() => isEditing && setShowDatePicker(true)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.inputContainer, !isEditing && styles.disabledInput]}>
                                        <Calendar size={18} color={COLORS.textMuted} style={styles.inputIcon} />

                                        <Text style={[styles.inputText, !form.dob && { color: COLORS.textMuted }]}>
                                            {form.dob || "Select Date"}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                            </View>
                            <View style={{ width: 80 }}>
                                <TextInputField
                                    label="Age"
                                    value={form.age}
                                    editable={false}
                                />
                            </View>
                        </View>

                        <Text style={styles.label}>Gender</Text>
                        <View style={styles.chipRow}>
                            {GENDERS.map(g => (
                                <TouchableOpacity
                                    key={g}
                                    disabled={!isEditing}
                                    onPress={() => updateForm('gender', g)}
                                    style={[
                                        styles.chip,
                                        form.gender === g && styles.chipActive,
                                        !isEditing && form.gender !== g && styles.chipDisabled
                                    ]}
                                >
                                    <Text style={[styles.chipText, form.gender === g && styles.chipTextActive]}>{g}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Blood Group</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollRow}>
                            {BLOOD_GROUPS.map(bg => (
                                <TouchableOpacity
                                    key={bg}
                                    disabled={!isEditing}
                                    onPress={() => updateForm('bloodGroup', bg)}
                                    style={[
                                        styles.circleChip,
                                        form.bloodGroup === bg && styles.circleChipActive,
                                        !isEditing && form.bloodGroup !== bg && styles.chipDisabled
                                    ]}
                                >
                                    <Text style={[styles.chipText, form.bloodGroup === bg && styles.chipTextActive]}>{bg}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* 3. Address */}
                    <View style={styles.card}>
                        <SectionHeader title="Address Details" icon={MapPin} />

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <TextInputField
                                    label="Pincode"
                                    value={form.pincode}
                                    onChangeText={(t: string) => updateForm('pincode', t)}
                                    keyboardType="numeric"
                                    rightElement={loadingAddress && <ActivityIndicator size="small" color={COLORS.primary} />}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <TextInputField label="City" value={form.city} editable={false} />
                            </View>
                        </View>

                        <TextInputField
                            label="Area / Locality"
                            value={form.area}
                            onChangeText={(t: string) => updateForm('area', t)}
                        />

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <TextInputField label="District" value={form.district} editable={false} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <TextInputField label="State" value={form.state} editable={false} />
                            </View>
                        </View>
                    </View>

                    {/* 4. Insurance */}
                    <View style={styles.card}>
                        <SectionHeader title="Insurance Details" icon={ShieldCheck} />
                        <TextInputField
                            label="Policy Provider Name"
                            value={form.insuranceName}
                            onChangeText={(t: string) => updateForm('insuranceName', t)}
                            placeholder="e.g. LIC, Star Health"
                        />
                        <TextInputField
                            label="Policy Number"
                            value={form.insuranceNumber}
                            onChangeText={(t: string) => updateForm('insuranceNumber', t)}
                            placeholder="XXXXXXXX"
                        />
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Save Button (Sticky) */}
            {isEditing && (
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Save size={20} color="#FFF" style={{ marginRight: 8 }} />
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Country Picker Modal */}
            <Modal visible={showCountryPicker} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Country</Text>
                        <FlatList
                            data={MOCK_COUNTRIES}
                            keyExtractor={item => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.countryItem}
                                    onPress={() => {
                                        updateForm('countryCode', item.code);
                                        setShowCountryPicker(false);
                                    }}
                                >
                                    <Text style={styles.countryItemText}>{item.flag}  {item.name} ({item.code})</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setShowCountryPicker(false)}>
                            <Text style={styles.closeBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>


            {showDatePicker && (
                <DateTimePicker
                    value={form.dob ? parseDOB(form.dob) : new Date(2000, 0, 1)}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                        setShowDatePicker(false);

                        if (selectedDate) {
                            const day = selectedDate.getDate().toString().padStart(2, "0");
                            const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
                            const year = selectedDate.getFullYear();

                            updateForm("dob", `${day}/${month}/${year}`);
                        }
                    }}
                />
            )}

        </SafeAreaView>
    );
}

// --- Styles ---

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
    },
    iconBtn: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: COLORS.secondary,
    },
    activeIconBtn: {
        backgroundColor: COLORS.error,
    },
    container: {
        padding: 20,
    },
    photoSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 3,
        borderColor: COLORS.white,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    avatarEditable: {
        borderColor: COLORS.primary,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        padding: 6,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    userName: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.text,
    },
    userRole: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        // borderColor: COLORS.border,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.secondary,
        paddingBottom: 10,
    },
    sectionIconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '500',
        color: COLORS.textMuted,
        marginBottom: 6,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 48,
    },
    disabledInput: {
        backgroundColor: '#f1f5f9',
        borderColor: 'transparent',
    },
    disabledGroup: {
        opacity: 0.9,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: '100%',
        color: COLORS.text,
        fontSize: 15,
        borderWidth: 0,
        backgroundColor: 'transparent',
    },
    disabledText: {
        color: COLORS.textMuted,
    },
    inputText: {
        fontSize: 15,
        color: COLORS.text,
    },
    verifyText: {
        color: COLORS.primary,
        fontWeight: '700',
        fontSize: 13,
    },
    phoneRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    countrySelect: {
        width: 90,
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        backgroundColor: '#f8fafc',
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        marginTop: 5,
    },
    switchLabel: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '500',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    scrollRow: {
        marginBottom: 16,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: 8,
    },
    chipActive: {
        backgroundColor: COLORS.primaryLight,
        borderColor: COLORS.primary,
    },
    chipDisabled: {
        opacity: 0.5,
    },
    chipText: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
    chipTextActive: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    circleChip: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: 8,
    },
    circleChipActive: {
        backgroundColor: COLORS.primaryLight,
        borderColor: COLORS.primary,
    },
    footer: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: COLORS.primary,
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    saveButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
    },
    otpContainer: {
        overflow: 'hidden',
        marginBottom: 16,
    },
    otpInner: {
        backgroundColor: '#fffbeb',
        borderWidth: 1,
        borderColor: '#fcd34d',
        borderRadius: 12,
        padding: 16,
    },
    otpHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    otpTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#b45309',
    },
    otpSubtitle: {
        fontSize: 12,
        color: '#92400e',
        marginBottom: 16,
    },
    otpSingleInput: {
        borderWidth: 2,
        borderColor: "#e2e8f0",
        borderRadius: 999,
        paddingHorizontal: 16,
        height: 54,
        fontSize: 16,
        textAlign: "center",
        marginBottom: 8,
    },
    otpInputError: {
        borderColor: COLORS.error,
        backgroundColor: '#fef2f2',
    },
    otpErrorText: {
        marginTop: 8,
        fontSize: 12,
        color: COLORS.error,
        fontWeight: '600',
        textAlign: 'center',
    },
    otpVerifyBtn: {
        backgroundColor: '#b45309',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    otpVerifyBtnText: {
        color: COLORS.white,
        fontWeight: '600',
        fontSize: 13,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        maxHeight: '60%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
        color: COLORS.text,
    },
    countryItem: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.secondary,
    },
    countryItemText: {
        fontSize: 16,
        color: COLORS.text,
    },
    closeBtn: {
        marginTop: 16,
        alignItems: 'center',
        padding: 12,
    },
    closeBtnText: {
        color: COLORS.error,
        fontWeight: '600',
    },
});