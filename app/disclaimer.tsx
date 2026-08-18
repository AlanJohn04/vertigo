import React from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "../components/shared/Button";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Shadows, BorderRadius, Typography, Spacing } from "../constants/theme";

export default function Disclaimer() {
  const router = useRouter();

  const handleAccept = async () => {
    await AsyncStorage.setItem("disclaimerAccepted", "true");
    router.replace("/landing");
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Icon */}
      <View style={styles.iconCircle}>
        <Ionicons name="shield-checkmark" size={40} color={Colors.primary} />
      </View>

      <Text style={styles.title}>Medical Disclaimer</Text>

      {/* Warning Banner */}
      <View style={styles.warningBanner}>
        <View style={styles.warningIconWrap}>
          <Ionicons name="warning" size={20} color="#DC2626" />
        </View>
        <View style={styles.warningTextWrap}>
          <Text style={styles.warningTitle}>Important Notice</Text>
          <Text style={styles.warningText}>
            This application is for information storage and educational purposes only.
          </Text>
        </View>
      </View>

      {/* Content Card */}
      <View style={styles.contentCard}>
        <Text style={styles.description}>
          VertEase is designed to assist healthcare providers in storing and managing
          patient information related to vertigo and balance disorders.
        </Text>

        {[
          { icon: "close-circle", text: "Does not provide medical diagnosis" },
          { icon: "close-circle", text: "Cannot replace professional medical advice" },
          { icon: "close-circle", text: "Should not be used for emergency decisions" },
          { icon: "close-circle", text: "Is not a substitute for clinical judgment" },
        ].map((item, i) => (
          <View key={i} style={styles.bulletRow}>
            <Ionicons name={item.icon as any} size={18} color={Colors.danger} />
            <Text style={styles.bulletText}>{item.text}</Text>
          </View>
        ))}

        <View style={styles.emphasisBox}>
          <Ionicons name="heart" size={18} color={Colors.primary} />
          <Text style={styles.emphasisText}>
            Always consult a qualified healthcare professional for medical advice.
          </Text>
        </View>
      </View>

      <Text style={styles.legalText}>
        By tapping "Accept," you acknowledge that you understand and agree to these terms.
      </Text>

      <View style={styles.buttonWrap}>
        <Button text="Accept & Continue" onPress={handleAccept} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: Spacing.xxl,
    paddingTop: 80,
    backgroundColor: Colors.background,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.title1,
    color: Colors.textPrimary,
    marginBottom: Spacing.xxl,
  },
  warningBanner: {
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: "100%",
    marginBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  warningIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  warningTextWrap: { flex: 1 },
  warningTitle: {
    ...Typography.headline,
    color: "#991B1B",
    marginBottom: 4,
  },
  warningText: {
    ...Typography.body,
    color: "#7F1D1D",
  },
  contentCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    width: "100%",
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  bulletText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginLeft: Spacing.md,
    flex: 1,
  },
  emphasisBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginTop: Spacing.xl,
  },
  emphasisText: {
    ...Typography.callout,
    color: Colors.primaryDark,
    marginLeft: Spacing.sm,
    flex: 1,
    fontWeight: "600",
  },
  legalText: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  buttonWrap: {
    width: "100%",
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
  },
});
