# System Invariants (The Unbreakables)

These 14 rules represent the foundation of the platform's financial integrity. If any rule is violated, the system is considered compromised and must be halted.

## Money & Ledger
1. **I1: Exclusive Service Access**: A wallet’s `balance` and `locked_balance` may only be modified inside `WalletService`.
2. **I2: Ledger Coupling**: Every mutation of `balance` or `locked_balance` MUST create at least one `transactions` row and one `ledger_entries` row in the same DB transaction.
3. **I3: Append-Only Ledger**: The ledger is append-only. Never edit or delete old entries. Corrections are recorded as new offsetting entries.
4. **I4: Decimal Precision**: All financial math must use the `Decimal` type end-to-end. Floating point math is forbidden in finance paths.

## Concurrency
5. **I5: Row-Level Locking**: Any mutation MUST lock the wallet row using `SELECT ... FOR UPDATE` before reading or modifying balances.
6. **I6: External Idempotency**: Webhook processing is idempotent, enforced by a DB UNIQUE constraint on `transactions.external_id` (or equivalent idempotency key).

## Webhooks
7. **I7: Signature First**: Webhook signature verification (HMAC) must succeed before any business logic is executed.
8. **I8: Safety Under Retry + Replay Defense**: Webhook processing must remain safe under retries, reordering, duplication, and replay attempts. Timestamp freshness must be enforced (e.g., reject events older than an allowed skew window).

## Trading Coupling
9. **I9: Lock-Before-Trade**: Trade execution must lock funds in `locked_balance` before an order is sent to the exchange.
10. **I10: Deterministic Release**: Trade closure or failure must release locks deterministically, including in error paths and restarts.

## Admin Controls
11. **I11: Withdrawal State Machine**: Withdrawals must follow: `PENDING_REVIEW → APPROVED → SENT → SETTLED` (or terminal states `REJECTED/FAILED`). Invalid transitions are rejected. Transitions must be idempotent.
12. **I12: Admin Audit**: All administrative actions (approvals, rejections, corrections, toggling kill switch) are audited with `admin_id`, timestamps, and a reason.

## Safety
13. **I13: Consistent Kill Switch**: The global Kill Switch blocks all financial mutations consistently across all modules (deposit confirmation, withdrawal creation/approval/settlement, trade locking, PnL settlement).
14. **I14: Reconciliation Proved**: The system must always be able to prove wallet state from the ledger. For each wallet `W`:
    - `credits(W) = Σ amount where credit_wallet_id = W.id`
    - `debits(W)  = Σ amount where debit_wallet_id  = W.id`
    - `net(W)     = credits(W) - debits(W)`
    - Enforce: `wallet.balance == net(W)` and `0 ≤ wallet.locked_balance ≤ wallet.balance`.


# Incident Response Runbook

## Severity Levels
- **SEV0 (Critical)**: Incorrect balances, double credits/debits, unauthorized mutations, withdrawals bypassing checks.
- **SEV1 (High)**: Webhooks failing, trading engines blocked, significant lag in settlement.
- **SEV2 (Medium)**: UI glitches, logging delays, minor API errors.

---

## SEV0 Protocol: Immediate Actions
1. **Enable Kill Switch**: Halt all financial mutations instantly.  
   Endpoint: `POST /api/admin/kill-switch?active=true`
2. **Freeze Withdrawals**: Ensure no approvals/settlements are possible while investigating.
3. **Snapshot Database**: Take a manual backup before performing any corrective actions.
4. **Start Incident Log**: Document every action taken: who acted, when, what changed, and why.

---

## Scenario: Duplicate Deposit Credited
**Symptoms**: User balance increased twice for the same external ID.
1. Enable Kill Switch.
2. Identify duplicate `transactions` and related `ledger_entries`.
3. **Correction**:
   - Do NOT edit or delete old entries.
   - Insert a `REVERSAL` transaction and offsetting ledger entries to restore correct net balance.
4. Verify DB constraints: confirm `external_id` is UNIQUE.
5. Postmortem: determine whether idempotency was bypassed due to a race condition, missing lock, or missing replay defense.

---

## Scenario: Wallet Reconcile Mismatch
**Symptoms**: `/api/admin/reconcile` returns 1+ mismatches.
1. Enable Kill Switch.
2. Export the reconciliation report.
3. Audit the ledger for the affected wallet to locate missing/extra rows.
4. **Correction**:
   - Insert a `CORRECTIVE` transaction and ledger entries to align wallet balance with ledger net.
   - Include a human-readable reason in the transaction/ledger metadata.
5. Re-run reconciliation and verify 0 mismatches.

---

## Scenario: Webhook backlog / delayed confirmations
**Symptoms**: many deposits stuck in PENDING for > X minutes
1. Verify webhook reception logs.
2. Run reconciliation against Binance Pay order history API.
3. Backfill missing events by re-triggering the confirmation logic with original payloads.

---

## Scenario: Lock leaks (locked_balance not released)
**Symptoms**: available balance stays low after trade close
1. Find open locks in `wallets.locked_balance`.
2. Reconcile trade state in `bot_trade_records` vs wallet locks.
3. If a trade is definitively closed but funds are locked: create a `CORRECTIVE` transaction to release the amount.

---

## Scenario: Database Dead / Corruption
1. Stop services.
2. Restore from the latest validated backup.
3. Replay WAL logs if available.
4. Run reconciliation to ensure restored state is consistent.
5. Re-enable services only after integrity is proved.
