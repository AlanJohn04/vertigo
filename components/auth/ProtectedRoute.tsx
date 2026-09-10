import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../../api/AuthContext";
import LogoAnimation from "../LogoAnimation";

interface ProtectedRouteProps { children: React.ReactNode; }

const DEV_BYPASS_AUTH = false;

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (DEV_BYPASS_AUTH) return;
    if (loading) return;
    const inAuthGroup = segments[0] === "(auth)";
    const inPatientGroup = segments[0] === "(patient)";
    const inTabsGroup = segments[0] === "(tabs)";
    const isPractitionerAllowedRoute = true;
    const isPublicRoute =
      segments[0] === "landing" ||
      segments[0] === "disclaimer" ||
      segments[0] === "typeOfUser" ||
      !segments[0];

    if (!user) {
      if (!inAuthGroup && !isPublicRoute) router.replace("/(auth)/SignIn");
    } else {
      if (inAuthGroup) {
        if (user.role === "patient") router.replace("/(patient)/PatientHome");
        else router.replace("/(tabs)/Home");
      } else if (user.role === "patient" && !inPatientGroup && !isPublicRoute) {
        router.replace("/(patient)/PatientHome");
      } else if (
        user.role === "practitioner" &&
        !inTabsGroup &&
        !isPublicRoute &&
        !isPractitionerAllowedRoute
      ) {
        router.replace("/(tabs)/Home");
      }
    }
  }, [user, loading, segments]);

  if (!DEV_BYPASS_AUTH && loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <View style={styles.brandContent}>
          <LogoAnimation size={240} rounded={false} />
          <Text style={styles.brandTitle}>VertiDx</Text>
          <Text style={styles.brandSubtitle}>AI-Powered Vestibular Diagnostics</Text>
        </View>
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="small" color="#ffffff" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }
  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#018b60",
  },
  brandContent: {
    alignItems: "center",
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 0.8,
    marginTop: 20,
  },
  brandSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.88)",
    marginTop: 6,
    letterSpacing: 0.3,
  },
  loadingWrapper: {
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

export default ProtectedRoute;