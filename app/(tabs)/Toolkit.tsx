import React from "react";
import { StyleSheet, Text, View, ScrollView, SafeAreaView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Shadows, BorderRadius, Typography, Spacing } from "../../constants/theme";

export default function Toolkit() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Toolkit</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.description}>
          Clinical tests and vestibular rehabilitation exercises.
        </Text>

        {/* Clinical Tests */}
        <Text style={styles.sectionTitle}>Clinical Tests</Text>
        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <Ionicons name="body-outline" size={32} color={Colors.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Dix-Hallpike Maneuver</Text>
            <Text style={styles.cardSubtitle}>Diagnostic test for BPPV</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <Ionicons name="eye-outline" size={32} color={Colors.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Head Impulse Test (vHIT)</Text>
            <Text style={styles.cardSubtitle}>Test of the vestibulo-ocular reflex</Text>
          </View>
        </View>

        {/* Rehabilitation Exercises */}
        <Text style={styles.sectionTitle}>Vestibular Rehabilitation</Text>
        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <Ionicons name="fitness-outline" size={32} color={Colors.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Epley Maneuver</Text>
            <Text style={styles.cardSubtitle}>Treatment for posterior canal BPPV</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <Ionicons name="walk-outline" size={32} color={Colors.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Brandt-Daroff Exercises</Text>
            <Text style={styles.cardSubtitle}>Habituation exercises for vertigo</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === "android" ? 40 : 0,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...Typography.title2,
    color: Colors.textPrimary,
  },
  container: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  description: {
    ...Typography.body,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.headline,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  card: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
    alignItems: "center",
  },
  cardIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    ...Typography.callout,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});
