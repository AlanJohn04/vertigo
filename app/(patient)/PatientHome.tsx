import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../api/AuthContext";
import { StatusBar } from "expo-status-bar";
import Button from "../../components/shared/Button";
import { useRouter, useFocusEffect } from "expo-router";
import { API_BASE_URL } from "@/api/config";
import { fetchPatientMLPrediction, MLPredictionResult } from "@/utils/mlPrediction";
import { Colors, Shadows, BorderRadius, Typography, Spacing } from "../../constants/theme";

export default function PatientHome() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [patientData, setPatientData] = useState<any>(null);
  const [mlResult, setMlResult] = useState<MLPredictionResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatientData();
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      loadPatientData();
    }, [user])
  );

  const loadPatientData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (user?.uid) queryParams.append("uid", user.uid);
      if (user?.email) queryParams.append("email", user.email);
      if (user?.displayName) queryParams.append("name", user.displayName);

      const response = await fetch(`${API_BASE_URL}/patients-lookup/me?${queryParams.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setPatientData(data);
        const prediction = await fetchPatientMLPrediction(data);
        setMlResult(prediction);
      }
    } catch (error) {
      console.error("Error loading patient data:", error);
    } finally {
      setLoading(false);
    }
  };

  const performLogout = async () => {
    try { 
      await logout(); 
    } catch (error) { 
      console.error("Logout error:", error); 
    } finally {
      router.replace("/(auth)/SignIn");
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      performLogout();
    } else {
      Alert.alert("Log Out", "Are you sure you want to log out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Log Out", style: "destructive", onPress: performLogout },
      ]);
    }
  };

  const conditionName = mlResult?.finalDiagnosis || patientData?.cause || "Vestibular Evaluation";
  const episodeCount = Array.isArray(patientData?.episodes) ? patientData.episodes.length : 0;
  const progressPercent = Math.min(72 + episodeCount * 5, 95);

  const getSeverityLevel = (condition: string) => {
    if (condition.includes("BPPV")) return { label: "Moderate", color: Colors.warning, bg: "#FFFBEB" };
    if (condition.includes("Meniere")) return { label: "Attention Needed", color: Colors.danger, bg: "#FEF2F2" };
    return { label: "Stable", color: Colors.success, bg: "#ECFDF5" };
  };

  const severity = getSeverityLevel(conditionName);

  const quickActions = [
    { label: "Log Episode", icon: "journal", color: "#0EA5E9", bg: "#E0F2FE", route: "/(patient)/LogEpisode" },
    { label: "Exercises", icon: "fitness", color: "#22C55E", bg: "#DCFCE7", route: "/(patient)/Exercises" },
    { label: "Ask AI", icon: "star", color: "#A855F7", bg: "#F3E8FF", route: "/(tabs)/ChatBot" },
    { label: "Checkups", icon: "calendar", color: "#D97706", bg: "#FEF3C7", route: "/(patient)/Checkups" },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.userName}>{user?.displayName?.split(" ")[0] || "Patient"}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => router.push("/(patient)/profile" as any)}
              accessibilityLabel="Profile"
            >
              <Ionicons name="person" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              accessibilityLabel="Log out"
              testID="patient-logout-button"
            >
              <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Condition Badge */}
        <View style={styles.conditionCard}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.conditionLabel}>CONDITION & ML DIAGNOSIS</Text>
            <Text style={styles.conditionValue} numberOfLines={1}>{conditionName}</Text>
          </View>
          <View style={[styles.severityPill, { backgroundColor: severity.bg }]}>
            <View style={[styles.severityDot, { backgroundColor: severity.color }]} />
            <Text style={[styles.severityText, { color: severity.color }]}>{severity.label}</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Full Medical Details CTA Button */}
        {patientData && (
          <TouchableOpacity
            style={styles.fullRecordCard}
            onPress={() => router.push(`/PatientDetail/${patientData.id}`)}
          >
            <View style={styles.recordIconWrap}>
              <Ionicons name="medical" size={24} color={Colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.recordTitle}>My Medical Record & ML Analysis</Text>
              <Text style={styles.recordSub}>Tap to view full details, symptoms & AI diagnosis</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.white} />
          </TouchableOpacity>
        )}

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressLabel}>RECOVERY PROGRESS</Text>
              <Text style={styles.progressValue}>{progressPercent}%</Text>
            </View>
            <View style={styles.progressBadge}>
              <Ionicons name="trending-up" size={16} color={Colors.white} />
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressSubtext}>
            {episodeCount > 0 ? `${episodeCount} vertigo episode(s) logged` : 'Recovery plan active'}
          </Text>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, i) => (
            <TouchableOpacity
              key={i}
              style={styles.actionCard}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.bg }]}>
                <Ionicons name={action.icon as any} size={24} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Next Checkup */}
        <View style={styles.checkupBanner}>
          <View style={styles.checkupIconWrap}>
            <Ionicons name="calendar" size={20} color={Colors.accent} />
          </View>
          <View style={styles.checkupTextWrap}>
            <Text style={styles.checkupLabel}>Next Checkup</Text>
            <Text style={styles.checkupDate}>Scheduled with Practitioner</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </View>

        {/* Sign Out */}
        <View style={styles.logoutWrap}>
          <Button text="Sign Out" onPress={handleLogout} variant="outlined" />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.white,
    paddingTop: 56,
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.xxl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...Shadows.md,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  greeting: { ...Typography.callout, color: Colors.textMuted },
  userName: { ...Typography.title1, color: Colors.textPrimary },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  profileBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#ECFDF5", alignItems: "center", justifyContent: "center",
  },
  conditionCard: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg, padding: Spacing.lg,
  },
  conditionLabel: { ...Typography.overline, color: Colors.textMuted, marginBottom: 2 },
  conditionValue: { ...Typography.headline, color: Colors.textPrimary },
  severityPill: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.pill,
  },
  severityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  severityText: { ...Typography.caption, fontWeight: "700" },
  content: { padding: Spacing.xxl },
  fullRecordCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.primaryDark, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, marginBottom: Spacing.xl, ...Shadows.md,
  },
  recordIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
    marginRight: Spacing.lg,
  },
  recordTitle: { ...Typography.headline, color: Colors.white },
  recordSub: { ...Typography.caption, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  progressCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    marginBottom: Spacing.xxl,
    ...Shadows.glow(Colors.primary),
  },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  progressLabel: { ...Typography.overline, color: "rgba(255,255,255,0.7)" },
  progressValue: { fontSize: 44, fontWeight: "900", color: Colors.white, marginTop: 4 },
  progressBadge: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  progressTrack: {
    height: 6, backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3, marginTop: Spacing.lg, marginBottom: Spacing.md,
  },
  progressFill: { height: 6, backgroundColor: Colors.white, borderRadius: 3 },
  progressSubtext: { ...Typography.callout, color: "rgba(255,255,255,0.8)" },
  sectionTitle: { ...Typography.title3, color: Colors.textPrimary, marginBottom: Spacing.lg },
  actionsGrid: {
    flexDirection: "row", flexWrap: "wrap",
    justifyContent: "space-between", marginBottom: Spacing.xxl,
  },
  actionCard: {
    width: "47%", backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl, padding: Spacing.xl,
    alignItems: "center", marginBottom: Spacing.lg, ...Shadows.sm,
  },
  actionIcon: {
    width: 52, height: 52, borderRadius: BorderRadius.lg,
    alignItems: "center", justifyContent: "center", marginBottom: Spacing.md,
  },
  actionLabel: { ...Typography.headline, color: Colors.textSecondary },
  checkupBanner: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, marginBottom: Spacing.xxl, ...Shadows.sm,
  },
  checkupIconWrap: {
    width: 40, height: 40, borderRadius: BorderRadius.md,
    backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center", marginRight: Spacing.lg,
  },
  checkupTextWrap: { flex: 1 },
  checkupLabel: { ...Typography.caption, color: Colors.textMuted },
  checkupDate: { ...Typography.headline, color: Colors.textPrimary },
  logoutWrap: { marginBottom: 40 },
});