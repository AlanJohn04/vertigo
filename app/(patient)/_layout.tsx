import React from "react";
import { Stack } from "expo-router";

export default function PatientLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="PatientHome" />
      <Stack.Screen name="LogEpisode" />
      <Stack.Screen name="Exercises" />
      <Stack.Screen name="Checkups" />
    </Stack>
  );
}