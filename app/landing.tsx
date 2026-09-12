import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Checkbox } from "react-native-paper";
import LogoAnimation from "../components/LogoAnimation";
import { Colors, BorderRadius, Spacing } from "../constants/theme";

const LandingPage: React.FC = () => {
  const router = useRouter();
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem("termsAccepted").then((val) => {
        if (val === "true") {
          setAgreedToTerms(true);
        }
      });
    }, [])
  );

  const handleToggleTerms = async () => {
    const nextVal = !agreedToTerms;
    setAgreedToTerms(nextVal);
    await AsyncStorage.setItem("termsAccepted", nextVal ? "true" : "false");
    if (nextVal) {
      await AsyncStorage.setItem("disclaimerAccepted", "true");
    }
  };

  const handleSignIn = () => {
    if (!agreedToTerms) {
      Alert.alert(
        "Terms & Conditions",
        "Please accept the Terms & Conditions before signing in.",
        [
          { text: "Read Terms", onPress: () => router.push("/(auth)/Terms") },
          { text: "I Agree", onPress: handleToggleTerms },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }
    router.push("/(auth)/SignIn");
  };

  const handleSignUp = () => {
    router.push("/(auth)/SignUp");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Main Content Area */}
        <View style={styles.centerSection}>
          {/* Animated Squircle Logo */}
          <LogoAnimation size={190} rounded={true} />

          {/* App Title & Tagline */}
          <Text style={styles.title}>VertiDx</Text>
          <Text style={styles.subtitle}>Decode the Vertigo</Text>
        </View>

        {/* Bottom Actions Section matching mockup order */}
        <View style={styles.bottomSection}>
          {/* Sign In Button */}
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={handleSignIn}
            activeOpacity={0.85}
          >
            <Text style={styles.signInBtnText}>Sign in</Text>
          </TouchableOpacity>

          {/* Not a member yet, Please sign up */}
          <View style={styles.signUpLinkWrap}>
            <Text style={styles.memberText}>Not a member yet, Please </Text>
            <TouchableOpacity
              onPress={handleSignUp}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
            >
              <Text style={styles.signUpHighlight}>sign up</Text>
            </TouchableOpacity>
          </View>

          {/* Terms & Conditions Checkbox */}
          <View style={styles.checkboxContainer}>
            <Checkbox
              status={agreedToTerms ? "checked" : "unchecked"}
              onPress={handleToggleTerms}
              color="#15803d"
            />
            <View style={styles.termsTextRow}>
              <TouchableOpacity onPress={handleToggleTerms} activeOpacity={0.7}>
                <Text style={styles.termsLabel}>Please accept the </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/Terms")}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
              >
                <Text style={styles.termsHighlight}>terms and conditions</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === "android" ? 40 : 0,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xxl,
    paddingTop: 48,
    paddingBottom: 36,
    minHeight: "100%",
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 38,
    fontWeight: "800",
    color: "#166534", // Signature green
    letterSpacing: 0.5,
    marginTop: 24,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937", // Slate dark
    marginTop: 10,
    letterSpacing: 0.2,
  },
  bottomSection: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    paddingBottom: 10,
  },
  signInBtn: {
    width: "100%",
    backgroundColor: "#15803d", // Vibrant green pill
    paddingVertical: 16,
    borderRadius: BorderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#15803d",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  signInBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: 0.3,
  },
  signUpLinkWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    marginBottom: 16,
  },
  memberText: {
    fontSize: 15,
    color: "#1F2937",
    textAlign: "center",
  },
  signUpHighlight: {
    color: "#15803d",
    fontWeight: "700",
    fontStyle: "italic",
    textDecorationLine: "underline",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  termsTextRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  termsLabel: {
    fontSize: 14,
    color: "#1F2937",
    marginLeft: 6,
  },
  termsHighlight: {
    color: "#15803d",
    fontWeight: "700",
    fontStyle: "italic",
    textDecorationLine: "underline",
  },
});

export default LandingPage;
