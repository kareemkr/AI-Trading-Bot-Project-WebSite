# System Invariants (The Unbreakables)

These 14 rules represent the foundation of the platform's financial integrity. If any rule is violated, the system is considered compromised and must be halted.

## Money & Ledger
1.  **I1: Exclusive Service Access**: A wallet’s `balance` and `locked_balance` may only be modified inside `WalletService`.
2.  **I2: Ledger Coupling**: Every mutation of `balance` or `locked_balance` MUST create at least one `transactions` row and one `ledger_entries` row in the same DB transaction.
3.  **I3: Append-Only Ledger**: The ledger is append-only. Never “edit” or "delete" old entries. Corrections are recorded as new offsetting entries.
4.  **I4: Decimal Precision**: All financial math must use the `Decimal` type. Floating point math is strictly forbidden in service logic.

## Concurrency
5.  **I5: Row-Level Locking**: Any mutation MUST lock the wallet row using `SELECT ... FOR UPDATE` before reading or modifying balances.
6.  **I6: External Idempotency**: Webhook processing is idempotent, enforced by a DB unique constraint on `transactions.external_id`.

## Webhooks
7.  **I7: Signature First**: Webhook signature verification (HMAC) happens before any business logic or parsing.
8.  **I8: Safety Under Retry**: Webhook processing must remain safe under retries, reordering, and duplication.

## Trading Coupling
9.  **I9: Lock-Before-Trade**: Trade execution must lock funds in `locked_balance` before an order is sent to the exchange.
10. **I10: Deterministic Release**: Trade closure or failure must release locks deterministically, even in error paths.

## Admin Controls
11. **I11: Withdrawal State Machine**: Withdrawals must follow the state machine: `PENDING_REVIEW` → `APPROVED` → `SENT` → `SETTLED`.
12. **I12: Admin Audit**: All administrative actions (approvals, toggling kill switches) are audited with `admin_id` and timestamps.

## Safety
13. **I13: Consistnent Kill Switch**: The global Kill Switch blocks all financial mutations (deposits, withdrawals, trading locks) consistently across all modules.
14. **I14: Reconciliation Proved**: The system must always be able to prove that `wallet.balance == sum(ledger_entries)`.
