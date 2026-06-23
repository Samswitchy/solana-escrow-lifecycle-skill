# Service Escrow Example (Milestone Freelance Contract)

This example details how to design milestone-based service escrows, which are common in freelance, consulting, and contractor agreements on-chain.

## User Scenario
A Client hires a Freelancer for a $3,000 project split into 3 milestones:
1. **Design** ($1,000)
2. **Backend Development** ($1,000)
3. **Deployment & Handover** ($1,000)

The Client locks the full $3,000 in the escrow vault, and releases funds progressively as each milestone is delivered.

---

## 1. On-Chain State Structure (Anchor)

```rust
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct Milestone {
    pub amount: u64,
    pub is_released: bool,
    pub is_disputed: bool,
}

#[account]
#[derive(InitSpace)]
pub struct ServiceEscrowState {
    pub escrow_id: u64,
    pub client: Pubkey,
    pub freelancer: Pubkey,
    pub resolver: Pubkey, // Platform dispute handler
    pub current_milestone_index: u8,
    #[max_len(5)] // Maximum of 5 milestones
    pub milestones: Vec<Milestone>,
    pub bump: u8,
}
```

---

## 2. Release Milestone Instruction (Anchor)

```rust
pub fn release_milestone(ctx: Context<ReleaseMilestone>, milestone_index: u8) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow_state;
    
    // Safety checks
    require!(ctx.accounts.client.key() == escrow.client, EscrowError::Unauthorized);
    require!((milestone_index as usize) < escrow.milestones.len(), EscrowError::InvalidIndex);
    
    let milestone = &mut escrow.milestones[milestone_index as usize];
    require!(!milestone.is_released, EscrowError::MilestoneAlreadyReleased);
    require!(!milestone.is_disputed, EscrowError::MilestoneInDispute);

    // CPI transfer seeds for signing
    let signer_seeds: &[&[&[u8]]] = &[&[
        b"service_escrow",
        escrow.client.as_ref(),
        &escrow.escrow_id.to_le_bytes(),
        &[escrow.bump],
    ]];

    // Execute transfer of milestone amount to freelancer
    anchor_spl::token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token::Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.freelancer_token_account.to_account_info(),
                authority: escrow.to_account_info(),
            },
            signer_seeds,
        ),
        milestone.amount,
    )?;

    milestone.is_released = true;
    escrow.current_milestone_index += 1;

    Ok(())
}
```

---

## 3. Client TypeScript Integration

```typescript
// Releasing Milestone 0 (Design)
const tx = await program.methods
  .releaseMilestone(0)
  .accounts({
    client: clientKeypair.publicKey,
    escrowState: escrowPda,
    vault: vaultTokenAccountPda,
    freelancerTokenAccount: freelancerTokenAccount,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .signers([clientKeypair])
  .rpc();
```
