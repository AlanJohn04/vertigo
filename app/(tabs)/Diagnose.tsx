import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Switch, SegmentedButtons } from "react-native-paper";
import { API_BASE_URL } from "@/api/config";
import { Colors, Shadows } from "../../constants/theme";

export default function DiagnoseScreen() {
  const [loading, setLoading] = useState(false);
  const [task, setTask] = useState<"1" | "2">("1");
  const [featureSet, setFeatureSet] = useState<"all" | "sym" | "exam">("all");

  const [result, setResult] = useState<{
    diagnosis: number;
    confidence: number;
    label: string;
    description: string;
  } | null>(null);

  // Form state holding all possible features across Task 1 & Task 2
  const [formData, setFormData] = useState({
    vertigo: true,
    dizziness: false,
    paroxysmal: true,
    positional: true,
    chronic: false,
    duration: "15", // minutes
    hearingLoss: false,
    tinnitus: false,
    auralFullness: false,
    headache: false,
    photophobia: false,
    motionSickness: false,
    familyHistory: false,
    acuteHearingLoss: false,
    nystagmus: false,
    rollTest: false,
    dixHallpike: true,
    labyrinthineReaction: "5.0",
    unilateralWeakness: "0.0",
    pta: "25",
    age: "45",
    gender: false, // false = Male(0), true = Female(1)
  });

  const toggleSwitch = (field: keyof typeof formData) => {
    setFormData((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Quick Preset Handlers for Easy Testing
  const applyPreset = (presetType: "bppv" | "meniere" | "migraine" | "non_peripheral") => {
    setResult(null);
    if (presetType === "bppv") {
      setTask("2");
      setFeatureSet("all");
      setFormData({
        vertigo: true,
        dizziness: false,
        paroxysmal: true,
        positional: true,
        chronic: false,
        duration: "1", // short episodes
        hearingLoss: false,
        tinnitus: false,
        auralFullness: false,
        headache: false,
        photophobia: false,
        motionSickness: false,
        familyHistory: false,
        acuteHearingLoss: false,
        nystagmus: false,
        rollTest: false,
        dixHallpike: true, // Key sign for BPPV
        labyrinthineReaction: "0.0",
        unilateralWeakness: "0.0",
        pta: "15",
        age: "58",
        gender: true,
      });
    } else if (presetType === "meniere") {
      setTask("2");
      setFeatureSet("all");
      setFormData({
        vertigo: true,
        dizziness: true,
        paroxysmal: true,
        positional: false,
        chronic: false,
        duration: "180", // hours
        hearingLoss: true, // Key sign
        tinnitus: true, // Key sign
        auralFullness: true, // Key sign
        headache: false,
        photophobia: false,
        motionSickness: false,
        familyHistory: false,
        acuteHearingLoss: true,
        nystagmus: true,
        rollTest: false,
        dixHallpike: false,
        labyrinthineReaction: "12.5",
        unilateralWeakness: "22.0",
        pta: "55",
        age: "52",
        gender: false,
      });
    } else if (presetType === "migraine") {
      setTask("2");
      setFeatureSet("all");
      setFormData({
        vertigo: true,
        dizziness: true,
        paroxysmal: true,
        positional: false,
        chronic: true,
        duration: "1440", // 24 hrs
        hearingLoss: false,
        tinnitus: false,
        auralFullness: false,
        headache: true, // Key sign
        photophobia: true, // Key sign
        motionSickness: true,
        familyHistory: true,
        acuteHearingLoss: false,
        nystagmus: false,
        rollTest: false,
        dixHallpike: false,
        labyrinthineReaction: "2.0",
        unilateralWeakness: "0.0",
        pta: "18",
        age: "36",
        gender: true,
      });
    } else if (presetType === "non_peripheral") {
      setTask("1");
      setFeatureSet("all");
      setFormData({
        vertigo: false,
        dizziness: true,
        paroxysmal: false,
        positional: false,
        chronic: true,
        duration: "10000",
        hearingLoss: false,
        tinnitus: false,
        auralFullness: false,
        headache: false,
        photophobia: false,
        motionSickness: false,
        familyHistory: false,
        acuteHearingLoss: false,
        nystagmus: false,
        rollTest: false,
        dixHallpike: false,
        labyrinthineReaction: "0.0",
        unilateralWeakness: "0.0",
        pta: "20",
        age: "65",
        gender: false,
      });
    }
  };

  const buildFeaturesArray = (): number[] => {
    const v = formData;
    if (task === "1") {
      if (featureSet === "all") {
        // 12 features: Vertigo, Dizziness, Paroxysmal, Positional, Chronic, Duration, HearingLoss, Nystagmus, RollTest, DixHallpike, Age, Gender
        return [
          v.vertigo ? 1 : 0,
          v.dizziness ? 1 : 0,
          v.paroxysmal ? 1 : 0,
          v.positional ? 1 : 0,
          v.chronic ? 1 : 0,
          Number(v.duration) || 0,
          v.hearingLoss ? 1 : 0,
          v.nystagmus ? 1 : 0,
          v.rollTest ? 1 : 0,
          v.dixHallpike ? 1 : 0,
          Number(v.age) || 0,
          v.gender ? 1 : 0,
        ];
      } else if (featureSet === "sym") {
        // 9 features
        return [
          v.vertigo ? 1 : 0,
          v.dizziness ? 1 : 0,
          v.paroxysmal ? 1 : 0,
          v.positional ? 1 : 0,
          v.chronic ? 1 : 0,
          Number(v.duration) || 0,
          v.hearingLoss ? 1 : 0,
          Number(v.age) || 0,
          v.gender ? 1 : 0,
        ];
      } else {
        // 5 features (exam only)
        return [
          v.nystagmus ? 1 : 0,
          v.rollTest ? 1 : 0,
          v.dixHallpike ? 1 : 0,
          Number(v.age) || 0,
          v.gender ? 1 : 0,
        ];
      }
    } else {
      // Task 2
      if (featureSet === "all") {
        // 19 features: Vertigo, Paroxysmal, Chronic, Dizziness, Headache, Photophobia, Duration, MotionSickness, FamilyHistory, HearingLoss, Tinnitus, AuralFullness, Nystagmus, LabyrinthineReaction, UnilateralWeakness, Age, Gender, PTA, AcuteHearingLoss
        return [
          v.vertigo ? 1 : 0,
          v.paroxysmal ? 1 : 0,
          v.chronic ? 1 : 0,
          v.dizziness ? 1 : 0,
          v.headache ? 1 : 0,
          v.photophobia ? 1 : 0,
          Number(v.duration) || 0,
          v.motionSickness ? 1 : 0,
          v.familyHistory ? 1 : 0,
          v.hearingLoss ? 1 : 0,
          v.tinnitus ? 1 : 0,
          v.auralFullness ? 1 : 0,
          v.nystagmus ? 1 : 0,
          Number(v.labyrinthineReaction) || 0,
          Number(v.unilateralWeakness) || 0,
          Number(v.age) || 0,
          v.gender ? 1 : 0,
          Number(v.pta) || 0,
          v.acuteHearingLoss ? 1 : 0,
        ];
      } else if (featureSet === "sym") {
        // 15 features
        return [
          v.vertigo ? 1 : 0,
          v.paroxysmal ? 1 : 0,
          v.chronic ? 1 : 0,
          v.dizziness ? 1 : 0,
          v.headache ? 1 : 0,
          v.photophobia ? 1 : 0,
          Number(v.duration) || 0,
          v.motionSickness ? 1 : 0,
          v.familyHistory ? 1 : 0,
          v.hearingLoss ? 1 : 0,
          v.tinnitus ? 1 : 0,
          v.auralFullness ? 1 : 0,
          Number(v.age) || 0,
          v.gender ? 1 : 0,
          v.acuteHearingLoss ? 1 : 0,
        ];
      } else {
        // 6 features (exam only)
        return [
          v.nystagmus ? 1 : 0,
          Number(v.labyrinthineReaction) || 0,
          Number(v.unilateralWeakness) || 0,
          Number(v.age) || 0,
          v.gender ? 1 : 0,
          Number(v.pta) || 0,
        ];
      }
    }
  };

  const handlePredict = async () => {
    try {
      setLoading(true);
      setResult(null);

      const features = buildFeaturesArray();

      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: Number(task),
          featureSet: featureSet,
          features: features,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get prediction");
      }

      const data = await response.json();
      let label = "";
      let description = "";

      if (task === "1") {
        if (data.diagnosis === 1) {
          label = "Peripheral Vertigo Detected";
          description = "Symptoms & signs indicate a peripheral vestibular disorder. Proceed to Task 2 for subtype identification.";
        } else {
          label = "Non-Peripheral Vertigo";
          description = "Symptoms suggest a central neurological cause or general dizziness (non-peripheral).";
        }
      } else {
        if (data.diagnosis === 0) {
          label = "Meniere's Disease (MD)";
          description = "Characterized by episodic vertigo, fluctuating hearing loss, tinnitus, and aural fullness.";
        } else if (data.diagnosis === 1) {
          label = "Vestibular Migraine (VM)";
          description = "Associated with headache, photophobia, motion sickness, and migraine history.";
        } else {
          label = "Benign Paroxysmal Positional Vertigo (BPPV)";
          description = "Brief paroxysmal vertigo triggered by head position changes, positive Dix-Hallpike/Roll test.";
        }
      }

      setResult({
        diagnosis: data.diagnosis,
        confidence: data.confidence,
        label,
        description,
      });
    } catch (error) {
      console.error("Prediction error:", error);
      alert("Error generating diagnosis. Please check server connection.");
    } finally {
      setLoading(false);
    }
  };

  const renderSwitch = (label: string, field: keyof typeof formData) => (
    <View style={styles.switchRow}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch
        value={formData[field] as boolean}
        onValueChange={() => toggleSwitch(field)}
        color={Colors.primary}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: Colors.background }}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ML Vertigo Diagnosis</Text>
        <Text style={styles.headerSubtitle}>AI-Powered Clinical Decision Support</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Preset Quick-Test Buttons */}
        <Text style={styles.sectionHeading}>⚡ Quick Sample Presets (Click to Test)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
          <TouchableOpacity style={[styles.presetChip, { backgroundColor: "#e3f2fd" }]} onPress={() => applyPreset("bppv")}>
            <Text style={styles.presetText}>🌀 BPPV Preset</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.presetChip, { backgroundColor: "#fff3e0" }]} onPress={() => applyPreset("meniere")}>
            <Text style={styles.presetText}>👂 Meniere's Preset</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.presetChip, { backgroundColor: "#f3e5f5" }]} onPress={() => applyPreset("migraine")}>
            <Text style={styles.presetText}>⚡ Migraine Preset</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.presetChip, { backgroundColor: "#efebe9" }]} onPress={() => applyPreset("non_peripheral")}>
            <Text style={styles.presetText}>❌ Non-Peripheral</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Task Selection */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. Select Target Task</Text>
          <SegmentedButtons
            value={task}
            onValueChange={(val) => { setTask(val as "1" | "2"); setResult(null); }}
            buttons={[
              { value: "1", label: "Task 1: Screening (Yes/No)" },
              { value: "2", label: "Task 2: Subtype Classification" },
            ]}
            style={{ marginBottom: 12 }}
          />

          <Text style={styles.sectionTitle}>2. Select Feature Set</Text>
          <SegmentedButtons
            value={featureSet}
            onValueChange={(val) => { setFeatureSet(val as "all" | "sym" | "exam"); setResult(null); }}
            buttons={[
              { value: "all", label: "All Features" },
              { value: "sym", label: "Symptoms Only" },
              { value: "exam", label: "Exam Only" },
            ]}
          />
        </View>

        {/* Demographics */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Demographics</Text>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Age (Years)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={formData.age}
              onChangeText={(t) => setFormData({ ...formData, age: t })}
              placeholder="45"
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Gender (Male / Female)</Text>
            <Switch
              value={formData.gender}
              onValueChange={() => toggleSwitch("gender")}
              color={Colors.primary}
            />
          </View>
        </View>

        {/* Symptoms Section (Shown if All or Sym) */}
        {featureSet !== "exam" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Symptom History</Text>
            {renderSwitch("Vertigo Sensation", "vertigo")}
            {renderSwitch("General Dizziness", "dizziness")}
            {renderSwitch("Paroxysmal (Episodic Attacks)", "paroxysmal")}
            {renderSwitch("Positional (Triggered by Head Move)", "positional")}
            {renderSwitch("Chronic Vertigo", "chronic")}
            {renderSwitch("Hearing Loss Feeling", "hearingLoss")}
            {task === "2" && (
              <>
                {renderSwitch("Tinnitus (Ringing in Ear)", "tinnitus")}
                {renderSwitch("Aural Fullness (Pressure in Ear)", "auralFullness")}
                {renderSwitch("Co-occurring Headache", "headache")}
                {renderSwitch("Photophobia (Sensitivity to Light)", "photophobia")}
                {renderSwitch("History of Motion Sickness", "motionSickness")}
                {renderSwitch("Family History of Balance Disorders", "familyHistory")}
                {renderSwitch("Acute Hearing Loss History", "acuteHearingLoss")}
              </>
            )}

            <View style={[styles.inputRow, { marginTop: 10 }]}>
              <Text style={styles.inputLabel}>Duration of vertigo attacks (mins)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={formData.duration}
                onChangeText={(t) => setFormData({ ...formData, duration: t })}
                placeholder="15"
              />
            </View>
          </View>
        )}

        {/* Examination Section (Shown if All or Exam) */}
        {featureSet !== "sym" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Clinical & Diagnostic Examination</Text>
            {renderSwitch("Spontaneous Nystagmus", "nystagmus")}
            {task === "1" && (
              <>
                {renderSwitch("Roll-Test Positive", "rollTest")}
                {renderSwitch("Dix-Hallpike Test Positive", "dixHallpike")}
              </>
            )}
            {task === "2" && (
              <>
                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Labyrinthine Reaction (%)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={formData.labyrinthineReaction}
                    onChangeText={(t) => setFormData({ ...formData, labyrinthineReaction: t })}
                  />
                </View>
                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Unilateral Weakness (%)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={formData.unilateralWeakness}
                    onChangeText={(t) => setFormData({ ...formData, unilateralWeakness: t })}
                  />
                </View>
                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Pure Tone Audiometry (PTA dB)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={formData.pta}
                    onChangeText={(t) => setFormData({ ...formData, pta: t })}
                  />
                </View>
              </>
            )}
          </View>
        )}

        {/* Submit Predict Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handlePredict}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>🔬 Run ML Prediction ({task === "1" ? "Task 1" : "Task 2"} - {featureSet.toUpperCase()})</Text>
          )}
        </TouchableOpacity>

        {/* Prediction Results Display */}
        {result && (
          <View style={[
            styles.resultCard,
            (task === "1" && result.diagnosis === 1) || (task === "2" && result.diagnosis === 2)
              ? styles.resultPositive
              : styles.resultInfo
          ]}>
            <Text style={styles.resultTitle}>Model Prediction Result</Text>
            <Text style={styles.resultLabel}>{result.label}</Text>
            <Text style={styles.resultDescription}>{result.description}</Text>
            {result.confidence > 0 && (
              <Text style={styles.resultConfidence}>
                Model Confidence: {(result.confidence * 100).toFixed(1)}%
              </Text>
            )}
            <Text style={styles.resultDisclaimer}>
              *This AI prediction is an assistive decision support tool trained on validated clinical datasets.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 54,
    paddingBottom: 18,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...Shadows.md,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: Colors.accent,
    fontSize: 13,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  presetScroll: {
    marginBottom: 14,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#cfd8dc",
  },
  presetText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primaryDark,
    marginBottom: 10,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  switchLabel: {
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    width: 90,
    textAlign: "right",
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 16,
    ...Shadows.md,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "bold",
  },
  resultCard: {
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    ...Shadows.md,
  },
  resultPositive: {
    backgroundColor: "#ffebee",
    borderWidth: 1.5,
    borderColor: "#ef5350",
  },
  resultInfo: {
    backgroundColor: "#e8f5e9",
    borderWidth: 1.5,
    borderColor: "#66bb6a",
  },
  resultTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  resultLabel: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 6,
    textAlign: "center",
  },
  resultDescription: {
    fontSize: 13,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 18,
  },
  resultConfidence: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primaryDark,
    marginBottom: 12,
  },
  resultDisclaimer: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
  },
});
