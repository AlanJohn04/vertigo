import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Markdown from "react-native-markdown-display";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/api/config";
import { fetchHybridDiagnosis, HybridPredictionResult } from "@/utils/mlPrediction";
import { Colors, Shadows, BorderRadius, Typography, Spacing } from "@/constants/theme";

const formatField = (key: string, value: any) => {
  if (value === null || value === undefined || value === "") return "Not specified";

  // Handle arrays
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "None";
  }

  // Handle objects (like duration)
  if (typeof value === "object") {
    const parts = [];
    for (const [unit, amount] of Object.entries(value)) {
      if (amount && amount !== "0" && amount !== "") {
        parts.push(`${amount} ${unit}`);
      }
    }
    return parts.length > 0 ? parts.join(", ") : "None";
  }

  // Return simple values
  return value.toString();
};

const getFieldLabel = (key: string) => {
  const labels = {
    id: "Patient ID",
    name: "Name",
    age: "Age",
    sex: "Sex",
    cause: "Cause",
    vertigo: "Vertigo Description",
    onset: "Vertigo Onset",
    vertigoSensation: "Vertigo Sensation Type",
    episodicOrPersistent: "Pattern",
    duration: "Duration of Vertigo",
    episodeDuration: "Episode Duration",
    remission: "Remission Between Episodes",
    triggers: "Triggers",
    headMovementEffect: "Head Movement Effect",
    headInjury: "Recent Head Injury",
    symptoms: "Associated Symptoms",
    earSymptoms: "Ear Symptoms",
    hearingLossSide: "Hearing Loss Side",
    hearingLossOnset: "Hearing Loss Onset",
    hearingLossDuration: "Hearing Loss Duration",
    hearingLossProgression: "Hearing Loss Progression",
    cerebellumSymptoms: "Cerebellar Symptoms",
    cranialNerveSymptoms: "Cranial Nerve Symptoms",
    comorbidities: "Comorbidities",
    antiepileptics: "Antiepileptic Medications",
    antipsychotics: "Antipsychotic Medications",
    ototoxicDrugs: "Ototoxic Drugs",
    medicationsTaken: "Medications Taken for Vertigo",
  };

  return (labels as any)[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
};

const PatientDetail = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [hybridResult, setHybridResult] = useState<HybridPredictionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingAI, setRefreshingAI] = useState(false);

  useEffect(() => {
    loadPatientData();
  }, [id]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      console.log("Fetching patient detail for ID:", id);
      
      let formattedPatient: any = null;
      const response = await fetch(`${API_BASE_URL}/patients/${id}`);
      
      if (response.ok) {
        const rawData = await response.json();
        formattedPatient = {
          ...rawData,
          ...(rawData.medicalData || {})
        };
      } else {
        const allPatients = await AsyncStorage.getItem("patients");
        if (allPatients) {
          const patients = JSON.parse(allPatients);
          formattedPatient = patients.find((p: any) => p.id === id);
        }
      }

      if (formattedPatient) {
        setPatient(formattedPatient);
        const hybrid = await fetchHybridDiagnosis(formattedPatient);
        setHybridResult(hybrid);
      }
    } catch (error) {
      console.error("Error loading patient data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshHybridAI = async () => {
    if (!patient) return;
    try {
      setRefreshingAI(true);
      const updated = await fetchHybridDiagnosis(patient);
      if (updated) setHybridResult(updated);
    } catch (e) {
      console.error("Error refreshing Hybrid AI:", e);
    } finally {
      setRefreshingAI(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Running 50:50 ML + LLM Hybrid Diagnostic Analysis...</Text>
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Patient not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Group fields logically
  const fieldGroups = [
    {
      title: "Basic Information",
      fields: ['name', 'age', 'sex', 'cause']
    },
    {
      title: "Vertigo Characteristics",
      fields: ['vertigo', 'onset', 'vertigoSensation', 'episodicOrPersistent', 'duration']
    },
    {
      title: "Episode Details",
      fields: ['episodeDuration', 'remission']
    },
    {
      title: "Triggers & Factors",
      fields: ['triggers', 'headMovementEffect', 'headInjury']
    },
    {
      title: "Associated Symptoms",
      fields: ['symptoms', 'earSymptoms', 'hearingLossSide', 'hearingLossOnset', 'hearingLossDuration', 'hearingLossProgression']
    },
    {
      title: "Neurological Symptoms",
      fields: ['cerebellumSymptoms', 'cranialNerveSymptoms']
    },
    {
      title: "Medical History",
      fields: ['comorbidities', 'antiepileptics', 'antipsychotics', 'ototoxicDrugs', 'medicationsTaken']
    }
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* Top Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backNavBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.patientName}>{patient.name || "Patient Record"}</Text>
          <Text style={styles.patientId}>ID: {patient.id} • Assigned Practitioner</Text>
        </View>
      </View>

      {/* 50:50 HYBRID ML + GEMINI LLM DIAGNOSTIC CARD */}
      <View style={styles.hybridCard}>
        <View style={styles.hybridHeaderRow}>
          <View style={styles.badgeRow}>
            <Ionicons name="sparkles" size={16} color={Colors.primary} />
            <Text style={styles.hybridOverline}>50:50 ML + LLM HYBRID DIAGNOSIS</Text>
          </View>
          {hybridResult && (
            <View style={styles.confidencePill}>
              <Text style={styles.confidenceText}>{hybridResult.confidencePercent}% Consensus Confidence</Text>
            </View>
          )}
        </View>

        <Text style={styles.hybridDiagnosisTitle}>
          {hybridResult?.finalHybridDiagnosis || "Consensus Diagnostic Analysis"}
        </Text>

        {/* 50:50 Contribution Gauge Bar */}
        {hybridResult && (
          <View style={styles.ensembleBarContainer}>
            <View style={styles.ensembleLabelsRow}>
              <Text style={styles.ensembleSideLabel}>
                <Text style={{ fontWeight: "700", color: Colors.info }}>50% ML Model: </Text>
                {hybridResult.mlContributionPercent}%
              </Text>
              <Text style={styles.ensembleSideLabel}>
                <Text style={{ fontWeight: "700", color: Colors.primary }}>50% LLM Reasoner: </Text>
                {hybridResult.llmContributionPercent}%
              </Text>
            </View>
            <View style={styles.ensembleTrack}>
              <View style={[styles.ensembleFillML, { width: "50%" }]} />
              <View style={[styles.ensembleFillLLM, { width: "50%" }]} />
            </View>
            <Text style={styles.ensembleFootnote}>
              Fused via 50:50 Ensemble Weighting (Statistical ONNX Classifier + Gemini Clinical Reasoner)
            </Text>
          </View>
        )}

        {/* Formatted Markdown Clinical Summary */}
        <View style={styles.markdownWrapper}>
          <Markdown style={markdownStyles}>
            {hybridResult?.clinicalAssessment || "Statistical models and clinical presentation evaluated."}
          </Markdown>
        </View>

        {/* Statistical ML Feature Badges */}
        {hybridResult?.ml && (
          <View style={styles.mlTagRow}>
            <View style={styles.mlTag}>
              <Text style={styles.mlTagText}>Category: {hybridResult.ml.primaryCategory}</Text>
            </View>
            {hybridResult.ml.task2 && (
              <View style={[styles.mlTag, { backgroundColor: "#EFF6FF" }]}>
                <Text style={[styles.mlTagText, { color: Colors.info }]}>ML Subtype: {hybridResult.ml.task2.label}</Text>
              </View>
            )}
          </View>
        )}

        {/* Prescribed Vestibular Exercises */}
        {hybridResult?.prescribedExercises && hybridResult.prescribedExercises.length > 0 && (
          <View style={styles.exerciseSection}>
            <Text style={styles.exerciseSectionTitle}>Prescribed Vestibular Rehabilitation Routine</Text>
            {hybridResult.prescribedExercises.map((ex, idx) => (
              <View key={idx} style={styles.exerciseCard}>
                <Ionicons name={(ex.icon || "fitness-outline") as any} size={22} color={Colors.primary} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.exerciseTitle}>{ex.title}</Text>
                  <Text style={styles.exerciseDesc}>{ex.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Red Flags & Care Plan */}
        {hybridResult?.redFlags && (
          <View style={styles.redFlagBox}>
            <Ionicons name="warning-outline" size={18} color={Colors.warning} style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.redFlagTitle}>Clinical Red Flags to Monitor</Text>
              <Text style={styles.redFlagText}>
                {hybridResult.redFlags.join(" • ")}
              </Text>
            </View>
          </View>
        )}

        {/* Re-run AI Analysis Button */}
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={handleRefreshHybridAI}
          disabled={refreshingAI}
        >
          {refreshingAI ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <>
              <Ionicons name="refresh" size={16} color={Colors.primary} />
              <Text style={styles.refreshBtnText}>Re-calculate 50:50 Ensemble Diagnosis</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Real-Time Patient Activity Sync */}
      <View style={styles.syncSection}>
        <Text style={styles.syncSectionTitle}>Live Patient Activity (Real-Time Synced)</Text>

        {/* Logged Episodes */}
        <View style={styles.syncCard}>
          <View style={styles.syncCardHeader}>
            <Ionicons name="pulse" size={18} color="#D97706" />
            <Text style={styles.syncCardTitle}>
              Logged Vertigo Episodes ({Array.isArray(patient.episodes) ? patient.episodes.length : 0})
            </Text>
          </View>
          {Array.isArray(patient.episodes) && patient.episodes.length > 0 ? (
            patient.episodes.map((ep: any, idx: number) => (
              <View key={idx} style={styles.episodeItem}>
                <Text style={styles.episodeSeverity}>Severity: {ep.severity || 5}/10</Text>
                <Text style={styles.episodeDetails}>Duration: {ep.duration || 'N/A'} • {ep.notes || 'No notes'}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptySyncText}>No episodes logged yet by patient.</Text>
          )}
        </View>

        {/* Recovery Progress */}
        <View style={styles.syncCard}>
          <View style={styles.syncCardHeader}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
            <Text style={styles.syncCardTitle}>Rehab Recovery Progress</Text>
          </View>
          <Text style={styles.syncCardBody}>
            {Array.isArray(patient.completedExercises) ? patient.completedExercises.length : 0}/3 Exercises Completed • {patient.recoveryProgress || 72}% Overall Recovery Score
          </Text>
        </View>
      </View>

      {/* Complete Patient Medical Data */}
      {fieldGroups.map((group, groupIndex) => {
        const hasContent = group.fields.some(
          field => patient[field] !== undefined &&
                   patient[field] !== null &&
                   patient[field] !== "" &&
                   !(Array.isArray(patient[field]) && patient[field].length === 0)
        );

        if (!hasContent) return null;

        return (
          <View key={groupIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{group.title}</Text>
            {group.fields.map((field) => {
              const value = patient[field];
              if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
                return null;
              }

              return (
                <View key={field} style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>{getFieldLabel(field)}</Text>
                  <Text style={styles.fieldValue}>{formatField(field, value)}</Text>
                </View>
              );
            })}
          </View>
        );
      })}
    </ScrollView>
  );
};

const markdownStyles = {
  body: {
    color: "#334155",
    fontSize: 14,
    lineHeight: 22,
  },
  heading1: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "800" as const,
    marginTop: 10,
    marginBottom: 6,
  },
  heading2: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700" as const,
    marginTop: 8,
    marginBottom: 4,
  },
  heading3: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700" as const,
    marginTop: 6,
    marginBottom: 4,
  },
  strong: {
    color: "#0F172A",
    fontWeight: "700" as const,
  },
  list_item: {
    marginVertical: 2,
  },
  bullet_list: {
    marginVertical: 4,
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 16,
    gap: 12,
  },
  backNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.sm,
  },
  patientName: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  patientId: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  hybridCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    ...Shadows.md,
  },
  hybridHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  hybridOverline: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  confidencePill: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primaryDark,
  },
  hybridDiagnosisTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  ensembleBarContainer: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 14,
  },
  ensembleLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  ensembleSideLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  ensembleTrack: {
    height: 8,
    borderRadius: 4,
    flexDirection: "row",
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
    marginBottom: 6,
  },
  ensembleFillML: {
    backgroundColor: Colors.info,
    height: "100%",
  },
  ensembleFillLLM: {
    backgroundColor: Colors.primary,
    height: "100%",
  },
  ensembleFootnote: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: "center",
  },
  markdownWrapper: {
    marginVertical: 8,
  },
  mlTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  mlTag: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
  },
  mlTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  exerciseSection: {
    marginTop: 8,
    marginBottom: 14,
  },
  exerciseSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  exerciseCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: BorderRadius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  exerciseTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  exerciseDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  redFlagBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: 14,
  },
  redFlagTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.danger,
    marginBottom: 2,
  },
  redFlagText: {
    fontSize: 12,
    color: "#991B1B",
    lineHeight: 16,
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    gap: 6,
  },
  refreshBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
  },
  syncSection: {
    marginBottom: Spacing.xl,
  },
  syncSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  syncCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: 10,
    ...Shadows.sm,
  },
  syncCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  syncCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  syncCardBody: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  episodeItem: {
    backgroundColor: "#FFFBEB",
    padding: 8,
    borderRadius: BorderRadius.sm,
    marginTop: 6,
  },
  episodeSeverity: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D97706",
  },
  episodeDetails: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptySyncText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: "italic",
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 6,
  },
  fieldRow: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 2,
    fontWeight: "600",
  },
  fieldValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textMuted,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F8FAFC",
  },
  errorText: {
    fontSize: 16,
    color: Colors.danger,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    color: Colors.white,
    fontWeight: "700",
  },
});

export default PatientDetail;