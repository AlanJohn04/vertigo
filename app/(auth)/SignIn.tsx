import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ToastAndroid,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Button from "../../components/shared/Button";
import { useAuth } from "../../api/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Shadows, BorderRadius, Typography, Spacing } from "../../constants/theme";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { signIn } = useAuth();

  const validateForm = () => {
    if (!email.trim()) { setError("Please enter your email address"); return false; }
    if (!password) { setError("Please enter your password"); return false; }
    setError("");
    return true;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      await signIn(email, password);
      console.log("Sign in successful");
      const storedRole = await AsyncStorage.getItem("userRole");
      if (storedRole === "patient") {
        router.replace("/(patient)/PatientHome");
      } else {
        router.replace("/(tabs)/Home");
      }
    } catch (error: any) {
      setError(error.message);
      const errorMessage = error.message || "An error occurred. Please try again.";
      if (Platform.OS === "android") {
        ToastAndroid.show(errorMessage, ToastAndroid.LONG);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push("/(auth)/ResetPassword");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="lock-closed" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue your journey</Text>
        </View>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="key-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
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

          <TouchableOpacity onPress={handleForgotPassword} disabled={isLoading} style={styles.forgotWrap}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* CTA */}
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Signing in...</Text>
          </View>
        ) : (
          <View style={styles.buttonWrap}>
            <Button text="Sign In" onPress={handleSignIn} disabled={isLoading} />
          </View>
        )}

        {/* Footer */}
        <Pressable onPress={() => router.push("/typeOfUser")} disabled={isLoading}>
          <Text style={styles.footerText}>
            Don't have an account? <Text style={styles.footerLink}>Sign Up</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: Spacing.xxl,
    paddingTop: 50,
    backgroundColor: Colors.background,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.sm,
    marginBottom: Spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xxxl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.title1,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    ...Typography.callout,
    color: Colors.danger,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  form: {
    marginBottom: Spacing.xxl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.callout,
    color: Colors.textSecondary,
    marginBottom: 6,
    marginLeft: 4,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
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
    marginTop: Spacing.xs,
  },
  forgotText: {
    ...Typography.callout,
    color: Colors.primary,
    fontWeight: "600",
  },
  loadingWrap: {
    alignItems: "center",
    marginVertical: Spacing.xxl,
  },
  loadingText: {
    ...Typography.callout,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  buttonWrap: {
    marginBottom: Spacing.xxl,
  },
  footerText: {
    ...Typography.callout,
    color: Colors.textMuted,
    textAlign: "center",
  },
  footerLink: {
    color: Colors.primary,
    fontWeight: "700",
  },
});
