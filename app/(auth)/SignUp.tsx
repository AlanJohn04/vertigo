import React, { useState, useCallback } from "react";
import {
  StyleSheet, Text, View, TextInput, Pressable, Image,
  TouchableOpacity, Alert, StatusBar, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Checkbox } from "react-native-paper";
import Button from "../../components/shared/Button";
import { useAuth, UserRole } from "../../api/AuthContext";
import { uploadImageToFirebase } from "../../utils/imageUpload";
import { getAuthInstance } from "../../api/firebaseConfig";
import { Colors, Shadows, BorderRadius, Typography, Spacing } from "../../constants/theme";

export default function SignUp() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole>("patient");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const { signUp, updateUserProfile } = useAuth();

  const validateForm = () => {
    if (!fullName.trim()) { setError("Please enter your full name"); return false; }
    if (!email.trim()) { setError("Please enter your email address"); return false; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError("Please enter a valid email address"); return false; }
    if (!password) { setError("Please enter a password"); return false; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return false; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return false; }
    if (!agreedToTerms) { setError("Please accept the terms and conditions"); return false; }
    setError("");
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const userCredential = await signUp(email, password, fullName, userRole, "");
      let imageUrl = "";
      const auth = getAuthInstance();
      const currentUser = auth.currentUser;
      if (profileImage && currentUser?.uid) {
        imageUrl = await uploadImageToFirebase(profileImage, currentUser.uid);
        await updateUserProfile(undefined, imageUrl);
      }
      Alert.alert("Account Created", `Your ${userRole} account has been created successfully!`, [
        { 
          text: "OK", 
          onPress: () => router.replace(userRole === "patient" ? "/(patient)/PatientHome" : "/(tabs)/Home") 
        },
      ]);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
        setImageFile(result.assets[0]);
      }
    } catch (err) {
      console.error("Error picking image:", err);
    }
  };

  const isPatient = userRole === "patient";

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <StatusBar translucent={false} backgroundColor={Colors.background} barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>SIGN UP</Text>
        </View>

        {/* Role Selection */}
        <View style={styles.roleSelectionContainer}>
          <Text style={styles.roleText}>Are you a medical practitioner</Text>
          <TouchableOpacity onPress={() => setUserRole("practitioner")} style={styles.radioWrapper}>
            <Ionicons name={userRole === "practitioner" ? "radio-button-on" : "radio-button-off"} size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.roleText}>. Or a Patient</Text>
          <TouchableOpacity onPress={() => setUserRole("patient")} style={styles.radioWrapper}>
            <Ionicons name={userRole === "patient" ? "radio-button-on" : "radio-button-off"} size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Avatar Picker */}
        <TouchableOpacity style={styles.avatarPicker} onPress={pickImage}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="camera" size={24} color={Colors.textMuted} />
              <Text style={styles.avatarText}>Photo</Text>
            </View>
          )}
          <View style={styles.avatarEditBadge}>
            <Ionicons name="add" size={16} color={Colors.white} />
          </View>
        </TouchableOpacity>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Form */}
        <View style={styles.form}>
          {[
            { label: "Enter username", icon: "person-outline", value: fullName, setter: setFullName, placeholder: "Username", kb: "default" as const },
            { label: "Enter your email", icon: "mail-outline", value: email, setter: setEmail, placeholder: "your@email.com", kb: "email-address" as const },
            { label: "Verify email – please enter OTP:", icon: "chatbubble-ellipses-outline", value: otp, setter: setOtp, placeholder: "123456", kb: "numeric" as const },
          ].map((field, i) => (
            <View key={i} style={styles.inputGroup}>
              <Text style={styles.label}>{field.label}</Text>
              <View style={styles.inputWrap}>
                <Ionicons name={field.icon as any} size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={field.placeholder}
                  placeholderTextColor={Colors.textMuted}
                  value={field.value}
                  onChangeText={field.setter}
                  keyboardType={field.kb}
                  autoCapitalize={field.kb === "email-address" ? "none" : "words"}
                  editable={!isLoading}
                />
              </View>
            </View>
          ))}

          {[
            { label: "Create password", value: password, setter: setPassword, placeholder: "Min 6 characters" },
            { label: "Confirm Password", value: confirmPassword, setter: setConfirmPassword, placeholder: "Re-enter password" },
          ].map((field, i) => (
            <View key={i} style={styles.inputGroup}>
              <Text style={styles.label}>{field.label}</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="key-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={field.placeholder}
                  placeholderTextColor={Colors.textMuted}
                  value={field.value}
                  onChangeText={field.setter}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
              </View>
            </View>
          ))}

          {!isPatient && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { marginBottom: Spacing.sm }]}>If you are a Medical Practitioner</Text>
              <Text style={styles.label}>Please enter your specialty</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="medkit-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Neurologist"
                  placeholderTextColor={Colors.textMuted}
                  value={specialty}
                  onChangeText={setSpecialty}
                  editable={!isLoading}
                />
              </View>
            </View>
          )}
        </View>

        {/* Terms Checkbox */}
        <View style={styles.checkboxContainer}>
          <Checkbox
            status={agreedToTerms ? "checked" : "unchecked"}
            onPress={handleToggleTerms}
            color="#15803d"
          />
          <Text style={styles.termsText}>
            Please accept the{" "}
            <Text
              style={styles.termsLink}
              onPress={() => router.push("/(auth)/Terms")}
            >
              terms and conditions
            </Text>
          </Text>
        </View>

        {/* CTA */}
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingLabel}>Creating your account...</Text>
          </View>
        ) : (
          <View style={styles.buttonWrap}>
            <Button text="Submit information" onPress={handleSignUp} disabled={isLoading} />
          </View>
        )}

        {/* Footer */}
        <Pressable onPress={() => router.push("/(auth)/SignIn")} disabled={isLoading} style={{ marginTop: 8, marginBottom: 30, alignItems: "center" }}>
          <Text style={styles.footerText}>
            Already have an account? <Text style={styles.footerLink}>Sign In</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: Spacing.xxl,
    paddingTop: 50,
    backgroundColor: Colors.background,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.white, alignItems: "center", justifyContent: "center",
    ...Shadows.sm, marginBottom: Spacing.xl,
  },
  header: { alignItems: "center", marginBottom: Spacing.xxl },
  title: { ...Typography.title1, color: Colors.textPrimary, marginBottom: Spacing.xs },
  subtitle: { ...Typography.body, color: Colors.textMuted, marginBottom: Spacing.md },
  roleBadge: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: BorderRadius.pill,
  },
  patientBadge: { backgroundColor: Colors.info },
  practitionerBadge: { backgroundColor: Colors.primary },
  roleBadgeText: { ...Typography.caption, color: Colors.white, fontWeight: "700", letterSpacing: 1, marginLeft: 4 },
  avatarPicker: { alignSelf: "center", marginBottom: Spacing.xxl, position: "relative" },
  avatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: Colors.primary },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.surfaceElevated, borderWidth: 2, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  avatarEditBadge: {
    position: "absolute", bottom: 2, right: 2,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: Colors.white,
  },
  errorBox: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FEF2F2", borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.xl,
    borderWidth: 1, borderColor: "#FECACA",
  },
  errorText: { ...Typography.callout, color: Colors.danger, marginLeft: Spacing.sm, flex: 1 },
  form: { marginBottom: Spacing.xl },
  inputGroup: { marginBottom: Spacing.lg },
  label: { ...Typography.callout, color: Colors.textSecondary, marginBottom: 6, marginLeft: 4 },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.lg, height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: Colors.textPrimary },
  footerText: { ...Typography.callout, color: Colors.textMuted, textAlign: "center", marginBottom: Spacing.xl },
  footerLink: { color: Colors.primary, fontWeight: "700" },
  loadingWrap: { alignItems: "center", marginVertical: Spacing.xxl },
  loadingLabel: { ...Typography.callout, color: Colors.textMuted, marginTop: Spacing.sm },
  buttonWrap: { paddingBottom: 40 },
  roleSelectionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xxl,
    flexWrap: "wrap",
  },
  roleText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  radioWrapper: {
    paddingHorizontal: 5,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  termsText: {
    ...Typography.callout,
    color: "#1F2937",
    marginLeft: Spacing.sm,
  },
  termsLink: {
    color: "#15803d",
    fontWeight: "700",
    fontStyle: "italic",
    textDecorationLine: "underline",
  },
});
