# backend/app/services/model.py
import joblib
import os
import threading

# Path is configured via an environment variable with a default
MODEL_PATH = os.getenv("MODEL_PATH", "/app/ml/artifacts/model.joblib")
_model = None
_model_lock = threading.Lock()

def get_model():
    global _model
    if _model is None:
         with _model_lock:
            if _model is None:
                print("🔄 Loading ML model...")
                _model = joblib.load(MODEL_PATH)
    return _model