import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../api/AuthContext";
import { API_BASE_URL } from "../../api/config";
import { Colors, Shadows, BorderRadius, Typography, Spacing } from "../../constants/theme";

const EXERCISES = [
  { id: "1", title: "Vestibular Habituation", description: "Move your head slowly from side to side 10 times.", duration: "5 mins", icon: "headset-outline", color: "#10B981" },
  { id: "2", title: "Brandt-Daroff Exercises", description: "Sit on the edge of the bed and lie down on one side.", duration: "15 mins", icon: "bed-outline", color: "#3B82F6" },
  { id: "3", title: "Gaze Stabilization", description: "Focus on a target and move your head while keeping focus.", duration: "10 mins", icon: "eye-outline", color: "#F59E0B" },
];

export default function Exercises() {
  const router = useRouter();
  const { user } = useAuth();
  const [completedList, setCompletedList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCompletedExercises();
  }, [user]);

  const loadCompletedExercises = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (user?.uid) queryParams.append("uid", user.uid);
      if (user?.email) queryParams.append("email", user.email);

      const response = await fetch(`${API_BASE_URL}/patients-lookup/me?${queryParams.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.completedExercises)) {
          setCompletedList(data.completedExercises);
        }
      }
    } catch (e) {
      console.error("Error loading exercises:", e);
    }
  };

  const toggleExercise = async (exerciseId: string) => {
    const isCompleted = completedList.includes(exerciseId);
    const updated = isCompleted
      ? completedList.filter(id => id !== exerciseId)
      : [...completedList, exerciseId];

    setCompletedList(updated);
    setLoading(true);

    try {
      const targetId = user?.uid || user?.email || "devtest@vertease.com";
      const response = await fetch(`${API_BASE_URL}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: targetId,
          exerciseId,
          completed: !isCompleted
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Exercise toggle synced to Neon DB:", result);
      }
    } catch (error) {
      console.error("Error toggling exercise:", error);
    } finally {
      setLoading(false);
    }
  };

  const completedCount = completedList.length;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Your Exercises</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Overview */}
      <View style={styles.overviewCard}>
        <View style={styles.overviewLeft}>
          <Text style={styles.overviewLabel}>TODAY'S GOAL</Text>
          <Text style={styles.overviewValue}>3 exercises</Text>
        </View>
        <View style={styles.overviewCircle}>
          <Text style={styles.overviewCircleText}>{completedCount}/3</Text>
        </View>
      </View>

      <View style={styles.content}>
        {EXERCISES.map((ex, index) => {
          const isDone = completedList.includes(ex.id);
          return (
            <TouchableOpacity 
              key={ex.id} 
              style={styles.exerciseCard} 
              onPress={() => toggleExercise(ex.id)}
              activeOpacity={0.7}
            >
              {/* Step Number */}
              <View style={styles.stepIndicator}>
                <View style={[styles.stepDot, { backgroundColor: isDone ? Colors.success : ex.color }]}>
                  {isDone ? (
                    <Ionicons name="checkmark" size={14} color={Colors.white} />
                  ) : (
                    <Text style={styles.stepNumber}>{index + 1}</Text>
                  )}
                </View>
                {index < EXERCISES.length - 1 && <View style={styles.stepLine} />}
              </View>

              {/* Card Content */}
              <View style={[styles.cardBody, isDone && { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0", borderWidth: 1 }]}>
                <View style={[styles.iconBox, { backgroundColor: ex.color + "18" }]}>
                  <Ionicons name={ex.icon as any} size={26} color={ex.color} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{ex.title}</Text>
                  <Text style={styles.cardDesc}>{ex.description}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{ex.duration}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={[styles.playBtn, { backgroundColor: isDone ? Colors.success : ex.color }]}
                  onPress={() => toggleExercise(ex.id)}
                >
                  <Ionicons name={isDone ? "checkmark-done" : "play"} size={18} color={Colors.white} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: 56, paddingBottom: Spacing.xl, paddingHorizontal: Spacing.xxl,
    backgroundColor: Colors.white, ...Shadows.sm,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surfaceElevated, alignItems: "center", justifyContent: "center",
  },
  title: { ...Typography.title3, color: Colors.textPrimary },
  overviewCard: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: Colors.primary, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, marginHorizontal: Spacing.xxl, marginTop: Spacing.xxl,
    ...Shadows.glow(Colors.primary),
  },
  overviewLeft: {},
  overviewLabel: { ...Typography.overline, color: "rgba(255,255,255,0.7)" },
  overviewValue: { ...Typography.title2, color: Colors.white, marginTop: 4 },
  overviewCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  overviewCircleText: { ...Typography.headline, color: Colors.white },
  content: { padding: Spacing.xxl },
  exerciseCard: { flexDirection: "row", marginBottom: Spacing.xl },
  stepIndicator: { alignItems: "center", marginRight: Spacing.lg, width: 24 },
  stepDot: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  stepNumber: { color: Colors.white, fontSize: 12, fontWeight: "700" },
  stepLine: {
    width: 2, flex: 1, backgroundColor: Colors.border, marginTop: 4,
  },
  cardBody: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, ...Shadows.sm,
  },
  iconBox: {
    width: 52, height: 52, borderRadius: BorderRadius.lg,
    alignItems: "center", justifyContent: "center", marginRight: Spacing.md,
  },
  cardInfo: { flex: 1 },
  cardTitle: { ...Typography.headline, color: Colors.textPrimary, marginBottom: 4 },
  cardDesc: { ...Typography.caption, color: Colors.textMuted, lineHeight: 18, marginBottom: 6 },
  metaRow: { flexDirection: "row", alignItems: "center" },
  metaText: { ...Typography.caption, color: Colors.textMuted, marginLeft: 4 },
  playBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center", marginLeft: Spacing.sm,
  },
});
