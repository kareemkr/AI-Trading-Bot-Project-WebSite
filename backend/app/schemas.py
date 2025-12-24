from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from decimal import Decimal

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: int
    subscription_status: str
    created_at: datetime

    class Config:
        from_attributes = True # In Pydantic v2, orm_mode = True is replaced by this

class WalletRead(BaseModel):
    id: int
    user_id: int
    currency: str
    balance: Decimal
    locked_balance: Decimal
    created_at: datetime

    class Config:
        from_attributes = True

class WithdrawalCreate(BaseModel):
    amount: Decimal
    address: str
    currency: str = "USDT"
    network: Optional[str] = "TRC20"

class WithdrawalRead(BaseModel):
    id: int
    amount: Decimal
    address: str
    status: str
    created_at: datetime
    review_note: Optional[str] = None

    class Config:
        from_attributes = True
