import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "../components/shared/Button";
import { useRouter } from "expo-router";
import { Colors, Shadows, BorderRadius, Typography, Spacing } from "../constants/theme";

const LandingPage: React.FC = () => {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/typeOfUser");
  };

  return (
    <View style={styles.container}>
      {/* Top Section */}
      <View style={styles.topSection}>
        <View style={styles.logoRow}>
          <View style={styles.logoDot} />
          <Text style={styles.logoName}>VertEase</Text>
        </View>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroImageContainer}>
          <View style={styles.heroCircle}>
            <Ionicons name="pulse" size={64} color={Colors.primary} />
          </View>
          {/* Decorative floating elements */}
          <View style={[styles.floatingDot, { top: 20, left: 30, backgroundColor: Colors.primaryLight }]} />
          <View style={[styles.floatingDot, { top: 60, right: 20, backgroundColor: Colors.accent, width: 14, height: 14 }]} />
          <View style={[styles.floatingDot, { bottom: 30, left: 50, backgroundColor: Colors.warning, width: 10, height: 10 }]} />
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.contentSection}>
        <Text style={styles.title}>
          Balance & Vertigo{"\n"}
          <Text style={styles.titleAccent}>Management</Text>
        </Text>
        <Text style={styles.subtitle}>
          Empowering patients and practitioners with intelligent vertigo tracking,
          exercises, and AI-powered insights.
        </Text>

        {/* Feature Pills */}
        <View style={styles.pillRow}>
          {[
            { icon: "shield-checkmark", label: "Secure" },
            { icon: "analytics", label: "Smart" },
            { icon: "people", label: "Connected" },
          ].map((item, i) => (
            <View key={i} style={styles.pill}>
              <Ionicons name={item.icon as any} size={14} color={Colors.primary} />
              <Text style={styles.pillText}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Button */}
      <View style={styles.bottomSection}>
        <Button
          text="Get Started"
          onPress={handleGetStarted}
          icon={<Ionicons name="arrow-forward" size={18} color={Colors.white} />}
        />
        <Text style={styles.loginHint}>
          Already have an account?{" "}
          <Text
            style={styles.loginLink}
            onPress={() => router.push("/(auth)/SignIn")}
          >
            Sign In
          </Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topSection: {
    paddingTop: 60,
    paddingHorizontal: Spacing.xxl,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    marginRight: 8,
  },
  logoName: {
    ...Typography.headline,
    color: Colors.primary,
    letterSpacing: 1,
  },
  heroSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heroImageContainer: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.glow(Colors.primary),
  },
  floatingDot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    opacity: 0.6,
  },
  contentSection: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xxl,
  },
  title: {
    ...Typography.largeTitle,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  titleAccent: {
    color: Colors.primary,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  pillRow: {
    flexDirection: "row",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    marginRight: 10,
  },
  pillText: {
    ...Typography.caption,
    color: Colors.primaryDark,
    marginLeft: 4,
    fontWeight: "600",
  },
  bottomSection: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: 50,
    alignItems: "center",
  },
  loginHint: {
    ...Typography.callout,
    color: Colors.textMuted,
    marginTop: Spacing.lg,
  },
  loginLink: {
    color: Colors.primary,
    fontWeight: "600",
  },
});

export default LandingPage;
