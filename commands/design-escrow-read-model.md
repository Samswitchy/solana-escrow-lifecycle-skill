---
name: design-escrow-read-model
description: Generates database schemas, event processing handlers, and webhook triggers for indexing a Solana escrow program.
---

# Command: Design Escrow Read Model

Use this command when a developer wants to connect their Solana escrow program to a backend server (e.g., Node.js / Express / NestJS) for transaction tracking, notification services, or frontend data fetching.

## Action Plan (AI Instructions)

1. **Scan Event Structs**: Locate all `#[event]` declarations in the Anchor program (e.g., `EscrowStateChanged`, `DisputeOpened`, `FundsReleased`).
2. **Generate Database Schema**: 
   - Draft a SQL schema (Postgres) or Mongoose schema (MongoDB) that matches the escrow status lifecycle.
   - Include columns for: `escrow_id`, `state_enum`, `funder`, `recipient`, `vault_address`, `amount`, `mint`, `tx_signature`, `block_height`, and `block_time`.
3. **Draft Event Listener Code**:
   - Write TypeScript code using `@solana/web3.js` and `@coral-xyz/anchor` Coder to subscribe to logs, parse events, and upsert records into the database.
4. **Draft Webhook Trigger**:
   - Write a helper function that dispatches secure webhooks to external listeners when the escrow state changes (e.g., transitions to `Funded` or `Disputed`).
