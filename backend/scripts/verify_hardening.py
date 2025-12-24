import asyncio
import os
import sys
from decimal import Decimal
from sqlalchemy import select

# Add parent dir to path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import AsyncSessionLocal
from app.services.wallet_service import wallet_service
from app.models.withdrawal import WithdrawalStatus
from app.models.user import User
from app.api.admin import reconcile_wallets

async def verify_hardening():
    print("--- Verifying Operational Hardening ---")
    
    async with AsyncSessionLocal() as db:
        # 1. Promote or Verify Admin
        result = await db.execute(select(User).where(User.email == "test@example.com"))
        user = result.scalar_one_or_none()
        if not user or not user.is_admin:
            print("❌ Admin user not found or not promoted.")
            return

        # 2. Test Reconciliation (Phase 6)
        print("Testing Reconciliation Logic...")
        report = await reconcile_wallets(db, user)
        if report["summary"]["healthy"]:
            print("✅ Ledger Integrity: OK")
        else:
            print(f"⚠️ Ledger Mismatch found in {report['summary']['issues_found']} wallets.")

        # 3. Test Withdrawal Request (Phase 7)
        print("Testing Withdrawal Request (Locked Balance)...")
        # Get wallet for USDT
        wallet = await wallet_service.get_wallet(db, user.id, "USDT")
        print(f"Initial Balance: {wallet.balance}, Locked: {wallet.locked_balance}")
        
        req = await wallet_service.create_withdrawal_request(
            db, user.id, amount=Decimal("100"), address="TRX_ADDRESS_123"
        )
        
        # Refresh and check
        await db.refresh(wallet)
        print(f"Post-Request Balance: {wallet.balance}, Locked: {wallet.locked_balance}")
        
        if wallet.locked_balance >= Decimal("100"):
            print("✅ Funds locked successfully.")
        else:
            print("❌ Funds NOT locked!")

        # 4. Test Admin Approval
        print("Testing Admin Approval...")
        await wallet_service.admin_process_withdrawal(db, req.id, "APPROVE", user.id, "Auto-verified")
        
        await db.refresh(wallet)
        print(f"Post-Approval Balance: {wallet.balance}, Locked: {wallet.locked_balance}")
        
        if wallet.locked_balance == Decimal("0"):
            print("✅ Funds unlocked and debited successfully.")
        else:
            print("❌ Balance deduction failed!")

if __name__ == "__main__":
    asyncio.run(verify_hardening())
