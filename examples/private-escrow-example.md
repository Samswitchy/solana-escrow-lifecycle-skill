# Private Escrow Example (P2P Settlement)

This example walks through a standard 2-party private escrow on Solana, demonstrating the code structure and state lifecycle.

## User Scenario
Alice wishes to buy a digital asset or perform a trade with Bob. They agree on a price of 100 USDC. Bob will initialize the escrow, Alice will fund it, and once Bob delivers the asset, Alice will confirm the release.

---

## 1. On-Chain State Structure (Anchor)

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

#[account]
#[derive(InitSpace)]
pub struct PrivateEscrowState {
    pub escrow_id: u64,
    pub initializer: Pubkey, // Bob (Seller)
    pub counterparty: Pubkey, // Alice (Buyer)
    pub amount: u64,
    pub mint: Pubkey,
    pub state: u8, // 0 = Created, 1 = Accepted, 2 = Funded, 3 = Completed
    pub bump: u8,
}
```

---

## 2. Anchor Implementation Snippet (Create & Fund)

```rust
pub fn create_escrow(
    ctx: Context<CreatePrivateEscrow>,
    escrow_id: u64,
    amount: u64,
    counterparty: Pubkey
) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow_state;
    escrow.escrow_id = escrow_id;
    escrow.initializer = ctx.accounts.initializer.key();
    escrow.counterparty = counterparty;
    escrow.amount = amount;
    escrow.state = 0; // Created
    escrow.bump = *ctx.bumps.get("escrow_state").unwrap();
    Ok(())
}

pub fn fund_escrow(ctx: Context<FundPrivateEscrow>) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow_state;
    require!(escrow.state == 0, EscrowError::InvalidState);

    // Perform CPI transfer from buyer to vault
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = anchor_spl::token::Transfer {
        from: ctx.accounts.buyer_token_account.to_account_info(),
        to: ctx.accounts.vault.to_account_info(),
        authority: ctx.accounts.buyer.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    anchor_spl::token::transfer(cpi_ctx, escrow.amount)?;

    escrow.state = 2; // Funded
    Ok(())
}
```

---

## 3. Client TypeScript Integration

```typescript
// Initializing the escrow as Bob (Seller)
const tx = await program.methods
  .createEscrow(escrowId, new anchor.BN(100_000_000), alicePublicKey)
  .accounts({
    escrowState: escrowPda,
    initializer: bobKeypair.publicKey,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .signers([bobKeypair])
  .rpc();

// Funding the escrow as Alice (Buyer)
const fundTx = await program.methods
  .fundEscrow()
  .accounts({
    buyer: aliceKeypair.publicKey,
    escrowState: escrowPda,
    vault: vaultTokenAccountPda,
    buyerTokenAccount: aliceTokenAccount,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .signers([aliceKeypair])
  .rpc();
```
