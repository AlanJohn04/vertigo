import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../api/AuthContext";
import { StatusBar } from "expo-status-bar";
import Button from "../../components/shared/Button";
import { useRouter, useFocusEffect } from "expo-router";
import { API_BASE_URL } from "@/api/config";
import { fetchHybridDiagnosis, HybridPredictionResult } from "@/utils/mlPrediction";
import { Colors, Shadows, BorderRadius, Typography, Spacing } from "../../constants/theme";

export default function PatientHome() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [patientData, setPatientData] = useState<any>(null);
  const [hybridResult, setHybridResult] = useState<HybridPredictionResult | null>(null);
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
        const hybrid = await fetchHybridDiagnosis(data);
        setHybridResult(hybrid);
      }
    } catch (error) {
      console.error("Error loading patient data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { 
      await logout(); 
    } catch (error) { 
      console.error("Logout error:", error); 
    }
  };

  const conditionName = hybridResult?.finalHybridDiagnosis || patientData?.cause || "Vestibular Evaluation";
  const episodeCount = Array.isArray(patientData?.episodes) ? patientData.episodes.length : 0;
  const completedExercisesCount = Array.isArray(patientData?.completedExercises) ? patientData.completedExercises.length : 0;
  const progressPercent = Math.min(60 + completedExercisesCount * 12 + episodeCount * 3, 95);

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
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => router.push("/(patient)/profile" as any)}
          >
            <Ionicons name="person" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Condition & 50:50 Ensemble Diagnosis Badge */}
        <View style={styles.conditionCard}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
              <Ionicons name="sparkles" size={13} color={Colors.primary} />
              <Text style={styles.conditionLabel}>50:50 ML + LLM HYBRID DIAGNOSIS</Text>
            </View>
            <Text style={styles.conditionValue} numberOfLines={1}>{conditionName}</Text>
            {hybridResult && (
              <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 2 }}>
                50% ML: {hybridResult.mlContributionPercent}% • 50% LLM: {hybridResult.llmContributionPercent}%
              </Text>
            )}
          </View>
          <View style={[styles.severityPill, { backgroundColor: severity.bg }]}>
            <View style={[styles.severityDot, { backgroundColor: severity.color }]} />
            <Text style={[styles.severityText, { color: severity.color }]}>
              {hybridResult ? `${hybridResult.confidencePercent}% Consensus` : severity.label}
            </Text>
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
              <Text style={styles.recordTitle}>My Medical Record & Hybrid AI Insights</Text>
              <Text style={styles.recordSub}>Tap to view full ML features, exercises & doctor notes</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.white} />
          </TouchableOpacity>
        )}

        {/* Recovery Progress Card */}
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
            {completedExercisesCount > 0 ? `${completedExercisesCount}/3 Exercises completed today` : 'Daily exercises ready to start'}
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

        {/* Prescribed Exercises Mini-Card */}
        {hybridResult?.prescribedExercises && hybridResult.prescribedExercises.length > 0 && (
          <View style={styles.exerciseSection}>
            <Text style={styles.sectionTitle}>Prescribed Rehabilitation Routine</Text>
            {hybridResult.prescribedExercises.slice(0, 2).map((ex, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.exerciseItem}
                onPress={() => router.push("/(patient)/Exercises" as any)}
              >
                <View style={styles.exerciseIconCircle}>
                  <Ionicons name={(ex.icon || "fitness") as any} size={18} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exerciseTitle}>{ex.title}</Text>
                  <Text style={styles.exerciseDesc} numberOfLines={1}>{ex.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Next Checkup */}
        <TouchableOpacity
          style={styles.checkupBanner}
          onPress={() => router.push("/(patient)/Checkups" as any)}
        >
          <View style={styles.checkupIconWrap}>
            <Ionicons name="calendar" size={20} color={Colors.accent} />
          </View>
          <View style={styles.checkupTextWrap}>
            <Text style={styles.checkupLabel}>Next Checkup</Text>
            <Text style={styles.checkupDate}>Scheduled with Practitioner</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Sign Out */}
        <View style={styles.logoutWrap}>
          <Button text="Sign Out" onPress={handleLogout} variant="outlined" />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.white,
    paddingTop: 60,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xxl,
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
    ...Shadows.sm,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  greeting: {
    ...Typography.callout,
    color: Colors.textMuted,
  },
  userName: {
    ...Typography.title1,
    color: Colors.textPrimary,
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  conditionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  conditionLabel: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  conditionValue: {
    ...Typography.headline,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  severityPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.pill,
  },
  severityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  severityText: {
    ...Typography.caption,
    fontWeight: "700",
  },
  content: {
    padding: Spacing.xxl,
  },
  fullRecordCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
    ...Shadows.md,
    gap: 12,
  },
  recordIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  recordTitle: {
    color: Colors.white,
    fontWeight: "800",
    fontSize: 15,
  },
  recordSub: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 12,
    marginTop: 2,
  },
  progressCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xxl,
    ...Shadows.sm,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  progressLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  progressValue: {
    ...Typography.title2,
    color: Colors.textPrimary,
  },
  progressBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressSubtext: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  sectionTitle: {
    ...Typography.title3,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: Spacing.xxl,
  },
  actionCard: {
    width: "48%",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    ...Shadows.sm,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  actionLabel: {
    ...Typography.callout,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  exerciseSection: {
    marginBottom: Spacing.xxl,
  },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: 8,
    ...Shadows.sm,
    gap: 12,
  },
  exerciseIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  exerciseDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  checkupBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xxxl,
    ...Shadows.sm,
  },
  checkupIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  checkupTextWrap: {
    flex: 1,
  },
  checkupLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  checkupDate: {
    ...Typography.callout,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  logoutWrap: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xxxl,
  },
});