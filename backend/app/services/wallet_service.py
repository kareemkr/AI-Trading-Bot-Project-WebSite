from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from app.models.wallet import Wallet, Transaction, LedgerEntry
from app.models.withdrawal import WithdrawalRequest, WithdrawalStatus
from decimal import Decimal
from datetime import datetime
from fastapi import HTTPException

def check_kill_switch():
    from app.main import PLATFORM_KILL_SWITCH
    if PLATFORM_KILL_SWITCH:
        raise HTTPException(status_code=503, detail="PLATFORM_EMERGENCY_HALT: Financial mutations are disabled.")

class WalletService:
    @staticmethod
    async def get_wallet(db: AsyncSession, user_id: int, currency: str = "USDT", lock: bool = False) -> Wallet:
        """
        Fetches the user's wallet. Optionally applies a row-level lock.
        """
        stmt = select(Wallet).where(Wallet.user_id == user_id, Wallet.currency == currency)
        if lock:
            stmt = stmt.with_for_update()
            
        result = await db.execute(stmt)
        wallet = result.scalars().first()
        
        if not wallet:
            # Create if not exists
            wallet = Wallet(user_id=user_id, currency=currency, balance=Decimal("0"), locked_balance=Decimal("0"))
            db.add(wallet)
            await db.flush()
        return wallet

    @staticmethod
    async def create_pending_deposit(db: AsyncSession, user_id: int, amount: Decimal, external_id: str, source: str = "BINANCE_PAY"):
        """
        Creates a transaction in 'pending' state. No balance is changed yet.
        """
        wallet = await WalletService.get_wallet(db, user_id, lock=False)
        tx = Transaction(
            wallet_id=wallet.id,
            type="deposit",
            amount=amount,
            status="pending",
            external_id=external_id,
            source=source
        )
        db.add(tx)
        await db.commit()
        return tx

    @staticmethod
    async def confirm_deposit(db: AsyncSession, external_id: str, amount: Decimal, currency: str = "USDT"):
        """
        Finalizes a pending deposit safely.
        """
        check_kill_switch()
        result = await db.execute(select(Transaction).where(Transaction.external_id == external_id))
        tx = result.scalars().first()
        
        if not tx:
            raise HTTPException(status_code=404, detail=f"Transaction {external_id} not found")
        
        if tx.status == "confirmed":
            return tx

        # Lock Wallet
        stmt = select(Wallet).where(Wallet.id == tx.wallet_id).with_for_update()
        res = await db.execute(stmt)
        wallet = res.scalars().one()

        wallet.balance += amount
        tx.status = "confirmed"
        tx.completed_at = datetime.utcnow()

        ledger = LedgerEntry(
            transaction_id=tx.id,
            credit_wallet_id=wallet.id,
            amount=amount,
            description=f"Confirmed {currency} deposit from {tx.source}"
        )
        db.add(ledger)
        await db.commit()
        return tx

    @staticmethod
    async def lock_funds(db: AsyncSession, user_id: int, amount: Decimal, currency: str = "USDT"):
        check_kill_switch()
        wallet = await WalletService.get_wallet(db, user_id, currency, lock=True)
        available = wallet.balance - wallet.locked_balance
        if available < amount:
            raise HTTPException(status_code=400, detail="Insufficient available funds")
        wallet.locked_balance += amount
        await db.commit()
        return wallet

    @staticmethod
    async def release_funds(db: AsyncSession, user_id: int, amount: Decimal, pnl: Decimal, currency: str = "USDT"):
        check_kill_switch()
        wallet = await WalletService.get_wallet(db, user_id, currency, lock=True)
        amount_to_unlock = min(amount, wallet.locked_balance)
        wallet.locked_balance -= amount_to_unlock
        wallet.balance += pnl
        if wallet.balance < 0: wallet.balance = Decimal("0")
        await db.commit()
        return wallet

    @staticmethod
    async def withdraw(db: AsyncSession, user_id: int, amount: Decimal, currency: str = "USDT"):
        check_kill_switch()
        wallet = await WalletService.get_wallet(db, user_id, currency, lock=True)
        available = wallet.balance - wallet.locked_balance
        if available < amount:
            raise HTTPException(status_code=400, detail="Insufficient available funds")

        tx = Transaction(
            wallet_id=wallet.id,
            type="withdrawal",
            amount=amount,
            status="confirmed",
            completed_at=datetime.utcnow(),
            source="MANUAL"
        )
        db.add(tx)
        await db.flush()
        
        wallet.balance -= amount
        
        ledger = LedgerEntry(
            transaction_id=tx.id,
            debit_wallet_id=wallet.id,
            amount=amount,
            description=f"Withdrawal of {amount} {currency}"
        )
        db.add(ledger)
        await db.commit()
        return tx

    @staticmethod
    async def create_withdrawal_request(db: AsyncSession, user_id: int, amount: Decimal, address: str, currency: str = "USDT"):
        """
        Creates a stateful withdrawal request.
        1. Locks the funds immediately.
        2. Records the request.
        """
        check_kill_switch()
        if amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be positive")

        # Lock funds first
        await WalletService.lock_funds(db, user_id, amount, currency)
        
        wallet = await WalletService.get_wallet(db, user_id, currency)
        
        request = WithdrawalRequest(
            user_id=user_id,
            wallet_id=wallet.id,
            currency=currency,
            amount=amount,
            address=address,
            status=WithdrawalStatus.PENDING_REVIEW
        )
        db.add(request)
        await db.commit()
        return request

    @staticmethod
    async def admin_process_withdrawal(db: AsyncSession, request_id: int, action: str, admin_id: int, note: str = None):
        """
        Admin reviews a withdrawal request.
        action: 'APPROVE' (mark as sent) or 'REJECT' (release funds)
        """
        check_kill_switch()
        stmt = select(WithdrawalRequest).where(WithdrawalRequest.id == request_id).with_for_update()
        res = await db.execute(stmt)
        request = res.scalars().one_or_none()
        
        if not request:
            raise HTTPException(status_code=404, detail="Withdrawal request not found")
        
        if request.status != WithdrawalStatus.PENDING_REVIEW:
            raise HTTPException(status_code=400, detail="Request already processed")

        wallet = await WalletService.get_wallet(db, request.user_id, request.currency, lock=True)

        if action == "APPROVE":
            request.status = WithdrawalStatus.APPROVED
            request.reviewed_by = admin_id
            request.review_note = note
            
            # Finalize the transaction
            tx = Transaction(
                wallet_id=wallet.id,
                type="withdrawal",
                amount=request.amount,
                status="confirmed",
                completed_at=datetime.utcnow(),
                source="MANUAL_WITHDRAWAL",
                reference=f"WR-{request.id}"
            )
            db.add(tx)
            await db.flush()
            
            # Update physical balance and unlock
            wallet.balance -= request.amount
            wallet.locked_balance -= request.amount
            
            ledger = LedgerEntry(
                transaction_id=tx.id,
                debit_wallet_id=wallet.id,
                amount=request.amount,
                description=f"Withdrawal to {request.address}"
            )
            db.add(ledger)
            
        elif action == "REJECT":
            request.status = WithdrawalStatus.REJECTED
            request.reviewed_by = admin_id
            request.review_note = note
            
            # Unlock the funds
            wallet.locked_balance -= request.amount
            
        await db.commit()
        return request

    @staticmethod
    async def deposit(db: AsyncSession, user_id: int, amount: Decimal, currency: str = "USDT", ref: str = None):
        check_kill_switch()
        wallet = await WalletService.get_wallet(db, user_id, currency, lock=True)
        wallet.balance += amount
        tx = Transaction(
            wallet_id=wallet.id,
            type="deposit",
            amount=amount,
            status="confirmed",
            reference=ref,
            completed_at=datetime.utcnow(),
            source="MANUAL"
        )
        db.add(tx)
        await db.flush()
        ledger = LedgerEntry(transaction_id=tx.id, credit_wallet_id=wallet.id, amount=amount, description=f"Manual Deposit: {amount} {currency}")
        db.add(ledger)
        await db.commit()
        return tx

wallet_service = WalletService()
