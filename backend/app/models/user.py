from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float
from sqlalchemy.sql import func
from app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String)
    is_admin = Column(Boolean, default=False)
    avatar = Column(String, nullable=True)
    subscription_status = Column(String(50), default="regular")
    subscription_expiry = Column(DateTime, nullable=True)
    wallet_address = Column(String, nullable=True)
    
    # Bot Settings
    telegram_token = Column(String, nullable=True)
    telegram_chat_id = Column(String, nullable=True)
    binance_api_key = Column(String, nullable=True)
    binance_api_secret = Column(String, nullable=True)
    auto_trade_confirmation = Column(Boolean, default=True)
    risk_management_alerts = Column(Boolean, default=True)
    news_analysis_ai = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
