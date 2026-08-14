import pandas as pd
import numpy as np
import os
import re
from sklearn.model_selection import StratifiedKFold
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
import xgboost as xgb
import lightgbm as lgb
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
import skl2onnx
from skl2onnx.common.data_types import FloatTensorType
import warnings

warnings.filterwarnings('ignore')

DATA_DIR = 'Diagnosis of peripheral vertigo'
MODELS_DIR = 'server/ml/models'

os.makedirs(MODELS_DIR, exist_ok=True)

def clean_data(df):
    if 'Name' in df.columns:
        df = df.drop(columns=['Name'])
    
    # Clean zero width spaces and other weird characters in strings
    for col in df.select_dtypes(include=['object']):
        df[col] = df[col].apply(lambda x: re.sub(r'[^\x00-\x7F]+', '', str(x)) if pd.notnull(x) else x)
        # Try converting back to numeric
        df[col] = pd.to_numeric(df[col], errors='coerce')
    
    return df

def get_models(is_multiclass):
    models = {
        'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
        'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
        'SVM': SVC(probability=True, random_state=42),
        'XGBoost': xgb.XGBClassifier(
            random_state=42, 
            eval_metric='logloss',
            tree_method='hist', # 'gpu_hist' is deprecated, 'hist' with device='cuda' is the new way, but to be safe and fall back nicely, 'hist' is good
            device='cuda' # Try GPU, XGBoost will fall back or error if not found, let's wrap in try/catch or just use 'cuda' if available
        ),
        'LightGBM': lgb.LGBMClassifier(random_state=42, device='gpu') # LightGBM GPU
    }
    return models

def train_and_evaluate(train_file, test_file, task_name):
    print(f"\n{'='*50}\nProcessing {task_name}\n{'='*50}")
    
    train_df = pd.read_excel(os.path.join(DATA_DIR, train_file))
    test_df = pd.read_excel(os.path.join(DATA_DIR, test_file))
    
    train_df = clean_data(train_df)
    test_df = clean_data(test_df)
    
    X_train = train_df.drop(columns=['Diagnosis'])
    y_train = train_df['Diagnosis']
    
    X_test = test_df.drop(columns=['Diagnosis'])
    y_test = test_df['Diagnosis']
    
    # Ensure all inputs are numeric
    X_train = X_train.apply(pd.to_numeric, errors='coerce')
    X_test = X_test.apply(pd.to_numeric, errors='coerce')
    
    is_multiclass = len(y_train.unique()) > 2
    
    models = get_models(is_multiclass)
    
    best_acc = 0
    best_model_name = ""
    best_pipeline = None
    
    for name, model in models.items():
        print(f"\nTraining {name}...")
        
        # We wrap in try-except because GPU might not be available or fail
        try:
            pipeline = ImbPipeline([
                ('imputer', SimpleImputer(strategy='median')),
                ('scaler', StandardScaler()),
                ('smote', SMOTE(random_state=42)),
                ('classifier', model)
            ])
            
            pipeline.fit(X_train, y_train)
            
        except Exception as e:
            if "gpu" in str(e).lower() or "cuda" in str(e).lower() or "clgetdeviceids" in str(e).lower():
                print(f"  GPU failed for {name}, falling back to CPU...")
                if name == 'XGBoost':
                    model = xgb.XGBClassifier(random_state=42, eval_metric='logloss', tree_method='hist')
                elif name == 'LightGBM':
                    model = lgb.LGBMClassifier(random_state=42)
                
                pipeline = ImbPipeline([
                    ('imputer', SimpleImputer(strategy='median')),
                    ('scaler', StandardScaler()),
                    ('smote', SMOTE(random_state=42)),
                    ('classifier', model)
                ])
                pipeline.fit(X_train, y_train)
            else:
                print(f"  Error training {name}: {e}")
                continue
                
        y_pred = pipeline.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        print(f"  Test Accuracy: {acc:.4f}")
        
        if acc > best_acc:
            best_acc = acc
            best_model_name = name
            best_pipeline = pipeline

    print(f"\nBest Model for {task_name}: {best_model_name} (Acc: {best_acc:.4f})")
    
    # Export Best Model to ONNX
    try:
        if best_pipeline:
            # We only need the pipeline up to the classifier if the classifier itself doesn't support ONNX easily, 
            # but scikit-learn models, xgboost, and lightgbm generally do with skl2onnx and onnxmltools.
            # Actually, `skl2onnx` might have issues with ImbPipeline (SMOTE is not supported).
            # But wait, SMOTE is only used during *training*. We don't need it during inference!
            # So we create a new standard Pipeline with just the fitted imputer, scaler, and classifier.
            
            inference_pipeline = Pipeline([
                ('imputer', best_pipeline.named_steps['imputer']),
                ('scaler', best_pipeline.named_steps['scaler']),
                ('classifier', best_pipeline.named_steps['classifier'])
            ])
            
            # For ONNX, we need to specify the initial types
            initial_type = [('float_input', FloatTensorType([None, X_train.shape[1]]))]
            
            # skl2onnx handles sklearn, but for XGB/LGBM we need to register their converters
            from skl2onnx import update_registered_converter
            
            if best_model_name == 'XGBoost':
                from onnxmltools.convert.xgboost.operator_converters.XGBoost import convert_xgboost
                from onnxmltools.convert.xgboost.shape_calculators.Classifier import calculate_xgboost_classifier_output_shapes
                update_registered_converter(
                    xgb.XGBClassifier, 'XGBoostXGBClassifier',
                    calculate_xgboost_classifier_output_shapes, convert_xgboost,
                    options={'nocl': [True, False], 'zipmap': [True, False, 'columns']}
                )
            elif best_model_name == 'LightGBM':
                from onnxmltools.convert.lightgbm.operator_converters.LightGbm import convert_lightgbm
                from onnxmltools.convert.lightgbm.shape_calculators.Classifier import calculate_lightgbm_classifier_output_shapes
                update_registered_converter(
                    lgb.LGBMClassifier, 'LightGbmLGBMClassifier',
                    calculate_lightgbm_classifier_output_shapes, convert_lightgbm,
                    options={'nocl': [True, False], 'zipmap': [True, False, 'columns']}
                )
            
            # Convert
            onnx_model = skl2onnx.convert_sklearn(inference_pipeline, initial_types=initial_type, target_opset=12)
            
            model_path = os.path.join(MODELS_DIR, f"{task_name}.onnx")
            with open(model_path, "wb") as f:
                f.write(onnx_model.SerializeToString())
            print(f"  Exported ONNX model to {model_path}")
            
    except Exception as e:
        print(f"  Warning: Failed to export ONNX for {best_model_name} - {e}")
        # Fallback to Random Forest if XGB/LGBM conversion fails and they were the best
        # Let's train an RF and export that just in case, because RF ONNX conversion is very stable
        print("  Training fallback Random Forest for guaranteed ONNX support...")
        rf_pipeline = ImbPipeline([
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler()),
            ('smote', SMOTE(random_state=42)),
            ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
        ])
        rf_pipeline.fit(X_train, y_train)
        
        inf_pipe = Pipeline([
            ('imputer', rf_pipeline.named_steps['imputer']),
            ('scaler', rf_pipeline.named_steps['scaler']),
            ('classifier', rf_pipeline.named_steps['classifier'])
        ])
        
        onnx_model = skl2onnx.convert_sklearn(inf_pipe, initial_types=[('float_input', FloatTensorType([None, X_train.shape[1]]))], target_opset=12)
        model_path = os.path.join(MODELS_DIR, f"{task_name}.onnx")
        with open(model_path, "wb") as f:
            f.write(onnx_model.SerializeToString())
        print(f"  Exported Fallback RF ONNX model to {model_path}")

tasks = [
    ('training_testing-task1-all.xlsx', 'external_validation-task1-all.xlsx', 'task1_all'),
    ('training_testing-task1-sym.xlsx', 'external_validation-task1-sym.xlsx', 'task1_sym'),
    ('training_testing-task1-exam.xlsx', 'external_validation-task1-exam.xlsx', 'task1_exam'),
    ('training_testing-task2-all.xlsx', 'external_validation-task2-all.xlsx', 'task2_all'),
    ('training_testing-task2-sym.xlsx', 'external_validation-task2-sym.xlsx', 'task2_sym'),
    ('training_testing-task2-exam.xlsx', 'external_validation-task2-exam.xlsx', 'task2_exam')
]

if __name__ == "__main__":
    for train_file, test_file, task_name in tasks:
        train_and_evaluate(train_file, test_file, task_name)
    
    print("\nAll tasks completed. Models exported to", MODELS_DIR)
