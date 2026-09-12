import React from 'react';
import { StyleSheet, Text, ScrollView, View, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function Terms() {
  const router = useRouter();

  const handleAgree = async () => {
    try {
      await AsyncStorage.setItem("termsAccepted", "true");
      await AsyncStorage.setItem("disclaimerAccepted", "true");
    } catch (e) {
      console.error("Error saving terms acceptance", e);
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/landing");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TERMS AND CONDITIONS</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.contentCard}>
          <Text style={styles.welcomeTitle}>Welcome to VertiDx</Text>

          <Text style={styles.paragraph}>
            VertiDx is designed to help users{" "}
            <Text style={styles.boldText}>
              better understand and assess symptoms of vertigo and dizziness. It also provides structured clinical decision support for healthcare professionals.
            </Text>
          </Text>

          <Text style={styles.paragraph}>
            VertiDx is an assistance and educational tool. Its information and suggestions are not intended to provide a definitive diagnosis or replace professional medical advice, examination, or treatment.
          </Text>

          <Text style={styles.subHeading}>For patients:</Text>
          <Text style={styles.paragraph}>
            VertiDx may help you understand your symptoms and the possible causes of dizziness or vertigo. It should not be used as a substitute for consultation with a qualified healthcare professional.
          </Text>

          <Text style={styles.subHeading}>For healthcare professionals:</Text>
          <Text style={styles.paragraph}>
            VertiDx is intended to support clinical assessment and reasoning. The final diagnosis and management decision remain with the treating healthcare professional.
          </Text>

          <Text style={styles.subHeading}>Privacy</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.boldText}>
              We respect your privacy. VertiDx does not sell or share your personal or health information with third parties for advertising or marketing purposes.
            </Text>{" "}
            Data is handled in accordance with our Privacy Policy and applicable data-protection requirements. Please avoid entering unnecessary personally identifiable information.
          </Text>

          <Text style={styles.subHeading}>Emergency Care</Text>
          <Text style={styles.paragraph}>
            VertiDx is not intended for emergency medical care. Seek immediate medical attention for sudden, severe, or potentially serious symptoms.
          </Text>

          <Text style={[styles.paragraph, styles.closingText]}>
            By continuing, you acknowledge that you have read and agree to the Terms & Conditions and Privacy Policy.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.agreeButton} onPress={handleAgree} activeOpacity={0.85}>
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
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: Spacing.xs,
    marginRight: Spacing.md,
  },
  headerTitle: {
    ...Typography.headline,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.8,
  },
  container: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  contentCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#166534',
    marginBottom: Spacing.lg,
  },
  subHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  paragraph: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 23,
  },
  boldText: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closingText: {
    marginTop: Spacing.md,
    fontStyle: 'italic',
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  footer: {
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  agreeButton: {
    backgroundColor: '#15803d',
    paddingVertical: 16,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agreeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },
});
