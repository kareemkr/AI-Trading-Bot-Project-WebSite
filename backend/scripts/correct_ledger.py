import asyncio
import os
import sys
from decimal import Decimal
from sqlalchemy import select, func
from datetime import datetime

# Add parent dir to path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import AsyncSessionLocal
from app.models.wallet import Wallet, Transaction, LedgerEntry

async def correct_ledger():
    print("--- ALIGNING WALLETS TO LEDGER (SENIOR AUDIT COMPLIANCE) ---")
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
            
            if diff != 0:
                print(f"Aligning Wallet {w.id}: Diff={diff}. Creating audit trail...")
                
                # Create a system transaction
                tx = Transaction(
                    wallet_id=w.id,
                    type="reconciliation",
                    amount=abs(diff),
                    status="confirmed",
                    source="SYSTEM_AUDIT",
                    reference="LEGACY_DATA_ALIGNMENT",
                    completed_at=datetime.utcnow()
                )
                db.add(tx)
                await db.flush()
                
                # Create Ledger Entry
                if diff > 0:
                    # Balance is higher than ledger: Credit the ledger to justify balance
                    ledger = LedgerEntry(
                        transaction_id=tx.id,
                        credit_wallet_id=w.id,
                        amount=diff,
                        description="Correction: Reconciling legacy balance drift to ledger"
                    )
                else:
                    # Balance is lower: Debit the ledger (unlikely but handled)
                    ledger = LedgerEntry(
                        transaction_id=tx.id,
                        debit_wallet_id=w.id,
                        amount=abs(diff),
                        description="Correction: Reconciling legacy balance drift to ledger"
                    )
                db.add(ledger)
                
                # After committing, net_ledger will match w.balance
                print(f"✅ Wallet {w.id} aligned.")
        
        await db.commit()
        print("Finalizing all corrections.")

if __name__ == "__main__":
    asyncio.run(correct_ledger())
