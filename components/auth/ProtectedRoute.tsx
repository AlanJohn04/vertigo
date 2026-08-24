import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { useAuth } from "../../api/AuthContext";
import { Colors, Typography } from "../../constants/theme";

interface ProtectedRouteProps { children: React.ReactNode; }

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inPatientGroup = segments[0] === "(patient)";
    const inTabsGroup = segments[0] === "(tabs)";
    const isPublicRoute =
      segments[0] === "landing" ||
      segments[0] === "disclaimer" ||
      segments[0] === "typeOfUser" ||
      !segments[0];

    if (!user) {
      if (!inAuthGroup && !isPublicRoute) {
        router.replace("/typeOfUser");
      }
    } else {
      if (inAuthGroup || segments[0] === "typeOfUser" || !segments[0]) {
        if (user.role === "patient") {
          router.replace("/(patient)/PatientHome");
        } else {
          router.replace("/(tabs)/Home");
        }
      } else if (user.role === "patient" && inTabsGroup) {
        router.replace("/(patient)/PatientHome");
      } else if (user.role === "practitioner" && inPatientGroup) {
        router.replace("/(tabs)/Home");
      }
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>V</Text>
        </View>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 24 }} />
        <Text style={styles.loadingText}>Loading VertEase...</Text>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { fontSize: 28, fontWeight: "900", color: Colors.white },
  loadingText: { ...Typography.callout, color: Colors.textMuted, marginTop: 12 },
});

export default ProtectedRoute;