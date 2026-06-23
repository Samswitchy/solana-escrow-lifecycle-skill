# Frontend Adapter Patterns for Solana Escrows

This guide covers integrating frontends with Solana escrow programs, specifically focusing on abstracting transaction building behind semantic service adapters.

## 1. The Pro-Level Interface Design

Instead of calling Anchor client instructions directly inside React or Vue files, wrap all interactions in an **Escrow Service Adapter**. This keeps components decoupled, testable, and clean.

```
┌────────────────────────┐
│      React Pages       │ (e.g., CheckoutPage, DisputeModal)
└───────────┬────────────┘
            │ calls (semantic methods)
            ▼
┌────────────────────────┐
│  EscrowServiceAdapter  │ (Converts parameters to Anchor Tx Instructions)
└───────────┬────────────┘
            │ executes
            ▼
┌────────────────────────┐
│  Solana Network RPC    │
└────────────────────────┘
```

---

## 2. Escrow Service Adapter Implementation (TypeScript)

Here is the canonical structure for an Escrow Adapter wrapping `@coral-xyz/anchor`:

```typescript
import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { SoliaEscrow, IDL } from './idl/solia_escrow';

export class EscrowServiceAdapter {
    private program: Program<SoliaEscrow>;

    constructor(connection: Connection, wallet: Wallet, programId: PublicKey) {
        const provider = new AnchorProvider(connection, wallet, {
            preflightCommitment: 'confirmed',
        });
        this.program = new Program<SoliaEscrow>(IDL, programId, provider);
    }

    /**
     * Creates a new private escrow transaction instruction.
     */
    public async buildCreateEscrowInstruction(params: {
        escrowId: number;
        amount: number;
        counterparty: PublicKey;
        expiryAt: number;
    }): Promise<TransactionInstruction> {
        const [escrowStatePda] = PublicKey.findProgramAddressSync(
            [Buffer.from('escrow'), this.program.provider.publicKey.toBuffer(), new anchor.BN(params.escrowId).toArrayLike(Buffer, 'le', 8)],
            this.program.programId
        );

        return await this.program.methods
            .createPrivateEscrow(
                1, // version
                new anchor.BN(params.escrowId),
                { participantMode: { buyerAndSeller: {} } }, // modes
                { intent: { standardEscrow: {} } },
                params.counterparty,
                new anchor.BN(params.amount),
                [0; 32], // dummy ref hash
                "ipfs://...",
                new anchor.BN(params.expiryAt),
                new anchor.BN(600) // confirmation window
            )
            .accounts({
                escrowState: escrowStatePda,
                initializer: this.program.provider.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .instruction();
    }

    /**
     * Executes the funding workflow for an accepted escrow.
     */
    public async fundEscrow(escrowId: number, tokenMint: PublicKey): Promise<string> {
        // Build state & vault PDAs
        // Run instructions methods...
        const txSig = await this.program.methods
            .fundPrivateEscrow()
            .accounts({
                // Required accounts
            })
            .rpc();

        return txSig;
    }
}
```

---

## 3. UI State Management and UX Best Practices
- **Explicit Loader States**: Provide the user with feedback for each phase: `Awaiting Wallet Approval` ➔ `Broadcasting Transaction` ➔ `Confirming on Blockchain`.
- **Preflight Validation**: Validate input bounds (e.g. balance checks) *before* invoking the wallet signer to save user friction.
- **Handling Wallet Disconnects**: Implement fallback states in the Adapter to cleanly handle wallet disconnections without crashing the UI thread.
