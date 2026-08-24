import * as ort from 'onnxruntime-node';
import path from 'path';

async function testONNX() {
  console.log("=== Testing Task 1 All Model ===");
  const t1Path = path.join(__dirname, '../server/ml/models/task1_all.onnx');
  const t1Session = await ort.InferenceSession.create(t1Path);
  console.log("T1 Input names:", t1Session.inputNames);
  console.log("T1 Output names:", t1Session.outputNames);

  // Sample features for patient (12 features)
  const t1Features = [1, 1, 1, 1, 0, 15, 0, 0, 0, 1, 45, 1];
  const t1Input = new ort.Tensor('float32', Float32Array.from(t1Features), [1, 12]);
  const t1Results = await t1Session.run({ [t1Session.inputNames[0]]: t1Input });
  console.log("T1 Results keys:", Object.keys(t1Results));
  for (const key of Object.keys(t1Results)) {
    console.log(`T1 Output [${key}]:`, t1Results[key].data, "type:", t1Results[key].type, "dims:", t1Results[key].dims);
  }

  console.log("\n=== Testing Task 2 All Model ===");
  const t2Path = path.join(__dirname, '../server/ml/models/task2_all.onnx');
  const t2Session = await ort.InferenceSession.create(t2Path);
  console.log("T2 Input names:", t2Session.inputNames);
  console.log("T2 Output names:", t2Session.outputNames);

  // Sample features for patient (19 features)
  const t2Features = [1, 1, 0, 1, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 45, 1, 20, 0];
  const t2Input = new ort.Tensor('float32', Float32Array.from(t2Features), [1, 19]);
  const t2Results = await t2Session.run({ [t2Session.inputNames[0]]: t2Input });
  console.log("T2 Results keys:", Object.keys(t2Results));
  for (const key of Object.keys(t2Results)) {
    console.log(`T2 Output [${key}]:`, t2Results[key].data, "type:", t2Results[key].type, "dims:", t2Results[key].dims);
  }
}

testONNX();
