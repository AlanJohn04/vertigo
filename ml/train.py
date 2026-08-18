"""
VertEase — Vertigo Diagnosis ML Training Script (v2)
====================================================
Trains a multi-class classifier on the 2,500-patient synthetic dataset
(vertigo_app_training_data.csv) containing 25 vestibular diagnoses with
categorical text features aligned to the app's questionnaire flow.

Key design decisions:
  - All categorical text columns are one-hot encoded (multi-select fields like
    triggers and associated_complaints are multi-label binarized first).
  - age and duration_value/episode_duration_value are treated as numeric.
  - Missing/NA values are handled gracefully.
  - GPU is used for XGBoost (device='cuda') and LightGBM (device='gpu').
  - Best model is exported as a single ONNX file.
  - Label mapping (diagnosis <-> integer) is saved as JSON for the server.
"""

import pandas as pd
import numpy as np
import os
import json
import warnings
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, classification_report
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
import xgboost as xgb
import lightgbm as lgb
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
import skl2onnx
from skl2onnx.common.data_types import FloatTensorType
from onnxmltools.convert.common.data_types import FloatTensorType as OnnxmlFloatTensorType

warnings.filterwarnings('ignore')

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(SCRIPT_DIR, 'data', 'vertigo_app_training_data.csv')
MODELS_DIR = os.path.join(SCRIPT_DIR, '..', 'server', 'ml', 'models')
LABEL_MAP_PATH = os.path.join(MODELS_DIR, 'label_map.json')
FEATURE_COLS_PATH = os.path.join(MODELS_DIR, 'feature_columns.json')

os.makedirs(MODELS_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Multi-select columns (semicolon-separated values)
# ---------------------------------------------------------------------------
MULTI_SELECT_COLS = [
    'comorbidities', 'triggers', 'associated_complaints',
    'ear_symptoms_detail', 'cerebellar_symptoms_detail',
    'cranial_nerve_symptoms_detail'
]

# Single-select categorical columns
SINGLE_CAT_COLS = [
    'sex', 'presenting_symptom', 'onset', 'duration_unit',
    'sensation_type', 'episodic_or_persistent',
    'episode_duration_unit', 'remission_between_episodes',
    'head_movement_triggered_or_aggravated', 'recent_head_injury',
    'hearing_loss_laterality', 'hearing_loss_onset',
    'hearing_loss_timing', 'hearing_loss_progression',
    'drug_history_category', 'drug_history_detail',
    'post_onset_medication'
]

# Numeric columns
NUMERIC_COLS = ['age', 'duration_value', 'episode_duration_value']


def load_and_preprocess(csv_path: str):
    """Load CSV, encode features, return X (DataFrame), y (Series), label_encoder."""
    print(f"Loading data from {csv_path}...")
    df = pd.read_csv(csv_path)
    print(f"  Loaded {len(df)} records with {len(df['diagnosis'].unique())} diagnoses")

    # Encode diagnosis labels
    le = LabelEncoder()
    y = le.fit_transform(df['diagnosis'])
    print(f"  Diagnoses: {list(le.classes_)}")

    # --- Numeric columns ---
    feature_frames = []

    for col in NUMERIC_COLS:
        series = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(float)
        feature_frames.append(series.to_frame(col))

    # --- Multi-select columns (multi-label binarize) ---
    for col in MULTI_SELECT_COLS:
        # Collect all unique individual values across all rows
        all_vals = set()
        for val in df[col].dropna():
            val = str(val).strip()
            if val and val not in ('NA', 'Not asked / unknown', 'No comorbidities',
                                    'No associated complaints reported', 'None reported / spontaneous'):
                for v in val.split(';'):
                    v = v.strip()
                    if v:
                        all_vals.add(v)

        all_vals = sorted(all_vals)
        # Create binary columns
        for v in all_vals:
            col_name = f"{col}__{v}"
            feature_frames.append(
                df[col].apply(lambda x: 1.0 if pd.notnull(x) and v in str(x) else 0.0)
                .to_frame(col_name)
            )

    # --- Single-select categorical columns (one-hot) ---
    for col in SINGLE_CAT_COLS:
        # Clean and fill NA
        series = df[col].fillna('NA').astype(str).str.strip()
        dummies = pd.get_dummies(series, prefix=col, dtype=float)
        feature_frames.append(dummies)

    X = pd.concat(feature_frames, axis=1)

    # Replace any remaining NaN with 0
    X = X.fillna(0.0)

    print(f"  Feature matrix: {X.shape[0]} samples × {X.shape[1]} features")
    return X, pd.Series(y, name='diagnosis'), le


def get_models():
    """Return dict of candidate models, GPU-first with CPU fallback."""
    models = {
        'Random Forest': RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1),
        'Logistic Regression': LogisticRegression(max_iter=2000, random_state=42, n_jobs=-1),
        'XGBoost (GPU)': xgb.XGBClassifier(
            random_state=42, eval_metric='mlogloss',
            tree_method='hist', device='cuda',
            n_estimators=200, learning_rate=0.1, max_depth=8
        ),
        'LightGBM (GPU)': lgb.LGBMClassifier(
            random_state=42, device='gpu',
            n_estimators=200, learning_rate=0.1, max_depth=8, verbose=-1
        ),
    }
    return models


def train_model():
    """Main training routine."""
    X, y, le = load_and_preprocess(DATA_PATH)

    # Save feature column names for server-side encoding
    feature_cols = list(X.columns)
    with open(FEATURE_COLS_PATH, 'w') as f:
        json.dump(feature_cols, f, indent=2)
    print(f"  Saved {len(feature_cols)} feature column names to {FEATURE_COLS_PATH}")

    # Save label map
    label_map = {int(i): name for i, name in enumerate(le.classes_)}
    with open(LABEL_MAP_PATH, 'w') as f:
        json.dump(label_map, f, indent=2)
    print(f"  Saved label map ({len(label_map)} diagnoses) to {LABEL_MAP_PATH}")

    # Train/test split (stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\n  Train: {len(X_train)}, Test: {len(X_test)}")

    models = get_models()
    best_acc = 0
    best_name = ""
    best_pipeline = None

    for name, model in models.items():
        print(f"\n  Training {name}...")
        try:
            pipeline = ImbPipeline([
                ('imputer', SimpleImputer(strategy='constant', fill_value=0)),
                ('scaler', StandardScaler()),
                ('smote', SMOTE(random_state=42, k_neighbors=min(5, min(np.bincount(y_train)) - 1)
                                if min(np.bincount(y_train)) > 1 else 1)),
                ('classifier', model)
            ])
            pipeline.fit(X_train, y_train)
        except Exception as e:
            err_str = str(e).lower()
            if 'gpu' in err_str or 'cuda' in err_str or 'clgetdeviceids' in err_str or 'device' in err_str:
                print(f"    GPU failed for {name}, falling back to CPU...")
                if 'xgboost' in name.lower():
                    model = xgb.XGBClassifier(
                        random_state=42, eval_metric='mlogloss',
                        tree_method='hist', n_estimators=200,
                        learning_rate=0.1, max_depth=8
                    )
                elif 'lightgbm' in name.lower():
                    model = lgb.LGBMClassifier(
                        random_state=42, n_estimators=200,
                        learning_rate=0.1, max_depth=8, verbose=-1
                    )
                name = name.replace('(GPU)', '(CPU)')
                try:
                    pipeline = ImbPipeline([
                        ('imputer', SimpleImputer(strategy='constant', fill_value=0)),
                        ('scaler', StandardScaler()),
                        ('smote', SMOTE(random_state=42,
                                        k_neighbors=min(5, min(np.bincount(y_train)) - 1)
                                        if min(np.bincount(y_train)) > 1 else 1)),
                        ('classifier', model)
                    ])
                    pipeline.fit(X_train, y_train)
                except Exception as e2:
                    print(f"    CPU fallback also failed: {e2}")
                    continue
            else:
                print(f"    Error training {name}: {e}")
                continue

        y_pred = pipeline.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        print(f"    Test Accuracy: {acc:.4f}")
        print(classification_report(y_test, y_pred, target_names=le.classes_, zero_division=0))

        if acc > best_acc:
            best_acc = acc
            best_name = name
            best_pipeline = pipeline

    print(f"\n{'='*60}")
    print(f"Best Model: {best_name} (Accuracy: {best_acc:.4f})")
    print(f"{'='*60}")

    # --- Export to ONNX ---
    if best_pipeline:
        export_to_onnx(best_pipeline, best_name, X_train.shape[1], le)


def export_to_onnx(pipeline, model_name, n_features, le):
    """Export the trained pipeline to ONNX format."""
    print(f"\nExporting {model_name} to ONNX...")

    # Create inference pipeline (without SMOTE -- only used during training)
    inference_pipeline = Pipeline([
        ('imputer', pipeline.named_steps['imputer']),
        ('scaler', pipeline.named_steps['scaler']),
        ('classifier', pipeline.named_steps['classifier'])
    ])

    # Use onnxmltools FloatTensorType for LightGBM/XGBoost compatibility
    is_lgbm = 'lightgbm' in model_name.lower()
    is_xgb = 'xgboost' in model_name.lower()
    use_onnxml_type = is_lgbm or is_xgb

    if use_onnxml_type:
        initial_type = [('float_input', OnnxmlFloatTensorType([None, n_features]))]
    else:
        initial_type = [('float_input', FloatTensorType([None, n_features]))]

    try:
        # Register converters for XGBoost and LightGBM
        from skl2onnx import update_registered_converter

        if is_xgb:
            from onnxmltools.convert.xgboost.operator_converters.XGBoost import convert_xgboost
            from onnxmltools.convert.xgboost.shape_calculators.Classifier import calculate_xgboost_classifier_output_shapes
            update_registered_converter(
                xgb.XGBClassifier, 'XGBoostXGBClassifier',
                calculate_xgboost_classifier_output_shapes, convert_xgboost,
                options={'nocl': [True, False], 'zipmap': [True, False, 'columns']}
            )
        elif is_lgbm:
            from onnxmltools.convert.lightgbm.operator_converters.LightGbm import convert_lightgbm
            from onnxmltools.convert.lightgbm.shape_calculators.Classifier import calculate_lightgbm_classifier_output_shapes
            update_registered_converter(
                lgb.LGBMClassifier, 'LightGbmLGBMClassifier',
                calculate_lightgbm_classifier_output_shapes, convert_lightgbm,
                options={'nocl': [True, False], 'zipmap': [True, False, 'columns']}
            )

        onnx_model = skl2onnx.convert_sklearn(
            inference_pipeline, initial_types=initial_type, target_opset=12,
            options={type(inference_pipeline.named_steps['classifier']): {'zipmap': False}}
        )

        model_path = os.path.join(MODELS_DIR, 'vertigo_diagnosis.onnx')
        with open(model_path, 'wb') as f:
            f.write(onnx_model.SerializeToString())
        print(f"  [OK] Exported ONNX model to {model_path}")

    except Exception as e:
        print(f"  [WARN] ONNX export failed for {model_name}: {e}")
        print("  Training fallback Random Forest for guaranteed ONNX export...")

        rf_pipeline = ImbPipeline([
            ('imputer', SimpleImputer(strategy='constant', fill_value=0)),
            ('scaler', StandardScaler()),
            ('smote', SMOTE(random_state=42)),
            ('classifier', RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1))
        ])

        # Re-load data for retraining
        X, y, _ = load_and_preprocess(DATA_PATH)
        X_train, _, y_train, _ = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        rf_pipeline.fit(X_train, y_train)

        inf_pipe = Pipeline([
            ('imputer', rf_pipeline.named_steps['imputer']),
            ('scaler', rf_pipeline.named_steps['scaler']),
            ('classifier', rf_pipeline.named_steps['classifier'])
        ])

        onnx_model = skl2onnx.convert_sklearn(
            inf_pipe,
            initial_types=[('float_input', FloatTensorType([None, n_features]))],
            target_opset=12,
            options={type(rf_pipeline.named_steps['classifier']): {'zipmap': False}}
        )
        model_path = os.path.join(MODELS_DIR, 'vertigo_diagnosis.onnx')
        with open(model_path, 'wb') as f:
            f.write(onnx_model.SerializeToString())
        print(f"  [OK] Exported fallback RF ONNX model to {model_path}")


if __name__ == '__main__':
    train_model()
    print("\nTraining complete! Model and metadata exported to server/ml/models/")
