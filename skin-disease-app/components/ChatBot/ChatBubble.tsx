import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInDown,
} from "react-native-reanimated";
import { sendMessageToBot } from "@/services/chatbotApi";
import TypingIndicator from "./TypingIndicator";

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export default function ChatWidget({
  disease,
  autoOpen,
  severity,
}: {
  disease?: string;
  autoOpen?: boolean;
  severity?: string;
}) {
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      text: "Hello! 👋 How can I assist you?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  // Animations
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  /* -------------------- Disease Context (ONCE) -------------------- */

  useEffect(() => {
    if (!disease) return;

    setMessages((prev) => {
      const exists = prev.some((m) => m.id === "disease-context");
      if (exists) return prev;

      return [
        ...prev,
        {
          id: "disease-context",
          text:
            `I’ve analyzed your scan and detected a possible ${disease}.\n\n` +
            `I can help you with:\n` +
            `• Daily skin care guidance\n` +
            `• Understanding severity\n` +
            `• Warning signs to watch for\n` +
            `• Finding nearby specialists\n\n` +
            `Tap a suggestion below to continue 👇`,
          sender: "bot",
          timestamp: new Date(),
        },
      ];
    });
  }, [disease]);


  /* -------------------- Auto Open + Auto Reply After Scan -------------------- */
  const autoSentRef = useRef(false);

 useEffect(() => {
  if (!autoOpen || !disease || autoSentRef.current) return;

  autoSentRef.current = true;
  setIsOpen(true);
  autoSendScanResult();
}, [autoOpen, disease]);

  /* -------------------- Open / Close Animation -------------------- */
  useEffect(() => {
    if (isOpen) {
      scale.value = withSpring(1, { damping: 155 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withTiming(0, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isOpen]);

  /* -------------------- Scroll to Bottom -------------------- */
  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    return () => clearTimeout(timer);
  }, [messages, isTyping]);


  const autoSendScanResult = async () => {
    setIsTyping(true);

    try {
      const response = await sendMessageToBot(
        "Scan completed",
        disease,
        "scan_result",
        severity
      );

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-bot-scan`,
          text: response.reply,
          sender: "bot",
          timestamp: new Date(),
        },
      ]);

      setQuickReplies(response.quick_replies || []);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          text: "Unable to load scan guidance. Please try again.",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  /* -------------------- Send Message -------------------- */
  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);
    Keyboard.dismiss();

    try {
      const response = await sendMessageToBot(
        userMsg.text,
        disease,
        "chat",
        severity   // ✅ IMPORTANT
      );

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-bot`,
          text: response.reply,
          sender: "bot",
          timestamp: new Date(),
        },
      ]);

      setQuickReplies(response.quick_replies || []);
    } finally {
      setIsTyping(false);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));


  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      {/* Floating Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsOpen((prev) => !prev)}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isOpen ? "close" : "chatbubble-ellipses"}
          size={28}
          color="#fff"
        />
      </TouchableOpacity>

      {isOpen && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalWrapper}
          pointerEvents="box-none"
        >
          <Animated.View style={[styles.chatWindow, animatedStyle]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.avatar}>
                  <Ionicons name="sparkles" size={18} color="#fff" />
                </View>
                <View>
                  <Text style={styles.headerTitle}>Assistant</Text>
                  <Text style={styles.headerSubtitle}>
                    Always here to help
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {severity && (
              <View
                style={[
                  styles.severityBadge,
                  severity === "severe"
                    ? styles.severe
                    : severity === "moderate"
                      ? styles.moderate
                      : styles.mild,
                ]}
              >
                <Text style={styles.severityText}>
                  Severity: {severity.toUpperCase()}
                </Text>
              </View>
            )}


            {/* Messages */}
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <Animated.View
                  entering={FadeInDown.duration(250)}
                  style={[
                    styles.messageBubble,
                    item.sender === "user"
                      ? styles.userBubble
                      : styles.botBubble,
                  ]}
                >
                  <Text
                    style={
                      item.sender === "user"
                        ? styles.userText
                        : styles.botText
                    }
                  >
                    {item.text}
                  </Text>
                </Animated.View>
              )}
              ListFooterComponent={isTyping ? <TypingIndicator /> : null}
            />

            {quickReplies.length > 0 && (
              <View style={styles.quickReplies}>
                {quickReplies.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.quickReplyButton}
                    onPress={async () => {
                      // show user message immediately
                      setMessages((prev) => [
                        ...prev,
                        {
                          id: Date.now().toString(),
                          text: item,
                          sender: "user",
                          timestamp: new Date(),
                        },
                      ]);

                      setIsTyping(true);

                      try {
                        const response = await sendMessageToBot(
                          item,
                          disease,
                          "chat",
                          severity
                        );

                        setMessages((prev) => [
                          ...prev,
                          {
                            id: `${Date.now()}-bot`,
                            text: response.reply,
                            sender: "bot",
                            timestamp: new Date(),
                          },
                        ]);

                        setQuickReplies(response.quick_replies || []);
                      } finally {
                        setIsTyping(false);
                      }
                    }}

                  >
                    <Text style={styles.quickReplyText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}


            {/* Input */}
            <View style={styles.inputArea}>
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                placeholderTextColor="#94A3B8"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSend}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !inputText.trim() && styles.sendDisabled,
                ]}
                onPress={handleSend}
                disabled={!inputText.trim()}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  overlayContainer: {
    position: "absolute",
    inset: 0,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    zIndex: 999,
  },
  floatingButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#0f766e",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
  modalWrapper: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 350,
    maxWidth: "90%",
    height: 500,
    maxHeight: "80%",
  },
  chatWindow: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 10,
  },

  severityBadge: {
    alignSelf: "flex-start",
    marginLeft: 16,
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  severityText: {
    fontSize: 11,
    fontWeight: "700",
  },

  mild: { backgroundColor: "#dcfce7" },
  moderate: { backgroundColor: "#ffedd5" },
  severe: { backgroundColor: "#fee2e2" },


  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#0f766e",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: "#1E293B",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  botBubble: {
    backgroundColor: "#F1F5F9",
    alignSelf: "flex-start",
  },
  userBubble: {
    backgroundColor: "#0f766e",
    alignSelf: "flex-end",
  },
  botText: {
    color: "#1E293B",
  },
  userText: {
    color: "#fff",
  },
  inputArea: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: 10,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0f766e",
    justifyContent: "center",
    alignItems: "center",
  },
  sendDisabled: {
    opacity: 0.5,
  },

  quickReplies: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },

  quickReplyButton: {
    backgroundColor: "#E0F2F1",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },

  quickReplyText: {
    color: "#0f766e",
    fontSize: 14,
    fontWeight: "500",
  },

});
