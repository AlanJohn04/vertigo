import React from "react";
import { StyleSheet, Platform } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Shadows } from "../../constants/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 0,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          paddingTop: 8,
          ...Shadows.md,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="Events"
        options={{
          tabBarLabel: "Patients",
          tabBarIcon: ({ color }) => (
            <Ionicons name="people" color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="ChatBot"
        options={{
          tabBarLabel: "AI Chat",
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubble-ellipses" color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="Diagnose"
        options={{
          tabBarLabel: "Diagnose",
          tabBarIcon: ({ color }) => (
            <Ionicons name="medkit" color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="Exercises"
        options={{
          tabBarLabel: "VRT Exercises",
          tabBarIcon: ({ color }) => (
            <Ionicons name="fitness" color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" color={color} size={22} />
          ),
        }}
      />
    </Tabs>
  );
}
