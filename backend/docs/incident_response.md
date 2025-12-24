# Incident Response Runbook

## Severity Levels
*   **SEV0 (Critical)**: Incorrect balances, double credits/debits, unauthorized mutations, withdrawals bypassing checks.
*   **SEV1 (High)**: Webhooks failing, trading engines blocked, significant lag in settlement.
*   **SEV2 (Medium)**: UI glitches, logging delays, minor API errors.

---

## 🚨 SEV0 Protocol: Immediate Actions
1.  **Enable Kill Switch**: Halt all financial mutations instantly.
    *   Endpoint: `POST /api/admin/kill-switch?active=true`
2.  **Freeze Withdrawals**: Ensure no further settlements occur.
3.  **Snapshot Database**: Run a manual backup before performing any "fixing" queries.
4.  **Start Incident Log**: Document every action taken, who acted, and what time.

---

## Scenario: Duplicate Deposit Credited
**Symptoms**: User balance increased twice for the same external ID.
1.  Enable Kill Switch.
2.  Identify the double transaction and ledger entries.
3.  **Correction**:
    *   DO NOT edit or delete the entries.
    *   Insert a REVERSAL transaction and offsetting ledger entry to bring the balance back to the correct state.
4.  Verify DB constraints: Ensure `external_id` has a UNIQUE constraint.
5.  Postmortem: Identify how the idempotency check was bypassed.

## Scenario: Wallet Reconcile Mismatch
**Symptoms**: `/api/admin/reconcile` returns 1+ mismatches.
1.  Enable Kill Switch.
2.  Export the reconciliation report.
3.  Manually audit the ledger for the affected wallet to find missing or extra rows.
4.  **Correction**:
    *   Insert a "CORRECTIVE_LEDGER" entry to align the wallet balance to the ledger sum.
    *   Document exactly why the correction was needed in the ledger description.

## Scenario: Database Dead / Corruption
1.  Stop services.
2.  Restore from the latest validated backup.
3.  Replay WAL logs if available.
4.  Run reconciliation: Ensure the restored state is 100% consistent.
5.  Re-enable services only after consistency is proved.
