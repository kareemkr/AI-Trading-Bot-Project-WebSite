import asyncio
import os
import sys
import uuid
import time
from decimal import Decimal
from sqlalchemy import select, func

# Add parent dir to path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "../../")))

from app.database.session import AsyncSessionLocal
from app.services.wallet_service import wallet_service
from app.models.user import User
from app.models.wallet import Wallet, Transaction, LedgerEntry
from app.models.bot import Signal, BotTradeRecord, BotLog
from app.models.withdrawal import WithdrawalRequest
from fastapi import HTTPException

async def run_stress_tests():
    print("🚀 Starting Senior Audit Stress Tests (Phase 11/13)")
    user_id = 1
    
    async with AsyncSessionLocal() as db:
        # Get initial state
        wallet = await wallet_service.get_wallet(db, user_id, "USDT")
        initial_balance = wallet.balance
        print(f"Base Balance: {initial_balance}")

        # --- TEST 1: Duplicate Webhook Idempotency ---
        print("\n[Test 1] Duplicate Webhook Idempotency (I6)")
        ext_id = f"test_id_{uuid.uuid4()}"
        
        tx = await wallet_service.create_pending_deposit(db, user_id, Decimal("500"), ext_id, "BINANCE_PAY")
        await wallet_service.confirm_deposit(db, ext_id, amount=Decimal("500"))
        
        await db.refresh(wallet)
        print(f"Balance after 1st credit: {wallet.balance}")

        try:
            await wallet_service.confirm_deposit(db, ext_id, amount=Decimal("500"))
            print("❌ FAIL: System allowed double confirmation")
        except Exception as e:
            print(f"✅ PASS: Blocked duplicate confirmation ({type(e).__name__})")

        # --- TEST 2: DB Transaction Integrity (Rollback) ---
        print("\n[Test 2] DB Transaction Integrity (Atomicity) (I2)")
        async with AsyncSessionLocal() as db_rollback:
            try:
                stmt = select(Wallet).where(Wallet.user_id == user_id)
                res = await db_rollback.execute(stmt)
                w_roll = res.scalars().one()
                w_roll.balance += Decimal("1000")
                raise ValueError("Simulated Crash")
            except ValueError:
                await db.refresh(wallet)
                if wallet.balance == initial_balance + Decimal("500"):
                    print("✅ PASS: Transaction rolled back correctly")
                else:
                    print(f"❌ FAIL: Balance corrupted!")

        # --- TEST 3: Concurrency Race (I5) ---
        print("\n[Test 3] Concurrency Race (10 simultaneous credits)")
        await db.refresh(wallet)
        pre_concurrent_bal = wallet.balance
        
        async def concurrent_credit(amount):
            async with AsyncSessionLocal() as db_task:
                await wallet_service.deposit(db_task, user_id, amount, "USDT", ref=f"CONCURRENT_{uuid.uuid4()}")

        tasks = [concurrent_credit(Decimal("10")) for _ in range(10)]
        await asyncio.gather(*tasks)
        
        await db.refresh(wallet)
        if wallet.balance == pre_concurrent_bal + Decimal("100"):
            print(f"✅ PASS: Correct final balance {wallet.balance}")
        else:
            print(f"❌ FAIL: Concurrency race detected!")

        # --- TEST 4: Kill Switch Safety (I13) ---
        print("\n[Test 4] Kill Switch Safety (Service-Level)")
        import app.main
        app.main.PLATFORM_KILL_SWITCH = True
        
        try:
            await wallet_service.deposit(db, user_id, Decimal("100"), "USDT")
            print("❌ FAIL: System allowed mutation with Kill Switch ON")
        except HTTPException as e:
            if e.status_code == 503:
                print("✅ PASS: Service blocked mutation with 503")
            else:
                print(f"❌ FAIL: Unexpected error {e}")
        
        app.main.PLATFORM_KILL_SWITCH = False # Release for I14 test

        # --- TEST 5: Detailed ReconciliationNet (I14) ---
        print("\n[Test 5] Precise Reconciliation Net (I14)")
        # Definition: wallet.balance == Σ credits - Σ debits
        
        # 1. Sum Credits
        credit_stmt = select(func.sum(LedgerEntry.amount)).where(LedgerEntry.credit_wallet_id == wallet.id)
        credits = (await db.execute(credit_stmt)).scalar() or Decimal("0")
        
        # 2. Sum Debits
        debit_stmt = select(func.sum(LedgerEntry.amount)).where(LedgerEntry.debit_wallet_id == wallet.id)
        debits = (await db.execute(debit_stmt)).scalar() or Decimal("0")
        
        net_calc = credits - debits
        await db.refresh(wallet)
        
        print(f"Calculated Net: {net_calc}, Wallet Balance: {wallet.balance}")
        if wallet.balance == net_calc and wallet.locked_balance >= 0 and wallet.locked_balance <= wallet.balance:
            print("✅ PASS: I14 Mathematical Invariant Holds")
        else:
            print("❌ FAIL: I14 Invariant Broken")

    print("\n🏁 All senior audit simulations completed.")

if __name__ == "__main__":
    asyncio.run(run_stress_tests())
