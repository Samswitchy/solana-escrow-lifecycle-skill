# Backend Read Models & Webhooks for Solana Escrows

This guide walks through event indexing strategies on Solana to feed a read-optimized backend database and power reliable external webhooks.

## 1. Architectural Relationship

> [!IMPORTANT]
> The on-chain Solana program is the **sole source of truth** for escrow states and asset custody. The backend database must only serve as a **read-model projection** to facilitate sorting, filtering, and rapid UI retrieval. The backend must never be trusted to make critical authorization decisions that can be bypassed on-chain.

```
┌─────────────────┐             ┌───────────────────┐             ┌─────────────────┐
│ Solana Program  │ ──(Events)─►│  Indexer / Worker │ ──(Updates)─►│ Read DB (Postgres)
└─────────────────┘             └───────────────────┘             └─────────────────┘
                                          │
                                   (Triggers Webhook)
                                          ▼
                                ┌───────────────────┐
                                │ Third-party App   │
                                └───────────────────┘
```

---

## 2. Event Indexing Strategies

### WebSocket Log Listening
Using `@solana/web3.js` to subscribe to log changes corresponding to the program ID:

```typescript
import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';

const connection = new Connection(process.env.SOLANA_RPC_URL!, "confirmed");
const programId = new PublicKey(process.env.ESCROW_PROGRAM_ID!);

// Instantiate Anchor parser to decode emitted events
const coder = new anchor.BorshCoder(idl);
const parser = new anchor.EventParser(programId, coder);

// Application-defined queue/upsert function used by the indexer worker.
declare function enqueueEscrowEvent(event: {
    signature: string;
    slot: number;
    name: string;
    data: unknown;
}): void;

connection.onLogs(programId, (logs, ctx) => {
    if (logs.err) return; // Skip failed transactions

    for (const event of parser.parseLogs(logs.logs)) {
        enqueueEscrowEvent({
            signature: logs.signature,
            slot: ctx.slot,
            name: event.name,
            data: event.data,
        });
    }
}, "confirmed");
```

### Event Parsing via Block Walkers (Helius / Custom Node)
To guarantee 100% indexing uptime (since WebSockets can drop), run a cron-based block walker that fetches transaction signatures for the program ID using `getSignaturesForAddress`:

```typescript
const signatures = await connection.getSignaturesForAddress(programId, {
    limit: 100,
    before: lastProcessedSignature,
});
```

---

## 3. Webhook Architecture and Reliability

1. **Transaction De-duplication**: Use the transaction's unique signature (`txSignature`) as a primary key or unique index in your event processor database. Never process a signature twice.
2. **Retry Policies**: Deliver webhooks with exponential backoff and a signature header (e.g., `X-Webhook-Signature`) to allow receivers to verify authenticity.
3. **Historical Backfills**: Always write a script to re-index blocks between timestamp intervals in case the WebSocket worker loses connectivity.
4. **Optimistic UI Updates**: Let the frontend trigger database updates optimistically upon transaction confirmation, but always label the status as "Pending Blockchain Confirmation" until the indexer processes the on-chain log event.
