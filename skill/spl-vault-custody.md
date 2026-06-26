# SPL Vault Custody in Solana Escrows

Managing token vaults safely in Solana can be tricky if you're not careful with PDA authorities and CPI validation. This guide walks through secure SPL and Token-2022 vault management.

## 1. Vault PDA Derivation

To avoid letting a user control the custody token account directly, the escrow vault token account must be a Program-Derived Address (PDA) or owned/controlled by a Program PDA. 

### Recommended Design: PDA Vault
A token account initialized dynamically as a PDA where the program holds the signature authority (or using the escrow state PDA as the authority).

```rust
#[derive(Accounts)]
pub struct FundEscrow<'info> {
    #[account(mut)]
    pub funder: Signer<'info>,

    #[account(
        mut,
        seeds = [b"escrow", funder.key().as_ref(), escrow_id.to_le_bytes().as_ref()],
        bump = escrow_state.bump
    )]
    pub escrow_state: Account<'info, EscrowAccount>,

    // Vault account initialized by the program, holding the escrowed tokens
    #[account(
        init,
        payer = funder,
        associated_token::mint = token_mint,
        associated_token::authority = escrow_state, // PDA is the owner
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub funder_token_account: Account<'info, TokenAccount>,
    
    pub token_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
```

---

## 2. On-Chain Transfer Security

### The "Execution State First" Rule
Never mutate the escrow status to `Funded` or emit event logs before verifying that the token transfer CPI completed successfully. In Rust/Anchor, returning `Ok(())` or bubble-up errors using the `?` operator ensures that if the transfer fails, the entire transaction reverts, preventing inconsistent states.

```rust
// Correct
pub fn handle_funding(ctx: Context<FundEscrow>) -> Result<()> {
    // 1. Prepare CPI
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = Transfer {
        from: ctx.accounts.funder_token_account.to_account_info(),
        to: ctx.accounts.vault.to_account_info(),
        authority: ctx.accounts.funder.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    // 2. Perform CPI (if this fails, transaction aborts)
    token::transfer(cpi_ctx, ctx.accounts.escrow_state.amount)?;

    // 3. Mutate State only AFTER success
    let escrow_state = &mut ctx.accounts.escrow_state;
    escrow_state.state = EscrowState::Funded;

    Ok(())
}
```

---

## 3. Checked Transfers (Preventing Mint Spoofing)
- Always validate that the mint of the vault account and the mint of the user's token account match the designated escrow mint.
- When dealing with Token-2022, use `token_2022::transfer_checked` which explicitly passes the decimal precision and mint address to avoid transfer manipulation.
- If using `Transfer` wrappers, configure constraints on the token accounts in Anchor:
```rust
#[account(
    constraint = funder_token_account.mint == token_mint.key(),
    constraint = vault.mint == token_mint.key()
)]
```
