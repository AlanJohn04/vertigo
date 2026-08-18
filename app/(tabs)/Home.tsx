import React, { useState, useCallback, useEffect } from "react";
import {
  StyleSheet, Text, View, ScrollView, Image, TouchableOpacity,
  TextInput, AppState, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "../../components/shared/Button";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useAuth } from "../../api/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/api/config";
import { useIsFocused } from "@react-navigation/native";
import { uploadImageToFirebase } from "@/utils/imageUpload";
import { Colors, Shadows, BorderRadius, Typography, Spacing } from "../../constants/theme";

interface Patient {
  id: string;
  name: string;
  cause: string;
}

// ── Practitioner Home Sub-Component ──
const PractitionerHome = ({ patients, onAddPatient }: { patients: Patient[]; onAddPatient: () => void }) => {
  const router = useRouter();
  return (
    <View style={styles.roleSection}>
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: "#ECFDF5" }]}>
            <Ionicons name="people" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.statNumber}>{patients.length}</Text>
          <Text style={styles.statLabel}>Patients</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: "#EFF6FF" }]}>
            <Ionicons name="calendar" size={20} color={Colors.info} />
          </View>
          <Text style={styles.statNumber}>2</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
      </View>

      {/* Add Patient CTA */}
      <TouchableOpacity style={styles.addPatientBtn} onPress={onAddPatient} activeOpacity={0.7}>
        <View style={styles.addPatientIcon}>
          <Ionicons name="add" size={24} color={Colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.addPatientTitle}>Add New Patient</Text>
          <Text style={styles.addPatientSub}>Start a new patient record</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
};

// ── Patient Home Sub-Component ──
const PatientHomeSection = () => {
  const router = useRouter();
  return (
    <View style={styles.roleSection}>
      <View style={styles.patientProgressCard}>
        <Text style={styles.progressOverline}>RECOVERY PROGRESS</Text>
        <Text style={styles.progressBigNumber}>72%</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "72%" }]} />
        </View>
        <Text style={styles.progressHint}>Keep going! You're doing great.</Text>
      </View>

      <Text style={styles.sectionHeading}>Daily Exercises</Text>
      <TouchableOpacity style={styles.exerciseRow}>
        <View style={styles.exercisePlayIcon}>
          <Ionicons name="play-circle" size={32} color={Colors.primary} />
        </View>
        <View style={styles.exerciseRowInfo}>
          <Text style={styles.exerciseRowTitle}>Habituation Training</Text>
          <Text style={styles.exerciseRowSub}>15 mins • 3 sets</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.aiChatCTA}
        onPress={() => router.push("/(tabs)/ChatBot" as any)}
      >
        <Ionicons name="sparkles" size={22} color={Colors.white} />
        <Text style={styles.aiChatText}>Consult AI Assistant</Text>
      </TouchableOpacity>
    </View>
  );
};

// ── Main HomePage ──
const HomePage: React.FC = () => {
  const router = useRouter();
  const { user, updateUserProfile } = useAuth();
  const [search, setSearch] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [lastUpdateCheck, setLastUpdateCheck] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const lastUpdate = await AsyncStorage.getItem("patientsLastUpdated");
        if (lastUpdate && lastUpdate !== lastUpdateCheck) {
          setLastUpdateCheck(lastUpdate);
          if (user?.uid) loadPatients();
        }
      } catch (error) { console.error("Error checking for updates:", error); }
    };
    checkForUpdates();
    const interval = setInterval(checkForUpdates, 3000);
    return () => clearInterval(interval);
  }, [lastUpdateCheck, user?.uid]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        const check = async () => {
          try {
            const lastUpdate = await AsyncStorage.getItem("patientsLastUpdated");
            if (lastUpdate && lastUpdate !== lastUpdateCheck) {
              setLastUpdateCheck(lastUpdate);
              if (user?.uid) loadPatients();
            }
          } catch (error) { console.error(error); }
        };
        check();
      }
    });
    return () => subscription.remove();
  }, [lastUpdateCheck, user?.uid]);

  useEffect(() => { if (user?.uid) loadPatients(); }, [user]);
  useEffect(() => { if (isFocused && user?.photoURL) setProfileImage(user.photoURL); }, [isFocused, user?.photoURL]);

  const loadPatients = async () => {
    try {
      const userId = user?.uid;
      if (!userId) return;
      const response = await fetch(`${API_BASE_URL}/patients?practitionerId=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch patients");
      const patientsList = await response.json();
      if (Array.isArray(patientsList)) {
        setPatients(patientsList);
        await AsyncStorage.setItem("patients", JSON.stringify(patientsList));
      } else setPatients([]);
    } catch (error) {
      console.error("Error loading patients:", error);
      try {
        const stored = await AsyncStorage.getItem("patients");
        if (stored) setPatients(JSON.parse(stored));
        else setPatients([]);
      } catch (e) { setPatients([]); }
    }
  };

  const pickImage = useCallback(async () => {
    if (!user?.uid) { Alert.alert("Error", "You must be logged in"); return; }
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") { Alert.alert("Permission Required"); return; }
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7,
      });
      if (!result.canceled) {
        setIsLoading(true);
        try {
          const uri = result.assets[0].uri;
          const downloadURL = await uploadImageToFirebase(uri, user.uid);
          await updateUserProfile(undefined, downloadURL);
          setProfileImage(downloadURL);
          Alert.alert("Success", "Profile picture updated!");
        } catch (e) { Alert.alert("Error", "Failed to update profile picture."); }
        finally { setIsLoading(false); }
      }
    } catch (e) { console.error(e); }
  }, [user]);

  const goToAddPatient = () => {
    if (user?.uid) {
      AsyncStorage.setItem("practitionerId", user.uid).then(() => router.push("/AddPatient"));
    } else alert("You must be logged in");
  };

  const handleSearch = () => {
    if (!search.trim()) { alert("Please enter a patient ID"); return; }
    const patient = patients.find((p) => p.id.toLowerCase().includes(search.toLowerCase()));
    if (patient) router.push(`/PatientDetail/${patient.id}`);
    else searchPatientInFirestore();
  };

  const searchPatientInFirestore = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${search}`);
      if (response.ok) router.push(`/PatientDetail/${search}`);
      else Alert.alert("Not Found", "No patient found with that ID.");
    } catch (error) { Alert.alert("Error", "Failed to search for patient"); }
  };

  const isPractitioner = user?.role === "practitioner";

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.userName}>{user?.displayName?.split(" ")[0] || "User"}</Text>
          </View>
          <TouchableOpacity onPress={pickImage} style={styles.profileBtn}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImg} />
            ) : (
              <Ionicons name="person" size={22} color={Colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Search */}
        {isPractitioner && (
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search patient by ID..."
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
        )}
      </View>

      {/* Role-specific content */}
      {isPractitioner ? (
        <PractitionerHome patients={patients} onAddPatient={goToAddPatient} />
      ) : (
        <PatientHomeSection />
      )}

      {/* Recent Patients (Practitioner) */}
      {isPractitioner && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionHeading}>Recent Patients</Text>
          {patients.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="people-outline" size={40} color={Colors.border} />
              <Text style={styles.emptyText}>No patients yet</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={goToAddPatient}>
                <Text style={styles.emptyBtnText}>Add your first patient</Text>
              </TouchableOpacity>
            </View>
          ) : (
            patients.slice(0, 5).map((patient) => (
              <TouchableOpacity
                key={patient.id}
                style={styles.patientRow}
                onPress={() => router.push(`/PatientDetail/${patient.id}`)}
              >
                <View style={styles.patientAvatar}>
                  <Text style={styles.patientInitial}>{patient.name?.charAt(0)?.toUpperCase()}</Text>
                </View>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{patient.name}</Text>
                  <Text style={styles.patientCondition}>{patient.cause || "—"}</Text>
                  <View style={{ flexDirection: "row", marginTop: 2 }}>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: Colors.primary }}>🤖 ML Model Diagnosis Available</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.white, paddingTop: 56, paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.xxl, borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    ...Shadows.md,
  },
  headerTop: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: Spacing.xl,
  },
  greeting: { ...Typography.callout, color: Colors.textMuted },
  userName: { ...Typography.title1, color: Colors.textPrimary },
  profileBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "#ECFDF5", alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
  profileImg: { width: 48, height: 48, borderRadius: 24 },
  searchBar: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.surfaceElevated, borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg, height: 46,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary, marginLeft: Spacing.sm },
  roleSection: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xxl },
  statsRow: { flexDirection: "row", marginBottom: Spacing.xl },
  statCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, alignItems: "center", ...Shadows.sm, marginRight: Spacing.md,
  },
  statIcon: {
    width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  statNumber: { ...Typography.title1, color: Colors.textPrimary },
  statLabel: { ...Typography.caption, color: Colors.textMuted },
  addPatientBtn: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, ...Shadows.sm,
  },
  addPatientIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center",
    marginRight: Spacing.lg,
  },
  addPatientTitle: { ...Typography.headline, color: Colors.textPrimary },
  addPatientSub: { ...Typography.caption, color: Colors.textMuted },
  // Patient section
  patientProgressCard: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl, marginBottom: Spacing.xxl, ...Shadows.glow(Colors.primary),
  },
  progressOverline: { ...Typography.overline, color: "rgba(255,255,255,0.7)" },
  progressBigNumber: { fontSize: 44, fontWeight: "900", color: Colors.white, marginVertical: Spacing.sm },
  progressTrack: { height: 6, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 3, marginBottom: Spacing.md },
  progressFill: { height: 6, backgroundColor: Colors.white, borderRadius: 3 },
  progressHint: { ...Typography.callout, color: "rgba(255,255,255,0.8)" },
  sectionHeading: { ...Typography.title3, color: Colors.textPrimary, marginBottom: Spacing.lg },
  exerciseRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadows.sm,
  },
  exercisePlayIcon: { marginRight: Spacing.lg },
  exerciseRowInfo: { flex: 1 },
  exerciseRowTitle: { ...Typography.headline, color: Colors.textPrimary },
  exerciseRowSub: { ...Typography.caption, color: Colors.textMuted },
  aiChatCTA: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.accent, borderRadius: BorderRadius.xl,
    paddingVertical: 18, ...Shadows.glow(Colors.accent),
  },
  aiChatText: { ...Typography.headline, color: Colors.white, marginLeft: Spacing.md },
  recentSection: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xl, paddingBottom: 40 },
  emptyCard: {
    alignItems: "center", paddingVertical: 40,
    backgroundColor: Colors.white, borderRadius: BorderRadius.xxl,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  emptyText: { ...Typography.body, color: Colors.textMuted, marginTop: Spacing.md, marginBottom: Spacing.xl },
  emptyBtn: { backgroundColor: "#ECFDF5", paddingHorizontal: 20, paddingVertical: 10, borderRadius: BorderRadius.md },
  emptyBtnText: { ...Typography.callout, color: Colors.primary, fontWeight: "600" },
  patientRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.sm,
  },
  patientAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#ECFDF5", alignItems: "center", justifyContent: "center", marginRight: Spacing.lg,
  },
  patientInitial: { fontSize: 16, fontWeight: "700", color: Colors.primary },
  patientInfo: { flex: 1 },
  patientName: { ...Typography.headline, color: Colors.textPrimary, marginBottom: 2 },
  patientCondition: { ...Typography.caption, color: Colors.textMuted },
});

export default HomePage;
