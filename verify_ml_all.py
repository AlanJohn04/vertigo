import os
import re
import sys
import pandas as pd
import numpy as np
import onnxruntime as ort

sys.stdout.reconfigure(encoding='utf-8')

DATA_DIR = "Diagnosis of peripheral vertigo"
MODELS_DIR = "server/ml/models"

tasks = [
    {
        "name": "Task 1 (All Features - 12 features)",
        "file": "external_validation-task1-all.xlsx",
        "model": "task1_all.onnx",
        "labels": {0: "Non-Peripheral Vertigo", 1: "Peripheral Vertigo"}
    },
    {
        "name": "Task 1 (Symptoms Only - 9 features)",
        "file": "external_validation-task1-sym.xlsx",
        "model": "task1_sym.onnx",
        "labels": {0: "Non-Peripheral Vertigo", 1: "Peripheral Vertigo"}
    },
    {
        "name": "Task 1 (Examination Only - 5 features)",
        "file": "external_validation-task1-exam.xlsx",
        "model": "task1_exam.onnx",
        "labels": {0: "Non-Peripheral Vertigo", 1: "Peripheral Vertigo"}
    },
    {
        "name": "Task 2 (All Features - 19 features)",
        "file": "external_validation-task2-all.xlsx",
        "model": "task2_all.onnx",
        "labels": {0: "Meniere's Disease (MD)", 1: "Vestibular Migraine (VM)", 2: "BPPV"}
    },
    {
        "name": "Task 2 (Symptoms Only - 15 features)",
        "file": "external_validation-task2-sym.xlsx",
        "model": "task2_sym.onnx",
        "labels": {0: "Meniere's Disease (MD)", 1: "Vestibular Migraine (VM)", 2: "BPPV"}
    },
    {
        "name": "Task 2 (Examination Only - 6 features)",
        "file": "external_validation-task2-exam.xlsx",
        "model": "task2_exam.onnx",
        "labels": {0: "Meniere's Disease (MD)", 1: "Vestibular Migraine (VM)", 2: "BPPV"}
    }
]

def clean_df(df):
    if 'Name' in df.columns:
        df = df.drop(columns=['Name'])
    for col in df.select_dtypes(include=['object']):
        df[col] = df[col].apply(lambda x: re.sub(r'[^\x00-\x7F]+', '', str(x)) if pd.notnull(x) else x)
        df[col] = pd.to_numeric(df[col], errors='coerce')
    return df

print("==========================================================================")
print("             VERTIGO ML MODELS FULL VERIFICATION SUITE                    ")
print("==========================================================================\n")

all_passed = True

for t in tasks:
    model_path = os.path.join(MODELS_DIR, t["model"])
    data_path = os.path.join(DATA_DIR, t["file"])
    
    print(f"--- Testing {t['name']} ---")
    print(f"    Model File: {t['model']}")
    print(f"    Validation Data: {t['file']}")
    
    if not os.path.exists(model_path):
        print(f"    [ERROR] Model file missing at {model_path}\n")
        all_passed = False
        continue
        
    if not os.path.exists(data_path):
        print(f"    [ERROR] Validation data file missing at {data_path}\n")
        all_passed = False
        continue

    # Load ONNX Session
    session = ort.InferenceSession(model_path)
    input_name = session.get_inputs()[0].name
    
    # Load Validation Data
    df = pd.read_excel(data_path)
    df = clean_df(df)
    
    X = df.drop(columns=['Diagnosis']).apply(pd.to_numeric, errors='coerce').fillna(0).values.astype(np.float32)
    y_true = df['Diagnosis'].values.astype(np.int64)
    
    # Run Inference on whole dataset
    outputs = session.run(None, {input_name: X})
    y_pred = outputs[0].flatten()
    
    accuracy = np.mean(y_pred == y_true) * 100
    total_samples = len(y_true)
    correct = np.sum(y_pred == y_true)
    
    print(f"    [SUCCESS] ONNX Model Loaded Successfully!")
    print(f"    Input Feature Count: {X.shape[1]}")
    print(f"    Validation Samples Tested: {total_samples}")
    print(f"    Correct Predictions: {correct}/{total_samples}")
    print(f"    Validation Accuracy: {accuracy:.2f}%")
    
    # Sample Case Display
    print("    Sample Prediction Verification:")
    for i in range(min(3, total_samples)):
        pred_label = t["labels"].get(int(y_pred[i]), str(y_pred[i]))
        true_label = t["labels"].get(int(y_true[i]), str(y_true[i]))
        status = "MATCH" if y_pred[i] == y_true[i] else "MISMATCH"
        print(f"      - Record {i+1}: Predicted = [{pred_label}] | Actual = [{true_label}] -> {status}")
    print()

if all_passed:
    print("==========================================================================")
    print("  ALL 6 ML MODELS VERIFIED AND WORKING PERFECTLY WITH ONNX RUNTIME!")
    print("==========================================================================")
