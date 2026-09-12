import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ToastAndroid,
  Modal,
  SafeAreaView,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuth } from "../../api/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Checkbox } from "react-native-paper";
import { Colors, BorderRadius, Spacing } from "../../constants/theme";
import LogoAnimation from "../../components/LogoAnimation";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem("termsAccepted").then((val) => {
        if (val === "true") {
          setAgreedToTerms(true);
        }
      });
    }, [])
  );

  const handleToggleTerms = async () => {
    const nextVal = !agreedToTerms;
    setAgreedToTerms(nextVal);
    await AsyncStorage.setItem("termsAccepted", nextVal ? "true" : "false");
    if (nextVal) {
      await AsyncStorage.setItem("disclaimerAccepted", "true");
    }
  };

  const { signIn } = useAuth();

  const handlePressSignIn = () => {
    if (!agreedToTerms) {
      Alert.alert(
        "Terms & Conditions",
        "Please accept the Terms & Conditions before signing in.",
        [
          { text: "Read Terms", onPress: () => router.push("/(auth)/Terms") },
          {
            text: "I Agree",
            onPress: async () => {
              await handleToggleTerms();
              setShowAuthModal(true);
            },
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }
    setShowAuthModal(true);
  };

  const handlePerformSignIn = async () => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      await signIn(email, password);
      const storedRole = await AsyncStorage.getItem("userRole");
      setShowAuthModal(false);
      if (storedRole === "patient") {
        router.replace("/(patient)/PatientHome");
      } else {
        router.replace("/(tabs)/Home");
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please try again.");
      if (Platform.OS === "android") {
        ToastAndroid.show(err.message || "Sign in failed", ToastAndroid.LONG);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowAuthModal(false);
    router.push("/(auth)/ResetPassword");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Center: Animated Squircle Logo + VertiDx + Tagline */}
        <View style={styles.centerSection}>
          <LogoAnimation size={190} rounded={true} />
          <Text style={styles.title}>VertiDx</Text>
          <Text style={styles.subtitle}>Decode the Vertigo</Text>
        </View>

        {/* Bottom: Sign In Button, Sign Up link, Terms & Conditions checkbox */}
        <View style={styles.bottomSection}>
          {/* Green Sign In Button */}
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={handlePressSignIn}
            activeOpacity={0.85}
          >
            <Text style={styles.signInBtnText}>Sign in</Text>
          </TouchableOpacity>

          {/* Not a member yet, Please sign up */}
          <View style={styles.signUpLinkWrap}>
            <Text style={styles.memberText}>Not a member yet, Please </Text>
            <TouchableOpacity
              onPress={() => router.push("/SignUp")}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
            >
              <Text style={styles.signUpHighlight}>sign up</Text>
            </TouchableOpacity>
          </View>

          {/* Terms and conditions Checkbox */}
          <View style={styles.checkboxContainer}>
            <Checkbox
              status={agreedToTerms ? "checked" : "unchecked"}
              onPress={handleToggleTerms}
              color="#15803d"
            />
            <View style={styles.termsTextRow}>
              <TouchableOpacity onPress={handleToggleTerms} activeOpacity={0.7}>
                <Text style={styles.termsLabel}>Please accept the </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/Terms")}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
              >
                <Text style={styles.termsHighlight}>terms and conditions</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Credential Entry Modal */}
      <Modal
        visible={showAuthModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAuthModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Sign In</Text>
                <Text style={styles.modalSubtitle}>Enter your VertiDx account details</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setError("");
                  setShowAuthModal(false);
                }}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={Colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrap}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={Colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <Ionicons
                  name="key-outline"
                  size={18}
                  color={Colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={handleForgotPassword}
              disabled={isLoading}
              style={styles.forgotWrap}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Action Buttons */}
            {isLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color="#15803d" />
                <Text style={styles.loadingText}>Signing in...</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.submitSignInBtn}
                onPress={handlePerformSignIn}
                activeOpacity={0.85}
              >
                <Text style={styles.submitSignInBtnText}>Sign In</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === "android" ? 40 : 0,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xxl,
    paddingTop: 48,
    paddingBottom: 36,
    minHeight: "100%",
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 38,
    fontWeight: "800",
    color: "#166534",
    letterSpacing: 0.5,
    marginTop: 24,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 10,
    letterSpacing: 0.2,
  },
  bottomSection: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    paddingBottom: 10,
  },
  signInBtn: {
    width: "100%",
    backgroundColor: "#15803d",
    paddingVertical: 16,
    borderRadius: BorderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#15803d",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  signInBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: 0.3,
  },
  signUpLinkWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    marginBottom: 16,
  },
  memberText: {
    fontSize: 15,
    color: "#1F2937",
    textAlign: "center",
  },
  signUpHighlight: {
    color: "#15803d",
    fontWeight: "700",
    fontStyle: "italic",
    textDecorationLine: "underline",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  termsTextRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  termsLabel: {
    fontSize: 14,
    color: "#1F2937",
    marginLeft: 6,
  },
  termsHighlight: {
    color: "#15803d",
    fontWeight: "700",
    fontStyle: "italic",
    textDecorationLine: "underline",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: Spacing.xxl,
    paddingBottom: 45,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#166534",
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    fontSize: 14,
    color: Colors.danger,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 6,
    marginLeft: 4,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  forgotWrap: {
    alignSelf: "flex-end",
    marginBottom: Spacing.xl,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#15803d",
  },
  submitSignInBtn: {
    width: "100%",
    backgroundColor: "#15803d",
    paddingVertical: 16,
    borderRadius: BorderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#15803d",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  submitSignInBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: 0.3,
  },
  loadingWrap: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
});
