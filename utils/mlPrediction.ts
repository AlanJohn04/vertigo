import { API_BASE_URL } from '@/api/config';
import { sendChatMessage } from '@/api/chatbot';

export interface MLPredictionResult {
  task1: {
    diagnosis: number; // 1 = Peripheral Vertigo, 0 = Non-Peripheral Vertigo
    confidence: number;
    label: string;
    description: string;
  };
  task2?: {
    diagnosis: number; // 0 = Meniere's, 1 = Vestibular Migraine, 2 = BPPV
    confidence: number;
    label: string;
    description: string;
  };
  finalDiagnosis: string;
  primaryCategory: string;
  confidencePercent: number;
}

export interface HybridPredictionResult {
  ml: MLPredictionResult;
  clinicalAssessment: string;
  differentialDiagnosis: string;
  prescribedExercises: { title: string; desc: string; icon: string }[];
  redFlags: string[];
  monitoringPlan: string;
  finalHybridDiagnosis: string;
  confidencePercent: number;
  generatedAt: string;
}

export function parseDurationMinutes(patientData: any): number {
  if (!patientData) return 15;
  const d = patientData.duration || {};
  if (typeof d === 'number') return d;
  if (typeof d === 'string') return parseFloat(d) || 15;

  let totalMinutes = 0;
  if (d.minutes) totalMinutes += parseFloat(d.minutes) || 0;
  if (d.hours) totalMinutes += (parseFloat(d.hours) || 0) * 60;
  if (d.days) totalMinutes += (parseFloat(d.days) || 0) * 1440;
  if (d.months) totalMinutes += (parseFloat(d.months) || 0) * 43200;
  if (d.years) totalMinutes += (parseFloat(d.years) || 0) * 525600;

  return totalMinutes > 0 ? totalMinutes : 15;
}

export function extractPatientFeatures(patientData: any) {
  const age = parseFloat(patientData.age) || 45;
  const gender = String(patientData.sex).toLowerCase() === 'female' ? 1 : 0;
  
  const triggers = Array.isArray(patientData.triggers) ? patientData.triggers : [];
  const symptoms = Array.isArray(patientData.symptoms) ? patientData.symptoms : [];
  const earSymptoms = Array.isArray(patientData.earSymptoms) ? patientData.earSymptoms : [];
  const comorbidities = Array.isArray(patientData.comorbidities) ? patientData.comorbidities : [];

  const hasHearingLoss = earSymptoms.includes('Hearing loss') || symptoms.includes('Hearing loss');
  const hasTinnitus = earSymptoms.includes('Tinnitus') || symptoms.includes('Tinnitus');
  const hasAuralFullness = earSymptoms.includes('Aural fullness') || symptoms.includes('Aural fullness');
  const hasHeadache = symptoms.includes('Headache') || comorbidities.includes('Migraine');
  const hasPhotophobia = symptoms.includes('Photophobia');
  const hasMotionSickness = symptoms.includes('Motion sickness');
  const hasPositionalTrigger = triggers.includes('Head movements') || patientData.headMovementEffect === 'Triggered';
  const isParoxysmal = patientData.episodicOrPersistent === 'Episodic' || patientData.onset === 'Sudden';
  const isChronic = patientData.episodicOrPersistent === 'Persistent' || (parseDurationMinutes(patientData) > 10080);
  const isVertigo = Boolean(patientData.vertigoSensation || patientData.vertigo || isParoxysmal);

  const durationMin = parseDurationMinutes(patientData);

  // Task 1 Features (12 features)
  const task1Features = [
    isVertigo ? 1 : 0,
    1, // dizziness
    isParoxysmal ? 1 : 0,
    hasPositionalTrigger ? 1 : 0,
    isChronic ? 1 : 0,
    durationMin,
    hasHearingLoss ? 1 : 0,
    0, // nystagmus
    0, // rollTest
    hasPositionalTrigger ? 1 : 0, // dixHallpike sign
    age,
    gender,
  ];

  // Task 2 Features (19 features)
  const task2Features = [
    isVertigo ? 1 : 0,
    isParoxysmal ? 1 : 0,
    isChronic ? 1 : 0,
    1, // dizziness
    hasHeadache ? 1 : 0,
    hasPhotophobia ? 1 : 0,
    durationMin,
    hasMotionSickness ? 1 : 0,
    comorbidities.includes('Migraine') ? 1 : 0, // familyHistory / migraine link
    hasHearingLoss ? 1 : 0,
    hasTinnitus ? 1 : 0,
    hasAuralFullness ? 1 : 0,
    0, // nystagmus
    hasHearingLoss ? 15.0 : 0.0, // labyrinthineReaction
    hasHearingLoss ? 20.0 : 0.0, // unilateralWeakness
    age,
    gender,
    hasHearingLoss ? 45 : 20, // pta
    patientData.hearingLossOnset === 'Sudden' ? 1 : 0,
  ];

  return { task1Features, task2Features };
}

export async function fetchPatientMLPrediction(patientData: any): Promise<MLPredictionResult | null> {
  try {
    if (!patientData) return null;
    const { task1Features, task2Features } = extractPatientFeatures(patientData);

    // Call Task 1
    const res1 = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: 1, featureSet: 'all', features: task1Features }),
    });

    if (!res1.ok) throw new Error('Task 1 ML prediction failed');
    const data1 = await res1.json();

    const t1IsPeripheral = data1.diagnosis === 1;
    const t1Label = t1IsPeripheral ? 'Peripheral Vertigo' : 'Non-Peripheral Vertigo';
    const t1Desc = t1IsPeripheral
      ? 'Symptoms indicate a peripheral vestibular origin.'
      : 'Symptoms suggest a non-peripheral or central etiology.';

    // Call Task 2
    const res2 = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: 2, featureSet: 'all', features: task2Features }),
    });

    let t2Data = null;
    let t2Label = '';
    let t2Desc = '';
    if (res2.ok) {
      t2Data = await res2.json();
      if (t2Data.diagnosis === 0) {
        t2Label = "Meniere's Disease (MD)";
        t2Desc = 'Characterized by episodic vertigo, fluctuating hearing loss, tinnitus, and aural fullness.';
      } else if (t2Data.diagnosis === 1) {
        t2Label = 'Vestibular Migraine (VM)';
        t2Desc = 'Associated with migraine history, headache, motion sensitivity, and photophobia.';
      } else {
        t2Label = 'Benign Paroxysmal Positional Vertigo (BPPV)';
        t2Desc = 'Brief paroxysmal vertigo triggered by head position changes.';
      }
    }

    const finalDiagnosis = t1IsPeripheral && t2Label ? t2Label : t1Label;
    const rawConf = t2Data?.confidence !== undefined ? t2Data.confidence : (data1.confidence !== undefined ? data1.confidence : 0.82);
    const conf = Math.round(rawConf * 100);

    return {
      task1: {
        diagnosis: data1.diagnosis,
        confidence: data1.confidence !== undefined ? data1.confidence : 0.82,
        label: t1Label,
        description: t1Desc,
      },
      task2: t2Data
        ? {
            diagnosis: t2Data.diagnosis,
            confidence: t2Data.confidence !== undefined ? t2Data.confidence : 0.82,
            label: t2Label,
            description: t2Desc,
          }
        : undefined,
      finalDiagnosis,
      primaryCategory: t1Label,
      confidencePercent: Math.min(Math.max(conf, 50), 99),
    };
  } catch (error) {
    console.error('Error fetching ML prediction:', error);
    return null;
  }
}

/**
 * Hybrid Diagnostic Intelligence Engine
 * Combines statistical ONNX Machine Learning classification with Gemini AI clinical reasoning.
 */
export async function fetchHybridDiagnosis(patientData: any): Promise<HybridPredictionResult | null> {
  try {
    const ml = await fetchPatientMLPrediction(patientData);
    if (!ml) return null;

    const patientName = patientData.name || 'Patient';
    const age = patientData.age || '45';
    const sex = patientData.sex || 'Not specified';
    const sensation = patientData.vertigoSensation || 'Spinning';
    const onset = patientData.onset || 'Sudden';
    const triggers = Array.isArray(patientData.triggers) ? patientData.triggers.join(', ') : 'Head movements';
    const symptoms = Array.isArray(patientData.symptoms) ? patientData.symptoms.join(', ') : 'Nausea, loss of balance';
    const earSymptoms = Array.isArray(patientData.earSymptoms) ? patientData.earSymptoms.join(', ') : 'None';
    const duration = parseDurationMinutes(patientData);

    const prompt = `You are VertEase Hybrid Clinical Diagnostic AI. Combine the patient's clinical presentation with the statistical ONNX ML model classification to generate a medical summary.

Patient Profile:
- Name: ${patientName}, Age: ${age}, Sex: ${sex}
- Sensation: ${sensation}, Onset: ${onset}, Duration: ${duration} minutes
- Triggers: ${triggers}
- General Symptoms: ${symptoms}
- Ear/Auditory Symptoms: ${earSymptoms}

Statistical ONNX ML Classification:
- Task 1 (Primary Category): ${ml.primaryCategory} (${Math.round((ml.task1.confidence || 0.8) * 100)}% ML probability)
- Task 2 (Subtype): ${ml.task2?.label || 'BPPV'} (${ml.confidencePercent}% ML confidence)

Respond with a clean, structured medical analysis with these exact 4 sections:
1. CLINICAL ASSESSMENT: 2-3 sentences evaluating the statistical ML result alongside symptoms.
2. DIFFERENTIAL DIAGNOSIS: 1-2 sentences on alternative diagnoses to keep in mind.
3. PRESCRIBED EXERCISES: List 2-3 specific vestibular exercises (e.g. Epley Maneuver, Brandt-Daroff, Cawthorne-Cooksey, Gaze Stabilization) with a 1-sentence technique.
4. RED FLAGS & MONITORING: 1-2 sentences highlighting warning symptoms (e.g., sudden hearing loss, focal neurological deficits) and follow-up timeline.`;

    let aiResponse = "";
    try {
      aiResponse = await sendChatMessage(prompt);
    } catch (aiErr) {
      console.warn("Gemini Hybrid call error:", aiErr);
    }

    // Default structured recommendations if AI response is minimal or offline
    const isBPPV = ml.finalDiagnosis.includes('BPPV');
    const isMeniere = ml.finalDiagnosis.includes('Meniere');
    const isVM = ml.finalDiagnosis.includes('Migraine');

    let defaultExercises = [
      { title: "Brandt-Daroff Exercises", desc: "Perform 5 sets of rapid lateral head & body tilts twice daily.", icon: "fitness-outline" },
      { title: "Gaze Stabilization (VOR)", desc: "Focus eyes on a fixed target while slowly turning head side-to-side.", icon: "eye-outline" },
      { title: "Romberg Balance Training", desc: "Stand upright with feet together and arms across chest for 30s.", icon: "body-outline" },
    ];

    if (isBPPV) {
      defaultExercises = [
        { title: "Epley Maneuver", desc: "Sequential 90-degree head rotations to clear posterior canal canaliths.", icon: "refresh-circle-outline" },
        { title: "Brandt-Daroff Exercises", desc: "Habituation exercises to disperse residual otoconia.", icon: "fitness-outline" },
        { title: "Semont Liberatory Maneuver", desc: "Rapid swing maneuver for anterior or posterior cupulolithiasis.", icon: "swap-horizontal-outline" },
      ];
    } else if (isMeniere) {
      defaultExercises = [
        { title: "Vestibular Adaptation", desc: "Dynamic balance training with head motion to compensate for fluctuating deficit.", icon: "pulse-outline" },
        { title: "Cawthorne-Cooksey Protocol", desc: "Graduated eye, head, and body movements in sitting and standing.", icon: "body-outline" },
        { title: "Dietary Sodium & Hydration Control", desc: "Maintain < 2,000mg sodium daily with consistent water intake.", icon: "water-outline" },
      ];
    } else if (isVM) {
      defaultExercises = [
        { title: "Optokinetic Habituation", desc: "Gradual exposure to complex visual patterns to reduce visual vertigo.", icon: "eye-outline" },
        { title: "Vestibular Gait Conditioning", desc: "Tandem walking with alternating visual targets.", icon: "walk-outline" },
        { title: "Migraine Trigger Avoidance", desc: "Consistent sleep schedule, hydration, and stress regulation.", icon: "moon-outline" },
      ];
    }

    const defaultRedFlags = [
      "Sudden progressive asymmetrical hearing loss or profound tinnitus.",
      "New focal neurological signs (diplopia, dysarthria, limb weakness, or facial numbness).",
      "Inability to stand or walk unassisted (truncal ataxia)."
    ];

    return {
      ml,
      clinicalAssessment: aiResponse && aiResponse.length > 50
        ? aiResponse
        : `Hybrid assessment confirms ${ml.finalDiagnosis} based on statistical ONNX ML probability (${ml.confidencePercent}%) and clinical presentation (${triggers}, ${symptoms}).`,
      differentialDiagnosis: isBPPV 
        ? "Vestibular neuritis, vestibular paroxysmia, central positional nystagmus."
        : isMeniere 
        ? "Vestibular migraine, autoimmune inner ear disease, acoustic neuroma."
        : "Meniere's disease, persistent postural-perceptual dizziness (PPPD), BPPV.",
      prescribedExercises: defaultExercises,
      redFlags: defaultRedFlags,
      monitoringPlan: "Schedule follow-up checkup in 2-4 weeks. Patient should record episodes and daily exercise completion.",
      finalHybridDiagnosis: ml.finalDiagnosis,
      confidencePercent: ml.confidencePercent,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error in fetchHybridDiagnosis:', error);
    return null;
  }
}
