from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey, Numeric
from sqlalchemy.sql import func
from app.database.session import Base

class Signal(Base):
    __tablename__ = "signals"

    id = Column(String, primary_key=True)  # Using event ID as PK
    type = Column(String, index=True)      # NEWS | SOCIAL_SIGNAL
    source = Column(String, index=True)    # CryptoCompare | X
    created_at = Column(DateTime(timezone=True), index=True)
    received_at = Column(DateTime(timezone=True), server_default=func.now())
    title = Column(String, nullable=True)
    content = Column(String, nullable=True)
    url = Column(String, nullable=True)
    heuristic_score = Column(Float, default=0.0)
    engagement = Column(Float, default=0.0)
    weighted_impact = Column(Float, default=0.0)
    account = Column(String, nullable=True, index=True)
    category = Column(String, nullable=True)
    scope = Column(String, nullable=True)
    targets = Column(JSON, nullable=True) # List of symbols

class BotTradeRecord(Base):
    __tablename__ = "bot_trades"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True)
    action = Column(String) # BUY | SELL | LONG | SHORT
    strength = Column(Float)
    sentiment = Column(Float)
    price = Column(Numeric(precision=38, scale=10), nullable=True)
    quantity = Column(Numeric(precision=38, scale=10), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

class BotLog(Base):
    __tablename__ = "bot_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    level = Column(String, default="INFO")
    message = Column(String)
    module = Column(String, nullable=True)
