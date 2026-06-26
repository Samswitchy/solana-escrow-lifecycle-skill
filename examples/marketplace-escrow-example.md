# Marketplace Escrow Example (OTC & Partial Fills)

This example details how to design marketplace escrows supporting partial fills, platform fee collection, and gasless relayer executions.

## User Scenario
A Seller wants to list 10,000 project tokens for sale on a P2P marketplace.
- **Partial Fills**: The seller allows buyers to buy portions of the listing (e.g., minimum 1,000 tokens per fill).
- **Fees**: The platform takes a 0.5% (50 bps) protocol fee upon successful trade completion.
- **Relayer**: To lower UX friction, the seller signs an off-chain permit letting a relayer submit the listing creation transaction gaslessly.

---

## 1. On-Chain Listing State Structure (Anchor)

```rust
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct ListingV2 {
    pub seller: Pubkey,
    pub token_mint: Pubkey,
    pub total_amount: u64,
    pub remaining_amount: u64,
    pub min_per_trade: u64,
    pub max_per_trade: u64,
    pub expected_payment_amount: u64,
    pub is_active: bool,
    pub bump: u8,
}
```

---

## 2. Anchor Implementation Snippet (Accept Trade with Fee Split)

```rust
pub fn accept_trade_fill(ctx: Context<AcceptTradeFill>, fill_amount: u64) -> Result<()> {
    let listing = &mut ctx.accounts.listing;
    require!(listing.is_active, EscrowError::InactiveListing);
    require!(fill_amount >= listing.min_per_trade, EscrowError::BelowMinimumTrade);
    require!(fill_amount <= listing.remaining_amount, EscrowError::ExceedsRemainingAmount);

    // 1. Calculate fees (50 bps = 0.5%)
    let protocol_fee = fill_amount
        .checked_mul(50)
        .ok_or(EscrowError::MathOverflow)?
        .checked_div(10000)
        .ok_or(EscrowError::MathOverflow)?;

    let net_fill_amount = fill_amount
        .checked_sub(protocol_fee)
        .ok_or(EscrowError::MathOverflow)?;

    // Signer seeds for listing authority
    let signer_seeds: &[&[&[u8]]] = &[&[
        b"listing",
        listing.seller.as_ref(),
        &[listing.bump],
    ]];

    // 2. CPI to transfer net fill amount to Buyer
    anchor_spl::token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token::Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.buyer_token_account.to_account_info(),
                authority: listing.to_account_info(),
            },
            signer_seeds,
        ),
        net_fill_amount,
    )?;

    // 3. CPI to transfer fee to Protocol Fee Wallet
    anchor_spl::token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token::Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.protocol_fee_wallet.to_account_info(),
                authority: listing.to_account_info(),
            },
            signer_seeds,
        ),
        protocol_fee,
    )?;

    // 4. Update state variables
    listing.remaining_amount = listing.remaining_amount
        .checked_sub(fill_amount)
        .ok_or(EscrowError::MathOverflow)?;
    if listing.remaining_amount == 0 {
        listing.is_active = false;
    }

    Ok(())
}
```

---

## 3. Gasless Relayer Execution (Permit Design)

To execute actions without charging the user gas fees, the user signs an off-chain structured payload (EIP-712 equivalent in Solana, verified using `solana_program::secp256k1_program` or Ed25519 instruction checks).

### On-Chain Permit Verification Struct
```rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ExecutionPermitArgs {
    pub user_signature: [u8; 64], // User's Ed25519 signature
    pub message: [u8; 32],        // Hash of (action, nonce, deadline, amount)
    pub deadline: i64,            // Expiration timestamp
    pub nonce: [u8; 32],          // Anti-replay nonce
}
```
The program validates the signature on-chain to ensure the seller authorized the action, and then uses the Relayer's gas wallet to pay the network fees.
