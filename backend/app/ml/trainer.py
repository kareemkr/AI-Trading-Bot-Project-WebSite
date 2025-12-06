import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import GradientBoostingClassifier

from app.ml.features import add_indicators, FEATURE_COLUMNS

class ModelTrainer:
    def __init__(self):
        self.model_path = "model.pkl"

    def create_labels(self, df, horizon=3, up_th=0.002, down_th=-0.002):
        df = df.copy()
        df["future_price"] = df["close"].shift(-horizon)
        df["future_return"] = (df["future_price"] - df["close"]) / df["close"]

        df["label"] = np.where(
            df["future_return"] > up_th, 1,
            np.where(df["future_return"] < down_th, -1, 0)
        )

        df.dropna(inplace=True)
        return df

    def train(self, df_raw):
        df_feat = add_indicators(df_raw)
        df_lab = self.create_labels(df_feat)

        X = df_lab[FEATURE_COLUMNS].values
        y = df_lab["label"].values

        model = GradientBoostingClassifier(
            n_estimators=300,
            learning_rate=0.05,
            max_depth=3,
            subsample=0.9
        )

        model.fit(X, y)
        joblib.dump(model, self.model_path)

        return {
            "samples": len(df_lab),
            "model_path": self.model_path
        }
