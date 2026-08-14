import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../api/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Typography } from "../constants/theme";

export default function Index() {
  const { user, loading } = useAuth();
  const [disclaimerAccepted, setDisclaimerAccepted] = useState<boolean | null>(null);
  const [checkingStorage, setCheckingStorage] = useState(true);

  useEffect(() => {
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
  }, []);

  if (loading || checkingStorage) {
    return (
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>V</Text>
          </View>
          <Text style={styles.appName}>VertEase</Text>
        </View>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 32 }} />
        <Text style={styles.loadingText}>Getting things ready...</Text>
      </View>
    );
  }

  if (user) {
    if (user.role === "patient") {
      return <Redirect href="/(patient)/PatientHome" />;
    }
    return <Redirect href="/(tabs)/Home" />;
  } else if (disclaimerAccepted) {
    return <Redirect href="/landing" />;
  } else {
    return <Redirect href="/disclaimer" />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  logoContainer: {
    alignItems: "center",
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 36,
    fontWeight: "900",
    color: Colors.white,
  },
  appName: {
    ...Typography.title1,
    color: Colors.textPrimary,
  },
  loadingText: {
    ...Typography.callout,
    color: Colors.textMuted,
    marginTop: 12,
  },
});
