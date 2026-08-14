import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/api/config";

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

import { fetchPatientMLPrediction, MLPredictionResult } from "@/utils/mlPrediction";

const PatientDetail = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [mlResult, setMlResult] = useState<MLPredictionResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatientData();
  }, [id]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      console.log("Fetching patient detail from Neon API for ID:", id);
      
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
        const prediction = await fetchPatientMLPrediction(formattedPatient);
        setMlResult(prediction);
      }
    } catch (error) {
      console.error("Error loading patient data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#429D7E" />
        <Text style={styles.loadingText}>Loading patient data & ML prediction...</Text>
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Patient not found</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Fields to exclude from rendering
  const excludeFields = ['id'];

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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.patientName}>{patient.name || "Patient"}</Text>
        <Text style={styles.patientId}>ID: {patient.id}</Text>
      </View>

      {/* ML Model Diagnosis Card */}
      <View style={styles.mlCard}>
        <View style={styles.mlHeaderRow}>
          <Text style={styles.mlBadgeOverline}>ONNX ML MODEL DIAGNOSIS</Text>
          {mlResult && (
            <View style={styles.confidencePill}>
              <Text style={styles.confidenceText}>{mlResult.confidencePercent}% Confidence</Text>
            </View>
          )}
        </View>

        <Text style={styles.mlDiagnosisTitle}>
          {mlResult?.finalDiagnosis || "ML Analysis Pending"}
        </Text>

        <Text style={styles.mlDescriptionText}>
          {mlResult?.task2?.description || mlResult?.task1?.description || "Based on patient's inputted clinical features."}
        </Text>

        {mlResult && (
          <View style={styles.mlFeatureRow}>
            <Text style={styles.mlTag}>Category: {mlResult.primaryCategory}</Text>
            {mlResult.task2 && <Text style={styles.mlTag}>Subtype: {mlResult.task2.label}</Text>}
          </View>
        )}
      </View>

      {/* Patient Logged Episodes Section (Synced) */}
      {Array.isArray(patient.episodes) && patient.episodes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Logged Vertigo Episodes ({patient.episodes.length})</Text>
          {patient.episodes.map((ep: any, idx: number) => (
            <View key={idx} style={styles.fieldRow}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <Text style={{ fontWeight: "700", color: "#D97706" }}>Severity: {ep.severity || 5}/10</Text>
                <Text style={{ fontSize: 12, color: "#666" }}>{ep.timestamp ? new Date(ep.timestamp).toLocaleDateString() : 'Recent'}</Text>
              </View>
              <Text style={styles.fieldValue}>
                Duration: {ep.duration || 'Unspecified'} | Notes: {ep.notes || 'No notes added'}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Patient Exercise Progress (Synced) */}
      {Array.isArray(patient.completedExercises) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rehab Exercise Progress</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Exercises Completed:</Text>
            <Text style={styles.fieldValue}>{patient.completedExercises.length}/3 Completed</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Recovery Progress Score:</Text>
            <Text style={styles.fieldValue}>{patient.recoveryProgress || 72}% Recovery</Text>
          </View>
        </View>
      )}

      {/* Patient Checkups Schedule (Synced) */}
      {Array.isArray(patient.checkups) && patient.checkups.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Checkup Appointments</Text>
          {patient.checkups.map((c: any, idx: number) => (
            <View key={idx} style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{c.date} • {c.time} ({c.status || 'Scheduled'})</Text>
              <Text style={styles.fieldValue}>{c.type || 'Consultation'} with {c.practitioner || 'Practitioner'}</Text>
            </View>
          ))}
        </View>
      )}

      {fieldGroups.map((group, groupIndex) => {
        // Check if group has any non-empty fields to display
        const hasContent = group.fields.some(
          field => patient[field] !== undefined &&
            patient[field] !== null &&
            patient[field] !== '' &&
            !excludeFields.includes(field)
        );

        if (!hasContent) return null;

        return (
          <View key={groupIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{group.title}</Text>

            {group.fields.map((field, fieldIndex) => {
              // Skip if field is empty or in exclude list
              if (
                patient[field] === undefined ||
                patient[field] === null ||
                patient[field] === '' ||
                excludeFields.includes(field)
              ) return null;

              return (
                <View key={fieldIndex} style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>{getFieldLabel(field)}:</Text>
                  <Text style={styles.fieldValue}>{formatField(field, patient[field])}</Text>
                </View>
              );
            })}
          </View>
        );
      })}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7F9",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7F9",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#D32F2F",
    marginBottom: 20,
  },
  header: {
    backgroundColor: "#429D7E",
    padding: 20,
    paddingTop: 60,
  },
  patientName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  patientId: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginTop: 5,
  },
  section: {
    backgroundColor: "white",
    margin: 10,
    borderRadius: 8,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#429D7E",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    paddingBottom: 8,
  },
  fieldRow: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333333",
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: "#555555",
    backgroundColor: "#F9F9F9",
    padding: 8,
    borderRadius: 4,
  },
  buttonContainer: {
    padding: 20,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#429D7E",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  mlCard: {
    backgroundColor: "#004D40",
    margin: 10,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  mlHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  mlBadgeOverline: {
    fontSize: 11,
    fontWeight: "700",
    color: "#80CBC4",
    letterSpacing: 0.5,
  },
  confidencePill: {
    backgroundColor: "#00796B",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: "#E0F2F1",
    fontSize: 12,
    fontWeight: "700",
  },
  mlDiagnosisTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  mlDescriptionText: {
    fontSize: 14,
    color: "#B2DFDB",
    lineHeight: 20,
    marginBottom: 12,
  },
  mlFeatureRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  mlTag: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
});

export default PatientDetail;