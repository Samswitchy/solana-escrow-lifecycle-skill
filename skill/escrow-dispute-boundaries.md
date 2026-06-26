# Escrow Dispute Boundaries & AI Safety

This guide details dispute resolution boundaries for Solana escrows, with a focus on trust layout and the strict safety boundaries between AI analysis and on-chain action.

## 1. The Core AI Safety Boundary

> [!CAUTION]
> **AI Must Never Resolve Disputes Directly**: AI agents can inspect metadata, index evidence, summarize claims, and highlight logical contradictions between disputing parties. However, they must **never** be given the authority to sign resolution transactions, decide payout splits, or trigger on-chain transfers. 

### Recommended Workflow: AI as Advisor
1. **Dispute Influx**: The buyer or seller opens a dispute. The state moves to `Disputed`.
2. **Evidence Collection**: Parties submit IPFS hashes containing agreements, transaction proofs, or chat logs.
3. **AI Evaluation**: The AI agent reads the evidence, structures it, compiles a timeline, and flags discrepancies.
4. **Human/Multisig Review**: The AI generates a review digest and proposes standard resolution choices.
5. **On-Chain Action**: A human resolver, DAO committee, or multisig group signs and executes the `resolve` instruction.

---

## 2. On-Chain Resolution Structure (Anchor)

In the Anchor program, enforce that only the registered resolver (e.g. a platform fee wallet, a multi-sig PDA, or a centralized dispute coordinator key) can sign the resolution instruction.

### Rust Struct for Dispute Resolution
```rust
#[derive(Accounts)]
pub struct ResolveEscrow<'info> {
    #[account(
        mut,
        constraint = escrow_state.resolver_authority == resolver.key() @ EscrowError::InvalidResolver
    )]
    pub resolver: Signer<'info>,

    #[account(
        mut,
        seeds = [b"escrow", escrow_state.initializer.as_ref(), escrow_state.escrow_id.to_le_bytes().as_ref()],
        bump = escrow_state.bump
    )]
    pub escrow_state: Account<'info, EscrowAccount>,

    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub seller_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}
```

### Handling Resolution Outcomes
Avoid binary outcomes (e.g. 100% to buyer or 100% to seller) if the business logic requires compromise. Standardize resolution outcomes as enums:

```rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum EscrowResolution {
    RefundToBuyer,
    ReleaseToSeller,
    Split50_50,
}
```

Implement the resolution execution logic with matching CPI calls:
```rust
pub fn handle_resolution(ctx: Context<ResolveEscrow>, outcome: EscrowResolution) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow_state;
    
    require!(escrow.state == EscrowState::Disputed, EscrowError::NotInDispute);

    let vault_amount = ctx.accounts.vault.amount;
    
    // Seed definitions to sign the CPI from the PDA
    let signer_seeds: &[&[&[u8]]] = &[&[
        b"escrow",
        escrow.initializer.as_ref(),
        &escrow.escrow_id.to_le_bytes(),
        &[escrow.bump],
    ]];

    match outcome {
        EscrowResolution::RefundToBuyer => {
            // Transfer 100% to buyer
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.vault.to_account_info(),
                        to: ctx.accounts.buyer_token_account.to_account_info(),
                        authority: escrow.to_account_info(),
                    },
                    signer_seeds,
                ),
                vault_amount,
            )?;
        }
        EscrowResolution::ReleaseToSeller => {
            // Transfer 100% to seller
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.vault.to_account_info(),
                        to: ctx.accounts.seller_token_account.to_account_info(),
                        authority: escrow.to_account_info(),
                    },
                    signer_seeds,
                ),
                vault_amount,
            )?;
        }
        EscrowResolution::Split50_50 => {
            let split = vault_amount.checked_div(2).ok_or(EscrowError::MathOverflow)?;
            // Transfer split to buyer
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.vault.to_account_info(),
                        to: ctx.accounts.buyer_token_account.to_account_info(),
                        authority: escrow.to_account_info(),
                    },
                    signer_seeds,
                ),
                split,
            )?;
            // Transfer split to seller (and remaining dust if any)
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.vault.to_account_info(),
                        to: ctx.accounts.seller_token_account.to_account_info(),
                        authority: escrow.to_account_info(),
                    },
                    signer_seeds,
                ),
                vault_amount.checked_sub(split).ok_or(EscrowError::MathOverflow)?,
            )?;
        }
    }

    escrow.state = EscrowState::Resolved;
    Ok(())
}
```
