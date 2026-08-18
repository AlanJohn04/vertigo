import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, Alert, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Button from "../../components/shared/Button";
import { useAuth } from "../../api/AuthContext";
import { Colors, Shadows, BorderRadius, Typography, Spacing } from "../../constants/theme";

export default function ResetPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();

  const handleResetPassword = async () => {
    if (!email.trim()) { setError("Please enter your email address"); return; }
    setIsLoading(true);
    setError("");
    try {
      await resetPassword(email);
      setSuccess(true);
      Alert.alert("Password Reset Email Sent", "Check your email for instructions to reset your password.", [{ text: "OK" }]);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name={success ? "checkmark-circle" : "key"} size={36} color={success ? Colors.success : Colors.primary} />
        </View>

        <Text style={styles.title}>{success ? "Email Sent!" : "Reset Password"}</Text>
        <Text style={styles.subtitle}>
          {success
            ? "Check your inbox for password reset instructions"
            : "Enter your email to receive a reset link"}
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {!success && (
          <>
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
              />
            </View>
            <View style={styles.buttonWrap}>
              <Button text="Send Reset Link" onPress={handleResetPassword} disabled={isLoading} />
            </View>
          </>
        )}

        <TouchableOpacity onPress={() => router.replace("/(auth)/SignIn")} style={styles.linkWrap}>
          <Ionicons name="arrow-back" size={16} color={Colors.primary} />
          <Text style={styles.linkText}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.xxl,
    paddingTop: 50,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.white, alignItems: "center", justifyContent: "center",
    ...Shadows.sm,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#ECFDF5", alignItems: "center", justifyContent: "center",
    marginBottom: Spacing.xxl,
  },
  title: { ...Typography.title1, color: Colors.textPrimary, marginBottom: Spacing.sm },
  subtitle: {
    ...Typography.body, color: Colors.textMuted,
    textAlign: "center", marginBottom: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  errorBox: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FEF2F2", borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.xl,
    borderWidth: 1, borderColor: "#FECACA", width: "100%",
  },
  errorText: { ...Typography.callout, color: Colors.danger, marginLeft: Spacing.sm, flex: 1 },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.lg, height: 52, width: "100%",
    marginBottom: Spacing.xxl,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: Colors.textPrimary },
  buttonWrap: { width: "100%", marginBottom: Spacing.xxl },
  linkWrap: {
    flexDirection: "row", alignItems: "center", marginTop: Spacing.lg,
  },
  linkText: { ...Typography.callout, color: Colors.primary, fontWeight: "600", marginLeft: 6 },
});