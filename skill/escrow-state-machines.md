# Solana Escrow State Machines

This guide covers state-machine design for Solana escrows using Anchor, focusing on enum layouts, state validation guards, and irreversibility rules.

## 1. Escrow Lifecycle Flow

The canonical state machine for a production Solana escrow is modeled as:

```
          [Create] 
              │
              ▼
         ┌───────────┐
         │  Created  │ ◄───────┐ (Unfunded state)
         └─────┬─────┘         │
               │               │
            [Accept]           │ [Expire / Cancel]
               │               │
               ▼               │
         ┌───────────┐         │
         │  Accepted │ ────────┘
         └─────┬─────┘
               │
             [Fund]
               │
               ▼
         ┌───────────┐
         │  Funded   │
         └─────┬─────┘
               │
      ┌────────┴────────┐
   [Confirm]        [Dispute]
      │                 │
      ▼                 ▼
┌───────────┐     ┌───────────┐
│ Completed │     │ Disputed  │ (Terminal State)
└───────────┘     └─────┬─────┘
  (Terminal             │
   State)           [Resolve]
                        │
                        ▼
                  ┌───────────┐
                  │ Resolved  │ (Terminal State)
                  └───────────┘
```

---

## 2. Rust State Representation (Anchor)

We represent the lifecycle status as an Anchor-compatible enum:

```rust
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum EscrowState {
    Created,
    Accepted,
    Funded,
    Completed,
    Disputed,
    Resolved,
    Cancelled,
    Expired,
}
```

And store it inside the primary Escrow state account:

```rust
#[account]
pub struct EscrowAccount {
    pub escrow_id: u64,
    pub initializer: Pubkey,
    pub counterparty: Pubkey,
    pub amount: u64,
    pub state: EscrowState,
    pub expiry_at: i64,
    pub confirmation_window_secs: i64,
    pub bump: u8,
}
```

---

## 3. Transition Guards & Validations

To prevent illegal state jumps, every escrow instruction must enforce preconditions (state guards).

### Check State Eligibility
For example, to fund an escrow, it must currently be in the `Accepted` state:

```rust
pub fn handler(ctx: Context<FundEscrow>) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow_state;
    
    // Guard: Verify starting state
    require!(
        escrow.state == EscrowState::Accepted,
        EscrowError::InvalidStateTransition
    );
    
    // Execute deposit logic ...
    escrow.state = EscrowState::Funded;
    Ok(())
}
```

### Irreversible Terminal States
Terminal states (`Completed`, `Cancelled`, `Expired`, `Resolved`) must never permit transition back or modification. Always enforce that the escrow cannot be mutated once terminated:

```rust
require!(
    escrow.state != EscrowState::Completed && 
    escrow.state != EscrowState::Cancelled &&
    escrow.state != EscrowState::Resolved,
    EscrowError::EscrowAlreadyClosed
);
```

### Expiry and Timeouts
When checks depend on deadlines, calculate the expiration against the on-chain clock:

```rust
let clock = Clock::get()?;
let current_time = clock.unix_timestamp;

// Check if expired
if escrow.state == EscrowState::Created && current_time > escrow.expiry_at {
    escrow.state = EscrowState::Expired;
}
```
*Note: Validators can manipulate the block timestamp slightly (usually within a 15-30 second window). For escrow windows (e.g. 45 minutes), this deviation is negligible.*
