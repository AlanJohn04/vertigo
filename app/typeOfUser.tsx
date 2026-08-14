import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { UserRole, useAuth } from "../api/AuthContext";
import { Colors, Shadows, BorderRadius, Typography, Spacing } from "../constants/theme";

const TypeOfUser = () => {
  const router = useRouter();
  const { testLogin } = useAuth();

  const handleCreateAccount = (role: UserRole) => {
    router.push({ pathname: "/(auth)/SignUp", params: { role } });
  };

  const handleSignIn = () => {
    router.push("/(auth)/SignIn");
  };

  const handleDevBypass = (role: UserRole) => {
    testLogin(role);
    if (role === "patient") {
      router.replace("/(patient)/PatientHome");
    } else {
      router.replace("/(tabs)/Home");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="people" size={32} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Who are you?</Text>
        <Text style={styles.subtitle}>
          Select your account role to register, sign in, or explore the VertEase panel.
        </Text>
      </View>

      {/* Role Cards */}
      <View style={styles.cardsContainer}>
        {/* Patient Card */}
        <View style={styles.roleCard}>
          <View style={[styles.roleIconBox, { backgroundColor: "#EFF6FF" }]}>
            <Ionicons name="heart" size={32} color={Colors.info} />
          </View>
          <Text style={styles.roleTitle}>Patient Account</Text>
          <Text style={styles.roleDescription}>
            Track your vertigo symptoms, view your ML analysis & medical records, and log episodes.
          </Text>
          
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: Colors.info }]}
              onPress={() => handleCreateAccount("patient")}
            >
              <Text style={styles.actionBtnText}>Register as Patient</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoBtn, { borderColor: Colors.info }]}
              onPress={() => handleDevBypass("patient")}
            >
              <Text style={[styles.demoBtnText, { color: Colors.info }]}>Quick Demo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Practitioner Card */}
        <View style={styles.roleCard}>
          <View style={[styles.roleIconBox, { backgroundColor: "#ECFDF5" }]}>
            <Ionicons name="medkit" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.roleTitle}>Healthcare Practitioner</Text>
          <Text style={styles.roleDescription}>
            Manage patient records, diagnose vertigo subtypes using ML models, and monitor recovery.
          </Text>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: Colors.primary }]}
              onPress={() => handleCreateAccount("practitioner")}
            >
              <Text style={styles.actionBtnText}>Register as Practitioner</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoBtn, { borderColor: Colors.primary }]}
              onPress={() => handleDevBypass("practitioner")}
            >
              <Text style={[styles.demoBtnText, { color: Colors.primary }]}>Quick Demo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign In Footer */}
        <TouchableOpacity style={styles.signInFooter} onPress={handleSignIn}>
          <Text style={styles.signInFooterText}>
            Already have an account? <Text style={{ color: Colors.primary, fontWeight: "700" }}>Sign In Here</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xxl,
  },
  header: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: Spacing.xxl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.title1,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  cardsContainer: {
    flex: 1,
  },
  roleCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  roleIconBox: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  roleTitle: {
    ...Typography.title2,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  roleDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  demoBtn: {
    borderWidth: 1.5,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  demoBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  signInFooter: {
    paddingVertical: 20,
    alignItems: "center",
  },
  signInFooterText: {
    ...Typography.callout,
    color: Colors.textMuted,
  },
});

export default TypeOfUser;
