import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../api/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LogoAnimation from "../components/LogoAnimation";

export default function Index() {
  const { user, loading } = useAuth();
  const [disclaimerAccepted, setDisclaimerAccepted] = useState<boolean | null>(null);
  const [checkingStorage, setCheckingStorage] = useState(true);
  const [minSplashDone, setMinSplashDone] = useState(false);

  useEffect(() => {
    // Keep splash animation visible for at least 2.5 seconds for complete spiral animation
    const timer = setTimeout(() => {
      setMinSplashDone(true);
    }, 2500);

    const checkDisclaimer = async () => {
      try {
        const value = await AsyncStorage.getItem("disclaimerAccepted");
        setDisclaimerAccepted(value === "true");
      } catch (error) {
        console.error("Error checking disclaimer:", error);
      } finally {
        setCheckingStorage(false);
      }
    };

    checkDisclaimer();

    return () => clearTimeout(timer);
  }, []);

  if (loading || checkingStorage || !minSplashDone) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.logoContainer}>
          <LogoAnimation size={240} rounded={false} />
          <Text style={styles.appName}>VertiDx</Text>
          <Text style={styles.appTagline}>AI-Powered Vestibular Diagnostics</Text>
        </View>
        <View style={styles.footer}>
          <ActivityIndicator size="small" color="#ffffff" />
          <Text style={styles.loadingText}>Initializing...</Text>
        </View>
      </View>
    );
  }

  if (user) {
    if (user.role === "patient") {
      return <Redirect href="/(patient)/PatientHome" />;
    }
    return <Redirect href="/(tabs)/Home" />;
  } else {
    return <Redirect href="/(auth)/SignIn" />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#018b60",
  },
  logoContainer: {
    alignItems: "center",
  },
  appName: {
    fontSize: 34,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 0.8,
    marginTop: 20,
  },
  appTagline: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.88)",
    marginTop: 6,
    letterSpacing: 0.3,
  },
  footer: {
    position: "absolute",
    bottom: 52,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 10,
    fontWeight: "500",
  },
});

