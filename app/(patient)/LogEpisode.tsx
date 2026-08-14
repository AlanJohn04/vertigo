import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../api/AuthContext";
import { API_BASE_URL } from "../../api/config";
import Button from "../../components/shared/Button";
import { Colors, Shadows, BorderRadius, Typography, Spacing } from "../../constants/theme";

export default function LogEpisode() {
  const router = useRouter();
  const { user } = useAuth();
  const [severity, setSeverity] = useState(5);
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user?.uid) { Alert.alert("Error", "You must be logged in."); return; }
    setLoading(true);
    try {
      const targetPatientId = user.uid || user.email || user.displayName || "unknown";
      const response = await fetch(`${API_BASE_URL}/episodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: targetPatientId, severity, duration, notes,
          timestamp: new Date().toISOString(),
        }),
      });
      if (response.ok) {
        Alert.alert("Success", "Episode logged successfully!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else { throw new Error("Failed to log episode"); }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save episode.");
    } finally { setLoading(false); }
  };

  const getSeverityColor = (num: number) => {
    if (num <= 3) return Colors.success;
    if (num <= 6) return Colors.warning;
    return Colors.danger;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Log Episode</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Severity */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="speedometer-outline" size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>Severity</Text>
          </View>
          <Text style={styles.severityDisplay}>
            <Text style={[styles.severityNumber, { color: getSeverityColor(severity) }]}>{severity}</Text>
            <Text style={styles.severityMax}> /10</Text>
          </Text>
          <View style={styles.severityGrid}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => setSeverity(num)}
                style={[
                  styles.severityBtn,
                  severity === num && { backgroundColor: getSeverityColor(num) },
                ]}
              >
                <Text style={[
                  styles.severityBtnText,
                  severity === num && { color: Colors.white },
                ]}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Duration */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="time-outline" size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>Duration</Text>
          </View>
          <TextInput
            style={styles.input}
            value={duration}
            onChangeText={setDuration}
            placeholder="e.g. 10 minutes"
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        {/* Notes */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>Notes & Triggers</Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="What happened? Any triggers like head movement?"
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Submit */}
        <View style={styles.submitWrap}>
          <Button
            text={loading ? "Saving..." : "Save Episode"}
            onPress={handleSubmit}
            disabled={loading}
          />
        </View>
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
  content: { padding: Spacing.xxl },
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, marginBottom: Spacing.lg, ...Shadows.sm,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.lg },
  cardTitle: { ...Typography.headline, color: Colors.textPrimary, marginLeft: Spacing.sm },
  severityDisplay: { textAlign: "center", marginBottom: Spacing.lg },
  severityNumber: { fontSize: 48, fontWeight: "900" },
  severityMax: { fontSize: 20, color: Colors.textMuted, fontWeight: "500" },
  severityGrid: {
    flexDirection: "row", flexWrap: "wrap", justifyContent: "center",
  },
  severityBtn: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceElevated, alignItems: "center", justifyContent: "center",
    margin: 4,
  },
  severityBtnText: { fontWeight: "700", fontSize: 16, color: Colors.textSecondary },
  input: {
    backgroundColor: Colors.surfaceElevated, borderRadius: BorderRadius.md,
    padding: Spacing.lg, fontSize: 16, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.border,
  },
  textArea: { height: 120, textAlignVertical: "top" },
  submitWrap: { marginTop: Spacing.xl, paddingBottom: 40 },
});
