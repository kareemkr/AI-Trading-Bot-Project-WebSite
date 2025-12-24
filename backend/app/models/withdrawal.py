from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
from app.database.session import Base
import enum

class WithdrawalStatus(enum.Enum):
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    SENT = "sent"
    CONFIRMED = "confirmed"
    FAILED = "failed"

class WithdrawalRequest(Base):
    __tablename__ = "withdrawal_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id"), nullable=False, index=True)
    currency = Column(String(10), nullable=False)
    amount = Column(Numeric(precision=38, scale=10), nullable=False)
    address = Column(String(255), nullable=False)
    status = Column(SQLEnum(WithdrawalStatus), default=WithdrawalStatus.PENDING_REVIEW)
    network = Column(String(50), nullable=True) # e.g. TRC20, ERC20
    
    # Audit trail
    review_note = Column(String(255), nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    tx_hash = Column(String(255), nullable=True) # Hash if sentinel to blockchain
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
