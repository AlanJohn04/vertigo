import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../api/AuthContext";
import { API_BASE_URL } from "../../api/config";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { uploadImageToFirebase } from "../../utils/imageUpload";
import { Colors, Shadows, BorderRadius, Typography, Spacing } from "../../constants/theme";

const ProfileScreen: React.FC = () => {
  const { user, logout, updateUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [patientCount, setPatientCount] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.uid) {
        try {
          if (user.role === "practitioner") {
            const response = await fetch(`${API_BASE_URL}/patients?practitionerId=${user.uid}`);
            if (response.ok) {
              const patients = await response.json();
              setPatientCount(patients.length);
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };
    fetchUserData();
  }, [user]);

  const performLogout = async () => {
    try {
      setIsLoading(true);
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
      router.replace("/(auth)/SignIn");
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      performLogout();
    } else {
      Alert.alert("Log Out", "Are you sure you want to log out?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: performLogout,
        },
      ]);
    }
  };

  const handleResetPassword = () => {
    router.push("/(auth)/ResetPassword");
  };

  const updateProfileImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please allow access to your photo library.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && user?.uid) {
        setIsLoading(true);
        try {
          const uri = result.assets[0].uri;
          const downloadURL = await uploadImageToFirebase(uri, user.uid);
          await updateUserProfile(undefined, downloadURL);
          Alert.alert("Success", "Profile picture updated!");
        } catch (error) {
          Alert.alert("Error", "Failed to update profile picture.");
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };

  if (!user) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const goBack = () => {
    if (user?.role === "patient") {
      router.push("/(patient)/PatientHome");
    } else {
      router.push("/(tabs)/Home");
    }
  };

  const isPatient = user.role === "patient";
  const isPractitioner = user.role === "practitioner";

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {isLoading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={Colors.white} />
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="chevron-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={updateProfileImage} style={styles.avatarWrap}>
          <Image
            source={{ uri: user.photoURL || "https://via.placeholder.com/120" }}
            style={styles.avatar}
          />
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={14} color={Colors.white} />
          </View>
        </TouchableOpacity>
        <Text style={styles.userName}>{user.displayName || "User"}</Text>
        <View style={[styles.rolePill, isPatient ? styles.patientPill : styles.practitionerPill]}>
          <Ionicons
            name={isPatient ? "heart" : "medkit"}
            size={12}
            color={Colors.white}
            style={{ marginRight: 4 }}
          />
          <Text style={styles.rolePillText}>
            {isPractitioner ? "Healthcare Provider" : "Patient"}
          </Text>
        </View>
      </View>

      {/* Info Cards */}
      <View style={styles.content}>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="mail-outline" size={18} color={Colors.primary} />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
          </View>
          {isPractitioner && (
            <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: Colors.borderLight }]}>
              <View style={styles.infoIconBox}>
                <Ionicons name="people-outline" size={18} color={Colors.primary} />
              </View>
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoLabel}>Total Patients</Text>
                <Text style={styles.infoValue}>{patientCount}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionRow} onPress={handleResetPassword}>
            <View style={[styles.actionIcon, { backgroundColor: "#EEF2FF" }]}>
              <Ionicons name="key-outline" size={18} color={Colors.accent} />
            </View>
            <Text style={styles.actionText}>Reset Password</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleLogout}
            accessibilityLabel="Log Out"
            testID="profile-logout-button"
          >
            <View style={[styles.actionIcon, { backgroundColor: "#FEF2F2" }]}>
              <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
            </View>
            <Text style={[styles.actionText, { color: Colors.danger }]}>Log Out</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 56,
    paddingBottom: 80,
    paddingHorizontal: Spacing.xxl,
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...Typography.title3,
    color: Colors.white,
  },
  avatarSection: {
    alignItems: "center",
    marginTop: -50,
    marginBottom: Spacing.xxl,
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: Colors.white,
    ...Shadows.lg,
  },
  editBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.white,
  },
  userName: {
    ...Typography.title2,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    marginTop: 8,
  },
  patientPill: { backgroundColor: Colors.info },
  practitionerPill: { backgroundColor: Colors.primary },
  rolePillText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: "600",
  },
  content: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    ...Typography.headline,
    color: Colors.textPrimary,
  },
  actionsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    ...Shadows.md,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
  },
  actionText: {
    ...Typography.headline,
    color: Colors.textPrimary,
    flex: 1,
  },
  actionDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.xl,
  },
});

export default ProfileScreen;