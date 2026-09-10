import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import {
  Checkbox,
  RadioButton,
  Divider,
  ProgressBar,
} from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { API_BASE_URL } from "@/api/config";
import { useAuth } from "@/api/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const colors = {
  primary: "#4db6ac",
  primaryDark: "#00796B",
  accent: "#e0f2f1",
  white: "#ffffff",
  lightGray: "#f2f2f2",
  mediumGray: "#e0e0e0",
  textDark: "#212121",
  textMedium: "#757575",
  textLight: "#9e9e9e",
  border: "#bdbdbd",
  error: "#f44336",
};

const AddPatient: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const isEditing = params.isEditing === "true";
  const patientId = params.patientId as string;

  useEffect(() => {
    let mounted = true;
    const checkAuthentication = () => {
      if (!user) {
        Alert.alert("Authentication Required", "You must be logged in as a practitioner to add patients.");
        if (mounted) {
            setTimeout(() => {
                router.replace("/(tabs)/Home");
            }, 100);
        }
      }
    };
    checkAuthentication();
    return () => { mounted = false; };
  }, [user]);

  useEffect(() => {
    const loadPatientData = async () => {
      if (isEditing && patientId) {
        try {
          const response = await fetch(`${API_BASE_URL}/patients/${patientId}`);
          if (response.ok) {
            const patientData = await response.json();
            setFormData((prev) => ({
              ...prev,
              ...patientData,
              ...(patientData.medicalData || {})
            }));
          }
        } catch (error) {
          console.error("Error loading patient data:", error);
          Alert.alert("Error", "Failed to load patient data");
        }
      }
    };

    loadPatientData();
  }, [isEditing, patientId]);

  const [step, setStep] = useState(1);
  const totalSteps = 16;

  const [formData, setFormData] = useState({
    id: generatePatientId(),
    name: "",
    email: "",
    patientId: "",
    age: "",
    sex: "",
    comorbidities: [] as string[],
    otherComorbidity: "",
    isTrueVertigo: "", // Yes / No
    onset: "",
    duration: { minutes: "", hours: "", days: "", months: "", years: "" },
    vertigoSensation: "",
    episodicOrPersistent: "",
    episodeDuration: { seconds: "", minutes: "", hours: "", days: "" },
    remission: "",
    vertigoProgression: "", // Worsening, Static, Improving
    triggers: [] as string[],
    headMovementEffect: "",
    headInjury: "",
    recentAirTravelOrDiving: "", // Yes / No
    earMastoidSurgery: "", // Yes / No
    previousVertigoDiagnosis: "", // Yes / No
    symptoms: [] as string[],
    earSymptoms: [] as string[],
    hearingLossSide: "",
    hearingLossOnset: "",
    hearingLossDuration: "",
    hearingLossProgression: "",
    cerebellumSymptoms: [] as string[],
    cranialNerveSymptoms: [] as string[],
    antiepileptics: [] as string[],
    antipsychotics: [] as string[],
    ototoxicDrugs: [] as string[],
    medicationsTaken: [] as string[],
    otherMedications: "",
    treatmentHistory: "", // History of rehab etc.
    additionalInfo: "", // Free text for final step
    cause: "",
    vertigo: "",
  });

  function generatePatientId() {
    return "PT" + Math.floor(100000 + Math.random() * 900000);
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNestedInputChange = (
    field: keyof typeof formData,
    subField: string,
    value: string
  ) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: { ...prev[field], [subField]: value },
    }));
  };

  const handleRadioChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item: string) => item !== value)
        : [...prev[field], value],
    }));
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, totalSteps));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    try {
      if (!user?.uid) {
        Alert.alert("Error", "Unable to identify current practitioner. Please login again.");
        return;
      }

      const practitionerId = user.uid;

      const patientData = {
        ...formData,
        practitionerId,
        updatedAt: new Date().toISOString(),
      };

      if (isEditing && patientId) {
        // Update existing patient
        console.log("Updating patient via API...");
        const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patientData)
        });
        if (!response.ok) throw new Error("Failed to update patient");
      } else {
        // Add new patient
        console.log("Submitting new patient data:", JSON.stringify(patientData, null, 2));
        const response = await fetch(`${API_BASE_URL}/patients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patientData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Server Error:", errorText);
          throw new Error(`Failed to create patient: ${errorText}`);
        }
        
        const result = await response.json();
        console.log("Patient created successfully:", result);
      }

      // After successful addition/update
      await AsyncStorage.setItem(
        "patientsLastUpdated",
        new Date().toISOString()
      );
      Alert.alert("Success", "Patient saved successfully!", [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)/Home"),
        },
      ]);
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "Failed to save patient");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isEditing ? "Edit Patient" : "Add Patient"}
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Step {step} of {totalSteps}
          </Text>
          <ProgressBar
            progress={step / totalSteps}
            color="#2D9F88"
            style={styles.progressBar}
          />
        </View>

        <View style={styles.formCard}>
          {/* Step 1: Basic Patient Details */}
          {step === 1 && (
            <>
              <Text style={styles.sectionTitle}>Patient Information</Text>
              <Text style={styles.label}>Patient ID</Text>
              <TextInput
                style={styles.input}
                value={formData.id}
                placeholder="Auto-generated"
                editable={false}
              />

              <Text style={styles.label}>Patient Name (Optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                placeholder="Enter patient name"
                onChangeText={(text) => handleInputChange("name", text)}
              />

              <View style={styles.rowContainer}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Age</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Years"
                    keyboardType="numeric"
                    value={formData.age}
                    onChangeText={(text) => handleInputChange("age", text)}
                  />
                </View>

                <View style={styles.halfInput}>
                  <Text style={styles.label}>Sex</Text>
                  <View style={styles.dropdownStyle}>
                    <RadioButton.Group
                      onValueChange={(value) => handleRadioChange("sex", value)}
                      value={formData.sex}
                    >
                      <View style={styles.radioRowContainer}>
                        {["Male", "Female", "Other"].map((option) => (
                          <View key={option} style={styles.radioOption}>
                            <RadioButton value={option} color="#2D9F88" />
                            <Text>{option}</Text>
                          </View>
                        ))}
                      </View>
                    </RadioButton.Group>
                  </View>
                </View>
              </View>
            </>
          )}

          {/* Step 2: Comorbidities */}
          {step === 2 && (
            <>
              <Text style={styles.sectionTitle}>Comorbidities</Text>
              <Text style={styles.label}>
                Is your patient suffering from any of the following conditions?
              </Text>

              {[
                "Diabetes",
                "Hypertension",
                "Migraine",
                "Anxiety or stress disorders",
                "Autoimmune disorders",
                "Panic episodes",
                "Anaemia",
                "Cardiac arrhythmia",
              ].map((condition) => (
                <View key={condition} style={styles.checkboxContainer}>
                  <Checkbox
                    status={
                      formData.comorbidities.includes(condition)
                        ? "checked"
                        : "unchecked"
                    }
                    onPress={() =>
                      handleCheckboxChange("comorbidities", condition)
                    }
                    color="#2D9F88"
                  />
                  <Text style={styles.checkboxText}>{condition}</Text>
                </View>
              ))}

              <Text style={styles.label}>Other Comorbidities (if any)</Text>
              <TextInput
                style={styles.input}
                placeholder="Specify other condition"
                value={formData.otherComorbidity}
                onChangeText={(text) => handleInputChange("otherComorbidity", text)}
              />
            </>
          )}

          {/* Step 3: True Vertigo Check */}
          {step === 3 && (
            <>
              <Text style={styles.sectionTitle}>Symptom Check</Text>
              <Text style={styles.label}>
                Is the patient experiencing true vertigo? (Spinning sensation or illusion of movement)
              </Text>
              <RadioButton.Group
                onValueChange={(value) => handleRadioChange("isTrueVertigo", value)}
                value={formData.isTrueVertigo}
              >
                <View style={styles.radioContainer}>
                  <View style={styles.radioButton}>
                    <RadioButton value="Yes" color="#2D9F88" />
                    <Text style={styles.radioText}>Yes</Text>
                  </View>
                  <View style={styles.radioButton}>
                    <RadioButton value="No" color="#2D9F88" />
                    <Text style={styles.radioText}>No</Text>
                  </View>
                </View>
              </RadioButton.Group>

              {formData.isTrueVertigo === "No" && (
                <View style={{ marginTop: Spacing.md, padding: Spacing.md, backgroundColor: "#FFF3CD", borderRadius: BorderRadius.md }}>
                  <Text style={{ ...Typography.callout, color: "#856404" }}>
                    Note: If the patient is experiencing lightheadedness, unsteadiness, or presyncope without the illusion of movement, this app's diagnostic trees may not be fully optimized for them in this version.
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Step 4: Vertigo Onset */}
          {step === 4 && (
            <>
              <Text style={styles.sectionTitle}>Vertigo Characteristics</Text>
              <Text style={styles.label}>
                Was the onset of vertigo sudden or gradual?
              </Text>
              <RadioButton.Group
                onValueChange={(value) => handleRadioChange("onset", value)}
                value={formData.onset}
              >
                <View style={styles.radioContainer}>
                  <View style={styles.radioButton}>
                    <RadioButton value="Sudden" color="#2D9F88" />
                    <Text style={styles.radioText}>Sudden</Text>
                  </View>
                  <View style={styles.radioButton}>
                    <RadioButton value="Gradual" color="#2D9F88" />
                    <Text style={styles.radioText}>Gradual</Text>
                  </View>
                </View>
              </RadioButton.Group>
            </>
          )}

          {/* Step 5: Duration */}
          {step === 5 && (
            <>
              <Text style={styles.sectionTitle}>Duration of Vertigo</Text>
              <Text style={styles.label}>
                How long has the patient had vertigo?
              </Text>
              <Text style={styles.sublabel}>(Fill in appropriate fields)</Text>

              <View style={styles.durationContainer}>
                {["minutes", "hours", "days", "months", "years"].map((unit) => (
                  <View key={unit} style={styles.durationItem}>
                    <TextInput
                      style={styles.durationInput}
                      placeholder="0"
                      keyboardType="numeric"
                      value={(formData.duration as any)[unit]}
                      onChangeText={(text) =>
                        handleNestedInputChange("duration", unit, text)
                      }
                    />
                    <Text style={styles.durationLabel}>
                      {unit.charAt(0).toUpperCase() + unit.slice(1)}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Step 6: Vertigo Sensation */}
          {step === 6 && (
            <>
              <Text style={styles.sectionTitle}>Type of Sensation</Text>
              <Text style={styles.label}>
                Is the vertigo characterized by a spinning sensation or a
                back-and-forth motion?
              </Text>
              <RadioButton.Group
                onValueChange={(value) =>
                  handleRadioChange("vertigoSensation", value)
                }
                value={formData.vertigoSensation}
              >
                <View style={styles.radioContainer}>
                  <View style={styles.radioButton}>
                    <RadioButton value="Spinning" color="#2D9F88" />
                    <Text style={styles.radioText}>Spinning</Text>
                  </View>
                  <View style={styles.radioButton}>
                    <RadioButton value="BackAndForth" color="#2D9F88" />
                    <Text style={styles.radioText}>Back-and-forth motion</Text>
                  </View>
                </View>
              </RadioButton.Group>
            </>
          )}

          {/* Step 7: Episodic or Persistent */}
          {step === 7 && (
            <>
              <Text style={styles.sectionTitle}>Pattern of Symptoms</Text>
              <Text style={styles.label}>
                Are the symptoms episodic or persistent?
              </Text>
              <RadioButton.Group
                onValueChange={(value) =>
                  handleRadioChange("episodicOrPersistent", value)
                }
                value={formData.episodicOrPersistent}
              >
                <View style={styles.radioContainer}>
                  <View style={styles.radioButton}>
                    <RadioButton value="Episodic" color="#2D9F88" />
                    <Text style={styles.radioText}>Episodic</Text>
                  </View>
                  <View style={styles.radioButton}>
                    <RadioButton value="Persistent" color="#2D9F88" />
                    <Text style={styles.radioText}>Persistent</Text>
                  </View>
                </View>
              </RadioButton.Group>

              {formData.episodicOrPersistent === "Episodic" && (
                <>
                  <Text style={styles.label}>
                    How long does each episode last?
                  </Text>
                  <View style={styles.durationContainer}>
                    {["seconds", "minutes", "hours", "days"].map((unit) => (
                      <View key={unit} style={styles.durationItem}>
                        <TextInput
                          style={styles.durationInput}
                          placeholder="0"
                          keyboardType="numeric"
                          value={(formData.episodeDuration as any)[unit]}
                          onChangeText={(text) =>
                            handleNestedInputChange(
                              "episodeDuration",
                              unit,
                              text
                            )
                          }
                        />
                        <Text style={styles.durationLabel}>
                          {unit.charAt(0).toUpperCase() + unit.slice(1)}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <Text style={styles.label}>
                    Does the patient experience remission between episodes?
                  </Text>
                  <RadioButton.Group
                    onValueChange={(value) =>
                      handleRadioChange("remission", value)
                    }
                    value={formData.remission}
                  >
                    <View style={styles.radioContainer}>
                      <View style={styles.radioButton}>
                        <RadioButton value="Partial" color="#2D9F88" />
                        <Text style={styles.radioText}>
                          Partial with reduced severity
                        </Text>
                      </View>
                      <View style={styles.radioButton}>
                        <RadioButton value="Complete" color="#2D9F88" />
                        <Text style={styles.radioText}>Complete</Text>
                      </View>
                    </View>
                  </RadioButton.Group>
                </>
              )}
            </>
          )}

          {/* Step 8: Vertigo Progression */}
          {step === 8 && (
            <>
              <Text style={styles.sectionTitle}>Progression</Text>
              <Text style={styles.label}>How has the vertigo been since its onset?</Text>
              <RadioButton.Group
                onValueChange={(value) => handleRadioChange("vertigoProgression", value)}
                value={formData.vertigoProgression}
              >
                <View style={styles.radioContainer}>
                  <View style={styles.radioButton}>
                    <RadioButton value="Worsening" color="#2D9F88" />
                    <Text style={styles.radioText}>Worsening</Text>
                  </View>
                  <View style={styles.radioButton}>
                    <RadioButton value="Static" color="#2D9F88" />
                    <Text style={styles.radioText}>Static</Text>
                  </View>
                  <View style={styles.radioButton}>
                    <RadioButton value="Improving" color="#2D9F88" />
                    <Text style={styles.radioText}>Improving</Text>
                  </View>
                </View>
              </RadioButton.Group>
            </>
          )}

          {/* Step 9: Triggers */}
          {step === 9 && (
            <>
              <Text style={styles.sectionTitle}>
                Triggers and Aggravating Factors
              </Text>
              <Text style={styles.label}>
                What triggers or aggravates the vertigo?
              </Text>
              <Text style={styles.sublabel}>(Select all that apply)</Text>

              {[
                "Head movements",
                "Changes in middle ear pressure (coughing, defecation)",
                "Loud sounds",
                "During ascend or descend in air travel",
                "Visual stimuli",
                "Anxiety or stress",
                "Motion sensitivity",
              ].map((trigger) => (
                <View key={trigger} style={styles.checkboxContainer}>
                  <Checkbox
                    status={
                      formData.triggers.includes(trigger)
                        ? "checked"
                        : "unchecked"
                    }
                    onPress={() => handleCheckboxChange("triggers", trigger)}
                    color="#2D9F88"
                  />
                  <Text style={styles.checkboxText}>{trigger}</Text>
                </View>
              ))}

              {formData.triggers.includes("Head movements") && (
                <>
                  <Text style={styles.label}>
                    Is vertigo triggered or aggravated by head movements?
                  </Text>
                  <RadioButton.Group
                    onValueChange={(value) =>
                      handleRadioChange("headMovementEffect", value)
                    }
                    value={formData.headMovementEffect}
                  >
                    <View style={styles.radioContainer}>
                      <View style={styles.radioButton}>
                        <RadioButton value="Triggered" color="#2D9F88" />
                        <Text style={styles.radioText}>Triggered</Text>
                      </View>
                      <View style={styles.radioButton}>
                        <RadioButton value="Aggravated" color="#2D9F88" />
                        <Text style={styles.radioText}>Aggravated</Text>
                      </View>
                    </View>
                  </RadioButton.Group>
                </>
              )}

              <Divider style={styles.divider} />

              <Text style={styles.label}>
                Did the patient sustain head injury in any form in the recent
                past?
              </Text>
              <RadioButton.Group
                onValueChange={(value) =>
                  handleRadioChange("headInjury", value)
                }
                value={formData.headInjury}
              >
                <View style={styles.radioContainer}>
                  <View style={styles.radioButton}>
                    <RadioButton value="Yes" color="#2D9F88" />
                    <Text style={styles.radioText}>Yes</Text>
                  </View>
                  <View style={styles.radioButton}>
                    <RadioButton value="No" color="#2D9F88" />
                    <Text style={styles.radioText}>No</Text>
                  </View>
                </View>
              </RadioButton.Group>
            </>
          )}

          {/* Step 10: Air Travel or Diving */}
          {step === 10 && (
            <>
              <Text style={styles.sectionTitle}>Recent History</Text>
              <Text style={styles.label}>
                Did the vertigo occur during or immediately after air travel or diving?
              </Text>
              <RadioButton.Group
                onValueChange={(value) => handleRadioChange("recentAirTravelOrDiving", value)}
                value={formData.recentAirTravelOrDiving}
              >
                <View style={styles.radioContainer}>
                  <View style={styles.radioButton}>
                    <RadioButton value="Yes" color="#2D9F88" />
                    <Text style={styles.radioText}>Yes</Text>
                  </View>
                  <View style={styles.radioButton}>
                    <RadioButton value="No" color="#2D9F88" />
                    <Text style={styles.radioText}>No</Text>
                  </View>
                </View>
              </RadioButton.Group>
            </>
          )}

          {/* Step 11: Surgery */}
          {step === 11 && (
            <>
              <Text style={styles.sectionTitle}>Surgical History</Text>
              <Text style={styles.label}>
                Did the patient undergo any ear/mastoid surgery in the past?
              </Text>
              <RadioButton.Group
                onValueChange={(value) => handleRadioChange("earMastoidSurgery", value)}
                value={formData.earMastoidSurgery}
              >
                <View style={styles.radioContainer}>
                  <View style={styles.radioButton}>
                    <RadioButton value="Yes" color="#2D9F88" />
                    <Text style={styles.radioText}>Yes</Text>
                  </View>
                  <View style={styles.radioButton}>
                    <RadioButton value="No" color="#2D9F88" />
                    <Text style={styles.radioText}>No</Text>
                  </View>
                </View>
              </RadioButton.Group>
            </>
          )}

          {/* Step 12: Previous Diagnosis */}
          {step === 12 && (
            <>
              <Text style={styles.sectionTitle}>Medical History</Text>
              <Text style={styles.label}>
                Have you ever been diagnosed with a vertigo-related condition in the past?
              </Text>
              <RadioButton.Group
                onValueChange={(value) => handleRadioChange("previousVertigoDiagnosis", value)}
                value={formData.previousVertigoDiagnosis}
              >
                <View style={styles.radioContainer}>
                  <View style={styles.radioButton}>
                    <RadioButton value="Yes" color="#2D9F88" />
                    <Text style={styles.radioText}>Yes</Text>
                  </View>
                  <View style={styles.radioButton}>
                    <RadioButton value="No" color="#2D9F88" />
                    <Text style={styles.radioText}>No</Text>
                  </View>
                </View>
              </RadioButton.Group>
            </>
          )}

          {/* Step 13: Associated Symptoms */}
          {step === 13 && (
            <>
              <Text style={styles.sectionTitle}>Associated Symptoms</Text>
              <Text style={styles.label}>
                What other complaints are associated with vertigo?
              </Text>
              <Text style={styles.sublabel}>(Select all that apply)</Text>

              {[
                "Nausea",
                "Vomiting",
                "Ear symptoms",
                "Headache",
                "Photophobia/phonophobia",
                "Fever",
                "Neck stiffness",
                "Cerebellar symptoms",
                "Cranial nerve dysfunction",
                "Dyspnoea",
                "Palpitation",
              ].map((symptom) => (
                <View key={symptom} style={styles.checkboxContainer}>
                  <Checkbox
                    status={
                      formData.symptoms.includes(symptom)
                        ? "checked"
                        : "unchecked"
                    }
                    onPress={() => handleCheckboxChange("symptoms", symptom)}
                    color="#2D9F88"
                  />
                  <Text style={styles.checkboxText}>{symptom}</Text>
                </View>
              ))}

              {formData.symptoms.includes("Ear symptoms") && (
                <>
                  <Text style={styles.labelIndented}>Ear Symptoms:</Text>
                  {[
                    "Hearing loss",
                    "Tinnitus",
                    "Aural fullness",
                    "Otorrhea",
                    "Otalgia",
                  ].map((symptom) => (
                    <View key={symptom} style={styles.checkboxIndented}>
                      <Checkbox
                        status={
                          formData.earSymptoms.includes(symptom)
                            ? "checked"
                            : "unchecked"
                        }
                        onPress={() =>
                          handleCheckboxChange("earSymptoms", symptom)
                        }
                        color="#2D9F88"
                      />
                      <Text style={styles.checkboxText}>{symptom}</Text>
                    </View>
                  ))}

                  {formData.earSymptoms.includes("Hearing loss") && (
                    <>
                      <Text style={styles.labelIndented}>Hearing loss is:</Text>
                      <RadioButton.Group
                        onValueChange={(value) =>
                          handleRadioChange("hearingLossSide", value)
                        }
                        value={formData.hearingLossSide}
                      >
                        <View style={styles.radioIndented}>
                          <View style={styles.radioButton}>
                            <RadioButton
                              value="UnilateralRight"
                              color="#2D9F88"
                            />
                            <Text style={styles.radioText}>
                              Unilateral Right
                            </Text>
                          </View>
                          <View style={styles.radioButton}>
                            <RadioButton
                              value="UnilateralLeft"
                              color="#2D9F88"
                            />
                            <Text style={styles.radioText}>
                              Unilateral Left
                            </Text>
                          </View>
                          <View style={styles.radioButton}>
                            <RadioButton value="Bilateral" color="#2D9F88" />
                            <Text style={styles.radioText}>Bilateral</Text>
                          </View>
                        </View>
                      </RadioButton.Group>

                      <Text style={styles.labelIndented}>
                        Onset of hearing loss:
                      </Text>
                      <RadioButton.Group
                        onValueChange={(value) =>
                          handleRadioChange("hearingLossOnset", value)
                        }
                        value={formData.hearingLossOnset}
                      >
                        <View style={styles.radioIndented}>
                          <View style={styles.radioButton}>
                            <RadioButton value="Sudden" color="#2D9F88" />
                            <Text style={styles.radioText}>Sudden</Text>
                          </View>
                          <View style={styles.radioButton}>
                            <RadioButton value="Insidious" color="#2D9F88" />
                            <Text style={styles.radioText}>Insidious</Text>
                          </View>
                        </View>
                      </RadioButton.Group>

                      <Text style={styles.labelIndented}>
                        Duration of hearing loss:
                      </Text>
                      <RadioButton.Group
                        onValueChange={(value) =>
                          handleRadioChange("hearingLossDuration", value)
                        }
                        value={formData.hearingLossDuration}
                      >
                        <View style={styles.radioIndented}>
                          <View style={styles.radioButton}>
                            <RadioButton value="Preexisting" color="#2D9F88" />
                            <Text style={styles.radioText}>Preexisting</Text>
                          </View>
                          <View style={styles.radioButton}>
                            <RadioButton
                              value="WithOrFollowing"
                              color="#2D9F88"
                            />
                            <Text style={styles.radioText}>
                              With or following vertigo
                            </Text>
                          </View>
                          <View style={styles.radioButton}>
                            <RadioButton value="Complete" color="#2D9F88" />
                            <Text style={styles.radioText}>
                              Complete hearing loss
                            </Text>
                          </View>
                          <View style={styles.radioButton}>
                            <RadioButton value="Fluctuating" color="#2D9F88" />
                            <Text style={styles.radioText}>
                              Fluctuating hearing loss
                            </Text>
                          </View>
                        </View>
                      </RadioButton.Group>

                      <Text style={styles.labelIndented}>
                        Hearing loss progression:
                      </Text>
                      <RadioButton.Group
                        onValueChange={(value) =>
                          handleRadioChange("hearingLossProgression", value)
                        }
                        value={formData.hearingLossProgression}
                      >
                        <View style={styles.radioIndented}>
                          <View style={styles.radioButton}>
                            <RadioButton
                              value="NonProgressive"
                              color="#2D9F88"
                            />
                            <Text style={styles.radioText}>
                              Non-progressive
                            </Text>
                          </View>
                          <View style={styles.radioButton}>
                            <RadioButton value="Progressive" color="#2D9F88" />
                            <Text style={styles.radioText}>Progressive</Text>
                          </View>
                        </View>
                      </RadioButton.Group>
                    </>
                  )}
                </>
              )}

              {formData.symptoms.includes("Cerebellar symptoms") && (
                <>
                  <Text style={styles.labelIndented}>Cerebellar symptoms:</Text>
                  {[
                    "Unsteady gait/difficulty walking straight",
                    "Dysarthria",
                    "Difficulty combing hair",
                    "Weakness of limbs",
                  ].map((symptom) => (
                    <View key={symptom} style={styles.checkboxIndented}>
                      <Checkbox
                        status={
                          formData.cerebellumSymptoms.includes(symptom)
                            ? "checked"
                            : "unchecked"
                        }
                        onPress={() =>
                          handleCheckboxChange("cerebellumSymptoms", symptom)
                        }
                        color="#2D9F88"
                      />
                      <Text style={styles.checkboxText}>{symptom}</Text>
                    </View>
                  ))}
                </>
              )}

              {formData.symptoms.includes("Cranial nerve dysfunction") && (
                <>
                  <Text style={styles.labelIndented}>
                    Cranial nerve dysfunction:
                  </Text>
                  {[
                    "Hyposmia",
                    "Blurring of vision",
                    "Diplopia",
                    "Loss of sensation on face",
                    "Incomplete closure of eye",
                    "Deviation of angle of mouth",
                    "Alteration of taste",
                    "Difficulty swallowing",
                    "Dysphonia",
                    "Difficulty movements of neck or shoulder",
                    "Difficulty movements of tongue",
                  ].map((symptom) => (
                    <View key={symptom} style={styles.checkboxIndented}>
                      <Checkbox
                        status={
                          formData.cranialNerveSymptoms.includes(symptom)
                            ? "checked"
                            : "unchecked"
                        }
                        onPress={() =>
                          handleCheckboxChange("cranialNerveSymptoms", symptom)
                        }
                        color="#2D9F88"
                      />
                      <Text style={styles.checkboxText}>{symptom}</Text>
                    </View>
                  ))}
                </>
              )}
            </>
          )}

          {/* Step 14: Medication History */}
          {step === 14 && (
            <>
              <Text style={styles.sectionTitle}>Medication History</Text>
              <Text style={styles.label}>
                Is the patient on any drugs or has taken these drugs in the
                recent past?
              </Text>

              <Text style={styles.categoryLabel}>Antiepileptics:</Text>
              {[
                "Carbamazepine",
                "Phenytoin",
                "Valproate",
                "Lamotrigine",
                "Gabapentin",
                "Vigabatrin",
                "Oxcarbazepine",
              ].map((drug) => (
                <View key={drug} style={styles.checkboxContainer}>
                  <Checkbox
                    status={
                      formData.antiepileptics.includes(drug)
                        ? "checked"
                        : "unchecked"
                    }
                    onPress={() => handleCheckboxChange("antiepileptics", drug)}
                    color="#2D9F88"
                  />
                  <Text style={styles.checkboxText}>{drug}</Text>
                </View>
              ))}

              <Text style={styles.categoryLabel}>Antipsychotics:</Text>
              {[
                "Chlorpromazine",
                "Haloperidol",
                "Thioridazine",
                "Risperidone",
                "Olanzapine",
                "Quetiapine",
                "Clozapine",
              ].map((drug) => (
                <View key={drug} style={styles.checkboxContainer}>
                  <Checkbox
                    status={
                      formData.antipsychotics.includes(drug)
                        ? "checked"
                        : "unchecked"
                    }
                    onPress={() => handleCheckboxChange("antipsychotics", drug)}
                    color="#2D9F88"
                  />
                  <Text style={styles.checkboxText}>{drug}</Text>
                </View>
              ))}

              <Text style={styles.categoryLabel}>Ototoxic Drugs:</Text>
              {[
                "Cisplatin",
                "Carboplatin",
                "Aminoglycosides",
                "Loop diuretics",
                "Quinine",
                "Erythromycin",
                "Aspirin",
                "Vancomycin",
              ].map((drug) => (
                <View key={drug} style={styles.checkboxContainer}>
                  <Checkbox
                    status={
                      formData.ototoxicDrugs.includes(drug)
                        ? "checked"
                        : "unchecked"
                    }
                    onPress={() => handleCheckboxChange("ototoxicDrugs", drug)}
                    color="#2D9F88"
                  />
                  <Text style={styles.checkboxText}>{drug}</Text>
                </View>
              ))}

              <Text style={[styles.categoryLabel, { marginTop: Spacing.lg }]}>Medications Taken for Vertigo:</Text>
              {[
                "Benzodiazepines",
                "Labyrinthine sedatives (Cinnarizine, Meclizine, Prochlorperazine, etc)",
                "Betahistine",
                "None of the above",
              ].map((medication) => (
                <View key={medication} style={styles.checkboxContainer}>
                  <Checkbox
                    status={
                      formData.medicationsTaken.includes(medication)
                        ? "checked"
                        : "unchecked"
                    }
                    onPress={() =>
                      handleCheckboxChange("medicationsTaken", medication)
                    }
                    color="#2D9F88"
                  />
                  <Text style={styles.checkboxText}>{medication}</Text>
                </View>
              ))}

              <Text style={[styles.categoryLabel, { marginTop: Spacing.lg }]}>Other Medications</Text>
              <TextInput
                style={styles.input}
                placeholder="List any other medications"
                value={formData.otherMedications}
                onChangeText={(text) => handleInputChange("otherMedications", text)}
              />
            </>
          )}

          {/* Step 15: Treatment History */}
          {step === 15 && (
            <>
              <Text style={styles.sectionTitle}>Treatment History</Text>
              <Text style={styles.label}>
                Has the patient tried any physical maneuvers (e.g., Epley maneuver) or Vestibular Rehabilitation Therapy (VRT)?
              </Text>
              <TextInput
                style={styles.textArea}
                placeholder="Describe previous treatments and outcomes"
                multiline
                numberOfLines={4}
                value={formData.treatmentHistory}
                onChangeText={(text) => handleInputChange("treatmentHistory", text)}
              />
            </>
          )}

          {/* Step 16: Additional Info */}
          {step === 16 && (
            <>
              <Text style={styles.sectionTitle}>Final Step</Text>
              <Text style={styles.label}>
                Any other information you'd like to provide about the patient's condition?
              </Text>
              <TextInput
                style={styles.textArea}
                placeholder="Additional notes"
                multiline
                numberOfLines={4}
                value={formData.additionalInfo}
                onChangeText={(text) => handleInputChange("additionalInfo", text)}
              />
            </>
          )}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {step > 1 && (
            <TouchableOpacity style={styles.navButton} onPress={prevStep}>
              <Text style={styles.buttonText}>Previous</Text>
            </TouchableOpacity>
          )}

          {step < totalSteps ? (
            <TouchableOpacity style={styles.mainButton} onPress={nextStep}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.mainButton} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: colors.lightGray,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primaryDark,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    color: colors.textMedium,
    marginBottom: 6,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.primaryDark,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textDark,
    marginBottom: 8,
  },
  sublabel: {
    fontSize: 14,
    fontStyle: "italic",
    color: colors.textLight,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    backgroundColor: colors.white,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    backgroundColor: colors.white,
    fontSize: 16,
    height: 100,
    textAlignVertical: "top",
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
    marginRight: 8,
  },
  dropdownStyle: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 4,
    backgroundColor: colors.white,
  },
  radioRowContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  radioContainer: {
    marginBottom: 16,
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  radioText: {
    fontSize: 16,
    color: colors.textDark,
  },
  radioIndented: {
    marginLeft: 16,
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  checkboxIndented: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginLeft: 24,
  },
  checkboxText: {
    fontSize: 16,
    color: colors.textDark,
    marginLeft: 8,
    flex: 1,
  },
  durationContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginBottom: 16,
  },
  durationItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
    marginBottom: 8,
  },
  durationInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 10,
    width: 60,
    marginRight: 8,
    textAlign: "center",
  },
  durationLabel: {
    fontSize: 14,
    color: colors.textDark,
  },
  labelIndented: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textDark,
    marginBottom: 8,
    marginLeft: 16,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.mediumGray,
    marginVertical: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  navButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  mainButton: {
    backgroundColor: colors.primaryDark,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default AddPatient;
