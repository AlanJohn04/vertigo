import pandas as pd
import glob
import os

print("=== Task 1 Columns ===")
for f in glob.glob("Diagnosis of peripheral vertigo/*task1*.xlsx"):
    df = pd.read_excel(f)
    print(f"\nFile: {os.path.basename(f)} (Shape: {df.shape})")
    print("Columns:", list(df.columns))
    print("Target head / distribution:", df.iloc[:, -1].value_counts().to_dict() if df.shape[1]>0 else "")

print("\n=== Task 2 Columns ===")
for f in glob.glob("Diagnosis of peripheral vertigo/*task2*.xlsx"):
    df = pd.read_excel(f)
    print(f"\nFile: {os.path.basename(f)} (Shape: {df.shape})")
    print("Columns:", list(df.columns))
    print("Target head / distribution:", df.iloc[:, -1].value_counts().to_dict() if df.shape[1]>0 else "")
