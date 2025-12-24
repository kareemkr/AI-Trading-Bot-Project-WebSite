from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database.session import get_db
from app.models.wallet import Wallet, LedgerEntry, Transaction
from app.models.user import User
from app.models.withdrawal import WithdrawalRequest, WithdrawalStatus
from app.services.wallet_service import wallet_service
from app.api.auth import get_current_admin
from decimal import Decimal
from typing import List, Dict, Optional

router = APIRouter()

@router.get("/reconcile")
async def reconcile_wallets(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Independent audit of all wallets.
    Checks: Σ(credits) - Σ(debits) vs wallet.balance
    """
    result = await db.execute(select(Wallet))
    wallets = result.scalars().all()
    
    report = []
    issues_found = 0

    for wallet in wallets:
        credit_stmt = select(func.sum(LedgerEntry.amount)).where(LedgerEntry.credit_wallet_id == wallet.id)
        credit_res = await db.execute(credit_stmt)
        total_credits = credit_res.scalar() or Decimal("0")

        debit_stmt = select(func.sum(LedgerEntry.amount)).where(LedgerEntry.debit_wallet_id == wallet.id)
        debit_res = await db.execute(debit_stmt)
        total_debits = debit_res.scalar() or Decimal("0")

        expected_balance = total_credits - total_debits
        actual_balance = wallet.balance
        diff = actual_balance - expected_balance

        status = "OK" if diff == 0 else "MISMATCH"
        if status == "MISMATCH":
            issues_found += 1

        report.append({
            "wallet_id": wallet.id,
            "user_id": wallet.user_id,
            "currency": wallet.currency,
            "actual_balance": float(actual_balance),
            "expected_balance": float(expected_balance),
            "diff": float(diff),
            "status": status
        })

    return {
        "summary": {
            "total_wallets": len(wallets),
            "issues_found": issues_found,
            "healthy": issues_found == 0
        },
        "details": report
    }

@router.get("/withdrawals")
async def list_withdrawals(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    stmt = select(WithdrawalRequest).order_by(WithdrawalRequest.created_at.desc())
    if status:
        stmt = stmt.where(WithdrawalRequest.status == status)
    
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/withdrawals/{request_id}/process")
async def process_withdrawal(
    request_id: int,
    action: str,
    note: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    request = await wallet_service.admin_process_withdrawal(
        db, request_id, action.upper(), admin.id, note
    )
    return {
        "message": f"Withdrawal {action} successful",
        "request_id": request.id,
        "new_status": request.status
    }

@router.post("/kill-switch")
async def toggle_kill_switch(
    active: bool,
    admin: User = Depends(get_current_admin)
):
    """
    Emergency halt of all trading and financial activity.
    """
    from app.main import PLATFORM_KILL_SWITCH
    # Note: In a real multi-worker setup, we would use Redis for this.
    import app.main
    app.main.PLATFORM_KILL_SWITCH = active
    return {"status": "SUCCESS", "kill_switch_active": active}
