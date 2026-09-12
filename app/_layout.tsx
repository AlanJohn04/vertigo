import { Stack } from "expo-router";
import { AuthProvider } from "../api/AuthContext";
import { useEffect } from "react";
import { LogBox } from "react-native";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import "../global.css";

export default function RootLayout() {
  useEffect(() => {
    LogBox.ignoreLogs([
      "AsyncStorage has been extracted from react-native core",
    ]);
  }, []);

  return (
    <AuthProvider>
      <ProtectedRoute>
        <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
          {/* Public screens */}
          <Stack.Screen name="index" />
          <Stack.Screen name="disclaimer" />
          <Stack.Screen name="landing" />
          <Stack.Screen name="typeOfUser" />
          <Stack.Screen name="login" />
          <Stack.Screen name="SignIn" />
          <Stack.Screen name="SignUp" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="Terms" />
          <Stack.Screen name="terms" />

          {/* Auth screens */}
          <Stack.Screen name="(auth)/SignIn" />
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(auth)/SignUp" />
          <Stack.Screen name="(auth)/ResetPassword" />
          <Stack.Screen name="(auth)/Terms" />

          {/* Patient screens */}
          <Stack.Screen name="(patient)" />

          {/* Practitioner (tabs) screens */}
          <Stack.Screen name="(tabs)" />

          {/* Standalone screens */}
          <Stack.Screen name="AddPatient" options={{ headerShown: false }} />
          <Stack.Screen name="PatientDetail/[id]" options={{ headerShown: false }} />
        </Stack>
      </ProtectedRoute>
    </AuthProvider>
  );
}
