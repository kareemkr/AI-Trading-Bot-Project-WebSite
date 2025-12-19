import sqlite3
from datetime import datetime, timezone

DB_PATH = "trades.db"

class TradeSim:
    def __init__(self):
        self.db = sqlite3.connect(DB_PATH, check_same_thread=False)
        self.db.execute("""
        CREATE TABLE IF NOT EXISTS trades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            coin TEXT,
            action TEXT,
            strength REAL,
            sentiment REAL,
            timestamp TEXT
        );
        """)
        self.db.commit()

    def record(self, coin, action, strength, sentiment):
        self.db.execute(
            "INSERT INTO trades (coin, action, strength, sentiment, timestamp) VALUES (?,?,?,?,?)",
            (coin, action, strength, sentiment, datetime.now(timezone.utc).isoformat())
        )
        self.db.commit()

    def last(self, n=10):
        rows = self.db.execute(
            "SELECT coin, action, strength, sentiment, timestamp FROM trades ORDER BY timestamp DESC LIMIT ?",
            (n,)
        ).fetchall()
        return [
            {"coin": r[0], "action": r[1], "strength": r[2], "sentiment": r[3], "timestamp": r[4]}
            for r in rows
        ]
