import React, { useState, useEffect } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { API_BASE_URL } from "@/api/config";
import { useAuth } from "@/api/AuthContext";
import { Colors, Shadows, BorderRadius, Typography, Spacing } from "../../constants/theme";

const Events: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [patients, setPatients] = useState<{ id: string; name: string; cause: string; firestoreId?: string }[]>([]);
  const [searchText, setSearchText] = useState("");

  useEffect(() => { if (user?.uid) loadPatients(); }, [user]);

  useFocusEffect(
    React.useCallback(() => { if (user?.uid) loadPatients(); }, [user])
  );

  const loadPatients = async () => {
    try {
      const userId = user?.uid;
      if (!userId) return;
      const response = await fetch(`${API_BASE_URL}/patients?practitionerId=${userId}`);
      if (!response.ok) throw new Error("Failed to load patients");
      const patientsList = await response.json();
      if (Array.isArray(patientsList)) setPatients(patientsList);
      else setPatients([]);
    } catch (error) {
      console.error("Error loading patients:", error);
      Alert.alert("Error", "Failed to load patients");
    }
  };

  const deletePatient = async (id: string, firestoreId?: string) => {
    Alert.alert("Delete Patient", "Are you sure you want to delete this patient?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            const targetId = firestoreId || id;
            const response = await fetch(`${API_BASE_URL}/patients/${targetId}`, { method: "DELETE" });
            if (response.ok) setPatients(patients.filter((p) => p.id !== id && p.firestoreId !== id));
            else throw new Error("Failed to delete");
          } catch (error) {
            console.error("Error deleting patient:", error);
            Alert.alert("Error", "Failed to delete patient");
          }
        },
      },
    ]);
  };

  const filtered = patients.filter((p) => p.name.toLowerCase().includes(searchText.toLowerCase()));

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.patientCard}
      onPress={() => router.push(`/PatientDetail/${item.id || item.firestoreId}`)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarLetter}>{item.name?.charAt(0)?.toUpperCase() || "?"}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.patientName}>{item.name}</Text>
        <Text style={styles.patientCause}>{item.cause || "No cause specified"}</Text>
        <View style={{ flexDirection: "row", marginTop: 4 }}>
          <View style={{ backgroundColor: "#E0F2F1", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: "#00796B" }}>🤖 Tap for ML Result</Text>
          </View>
        </View>
      </View>
      <View style={styles.actionBtns}>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: "#ECFDF5" }]}
          onPress={() => router.push({ pathname: "/AddPatient", params: { patientId: item.id || item.firestoreId, isEditing: "true" } })}
        >
          <Ionicons name="create-outline" size={18} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: "#FEF2F2" }]}
          onPress={() => deletePatient(item.id, item.firestoreId)}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.danger} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Patients</Text>
        <Text style={styles.count}>{patients.length} total</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search patients..."
          placeholderTextColor={Colors.textMuted}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText("")}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="people-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>No patients found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 56, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.xxl,
    backgroundColor: Colors.white, ...Shadows.sm,
  },
  title: { ...Typography.title1, color: Colors.textPrimary },
  count: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  searchWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg, marginHorizontal: Spacing.xxl,
    marginTop: Spacing.lg, height: 48, ...Shadows.sm,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary, marginLeft: Spacing.sm },
  list: { padding: Spacing.xxl, paddingTop: Spacing.lg },
  patientCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.sm,
  },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#ECFDF5", alignItems: "center", justifyContent: "center",
    marginRight: Spacing.lg,
  },
  avatarLetter: { fontSize: 18, fontWeight: "700", color: Colors.primary },
  cardInfo: { flex: 1 },
  patientName: { ...Typography.headline, color: Colors.textPrimary, marginBottom: 2 },
  patientCause: { ...Typography.caption, color: Colors.textMuted },
  actionBtns: { flexDirection: "row" },
  iconBtn: {
    width: 36, height: 36, borderRadius: BorderRadius.sm,
    alignItems: "center", justifyContent: "center", marginLeft: 8,
  },
  emptyWrap: { alignItems: "center", paddingVertical: 60 },
  emptyText: { ...Typography.body, color: Colors.textMuted, marginTop: Spacing.md },
});

export default Events;
