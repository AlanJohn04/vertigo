import 'dotenv/config';
import { fetchHybridDiagnosis } from '../utils/mlPrediction';

async function runHybridTest() {
  console.log("=== Testing Hybrid ML + Gemini Diagnosis ===");
  const testPatient = {
    name: "John Doe",
    age: "52",
    sex: "Male",
    vertigoSensation: "Spinning",
    onset: "Sudden",
    episodicOrPersistent: "Episodic",
    triggers: ["Head movements", "Rolling in bed"],
    headMovementEffect: "Triggered",
    duration: { minutes: "3" },
    symptoms: ["Nausea", "Unsteadiness"],
    earSymptoms: [],
    comorbidities: []
  };

  const hybrid = await fetchHybridDiagnosis(testPatient);
  console.log("Hybrid Diagnosis Result:", JSON.stringify(hybrid, null, 2));
}

runHybridTest();
