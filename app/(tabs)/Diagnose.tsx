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
import { Switch } from "react-native-paper";
import { API_BASE_URL } from "@/api/config";
import { Colors, Shadows } from "../../constants/theme";

// ---------------------------------------------------------------------------
// Types & Options (matching the training data vocabulary exactly)
// ---------------------------------------------------------------------------
const PRESENTING_SYMPTOMS = [
  "Vertigo", "Dizziness/ Light headedness", "Unsteadiness", "Oscillopsia", "Not sure"
];

const COMORBIDITIES = [
  "Diabetes", "Hypertension", "Migraine", "Anxiety or stress disorders",
  "Autoimmune disorders", "Panic episodes", "Anaemia", "Cardiac arrythmia"
];

const SENSATION_TYPES = ["Spinning", "Back and Forth"];

const TRIGGERS = [
  "Head movements", "Changes in middle ear pressure (Coughing, defecation)",
  "Loud sounds", "During ascend or descend in air travel",
  "Visual Stimuli", "Anxiety or stress"
];

const ASSOCIATED_COMPLAINTS = [
  "Nausea", "Vomiting", "Ear Symptoms", "Headache",
  "Photophobia/ phonophobia", "Fever", "Neck stiffness",
  "Cerebellar symptoms", "Cranial nerve dysfunction symptoms",
  "Dyspnoea", "Palpitation"
];

const EAR_SYMPTOMS = [
  "Hearing loss", "Tinnitus", "Aural fullness", "Otorrhea", "Otalgia"
];

const CEREBELLAR_SYMPTOMS = [
  "Unsteady gait/ difficulty walking straight", "Dysarthria",
  "Difficulty combing hair", "Weakness of limbs"
];

const CRANIAL_NERVE_SYMPTOMS = [
  "Hyposmia", "Blurring of vision", "Diplopia", "Loss of sensation on face",
  "Incomplete closure of eye", "Deviation of angle of mouth at rest or when asked to smile",
  "Alteration of taste", "Difficulty swallowing", "Dysphonia",
  "Difficulty movements of neck or shrugging of shoulder",
  "Difficulty movements of tongue"
];

const DRUG_CATEGORIES = ["Antiepileptics", "Antipsychotics", "Ototoxic Drugs", "None of the above"];

const POST_ONSET_MEDS = [
  "Benzodiazepines",
  "Labyrinthine sedatives (Cinnarizine, Meclizine, Procholorperazine, etc)",
  "Betahistine", "None of the above"
];

const DURATION_UNITS = ["Minutes", "Hours", "Days", "Months", "Years"];
const EPISODE_DURATION_UNITS = ["Seconds", "Minutes", "Hours", "Days"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function DiagnoseScreen() {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const [result, setResult] = useState<{
    diagnosisName: string;
    confidence: number;
    topDiagnoses: { name: string; probability: number }[];
  } | null>(null);

  // Form state aligned to the CSV columns / questionnaire flow
  const [form, setForm] = useState({
    // Demographics
    age: "45",
    sex: "Male",
    comorbidities: [] as string[],

    // Presenting symptom
    presenting_symptom: "Vertigo",

    // Q1 — Onset
    onset: "Sudden",

    // Q2 — Total duration
    duration_unit: "Hours",
    duration_value: "2",

    // Q3 — Sensation type
    sensation_type: "Spinning",

    // Q4 — Episodic or Persistent
    episodic_or_persistent: "Episodic",
    episode_duration_unit: "Seconds",
    episode_duration_value: "30",
    remission_between_episodes: "Complete",

    // Q5 — Triggers
    triggers: [] as string[],
    head_movement_triggered_or_aggravated: "NA",
    recent_head_injury: "No",

    // Q6 — Associated complaints
    associated_complaints: [] as string[],
    ear_symptoms_detail: [] as string[],
    hearing_loss_laterality: "NA",
    hearing_loss_onset: "NA",
    hearing_loss_timing: "NA",
    hearing_loss_progression: "NA",
    cerebellar_symptoms_detail: [] as string[],
    cranial_nerve_symptoms_detail: [] as string[],

    // Q7 — Drug history
    drug_history_category: "None of the above",
    drug_history_detail: "NA",

    // Q8 — Post-onset medication
    post_onset_medication: "None of the above",
  });

  const totalSteps = 9; // 0–8

  const updateForm = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleMultiSelect = (field: string, value: string) => {
    setForm(prev => {
      const arr = (prev as any)[field] as string[];
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter(v => v !== value) };
      }
      return { ...prev, [field]: [...arr, value] };
    });
  };

  // Quick preset for testing
  const applyPreset = (type: "bppv" | "meniere" | "migraine" | "pppd") => {
    setResult(null);
    setCurrentStep(0);
    if (type === "bppv") {
      setForm({
        age: "60", sex: "Female", comorbidities: ["Hypertension"],
        presenting_symptom: "Vertigo", onset: "Sudden",
        duration_unit: "Days", duration_value: "3",
        sensation_type: "Spinning", episodic_or_persistent: "Episodic",
        episode_duration_unit: "Seconds", episode_duration_value: "30",
        remission_between_episodes: "Complete",
        triggers: ["Head movements"],
        head_movement_triggered_or_aggravated: "Triggered",
        recent_head_injury: "No",
        associated_complaints: ["Nausea", "Vomiting"],
        ear_symptoms_detail: [], hearing_loss_laterality: "NA",
        hearing_loss_onset: "NA", hearing_loss_timing: "NA",
        hearing_loss_progression: "NA",
        cerebellar_symptoms_detail: [], cranial_nerve_symptoms_detail: [],
        drug_history_category: "None of the above", drug_history_detail: "NA",
        post_onset_medication: "Labyrinthine sedatives (Cinnarizine, Meclizine, Procholorperazine, etc)",
      });
    } else if (type === "meniere") {
      setForm({
        age: "50", sex: "Male", comorbidities: [],
        presenting_symptom: "Vertigo", onset: "Sudden",
        duration_unit: "Years", duration_value: "3",
        sensation_type: "Spinning", episodic_or_persistent: "Episodic",
        episode_duration_unit: "Hours", episode_duration_value: "4",
        remission_between_episodes: "Complete",
        triggers: ["Head movements"],
        head_movement_triggered_or_aggravated: "Aggravated",
        recent_head_injury: "No",
        associated_complaints: ["Nausea", "Vomiting", "Ear Symptoms"],
        ear_symptoms_detail: ["Hearing loss", "Tinnitus", "Aural fullness"],
        hearing_loss_laterality: "Unilateral Left",
        hearing_loss_onset: "Insidious", hearing_loss_timing: "With or Following vertigo",
        hearing_loss_progression: "Fluctuating",
        cerebellar_symptoms_detail: [], cranial_nerve_symptoms_detail: [],
        drug_history_category: "None of the above", drug_history_detail: "NA",
        post_onset_medication: "Betahistine",
      });
    } else if (type === "migraine") {
      setForm({
        age: "35", sex: "Female", comorbidities: ["Migraine", "Anxiety or stress disorders"],
        presenting_symptom: "Vertigo", onset: "Sudden",
        duration_unit: "Hours", duration_value: "12",
        sensation_type: "Spinning", episodic_or_persistent: "Episodic",
        episode_duration_unit: "Hours", episode_duration_value: "6",
        remission_between_episodes: "Complete",
        triggers: ["Head movements", "Visual Stimuli", "Loud sounds", "Anxiety or stress"],
        head_movement_triggered_or_aggravated: "Triggered",
        recent_head_injury: "No",
        associated_complaints: ["Nausea", "Vomiting", "Headache", "Photophobia/ phonophobia"],
        ear_symptoms_detail: [], hearing_loss_laterality: "NA",
        hearing_loss_onset: "NA", hearing_loss_timing: "NA",
        hearing_loss_progression: "NA",
        cerebellar_symptoms_detail: [], cranial_nerve_symptoms_detail: [],
        drug_history_category: "None of the above", drug_history_detail: "NA",
        post_onset_medication: "Benzodiazepines",
      });
    } else if (type === "pppd") {
      setForm({
        age: "38", sex: "Female", comorbidities: ["Anxiety or stress disorders", "Panic episodes"],
        presenting_symptom: "Unsteadiness", onset: "Gradual",
        duration_unit: "Months", duration_value: "8",
        sensation_type: "Back and Forth", episodic_or_persistent: "Persistent",
        episode_duration_unit: "NA" as any, episode_duration_value: "",
        remission_between_episodes: "NA",
        triggers: ["Visual Stimuli", "Anxiety or stress", "Head movements"],
        head_movement_triggered_or_aggravated: "Aggravated",
        recent_head_injury: "No",
        associated_complaints: ["Nausea", "Photophobia/ phonophobia"],
        ear_symptoms_detail: [], hearing_loss_laterality: "NA",
        hearing_loss_onset: "NA", hearing_loss_timing: "NA",
        hearing_loss_progression: "NA",
        cerebellar_symptoms_detail: [], cranial_nerve_symptoms_detail: [],
        drug_history_category: "None of the above", drug_history_detail: "NA",
        post_onset_medication: "Benzodiazepines",
      });
    }
  };

  const handlePredict = async () => {
    try {
      setLoading(true);
      setResult(null);

      // Build the payload matching the CSV column names
      const payload: any = {
        age: form.age,
        sex: form.sex,
        comorbidities: form.comorbidities.length > 0 ? form.comorbidities.join("; ") : "No comorbidities",
        presenting_symptom: form.presenting_symptom,
        onset: form.onset,
        duration_unit: form.duration_unit,
        duration_value: form.duration_value,
        sensation_type: form.sensation_type,
        episodic_or_persistent: form.episodic_or_persistent,
        episode_duration_unit: form.episodic_or_persistent === "Episodic" ? form.episode_duration_unit : "NA",
        episode_duration_value: form.episodic_or_persistent === "Episodic" ? form.episode_duration_value : "0",
        remission_between_episodes: form.episodic_or_persistent === "Episodic" ? form.remission_between_episodes : "NA",
        triggers: form.triggers.length > 0 ? form.triggers.join("; ") : "None reported / spontaneous",
        head_movement_triggered_or_aggravated: form.triggers.includes("Head movements") ? form.head_movement_triggered_or_aggravated : "NA",
        recent_head_injury: form.recent_head_injury,
        associated_complaints: form.associated_complaints.length > 0 ? form.associated_complaints.join("; ") : "No associated complaints reported",
        ear_symptoms_detail: form.associated_complaints.includes("Ear Symptoms") && form.ear_symptoms_detail.length > 0
          ? form.ear_symptoms_detail.join("; ") : "NA",
        hearing_loss_laterality: form.ear_symptoms_detail.includes("Hearing loss") ? form.hearing_loss_laterality : "NA",
        hearing_loss_onset: form.ear_symptoms_detail.includes("Hearing loss") ? form.hearing_loss_onset : "NA",
        hearing_loss_timing: form.ear_symptoms_detail.includes("Hearing loss") ? form.hearing_loss_timing : "NA",
        hearing_loss_progression: form.ear_symptoms_detail.includes("Hearing loss") ? form.hearing_loss_progression : "NA",
        cerebellar_symptoms_detail: form.associated_complaints.includes("Cerebellar symptoms") && form.cerebellar_symptoms_detail.length > 0
          ? form.cerebellar_symptoms_detail.join("; ") : "NA",
        cranial_nerve_symptoms_detail: form.associated_complaints.includes("Cranial nerve dysfunction symptoms") && form.cranial_nerve_symptoms_detail.length > 0
          ? form.cranial_nerve_symptoms_detail.join("; ") : "NA",
        drug_history_category: form.drug_history_category,
        drug_history_detail: form.drug_history_category !== "None of the above" ? form.drug_history_detail : "NA",
        post_onset_medication: form.post_onset_medication,
      };

      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to get prediction");
      }

      const data = await response.json();
      setResult({
        diagnosisName: data.diagnosisName || "Unknown",
        confidence: data.confidence || 0,
        topDiagnoses: data.topDiagnoses || [],
      });
    } catch (error) {
      console.error("Prediction error:", error);
      alert("Error generating diagnosis. Please check server connection.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // UI Helpers
  // ---------------------------------------------------------------------------
  const renderRadio = (label: string, options: string[], field: string) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.optionsWrap}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt}
            style={[styles.radioChip, (form as any)[field] === opt && styles.radioChipActive]}
            onPress={() => updateForm(field, opt)}
          >
            <Text style={[styles.radioChipText, (form as any)[field] === opt && styles.radioChipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderMultiSelect = (label: string, options: string[], field: string) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldHint}>Select all that apply</Text>
      <View style={styles.optionsWrap}>
        {options.map(opt => {
          const arr = (form as any)[field] as string[];
          const selected = arr.includes(opt);
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.multiChip, selected && styles.multiChipActive]}
              onPress={() => toggleMultiSelect(field, opt)}
            >
              <Text style={[styles.multiChipText, selected && styles.multiChipTextActive]}>
                {selected ? "✓ " : ""}{opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderNumericInput = (label: string, field: string, placeholder: string) => (
    <View style={styles.inputRow}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.textInput}
        keyboardType="numeric"
        value={(form as any)[field]}
        onChangeText={t => updateForm(field, t)}
        placeholder={placeholder}
      />
    </View>
  );

  // ---------------------------------------------------------------------------
  // Step Renderers
  // ---------------------------------------------------------------------------
  const renderStep0 = () => (
    <View style={styles.card}>
      <Text style={styles.stepTitle}>👤 Patient Demographics</Text>
      <Text style={styles.stepSubtitle}>Basic patient information</Text>
      {renderNumericInput("Age (Years)", "age", "45")}
      {renderRadio("Sex", ["Male", "Female", "Others"], "sex")}
      {renderMultiSelect("Known Comorbidities", COMORBIDITIES, "comorbidities")}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.card}>
      <Text style={styles.stepTitle}>🩺 Presenting Symptom</Text>
      <Text style={styles.stepSubtitle}>What is the patient primarily suffering from?</Text>
      {renderRadio("Primary Complaint", PRESENTING_SYMPTOMS, "presenting_symptom")}
      <View style={styles.divider} />
      <Text style={styles.stepTitle}>Q1 — Onset</Text>
      <Text style={styles.stepSubtitle}>How did the symptoms begin?</Text>
      {renderRadio("Onset Type", ["Sudden", "Gradual"], "onset")}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.card}>
      <Text style={styles.stepTitle}>⏱️ Q2 — Total Duration of Illness</Text>
      <Text style={styles.stepSubtitle}>How long has the patient been experiencing symptoms?</Text>
      {renderRadio("Duration Unit", DURATION_UNITS, "duration_unit")}
      {renderNumericInput("Duration Value", "duration_value", "2")}
      <View style={styles.divider} />
      <Text style={styles.stepTitle}>🌀 Q3 — Sensation Type</Text>
      <Text style={styles.stepSubtitle}>What type of sensation does the patient experience?</Text>
      {renderRadio("Sensation", SENSATION_TYPES, "sensation_type")}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.card}>
      <Text style={styles.stepTitle}>🔄 Q4 — Episode Pattern</Text>
      <Text style={styles.stepSubtitle}>Is the condition episodic or persistent?</Text>
      {renderRadio("Pattern", ["Episodic", "Persistent"], "episodic_or_persistent")}
      {form.episodic_or_persistent === "Episodic" && (
        <>
          <View style={styles.divider} />
          <Text style={styles.fieldLabel}>Q4A — How long does each episode last?</Text>
          {renderRadio("Episode Duration Unit", EPISODE_DURATION_UNITS, "episode_duration_unit")}
          {renderNumericInput("Episode Duration Value", "episode_duration_value", "30")}
          <View style={styles.divider} />
          <Text style={styles.fieldLabel}>Q4B — Remission between episodes?</Text>
          {renderRadio("Remission", ["Complete", "Partial", "None"], "remission_between_episodes")}
        </>
      )}
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.card}>
      <Text style={styles.stepTitle}>⚡ Q5 — Triggers</Text>
      <Text style={styles.stepSubtitle}>What triggers or worsens the symptoms?</Text>
      {renderMultiSelect("Known Triggers", TRIGGERS, "triggers")}

      {form.triggers.includes("Head movements") && (
        <>
          <View style={styles.divider} />
          <Text style={styles.fieldLabel}>Q5A — Head movements:</Text>
          {renderRadio("Effect", ["Triggered", "Aggravated"], "head_movement_triggered_or_aggravated")}
        </>
      )}

      <View style={styles.divider} />
      <Text style={styles.fieldLabel}>Q5B — Recent head injury?</Text>
      {renderRadio("Head Injury", ["Yes", "No"], "recent_head_injury")}
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.card}>
      <Text style={styles.stepTitle}>📋 Q6 — Associated Complaints</Text>
      <Text style={styles.stepSubtitle}>Select all symptoms the patient reports alongside vertigo/dizziness</Text>
      {renderMultiSelect("Associated Symptoms", ASSOCIATED_COMPLAINTS, "associated_complaints")}
    </View>
  );

  const renderStep6 = () => (
    <View style={styles.card}>
      <Text style={styles.stepTitle}>🔍 Q6 — Detailed Sub-symptoms</Text>
      <Text style={styles.stepSubtitle}>Provide details for selected associated complaints</Text>

      {form.associated_complaints.includes("Ear Symptoms") && (
        <>
          <Text style={styles.subSectionTitle}>Q6A — Ear Symptoms Detail</Text>
          {renderMultiSelect("Select ear symptoms", EAR_SYMPTOMS, "ear_symptoms_detail")}

          {form.ear_symptoms_detail.includes("Hearing loss") && (
            <>
              <Text style={styles.subFieldLabel}>Q6A1 — Hearing Loss Laterality</Text>
              {renderRadio("Side", ["Unilateral Right", "Unilateral Left", "Bilateral"], "hearing_loss_laterality")}
              <Text style={styles.subFieldLabel}>Q6A2 — Hearing Loss Onset</Text>
              {renderRadio("HL Onset", ["Sudden", "Insidious"], "hearing_loss_onset")}
              <Text style={styles.subFieldLabel}>Q6A3 — Hearing Loss Timing</Text>
              {renderRadio("Timing", ["Before the onset of vertigo", "With or Following vertigo"], "hearing_loss_timing")}
              <Text style={styles.subFieldLabel}>Q6A4 — Hearing Loss Progression</Text>
              {renderRadio("Progression", ["Fluctuating", "Progressive", "Non progressive"], "hearing_loss_progression")}
            </>
          )}
          <View style={styles.divider} />
        </>
      )}

      {form.associated_complaints.includes("Cerebellar symptoms") && (
        <>
          <Text style={styles.subSectionTitle}>Q6B — Cerebellar Symptoms Detail</Text>
          {renderMultiSelect("Select cerebellar symptoms", CEREBELLAR_SYMPTOMS, "cerebellar_symptoms_detail")}
          <View style={styles.divider} />
        </>
      )}

      {form.associated_complaints.includes("Cranial nerve dysfunction symptoms") && (
        <>
          <Text style={styles.subSectionTitle}>Q6C — Cranial Nerve Symptoms Detail</Text>
          {renderMultiSelect("Select cranial nerve symptoms", CRANIAL_NERVE_SYMPTOMS, "cranial_nerve_symptoms_detail")}
        </>
      )}

      {!form.associated_complaints.includes("Ear Symptoms") &&
       !form.associated_complaints.includes("Cerebellar symptoms") &&
       !form.associated_complaints.includes("Cranial nerve dysfunction symptoms") && (
        <Text style={styles.noSubText}>No sub-symptom details needed for your selections. Continue to next step.</Text>
      )}
    </View>
  );

  const renderStep7 = () => (
    <View style={styles.card}>
      <Text style={styles.stepTitle}>💊 Q7 — Drug History</Text>
      <Text style={styles.stepSubtitle}>Is the patient on any relevant medications?</Text>
      {renderRadio("Drug Category", DRUG_CATEGORIES, "drug_history_category")}

      {form.drug_history_category !== "None of the above" && (
        <>
          <View style={styles.divider} />
          <Text style={styles.fieldLabel}>Specific Drug</Text>
          <TextInput
            style={[styles.textInput, { width: '100%' }]}
            value={form.drug_history_detail}
            onChangeText={t => updateForm("drug_history_detail", t)}
            placeholder="e.g. Cisplatin, Aminoglycosides"
          />
        </>
      )}

      <View style={styles.divider} />
      <Text style={styles.stepTitle}>💉 Q8 — Post-onset Medication</Text>
      <Text style={styles.stepSubtitle}>Has the patient taken any medication since symptoms started?</Text>
      {renderRadio("Post-onset Medication", POST_ONSET_MEDS, "post_onset_medication")}
    </View>
  );

  const renderStep8 = () => (
    <View style={styles.card}>
      <Text style={styles.stepTitle}>📊 Review & Predict</Text>
      <Text style={styles.stepSubtitle}>Summary of patient data before running AI diagnosis</Text>

      <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Age:</Text><Text style={styles.summaryValue}>{form.age} yrs, {form.sex}</Text></View>
      <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Presenting:</Text><Text style={styles.summaryValue}>{form.presenting_symptom}</Text></View>
      <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Onset:</Text><Text style={styles.summaryValue}>{form.onset}</Text></View>
      <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Duration:</Text><Text style={styles.summaryValue}>{form.duration_value} {form.duration_unit}</Text></View>
      <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Sensation:</Text><Text style={styles.summaryValue}>{form.sensation_type}</Text></View>
      <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Pattern:</Text><Text style={styles.summaryValue}>{form.episodic_or_persistent}</Text></View>
      {form.triggers.length > 0 && <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Triggers:</Text><Text style={styles.summaryValue}>{form.triggers.join(", ")}</Text></View>}
      {form.associated_complaints.length > 0 && <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Associated:</Text><Text style={styles.summaryValue}>{form.associated_complaints.join(", ")}</Text></View>}
      <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Drug Hx:</Text><Text style={styles.summaryValue}>{form.drug_history_category}</Text></View>
      <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Post-onset Rx:</Text><Text style={styles.summaryValue}>{form.post_onset_medication}</Text></View>

      <TouchableOpacity style={styles.predictButton} onPress={handlePredict} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.predictButtonText}>🔬 Run AI Diagnosis (25 conditions)</Text>
        )}
      </TouchableOpacity>

      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>AI DIAGNOSIS RESULT</Text>
          <Text style={styles.resultDiagnosis}>{result.diagnosisName}</Text>
          {result.confidence > 0 && (
            <Text style={styles.resultConfidence}>
              Confidence: {(result.confidence * 100).toFixed(1)}%
            </Text>
          )}

          {result.topDiagnoses.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.diffTitle}>Differential Diagnoses</Text>
              {result.topDiagnoses.map((d, i) => (
                <View key={i} style={styles.diffRow}>
                  <Text style={styles.diffRank}>#{i + 1}</Text>
                  <Text style={styles.diffName}>{d.name}</Text>
                  <Text style={styles.diffProb}>{d.probability.toFixed(1)}%</Text>
                </View>
              ))}
            </>
          )}

          <Text style={styles.disclaimer}>
            *This AI prediction is an assistive decision-support tool trained on 2,500 synthetic clinical records across 25 vestibular diagnoses. It does not replace clinical judgment.
          </Text>
        </View>
      )}
    </View>
  );

  const steps = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6, renderStep7, renderStep8];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: Colors.background }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Vertigo Diagnosis</Text>
        <Text style={styles.headerSubtitle}>25-Condition Clinical Decision Support • Step {currentStep + 1} of {totalSteps}</Text>
        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((currentStep + 1) / totalSteps) * 100}%` }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Presets */}
        {currentStep === 0 && (
          <>
            <Text style={styles.sectionHeading}>⚡ Quick Presets (Click to auto-fill)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
              <TouchableOpacity style={[styles.presetChip, { backgroundColor: "#e3f2fd" }]} onPress={() => applyPreset("bppv")}>
                <Text style={styles.presetText}>🌀 BPPV</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.presetChip, { backgroundColor: "#fff3e0" }]} onPress={() => applyPreset("meniere")}>
                <Text style={styles.presetText}>👂 Meniere's</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.presetChip, { backgroundColor: "#f3e5f5" }]} onPress={() => applyPreset("migraine")}>
                <Text style={styles.presetText}>⚡ Vest. Migraine</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.presetChip, { backgroundColor: "#efebe9" }]} onPress={() => applyPreset("pppd")}>
                <Text style={styles.presetText}>😵 PPPD</Text>
              </TouchableOpacity>
            </ScrollView>
          </>
        )}

        {/* Current Step Content */}
        {steps[currentStep]()}

        {/* Navigation */}
        <View style={styles.navRow}>
          {currentStep > 0 && (
            <TouchableOpacity style={styles.navBtnBack} onPress={() => { setCurrentStep(c => c - 1); setResult(null); }}>
              <Text style={styles.navBtnBackText}>← Previous</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          {currentStep < totalSteps - 1 && (
            <TouchableOpacity style={styles.navBtnNext} onPress={() => setCurrentStep(c => c + 1)}>
              <Text style={styles.navBtnNextText}>Next →</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { padding: 16 },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 54, paddingBottom: 14, paddingHorizontal: 20,
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
    ...Shadows.md,
  },
  headerTitle: { color: Colors.white, fontSize: 22, fontWeight: "bold" },
  headerSubtitle: { color: Colors.accent, fontSize: 12, marginTop: 2 },
  progressBar: { height: 4, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2, marginTop: 10 },
  progressFill: { height: 4, backgroundColor: Colors.accent, borderRadius: 2 },
  sectionHeading: {
    fontSize: 13, fontWeight: "700", color: Colors.textSecondary,
    marginBottom: 8, marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5,
  },
  presetScroll: { marginBottom: 14 },
  presetChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    marginRight: 8, borderWidth: 1, borderColor: "#cfd8dc",
  },
  presetText: { fontSize: 13, fontWeight: "600", color: Colors.textPrimary },
  card: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 18,
    marginBottom: 14, ...Shadows.sm,
  },
  stepTitle: { fontSize: 17, fontWeight: "700", color: Colors.primaryDark, marginBottom: 4 },
  stepSubtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 14 },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 14 },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary, marginBottom: 6 },
  fieldHint: { fontSize: 11, color: Colors.textSecondary, marginBottom: 6, fontStyle: "italic" },
  subSectionTitle: { fontSize: 15, fontWeight: "700", color: Colors.primary, marginBottom: 8, marginTop: 4 },
  subFieldLabel: { fontSize: 13, fontWeight: "600", color: Colors.textPrimary, marginTop: 10, marginBottom: 4 },
  optionsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  radioChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1.5, borderColor: "#d0d0d0", backgroundColor: "#fafafa",
  },
  radioChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  radioChipText: { fontSize: 12, color: Colors.textPrimary, fontWeight: "500" },
  radioChipTextActive: { color: Colors.white, fontWeight: "700" },
  multiChip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1.5, borderColor: "#d0d0d0", backgroundColor: "#fafafa", marginBottom: 4,
  },
  multiChipActive: { backgroundColor: "#e8f5e9", borderColor: "#66bb6a" },
  multiChipText: { fontSize: 12, color: Colors.textPrimary },
  multiChipTextActive: { color: "#2e7d32", fontWeight: "700" },
  inputRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingVertical: 6,
  },
  inputLabel: { fontSize: 14, color: Colors.textPrimary, flex: 1 },
  textInput: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6, width: 100,
    textAlign: "right", fontSize: 14,
  },
  noSubText: { fontSize: 13, color: Colors.textSecondary, fontStyle: "italic", textAlign: "center", paddingVertical: 20 },
  navRow: { flexDirection: "row", marginTop: 4 },
  navBtnBack: {
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10,
    backgroundColor: "#f5f5f5", borderWidth: 1, borderColor: "#ddd",
  },
  navBtnBackText: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },
  navBtnNext: {
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10,
    backgroundColor: Colors.primary, ...Shadows.sm,
  },
  navBtnNextText: { fontSize: 14, fontWeight: "700", color: Colors.white },
  predictButton: {
    backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 16,
    alignItems: "center", marginTop: 16, ...Shadows.md,
  },
  predictButtonText: { color: Colors.white, fontSize: 16, fontWeight: "bold" },
  resultCard: {
    borderRadius: 14, padding: 20, marginTop: 16,
    backgroundColor: "#f3e5f5", borderWidth: 2, borderColor: "#ab47bc",
    ...Shadows.md,
  },
  resultTitle: {
    fontSize: 11, fontWeight: "700", color: Colors.textSecondary,
    textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, textAlign: "center",
  },
  resultDiagnosis: {
    fontSize: 20, fontWeight: "bold", color: "#6a1b9a",
    textAlign: "center", marginBottom: 6,
  },
  resultConfidence: {
    fontSize: 15, fontWeight: "700", color: Colors.primaryDark,
    textAlign: "center", marginBottom: 8,
  },
  diffTitle: {
    fontSize: 13, fontWeight: "700", color: Colors.textSecondary,
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8,
  },
  diffRow: {
    flexDirection: "row", alignItems: "center", paddingVertical: 4,
    borderBottomWidth: 1, borderBottomColor: "#e0e0e0",
  },
  diffRank: { fontSize: 12, fontWeight: "700", color: Colors.textSecondary, width: 28 },
  diffName: { fontSize: 13, color: Colors.textPrimary, flex: 1 },
  diffProb: { fontSize: 13, fontWeight: "700", color: Colors.primaryDark, width: 55, textAlign: "right" },
  disclaimer: {
    fontSize: 10, color: Colors.textSecondary, textAlign: "center",
    fontStyle: "italic", marginTop: 14, lineHeight: 14,
  },
  summaryRow: { flexDirection: "row", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  summaryLabel: { fontSize: 13, fontWeight: "700", color: Colors.textSecondary, width: 100 },
  summaryValue: { fontSize: 13, color: Colors.textPrimary, flex: 1 },
});
