import * as ort from 'onnxruntime-node';
import path from 'path';
import { extractPatientFeatures } from '../utils/mlPrediction';

async function testVariations() {
  const t1Session = await ort.InferenceSession.create(path.join(__dirname, '../server/ml/models/task1_all.onnx'));
  const t2Session = await ort.InferenceSession.create(path.join(__dirname, '../server/ml/models/task2_all.onnx'));

  const patients = [
    {
      name: "Patient 1: Classic BPPV",
      age: "62",
      sex: "Female",
      vertigoSensation: "Spinning",
      onset: "Sudden",
      episodicOrPersistent: "Episodic",
      triggers: ["Head movements"],
      headMovementEffect: "Triggered",
      duration: { minutes: "2" },
      symptoms: ["Nausea"],
      earSymptoms: [],
      comorbidities: []
    },
    {
      name: "Patient 2: Classic Meniere's Disease",
      age: "48",
      sex: "Male",
      vertigoSensation: "Spinning",
      onset: "Sudden",
      episodicOrPersistent: "Episodic",
      triggers: ["Stress"],
      duration: { hours: "3" },
      symptoms: ["Nausea", "Vomiting"],
      earSymptoms: ["Hearing loss", "Tinnitus", "Aural fullness"],
      hearingLossOnset: "Sudden",
      comorbidities: []
    },
    {
      name: "Patient 3: Classic Vestibular Migraine",
      age: "28",
      sex: "Female",
      vertigoSensation: "Spinning",
      onset: "Sudden",
      episodicOrPersistent: "Episodic",
      triggers: ["Bright lights", "Lack of sleep"],
      duration: { hours: "6" },
      symptoms: ["Headache", "Photophobia", "Motion sickness"],
      earSymptoms: [],
      comorbidities: ["Migraine"]
    },
    {
      name: "Patient 4: Non-Peripheral / Central Dizziness",
      age: "70",
      sex: "Male",
      vertigoSensation: "",
      onset: "Gradual",
      episodicOrPersistent: "Persistent",
      triggers: [],
      duration: { years: "2" },
      symptoms: ["Unsteadiness"],
      earSymptoms: [],
      comorbidities: ["Hypertension"]
    }
  ];

  for (const p of patients) {
    const { task1Features, task2Features } = extractPatientFeatures(p);
    
    // Task 1
    const t1Input = new ort.Tensor('float32', Float32Array.from(task1Features), [1, 12]);
    const t1Res = await t1Session.run({ [t1Session.inputNames[0]]: t1Input });
    const t1Label = Number(t1Res[t1Session.outputNames[0]].data[0]);
    const t1Raw = Array.from(t1Res[t1Session.outputNames[1]].data as any) as number[];
    // Convert margin to probability via sigmoid if margin or softmax
    const t1Margin = t1Raw[1] || 0;
    const t1Prob = 1 / (1 + Math.exp(-t1Margin));

    // Task 2
    const t2Input = new ort.Tensor('float32', Float32Array.from(task2Features), [1, 19]);
    const t2Res = await t2Session.run({ [t2Session.inputNames[0]]: t2Input });
    const t2Label = Number(t2Res[t2Session.outputNames[0]].data[0]);
    const t2Probs = Array.from(t2Res[t2Session.outputNames[1]].data as any) as number[];

    const labels = ["Meniere's Disease", "Vestibular Migraine", "BPPV"];
    const predictedT2 = labels[t2Label] || "Unknown";
    const t2Conf = t2Probs[t2Label];

    console.log(`\n========================================`);
    console.log(`Patient: ${p.name}`);
    console.log(`Task 1: ${t1Label === 1 ? "Peripheral Vertigo" : "Non-Peripheral Vertigo"} (Confidence: ${(t1Prob * 100).toFixed(1)}%)`);
    console.log(`Task 2 Prediction: ${predictedT2} (Confidence: ${(t2Conf * 100).toFixed(1)}%)`);
    console.log(`Task 2 Probabilities: Meniere's: ${(t2Probs[0]*100).toFixed(1)}%, VM: ${(t2Probs[1]*100).toFixed(1)}%, BPPV: ${(t2Probs[2]*100).toFixed(1)}%`);
  }
}

testVariations();
