# Solana Escrow Test Matrix

This guide lists integration test matrices and patterns for testing Solana escrow programs using Mocha, TypeScript, and Anchor.

## 1. The Escrow Test Matrix Checklist

A production-grade escrow contract must verify these scenarios:

| Category | Test Case | Expected Result |
|----------|-----------|-----------------|
| **Happy Path** | 1. Initialize global state & supported assets | Success |
| | 2. Create private escrow (unfunded) | Success (State = `Created`) |
| | 3. Accept private escrow (binds counterparty) | Success (State = `Accepted`) |
| | 4. Fund private escrow (user -> vault token transfer) | Success (State = `Funded`) |
| | 5. Release/Confirm escrow (vault -> recipient transfer) | Success (State = `Completed`) |
| **Timeout Paths** | 6. Cancel private escrow *before* funding | Success (State = `Cancelled`) |
| | 7. Expire private escrow after deadline | Success (State = `Expired`) |
| | 8. Reclaim funds from expired/cancelled escrow | Success (Vault returns to depositor) |
| **Dispute Paths** | 9. Dispute a funded escrow | Success (State = `Disputed`) |
| | 10. Resolve dispute favoring Buyer (Refund) | Success (State = `Resolved`, 100% to Buyer) |
| | 11. Resolve dispute favoring Seller (Release) | Success (State = `Resolved`, 100% to Seller) |
| **Security Boundaries** | 12. Try to double-fund an escrow | **FAIL** (State already `Funded`) |
| | 13. Try to cancel a funded escrow directly | **FAIL** (Must open dispute) |
| | 14. Unauthorized resolver attempts to resolve | **FAIL** (Constraint violation) |
| | 15. Attempt to accept/fund with wrong mint asset | **FAIL** (Constraint/type mismatch) |
| | 16. Attempt to double-claim/re-enter release | **FAIL** (Account is closed/mutated) |

---

## 2. Test Snippet: Positive Flow (TypeScript)

Example test suite skeleton using Anchor and Mocha:

```typescript
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { expect } from 'chai';
import { EscrowProgram } from '../target/types/escrow_program';

describe('escrow-lifecycle', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.EscrowProgram as Program<EscrowProgram>;

  let escrowId = new anchor.BN(Date.now());
  let initializer = provider.publicKey;
  let counterparty = anchor.web3.Keypair.generate().publicKey;

  it('creates a private escrow state', async () => {
    const [escrowPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), initializer.toBuffer(), escrowId.toArrayLike(Buffer, 'le', 8)],
      program.programId
    );

    await program.methods
      .createPrivateEscrow(
        1, // version
        escrowId,
        { participantMode: { buyerAndSeller: {} } },
        { intent: { standardEscrow: {} } },
        counterparty,
        new anchor.BN(1_000_000), // amount
        Array(32).fill(0), // ref hash
        "ipfs://metadata",
        new anchor.BN(Math.floor(Date.now() / 1000) + 3600), // 1hr expiry
        new anchor.BN(600)
      )
      .accounts({
        escrowState: escrowPda,
        initializer: initializer,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const account = await program.account.escrowAccount.fetch(escrowPda);
    expect(account.amount.toNumber()).to.equal(1_000_000);
    expect(account.state).to.deep.equal({ created: {} });
  });
});
```

---

## 3. Test Snippet: Negative Security Check

Always verify that unauthorized users are rejected on-chain:

```typescript
it('rejects funding from non-designated counterparty', async () => {
  const intruder = anchor.web3.Keypair.generate();
  
  try {
    await program.methods
      .fundPrivateEscrow()
      .accounts({
        funder: intruder.publicKey,
        escrowState: escrowPda,
        vault: vaultTokenAccount,
        funderTokenAccount: intruderTokenAccount,
        tokenMint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([intruder])
      .rpc();
    
    expect.fail("Should have failed to fund from random keypair");
  } catch (err: any) {
    // Assert specific error code from your program
    expect(err.message).to.match(/InvalidInitializer|ConstraintRaw/);
  }
});
```
