// app/index.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  Camera,
  Image as ImageIcon,
  RotateCcw,
  User,
  ScanLine,
  Home,
  FileText,
  Bell,
  MapPin,
  Star,
  Activity as ActivityIcon,
  LogOut,
  Trash2,
  X,  // Added for close icon
} from "lucide-react-native";

import * as Location from "expo-location";

import { useRouter } from "expo-router";

import { logoutUser } from "../../services/auth";
import { runSkinPrediction } from "../../services/prediction";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveScanToBackend } from "../../services/scans";
import { fetchScans, deleteScan } from "../../services/scans";
import { downloadScanPDF } from "../../services/pdf";
import { Modal } from "react-native";
import { authFetch } from "@/services/api";
import UserProfileScreen from "./profile";
import ChatWidget from "@/components/ChatBot/ChatBubble";


// ---------- Types ----------
type Severity = "Low" | "Moderate" | "High";

interface DiagnosisResult {
  diagnosis: string;
  confidence: string;
  severity: Severity;
  advice: string;
  isSafe: boolean;
}

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  rating: number;
  distance: string;
  image: string;
}

interface ScanHistory {
  id: number;
  diagnosis: string;
  confidence: string;
  severity: Severity;
  advice: string;
  is_safe: boolean;
  image: string;
  created_at: string;
}


// ---------- Main App Component ----------

const isWeb = Platform.OS === "web";

export default function App() {

  const router = useRouter();

const [showCityInput, setShowCityInput] = useState(false);
const [manualCity, setManualCity] = useState("");
const [locationModal, setLocationModal] = useState(false);



  const restoreUser = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");

      if (!token) return;

      const res = await authFetch("/api/auth/profile/");

      if (!res.ok) {
        throw new Error("Profile fetch failed");
      }

      const userData = await res.json();
      setUser(userData);
      setIsLoggedIn(true);
    } catch (e) {
      await AsyncStorage.multiRemove(["accessToken", "refreshToken", "user"]);
    }
  };


  useEffect(() => {
    restoreUser();
  }, []);




  const [user, setUser] = useState<{
    id: number;
    email: string;
    full_name: string;
  } | null>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [activeTab, setActiveTab] = useState<"home" | "history" | "profile">("home");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  // ---------- AI Progress Analysis ----------
  const getProgressAnalysis = () => {
    if (history.length < 2) return null;

    const latest = history[0];
    const previous = history[1];

    const severityScore = {
      Low: 1,
      Moderate: 2,
      High: 3,
    };

    const latestScore = severityScore[latest.severity];
    const previousScore = severityScore[previous.severity];

    if (latestScore < previousScore) {
      return {
        status: "Improving",
        message: "Your skin condition is improving compared to last scan.",
        color: "#16a34a",
        bg: "#dcfce7",
        icon: "🟢",
      };
    }

    if (latestScore > previousScore) {
      return {
        status: "Worsening",
        message: "Your skin condition has worsened since last scan.",
        color: "#dc2626",
        bg: "#fee2e2",
        icon: "🔴",
      };
    }

    return {
      status: "Stable",
      message: "Your skin condition is stable. Continue your care plan.",
      color: "#ca8a04",
      bg: "#fef9c3",
      icon: "🟡",
    };
  };



  const DetailRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );


  // ---------- Image pick ----------
  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Gallery permission required");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!res.canceled) {
      const uri = res.assets[0].uri;
      setImageUri(uri);
      runPrediction(uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      alert("Camera permission required");
      return;
    }

    const res = await ImagePicker.launchCameraAsync({ quality: 1 });

    if (!res.canceled) {
      const uri = res.assets[0].uri;
      setImageUri(uri);
      runPrediction(uri);
    }
  };

  const runPrediction = async (uri: string) => {
    setAnalyzing(true);
    setResult(null);

    try {
      const result = await runSkinPrediction({
        uri,
        name: "skin.jpg",
        type: "image/jpeg",
      });
      setResult(result);
    } catch (e) {
      alert("Prediction failed");
    } finally {
      setAnalyzing(false);
    }
  };


  const resetScan = () => {
    setImageUri(null);
    setResult(null);
    setAnalyzing(false);
  };


  // ---------- Auth handlers (called by auth screens) ----------

  const handleLogout = async () => {
    await logoutUser();

    setUser(null);
    setIsLoggedIn(false);
    setActiveTab("home");
  };

  const [history, setHistory] = useState<ScanHistory[]>([]);
  const [selectedScan, setSelectedScan] = useState<ScanHistory | null>(null);

  useEffect(() => {
    if (isLoggedIn) {
      fetchScans()
        .then(setHistory)
      // .catch(console.error);
    }
  }, [isLoggedIn]);


  const saveResult = async () => {
    if (!result || !imageUri) return;

    if (!isLoggedIn) {
      alert("Please login to save scans");
      return;
    }

    try {
      const scanPayload = {
        diagnosis: result.diagnosis,
        confidence: result.confidence,
        severity: result.severity,
        advice: result.advice,
        isSafe: result.isSafe,
      };

      const savedScan = await saveScanToBackend(scanPayload, imageUri);

      // ✅ refresh history from backend
      const updated = await fetchScans();
      setHistory(updated);

      alert("Scan saved securely");
    } catch (err) {
      // console.error(err);
      alert("Failed to save scan");
    }
  };

  // ---------- AI Medical Triage System ----------
  const getUrgencyAlert = () => {
    if (!result) return null;

    if (result.severity === "High") {
      return {
        level: "Immediate Attention Required",
        message:
          "Our AI strongly recommends consulting a dermatologist within 24–48 hours.",
        color: "#dc2626",
        bg: "#fee2e2",
        icon: "🚨",
      };
    }

    if (result.severity === "Moderate") {
      return {
        level: "Medical Review Suggested",
        message:
          "Monitor closely. If symptoms persist for 3 days, consult a dermatologist.",
        color: "#ca8a04",
        bg: "#fef9c3",
        icon: "⚠️",
      };
    }

    return {
      level: "Low Risk",
      message:
        "This condition can usually be managed with home care and monitoring.",
      color: "#16a34a",
      bg: "#dcfce7",
      icon: "✅",
    };
  };





  // ---------- Header ----------
  const Header = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.appTitle}>DermaCare AI</Text>
        {isLoggedIn && user && (
          <Text style={styles.appSubtitle}>
            Hello, {user?.full_name?.split(" ")?.[0] || "there"} 👋
          </Text>
        )}
      </View>
      <View style={styles.headerRight}>
        <View style={styles.bellButton}>
          <Bell size={18} color="#475569" />
          <View style={styles.bellDot} />
        </View>

        <View style={styles.avatar}>
          <Image
            source={{
              uri: "https://api.dicebear.com/7.x/avataaars/png?seed=John",
            }}
            style={styles.avatarImage}
          />
        </View>

        {isLoggedIn && (
          <TouchableOpacity onPress={handleLogout} style={styles.logoutIcon}>
            <LogOut size={20} color="#b91c1c" />
          </TouchableOpacity>
        )}
      </View>
    </View >
  );


  // ---------- Tabs ----------
  const HomeTab = () => (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Scan card */}
      <View style={styles.scanCard}>
        {!imageUri ? (
          <View style={styles.scanCardInner}>
            <View style={styles.scanIconWrapper}>
              <ScanLine size={32} color="#ffffff" />
            </View>
            <Text style={styles.scanTitle}>New Skin Scan</Text>
            <Text style={styles.scanSubtitle}>
              AI-powered analysis for rashes, moles, and acne.
            </Text>

            <View style={styles.scanButtonsRow}>
              <TouchableOpacity
                style={styles.scanPrimaryButton}
                onPress={takePhoto}
              >
                <Camera size={16} color="#0f766e" />
                <Text style={styles.scanPrimaryText}>Scan</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.scanSecondaryButton}
                onPress={pickFromGallery}
              >
                <ImageIcon size={16} color="#ffffff" />
                <Text style={styles.scanSecondaryText}>Upload</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.scanResultWrapper}>
            <View style={styles.scanImageWrapper}>
              <Image source={{ uri: imageUri }} style={styles.scanImage} />
              {analyzing && (
                <View style={styles.scanImageOverlay}>
                  <ActivityIndicator size="large" color="#ffffff" />
                  <Text style={styles.processingText}>Processing...</Text>
                </View>
              )}
            </View>

            {!analyzing && result && (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultDiagnosis}>{result.diagnosis}</Text>
                  <View style={styles.resultConfidenceBadge}>
                    <Text style={styles.resultConfidenceText}>
                      {result.confidence}
                    </Text>
                  </View>
                </View>
                {/* <Text style={styles.resultAdvice}>{result.advice}</Text> */}


                <View style={styles.detailsBox}>
                  <DetailRow label="Disease" value={result.diagnosis} />
                  <DetailRow label="Confidence" value={result.confidence} />
                  <DetailRow label="Severity" value={result.severity} />
                </View>

                <Text style={styles.resultAdvice}>{result.advice}</Text>

                <View style={styles.resultActionsRow}>
                  <TouchableOpacity style={styles.saveButton} onPress={saveResult}>
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.recheckButton} onPress={() => imageUri && runPrediction(imageUri)}>
                    <Text style={styles.recheckButtonText}>Recheck</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.retakeButton} onPress={resetScan}>
                    <RotateCcw size={14} color="#4b5563" />
                    <Text style={styles.retakeText}>Retake</Text>
                  </TouchableOpacity>
                </View>


                <View style={styles.resultActionsRow}>
                  {/* <TouchableOpacity
                    style={styles.retakeButton}
                    onPress={resetScan}
                  >
                    <RotateCcw size={14} color="#4b5563" />
                    <Text style={styles.retakeText}>Retake</Text>
                  </TouchableOpacity> */}
                  {/* {result.severity !== "Low" && ( */}
                  <TouchableOpacity
                    style={styles.findDoctorButton}
                    onPress={() => {
                      if (!isLoggedIn) {
                        router.push("/auth/login");
                        return;
                      }
                      setLocationModal(true);
                    }}
                  >
                    <Text style={styles.findDoctorText}>Find Doctor</Text>
                  </TouchableOpacity>

                  {/* // )} */}
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* AI Urgency Alert */}
      {getUrgencyAlert() && (
        <View
          style={[
            styles.urgencyBox,
            { backgroundColor: getUrgencyAlert()!.bg },
          ]}
        >
          <Text
            style={[
              styles.urgencyTitle,
              { color: getUrgencyAlert()!.color },
            ]}
          >
            {getUrgencyAlert()!.icon} {getUrgencyAlert()!.level}
          </Text>

          <Text style={styles.urgencyMessage}>
            {getUrgencyAlert()!.message}
          </Text>
        </View>
      )}


      {/* Daily tips
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Daily Tips</Text>
          <Text style={styles.sectionLink}>View all</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 16 }}
        >
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.tipCard}>
              <View style={styles.tipHeaderRow}>
                <View style={styles.tipIconWrapper}>
                  <ActivityIcon size={16} color="#c05621" />
                </View>
                <Text style={styles.tipTag}>Sun Care</Text>
              </View>
              <Text style={styles.tipTitle}>Wear SPF 50 today</Text>
              <Text style={styles.tipText}>
                UV index is high today. Reapply every 2 hours if outside.
              </Text>
            </View>
          ))}
        </ScrollView>
      </View> */}

      {/* AI Skin Condition Analysis */}
      {getProgressAnalysis() && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Condition Analysis</Text>

          <View
            style={[
              styles.analysisBox,
              { backgroundColor: getProgressAnalysis()!.bg },
            ]}
          >
            <Text
              style={[
                styles.analysisStatus,
                { color: getProgressAnalysis()!.color },
              ]}
            >
              {getProgressAnalysis()!.icon} {getProgressAnalysis()!.status}
            </Text>

            <Text style={styles.analysisMessage}>
              {getProgressAnalysis()!.message}
            </Text>
          </View>
        </View>
      )}


      {/* AI Personalized Care Plan */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your AI Care Plan</Text>

        {!result ? (
          <View style={styles.careEmptyBox}>
            <Text style={styles.careEmptyText}>
              Scan your skin to receive a personalized treatment plan.
            </Text>
          </View>
        ) : (
          <View style={styles.carePlanBox}>

            <View style={styles.careHeaderRow}>
              <Text style={styles.careTitle}>
                Care Plan for {result.diagnosis}
              </Text>
              <View style={styles.careBadge}>
                <Text style={styles.careBadgeText}>{result.severity} Risk</Text>
              </View>
            </View>

            <View style={styles.careStep}>
              <Text style={styles.careStepNumber}>1</Text>
              <Text style={styles.careStepText}>
                Clean affected area twice daily using a gentle cleanser.
              </Text>
            </View>

            <View style={styles.careStep}>
              <Text style={styles.careStepNumber}>2</Text>
              <Text style={styles.careStepText}>
                Apply dermatologist-recommended medication as prescribed.
              </Text>
            </View>

            <View style={styles.careStep}>
              <Text style={styles.careStepNumber}>3</Text>
              <Text style={styles.careStepText}>
                Avoid direct sun exposure and always use SPF 30+ sunscreen.
              </Text>
            </View>

            <View style={styles.careStep}>
              <Text style={styles.careStepNumber}>4</Text>
              <Text style={styles.careStepText}>
                Monitor changes weekly using DermaCare AI scans.
              </Text>
            </View>

          </View>
        )}
      </View>

      {/* Skin Progress Timeline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Skin Progress</Text>

        {history.length === 0 ? (
          <View style={styles.progressEmptyBox}>
            <Text style={styles.progressEmptyText}>
              Your skin progress will appear here after a few scans.
            </Text>
          </View>
        ) : (
          history.slice(0, 3).map((scan, index) => (
            <View key={scan.id} style={styles.progressCard}>
              <View style={styles.progressLeft}>
                <Image
                  source={{ uri: scan.image }}
                  style={styles.progressImage}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.progressDisease}>
                  {scan.diagnosis}
                </Text>

                <Text style={styles.progressDate}>
                  {new Date(scan.created_at).toLocaleDateString()}
                </Text>

                <View style={styles.progressMetaRow}>
                  <Text style={styles.progressMeta}>
                    {scan.confidence}
                  </Text>
                  <Text style={styles.progressMeta}>
                    {scan.severity} Risk
                  </Text>
                </View>
              </View>

              <View style={styles.progressIndex}>
                <Text style={styles.progressIndexText}>
                  #{history.length - index}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>



      {/* Skin Health Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Skin Health Insights</Text>

        <View style={styles.insightGrid}>

          <View style={styles.insightCard}>
            <Text style={styles.insightValue}>98.2%</Text>
            <Text style={styles.insightLabel}>AI Accuracy</Text>
            <Text style={styles.insightSub}>
              Clinically validated model
            </Text>
          </View>

          <View style={styles.insightCard}>
            <Text style={styles.insightValue}>
              {result?.severity || "—"}
            </Text>
            <Text style={styles.insightLabel}>Current Risk</Text>
            <Text style={styles.insightSub}>
              Based on latest scan
            </Text>
          </View>

          <View style={styles.insightCard}>
            <Text style={styles.insightValue}>
              {history.length}
            </Text>
            <Text style={styles.insightLabel}>Total Scans</Text>
            <Text style={styles.insightSub}>
              Health history stored
            </Text>
          </View>

          <View style={styles.insightCard}>
            <Text style={styles.insightValue}>24/7</Text>
            <Text style={styles.insightLabel}>Monitoring</Text>
            <Text style={styles.insightSub}>
              Continuous AI support
            </Text>
          </View>

        </View>
      </View>

    </ScrollView>
  );

  const HistoryTab = () => (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
      >
        {history.length === 0 && (
          <Text style={{ textAlign: "center", color: "#64748b", marginTop: 20 }}>
            No scans saved yet
          </Text>
        )}

        {history.map((item) => {
          const badgeStyle =
            item.severity === "High"
              ? styles.severityHigh
              : item.severity === "Moderate"
                ? styles.severityModerate
                : styles.severityLow;

          return (
            <View key={item.id} style={styles.historyCard}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => setSelectedScan(item)}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={[styles.historyIcon, badgeStyle]}>
                    <Text style={styles.historyIconText}>
                      {item.diagnosis.charAt(0)}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyDiagnosis}>
                      {item.diagnosis}
                    </Text>
                    <Text style={styles.historyDateText}>
                      {new Date(item.created_at).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => downloadScanPDF(item.id)}
                style={{ paddingHorizontal: 10 }}
              >
                <FileText size={18} color="#0f766e" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  const confirmDelete =
                    Platform.OS === "web"
                      ? window.confirm("Delete this scan permanently?")
                      : true;

                  if (!confirmDelete) return;

                  await deleteScan(item.id);
                  setHistory((prev) =>
                    prev.filter((s) => s.id !== item.id)
                  );
                  if (selectedScan?.id === item.id) {
                    setSelectedScan(null);
                  }
                }}
                style={{ paddingHorizontal: 10 }}
              >
                <Trash2 size={20} color="#dc2626" />
              </TouchableOpacity>

            </View>
          );
        })}
      </ScrollView>

      {/* ✅ MODAL MUST BE HERE */}
      <Modal
        visible={!!selectedScan}
        animationType="slide"
        onRequestClose={() => setSelectedScan(null)}
      >
        {selectedScan && (
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              onPress={() => setSelectedScan(null)}
              style={styles.closeButton}
            >
              <X size={24} color="#000000" />
            </TouchableOpacity>
            <ScrollView style={{ padding: 20 }}>
              <Image
                source={{ uri: selectedScan.image }}
                style={{ height: 220, borderRadius: 16, marginBottom: 16 }}
              />

              <Text style={styles.title}>{selectedScan.diagnosis}</Text>

              <DetailRow label="Confidence" value={selectedScan.confidence} />
              <DetailRow label="Severity" value={selectedScan.severity} />
              <DetailRow
                label="Date"
                value={new Date(selectedScan.created_at).toLocaleString()}
              />

              <Text style={styles.adviceTitle}>Medical Advice</Text>
              <Text style={styles.advice}>{selectedScan.advice}</Text>
            </ScrollView>
          </View>
        )}
      </Modal>
    </>
  );


  const ProfileTab = () => {
    useEffect(() => {
      if (!isLoggedIn) {
        router.replace("/auth/login");
      }
    }, [isLoggedIn]);

    if (!isLoggedIn) return null;

    return <UserProfileScreen />;
  };





  // ---------- MAIN ----------
  return (
    <View style={styles.root}>
      <View style={styles.appContainer}>
        {/* fake status bar */}
        <View style={styles.statusBar}>
          <Text style={styles.statusTime}>9:41</Text>
          <View style={styles.statusDots}>
            <View style={styles.statusDot} />
            <View style={styles.statusDot} />
          </View>
        </View>

        <Header />

        <View style={{ flex: 1, backgroundColor: "#f1f5f9" }}>
          {activeTab === "home" && <HomeTab />}
          {activeTab === "history" && <HistoryTab />}
          {activeTab === "profile" && <ProfileTab />}
        </View>

        <View style={styles.tabBar}>
          <TabButton
            label="Home"
            Icon={Home}
            active={activeTab === "home"}
            onPress={() => setActiveTab("home")}
          />
          <TabButton
            label="History"
            Icon={FileText}
            active={activeTab === "history"}
            onPress={() => setActiveTab("history")}
          />
          <TabButton
            label="Profile"
            Icon={User}
            active={activeTab === "profile"}
            onPress={() => setActiveTab("profile")}
          />
        </View>
      </View>

      {result && (
        <ChatWidget
          disease={result.diagnosis}
          autoOpen={true}
        />
      )}

<Modal
  visible={locationModal}
  transparent
  animationType="slide"
  onRequestClose={() => {
    setLocationModal(false);
    setShowCityInput(false);
    setManualCity("");
  }}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>
      <Text style={styles.modalTitle}>Choose Location</Text>

      {/* ================= LIVE LOCATION ================= */}
      <TouchableOpacity
        style={styles.findDoctorButton}
        onPress={async () => {
          setLocationModal(false);
          setShowCityInput(false);
          setManualCity("");

          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            alert("Location permission denied");
            return;
          }

          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Highest,
            mayShowUserSettingsDialog: true,
          });

          router.push({
            pathname: "/hospitals",
            params: {
              diagnosis: result?.diagnosis,
              severity: result?.severity,
              lat: loc.coords.latitude,
              lon: loc.coords.longitude,
              accuracy: loc.coords.accuracy,
            },
          });
        }}
      >
        <Text style={styles.findDoctorText}>Use Live Location</Text>
      </TouchableOpacity>

      {/* ================= MANUAL CITY MODE ================= */}
      {!showCityInput && (
        <TouchableOpacity
          style={[
            styles.findDoctorButton,
            { marginTop: 10, backgroundColor: "#1f2937" },
          ]}
          onPress={() => setShowCityInput(true)}
        >
          <Text style={styles.findDoctorText}>Enter City Manually</Text>
        </TouchableOpacity>
      )}

      {/* ================= CITY INPUT ================= */}
      {showCityInput && (
        <>
          <TextInput
            placeholder="Enter city (e.g. Pune)"
            value={manualCity}
            onChangeText={setManualCity}
            style={{
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 8,
              padding: 10,
              marginTop: 12,
            }}
          />

          <TouchableOpacity
            style={[styles.findDoctorButton, { marginTop: 10 }]}
            onPress={() => {
              if (!manualCity.trim()) {
                alert("Please enter a city name");
                return;
              }

              setLocationModal(false);
              setShowCityInput(false);
              setManualCity("");

              router.push({
                pathname: "/hospitals",
                params: {
                  diagnosis: result?.diagnosis,
                  city: manualCity.trim(),
                },
              });
            }}
          >
            <Text style={styles.findDoctorText}>Search Doctors</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  </View>
</Modal>


    </View>
  );
}

// ---------- Tab Button ----------
type TabButtonProps = {
  label: string;
  Icon: typeof Home;
  active: boolean;
  onPress: () => void;
};

function TabButton({ label, Icon, active, onPress }: TabButtonProps) {
  return (
    <TouchableOpacity style={styles.tabButton} onPress={onPress}>
      <View
        style={[
          styles.tabIconWrapper,
          active && styles.tabIconWrapperActive,
        ]}
      >
        <Icon size={24} color={active ? "#0f766e" : "#94a3b8"} />
      </View>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ---------- Styles ----------
// (same as your previous file – left as-is)
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#e2e8f0",
    alignItems: "stretch",
    justifyContent: "flex-start",
  },
  appContainer: {
    flex: 1,
    width: "100%",
    maxWidth: isWeb ? "100%" : 400,
    alignSelf: "center",
    backgroundColor: "#f8fafc",
    borderRadius: isWeb ? 0 : 40,
    borderWidth: isWeb ? 0 : 8,
    borderColor: "#ffffff",
    overflow: "hidden",
  },
  statusBar: {
    height: 24,
    paddingHorizontal: 24,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusTime: { fontSize: 12, fontWeight: "600", color: "#111827" },
  statusDots: { flexDirection: "row", gap: 4 },
  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
  },

  // Header
  header: {
    paddingHorizontal: isWeb ? 64 : 24,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  appTitle: { fontSize: 20, fontWeight: "800", color: "#0f766e" },
  appSubtitle: { fontSize: 12, color: "#64748b" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  logoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },


  bellDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#ef4444",
    position: "absolute",
    top: 6,
    right: 6,
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#ccfbf1",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  avatarImage: { width: "100%", height: "100%" },

  // (rest of styles are same as you already had: scrollContent, scanCard, sections,
  // history, profile, tabBar, etc.)

  scrollContent: {
    paddingHorizontal: isWeb ? 64 : 20,
    paddingVertical: 16,
    paddingBottom: 24,
  },
  scanCard: {
    borderRadius: 24,
    padding: 16,
    backgroundColor: "#0f766e",
    marginBottom: 16,
  },
  scanCardInner: { alignItems: "center" },
  scanIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  scanTitle: { fontSize: 20, fontWeight: "700", color: "#ffffff" },
  scanSubtitle: {
    fontSize: 13,
    color: "#d1fae5",
    textAlign: "center",
    marginBottom: 16,
  },
  scanButtonsRow: { flexDirection: "row", gap: 10, width: "100%" },
  scanPrimaryButton: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  scanSecondaryButton: {
    flex: 1,
    backgroundColor: "rgba(15,118,110,0.7)",
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  scanPrimaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f766e",
  },
  scanSecondaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  scanResultWrapper: { alignItems: "center" },
  scanImageWrapper: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 10,
  },
  scanImage: { width: "100%", height: 190, resizeMode: "cover" },
  scanImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  processingText: {
    marginTop: 8,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  resultCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  resultDiagnosis: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
    marginRight: 8,
  },
  resultConfidenceBadge: {
    backgroundColor: "#ccfbf1",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  resultConfidenceText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0f766e",
  },
  resultAdvice: { fontSize: 12, color: "#6b7280", marginBottom: 8 },
  resultActionsRow: { flexDirection: "row", gap: 8 },
  retakeButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  retakeText: { fontSize: 12, fontWeight: "600", color: "#4b5563" },
  findDoctorButton: {
    flex: 1,
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: "#0f766e",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },
  findDoctorText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },

  section: { marginTop: 8 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  sectionLink: { fontSize: 11, fontWeight: "600", color: "#0f766e" },

  tipCard: {
    width: 220,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  tipHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 6,
  },
  tipIconWrapper: {
    padding: 4,
    borderRadius: 10,
    backgroundColor: "#ffedd5",
  },
  tipTag: { fontSize: 10, fontWeight: "700", color: "#9a3412" },
  tipTitle: { fontSize: 13, fontWeight: "700", color: "#111827", marginBottom: 2 },
  tipText: { fontSize: 11, color: "#6b7280" },

  doctorCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 8,
  },
  doctorImage: {
    width: 48,
    height: 48,
    borderRadius: 999,
    marginRight: 12,
    backgroundColor: "#e5e7eb",
  },
  doctorName: { fontSize: 13, fontWeight: "700", color: "#111827" },
  doctorSpecialty: { fontSize: 11, color: "#6b7280" },
  doctorRight: { alignItems: "flex-end", gap: 4 },
  doctorRatingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  doctorRatingText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
  },
  doctorDistanceRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  doctorDistanceText: { fontSize: 11, color: "#9ca3af" },

  historyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 8,
  },
  historyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  historyIconText: { fontSize: 18, fontWeight: "700" },
  severityHigh: { backgroundColor: "#fee2e2" },
  severityModerate: { backgroundColor: "#ffedd5" },
  severityLow: { backgroundColor: "#dcfce7" },
  historyDiagnosis: { fontSize: 14, fontWeight: "700", color: "#111827" },
  historyDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  historyDateText: { fontSize: 11, color: "#6b7280" },

  profileHeader: { alignItems: "center", marginBottom: 20 },
  profileAvatarWrapper: {
    width: 96,
    height: 96,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: "#ffffff",
    overflow: "hidden",
    backgroundColor: "#ccfbf1",
    marginBottom: 8,
    elevation: 3,
  },
  profileAvatar: { width: "100%", height: "100%" },
  profileName: { fontSize: 18, fontWeight: "700", color: "#111827" },
  profileSubtitle: { fontSize: 13, color: "#6b7280" },
  profileStatsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  profileStatPrimary: {
    flex: 1,
    backgroundColor: "#0f766e",
    borderRadius: 18,
    padding: 12,
    alignItems: "center",
  },
  profileStatNumber: { fontSize: 22, fontWeight: "700", color: "#ffffff" },
  profileStatLabel: { fontSize: 10, color: "#ccfbf1" },
  profileStatSecondary: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  profileStatNumberSecondary: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  profileStatLabelSecondary: { fontSize: 10, color: "#9ca3af" },
  settingsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  settingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  settingsLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  settingsLabel: { fontSize: 13, color: "#111827" },
  logoutButton: {
    marginTop: 16,
    marginBottom: 24,
    backgroundColor: "#fee2e2",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#b91c1c",
  },

  tabBar: {
    height: 72,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabButton: { alignItems: "center", gap: 2 },
  tabIconWrapper: { padding: 4, borderRadius: 12 },
  tabIconWrapperActive: { backgroundColor: "#e0f2f1" },
  tabLabel: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "500",
  },
  tabLabelActive: { color: "#0f766e", fontWeight: "700" },


  detailsBox: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  detailLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },

  detailValue: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "700",
  },

  saveButton: {
    flex: 1,
    backgroundColor: "#dcfce7",
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },

  saveButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#166534",
  },

  recheckButton: {
    flex: 1,
    backgroundColor: "#e0f2fe",
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },

  recheckButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#075985",
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },

  adviceTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginTop: 12,
  },

  advice: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 18,
  },

  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },

  insightGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 8,
  },

  insightCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  insightValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f766e",
    marginBottom: 2,
  },

  insightLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },

  insightSub: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },

  careEmptyBox: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginTop: 8,
  },

  careEmptyText: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },

  carePlanBox: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginTop: 8,
  },

  careHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  careTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },

  careBadge: {
    backgroundColor: "#fee2e2",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  careBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#b91c1c",
  },

  careStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },

  careStepNumber: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: "#0f766e",
    color: "#ffffff",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "800",
    marginRight: 8,
  },

  careStepText: {
    flex: 1,
    fontSize: 12,
    color: "#374151",
    lineHeight: 16,
  },

  progressEmptyBox: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginTop: 8,
  },

  progressEmptyText: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },

  progressCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  progressLeft: {
    marginRight: 10,
  },

  progressImage: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
  },

  progressDisease: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },

  progressDate: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 2,
  },

  progressMetaRow: {
    flexDirection: "row",
    gap: 10,
  },

  progressMeta: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0f766e",
  },

  progressIndex: {
    marginLeft: 6,
    backgroundColor: "#e0f2f1",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  progressIndexText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0f766e",
  },

  analysisBox: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginTop: 8,
  },

  analysisStatus: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
  },

  analysisMessage: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },

  urgencyBox: {
    marginTop: 10,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  urgencyTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
  },

  urgencyMessage: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },



});

