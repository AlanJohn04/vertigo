import React from 'react';
import { StyleSheet, Text, ScrollView, View, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function Terms() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TERMS AND CONDITIONS</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.text}>Welcome to VertiDx</Text>

        <Text style={styles.text}>
          VertiDx is designed to help users **better understand and assess symptoms of vertigo and dizziness**. It also provides structured clinical decision support for healthcare professionals.
        </Text>
        <Text style={styles.text}>
          VertiDx is an assistance and educational tool. Its information and suggestions are not intended to provide a definitive diagnosis or replace professional medical advice, examination, or treatment.
        </Text>

        <Text style={styles.subHeading}>For patients:</Text>
        <Text style={styles.text}>
          VertiDx may help you understand your symptoms and the possible causes of dizziness or vertigo. It should not be used as a substitute for consultation with a qualified healthcare professional.
        </Text>

        <Text style={styles.subHeading}>For healthcare professionals:</Text>
        <Text style={styles.text}>
          VertiDx is intended to support clinical assessment and reasoning. The final diagnosis and management decision remain with the treating healthcare professional.
        </Text>

        <Text style={styles.subHeading}>Privacy</Text>
        <Text style={styles.text}>
          We respect your privacy. VertiDx does not sell or share your personal or health information with third parties for advertising or marketing purposes. Data is handled in accordance with our Privacy Policy and applicable data-protection requirements. Please avoid entering unnecessary personally identifiable information.
        </Text>

        <Text style={styles.subHeading}>Emergency Care</Text>
        <Text style={styles.text}>
          VertiDx is not intended for emergency medical care. Seek immediate medical attention for sudden, severe, or potentially serious symptoms.
        </Text>

        <Text style={styles.text}>
          By continuing, you acknowledge that you have read and agree to the Terms & Conditions and Privacy Policy.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.agreeButton} onPress={() => router.back()}>
          <Text style={styles.agreeButtonText}>I Agree & Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: Spacing.xs,
    marginRight: Spacing.md,
  },
  headerTitle: {
    ...Typography.title3,
    color: Colors.textPrimary,
  },
  container: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  subHeading: {
    ...Typography.headline,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  text: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 24,
  },
  footer: {
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  agreeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  agreeButtonText: {
    ...Typography.headline,
    color: Colors.white,
  },
});
