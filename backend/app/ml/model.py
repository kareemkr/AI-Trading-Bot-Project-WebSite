import pickle
import numpy as np
import pandas as pd
from pathlib import Path


class MLModel:
    def __init__(self, model_path: str = "app/ml/models/model.pkl"):
        self.model = None
        self.model_path = Path(model_path)

        if self.model_path.exists():
            self.load()
        else:
            print(f"[ML] Warning: Model not found at {self.model_path}")

    def load(self):
        """Load ML model from pickle file."""
        with open(self.model_path, "rb") as f:
            self.model = pickle.load(f)
        print("[ML] Model loaded successfully.")

    def preprocess(self, df: pd.DataFrame):
        """
        Convert OHLCV dataframe into ML-ready features.
        You can replace this later with TA indicators or feature engineering.
        """
        df = df.copy()

        # Basic features: returns + moving averages
        df["return"] = df["close"].pct_change()
        df["ma_fast"] = df["close"].rolling(5).mean()
        df["ma_slow"] = df["close"].rolling(20).mean()

        df = df.dropna()

        features = df[["return", "ma_fast", "ma_slow"]].values

        return features[-1:]   # latest row only

    def predict(self, df: pd.DataFrame):
        """Run prediction using the loaded ML model."""
        if self.model is None:
            print("[ML] ERROR: Model not loaded!")
            return None

        features = self.preprocess(df)

        prediction = self.model.predict(features)[0]

        return prediction
