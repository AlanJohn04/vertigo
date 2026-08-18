import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../api/AuthContext";
import { API_BASE_URL } from "../../api/config";
import { Colors, Shadows, BorderRadius, Typography, Spacing } from "../../constants/theme";

export default function Checkups() {
  const router = useRouter();
  const { user } = useAuth();
  const [checkups, setCheckups] = useState<any[]>([
    { id: "1", date: "March 20, 2026", time: "10:30 AM", practitioner: "Dr. Smith", status: "Upcoming", type: "Follow-up" },
    { id: "2", date: "March 15, 2026", time: "2:00 PM", practitioner: "Dr. Smith", status: "Completed", type: "Initial Consult" },
  ]);

  useEffect(() => {
    loadCheckups();
  }, [user]);

  const loadCheckups = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (user?.uid) queryParams.append("uid", user.uid);
      if (user?.email) queryParams.append("email", user.email);

      const response = await fetch(`${API_BASE_URL}/patients-lookup/me?${queryParams.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.checkups) && data.checkups.length > 0) {
          setCheckups(data.checkups);
        }
      }
    } catch (e) {
      console.error("Error loading checkups:", e);
    }
  };

  const scheduleNewCheckup = async () => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 7);
    const dateStr = nextDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const newCheckup = {
      id: String(Date.now()),
      date: dateStr,
      time: "11:00 AM",
      practitioner: "Dr. Vestibular Specialist",
      status: "Upcoming",
      type: "Rehab Follow-up"
    };

    const updated = [newCheckup, ...checkups];
    setCheckups(updated);

    try {
      const targetId = user?.uid || user?.email || "devtest@vertease.com";
      await fetch(`${API_BASE_URL}/checkups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: targetId, checkup: newCheckup })
      });
      Alert.alert("Success", `Checkup scheduled for ${dateStr}!`);
    } catch (error) {
      console.error("Error scheduling checkup:", error);
    }
  };

  const upcomingCheckup = checkups.find(c => c.status === "Upcoming") || checkups[0];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Your Checkups</Text>
        <TouchableOpacity onPress={scheduleNewCheckup} style={styles.addBtn}>
          <Ionicons name="add" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Next Session Card */}
        <Text style={styles.sectionLabel}>NEXT SESSION</Text>
        {upcomingCheckup ? (
          <View style={styles.nextCard}>
            <View style={styles.nextCardLeft}>
              <View style={styles.dateBadge}>
                <Text style={styles.dateDay}>{upcomingCheckup.date.split(" ")[1]?.replace(",", "") || "20"}</Text>
                <Text style={styles.dateMonth}>{upcomingCheckup.date.split(" ")[0]?.substring(0, 3).toUpperCase() || "MAR"}</Text>
              </View>
            </View>
            <View style={styles.nextCardCenter}>
              <Text style={styles.nextTitle}>{upcomingCheckup.type || "Vestibular Analysis"}</Text>
              <Text style={styles.nextSub}>{upcomingCheckup.practitioner} • {upcomingCheckup.time}</Text>
            </View>
            <TouchableOpacity style={styles.calendarBtn} onPress={scheduleNewCheckup}>
              <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Schedule CTA */}
        <TouchableOpacity style={styles.scheduleCta} onPress={scheduleNewCheckup}>
          <Ionicons name="add-circle-outline" size={20} color={Colors.white} />
          <Text style={styles.scheduleCtaText}>Schedule Next Checkup</Text>
        </TouchableOpacity>

        {/* History */}
        <Text style={styles.sectionLabel}>HISTORY & APPOINTMENTS</Text>
        {checkups.map((check) => {
          const isCompleted = check.status === "Completed";
          return (
            <View key={check.id} style={styles.historyCard}>
              <View style={[styles.statusDot, { backgroundColor: isCompleted ? Colors.success : Colors.warning }]} />
              <View style={styles.historyInfo}>
                <Text style={styles.historyDate}>{check.date}</Text>
                <Text style={styles.historyType}>{check.type} • {check.practitioner}</Text>
              </View>
              <View style={styles.historyRight}>
                <Text style={styles.historyTime}>{check.time}</Text>
                <View style={[styles.statusPill, { backgroundColor: isCompleted ? "#ECFDF5" : "#FFFBEB" }]}>
                  <Text style={[styles.statusText, { color: isCompleted ? Colors.success : Colors.warning }]}>
                    {check.status}
                  </Text>
                </View>
              </View>
            </View>
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
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#ECFDF5", alignItems: "center", justifyContent: "center",
  },
  title: { ...Typography.title3, color: Colors.textPrimary },
  content: { padding: Spacing.xxl },
  sectionLabel: { ...Typography.overline, color: Colors.textMuted, marginBottom: Spacing.md },
  nextCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.white, borderRadius: BorderRadius.xxl,
    padding: Spacing.xl, marginBottom: Spacing.xl, ...Shadows.md,
  },
  nextCardLeft: { marginRight: Spacing.lg },
  dateBadge: {
    backgroundColor: "#ECFDF5", borderRadius: BorderRadius.lg,
    paddingHorizontal: 14, paddingVertical: 10, alignItems: "center",
  },
  dateDay: { fontSize: 22, fontWeight: "900", color: Colors.primary },
  dateMonth: { fontSize: 10, fontWeight: "700", color: Colors.primary, letterSpacing: 1 },
  nextCardCenter: { flex: 1 },
  nextTitle: { ...Typography.headline, color: Colors.textPrimary, marginBottom: 4 },
  nextSub: { ...Typography.caption, color: Colors.textMuted },
  calendarBtn: {
    width: 40, height: 40, borderRadius: BorderRadius.md,
    backgroundColor: "#ECFDF5", alignItems: "center", justifyContent: "center",
  },
  scheduleCta: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.primary, borderRadius: BorderRadius.xl,
    paddingVertical: 14, marginBottom: Spacing.xxl, ...Shadows.sm,
  },
  scheduleCtaText: { ...Typography.headline, color: Colors.white, marginLeft: 8 },
  historyCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.sm,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: Spacing.lg },
  historyInfo: { flex: 1 },
  historyDate: { ...Typography.headline, color: Colors.textPrimary, marginBottom: 2 },
  historyType: { ...Typography.caption, color: Colors.textMuted },
  historyRight: { alignItems: "flex-end" },
  historyTime: { ...Typography.callout, color: Colors.textSecondary, marginBottom: 4 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.pill },
  statusText: { ...Typography.caption, fontWeight: "600" },
});
