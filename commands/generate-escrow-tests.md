---
name: generate-escrow-tests
description: Automatically builds Mocha/TypeScript test suites covering the happy path, timeout, dispute, and attack vectors for a Solana escrow program.
---

# Command: Generate Escrow Tests

Use this command when a developer has built an escrow Anchor program and needs to write integration tests to verify it before deployment.

## Action Plan (AI Instructions)

1. **Parse Instructions**: Read the source files in `programs/` (or the IDL) to understand the instruction entrypoints (`initialize`, `accept`, `fund`, `confirm`, `cancel`, `dispute`, `resolve`).
2. **Determine Accounts**: Map out the required PDA structures, signer accounts, mints, and token accounts.
3. **Generate Setup Blocks**:
   - Write instructions to fund test wallets with SOL (airdrop).
   - Write instructions to create local test SPL token mints and mint initial balances to the buyer/funder account.
4. **Draft the Test Matrix**: Write distinct test cases covering:
   - **Happy Path**: Setup, Create, Accept, Fund, Confirm.
   - **Reclaim / Expiry**: Create, time-travel / trigger expiry, Cancel, claim refund.
   - **Dispute Flow**: Setup, Create, Accept, Fund, Dispute, Resolve.
   - **Negative Boundary Checks**: Verify that unauthorized calls to release or refund fail on-chain.
5. **Output**: Write the file under `tests/<program-name>.ts`.
