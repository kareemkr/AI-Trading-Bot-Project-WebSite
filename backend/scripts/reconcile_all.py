import asyncio
import os
import sys
from decimal import Decimal
from sqlalchemy import select, func

# Add parent dir to path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import AsyncSessionLocal
from app.models.wallet import Wallet, LedgerEntry

async def reconcile_report():
    print("--- GLOBAL WALLET RECONCILIATION REPORT ---")
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Wallet))
        wallets = result.scalars().all()
        
        for w in wallets:
            # 1. Sum Credits
            credit_stmt = select(func.sum(LedgerEntry.amount)).where(LedgerEntry.credit_wallet_id == w.id)
            credits = (await db.execute(credit_stmt)).scalar() or Decimal("0")
            
            # 2. Sum Debits
            debit_stmt = select(func.sum(LedgerEntry.amount)).where(LedgerEntry.debit_wallet_id == w.id)
            debits = (await db.execute(debit_stmt)).scalar() or Decimal("0")
            
            net_ledger = credits - debits
            diff = w.balance - net_ledger
            
            status = "OK" if diff == 0 else "MISMATCH"
            print(f"Wallet {w.id} (User {w.user_id} {w.currency}): Balance={w.balance}, LedgerNet={net_ledger}, Diff={diff} [{status}]")

if __name__ == "__main__":
    asyncio.run(reconcile_report())
