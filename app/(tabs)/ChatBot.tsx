import React, { useState, useRef, useEffect } from "react";
import Markdown from "react-native-markdown-display";
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { sendChatMessage } from "../../api/chatbot";
import { useAuth } from "../../api/AuthContext";
import { API_BASE_URL } from "@/api/config";
import { Colors, Shadows, BorderRadius, Typography, Spacing } from "../../constants/theme";

export type Message = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp?: string | Date;
};

export default function ChatBot() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", text: "Hello! I'm VertEase AI assistant. How can I help you understand your vertigo symptoms or recovery today?", isUser: false },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (user) { fetchChatHistory(); }
    else {
      setMessages([{ id: "welcome", text: "Hello! I'm VertEase AI assistant. How can I help you understand your vertigo symptoms or recovery today?", isUser: false }]);
      setIsHistoryLoading(false);
    }
  }, [user?.uid]);

  const fetchChatHistory = async () => {
    if (!user) return;
    setIsHistoryLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/conversations/${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
          setMessages([{ id: "welcome", text: "Hello! I'm VertEase AI assistant. How can I help you understand your vertigo symptoms or recovery today?", isUser: false }]);
        }
      }
    } catch (error) { 
      console.error("Error fetching chat history:", error); 
    } finally { 
      setIsHistoryLoading(false); 
    }
  };

  const syncMessagesToNeon = async (updatedMessages: Message[]) => {
    if (!user) return;
    try {
      await fetch(`${API_BASE_URL}/conversations/${user.uid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });
    } catch (error) { 
      console.error("Error syncing chat:", error); 
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const messageText = input.trim();
    const userMessage: Message = { id: `${Date.now()}-user`, text: messageText, isUser: true, timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    try {
      const response = await sendChatMessage(messageText);
      const botMessage: Message = { id: `${Date.now()}-bot`, text: response || "I don't have a response for that.", isUser: false, timestamp: new Date().toISOString() };
      const finalMessages = [...newMessages, botMessage];
      setMessages(finalMessages);
      await syncMessagesToNeon(finalMessages);
    } catch (error) { 
      console.error("Error in handleSend:", error); 
    } finally {
      setIsLoading(false);
      setTimeout(() => { flatListRef.current?.scrollToEnd({ animated: true }); }, 150);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerDot}>
          <Ionicons name="star" size={18} color={Colors.white} />
        </View>
        <View>
          <Text style={styles.headerTitle}>AI Assistant</Text>
          <Text style={styles.headerSub}>Powered by VertEase AI</Text>
        </View>
      </View>

      {isHistoryLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading chat history...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.messageBubble, item.isUser ? styles.userBubble : styles.botBubble]}>
              {!item.isUser && (
                <View style={styles.botAvatar}>
                  <Ionicons name="star" size={14} color={Colors.primary} />
                </View>
              )}
              <View style={[styles.messageContent, item.isUser ? styles.userContent : styles.botContent]}>
                {item.isUser ? (
                  <Text style={styles.userText}>{item.text}</Text>
                ) : (
                  <Markdown style={markdownStyles}>
                    {item.text}
                  </Markdown>
                )}
              </View>
            </View>
          )}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {isLoading && (
        <View style={styles.typingIndicator}>
          <View style={styles.typingDots}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={styles.typingDot} />
            ))}
          </View>
          <Text style={styles.typingText}>VertEase AI is typing...</Text>
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={user ? "Ask me anything about vertigo..." : "Sign in to chat"}
            placeholderTextColor={Colors.textMuted}
            multiline
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            editable={!!user}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isLoading || !user) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={isLoading || !input.trim() || !user}
          >
            <Ionicons name="arrow-up" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const markdownStyles = {
  body: { color: Colors.textPrimary, fontSize: 15, lineHeight: 22 },
  heading1: { fontSize: 18, fontWeight: "700" as const, color: Colors.textPrimary, marginTop: 8, marginBottom: 4 },
  heading2: { fontSize: 16, fontWeight: "700" as const, color: Colors.textPrimary, marginTop: 6, marginBottom: 4 },
  heading3: { fontSize: 15, fontWeight: "700" as const, color: Colors.textPrimary, marginTop: 4, marginBottom: 2 },
  strong: { fontWeight: "700" as const, color: Colors.primary },
  paragraph: { marginTop: 2, marginBottom: 6 },
  list_item: { marginVertical: 2 },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingTop: 56, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.xxl,
    backgroundColor: Colors.white, ...Shadows.sm,
  },
  headerDot: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center",
    marginRight: Spacing.md,
  },
  headerTitle: { ...Typography.title3, color: Colors.textPrimary },
  headerSub: { ...Typography.caption, color: Colors.textMuted },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { ...Typography.callout, color: Colors.textMuted, marginTop: Spacing.sm },
  messageList: { padding: Spacing.lg, paddingBottom: 40, flexGrow: 1 },
  messageBubble: { flexDirection: "row", marginBottom: Spacing.md, alignItems: "flex-start" },
  userBubble: { justifyContent: "flex-end" },
  botBubble: { justifyContent: "flex-start" },
  botAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#ECFDF5", alignItems: "center", justifyContent: "center",
    marginRight: Spacing.sm, marginTop: 4,
  },
  messageContent: { borderRadius: BorderRadius.xl, padding: Spacing.lg },
  userContent: {
    maxWidth: "75%",
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 6,
  },
  botContent: {
    maxWidth: "85%",
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 6,
    ...Shadows.sm,
  },
  userText: { color: Colors.white, fontSize: 15, lineHeight: 22 },
  typingIndicator: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.sm,
  },
  typingDots: { flexDirection: "row" },
  typingDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary, opacity: 0.5, marginRight: 4,
  },
  typingText: { ...Typography.caption, color: Colors.textMuted, marginLeft: Spacing.sm },
  inputBar: {
    flexDirection: "row", alignItems: "flex-end",
    backgroundColor: Colors.white, borderRadius: BorderRadius.xxl,
    paddingLeft: Spacing.xl, paddingRight: 6, paddingVertical: 6,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.lg, ...Shadows.md,
  },
  input: { flex: 1, fontSize: 16, color: Colors.textPrimary, maxHeight: 100, minHeight: 40, paddingVertical: 8 },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
});
