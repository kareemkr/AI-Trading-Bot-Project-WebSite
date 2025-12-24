from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.session import Base
import enum

class TransactionType(enum.Enum):
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    TRADE_COST = "trade_cost"
    PNL = "pnl"
    TRANSFER = "transfer"

class TransactionStatus(enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    currency = Column(String(10), nullable=False)  # USDT, BTC, ETH, etc.
    balance = Column(Numeric(precision=38, scale=10), default=0)
    locked_balance = Column(Numeric(precision=38, scale=10), default=0)  # For open orders
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # user = relationship("User", back_populates="wallets")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id"), nullable=False, index=True)
    type = Column(String(50), nullable=False) # deposit, withdrawal, etc.
    amount = Column(Numeric(precision=38, scale=10), nullable=False)
    status = Column(String(50), default="pending") # pending, confirmed, failed
    external_id = Column(String(255), nullable=True, index=True, unique=True) # e.g. Binance merchantTradeNo
    source = Column(String(100), nullable=True) # e.g. BINANCE_PAY, MANUAL
    tx_hash = Column(String(255), nullable=True) # Blockchain hash
    reference = Column(String(255), nullable=True) # Internal reference
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    debit_wallet_id = Column(Integer, ForeignKey("wallets.id"), nullable=True)
    credit_wallet_id = Column(Integer, ForeignKey("wallets.id"), nullable=True)
    amount = Column(Numeric(precision=38, scale=10), nullable=False)
    description = Column(String(255), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
