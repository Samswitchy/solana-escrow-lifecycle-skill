---
name: create-escrow-spec
description: Scaffolds a complete, production-ready Solana escrow architecture specification based on specified business requirements.
---

# Command: Create Escrow Spec

Use this command when a developer wants to design a new Solana escrow mechanism (e.g., milestone-based freelance payments, simple OTC tokens, or multi-party vesting schedules).

## Invocation Parameters

Ask the user or deduce from context the following variables:
1. **Escrow Type**: P2P OTC, freelance service, NFT-collateralized, linear vesting.
2. **Participants**: Multi-sig, 2-party, 3-party (Arbiter).
3. **Assets**: Native SOL, SPL Tokens, or Token-2022.
4. **Dispute Resolution**: Human arbiter, multi-sig consensus, oracle trigger.

---

## Action Plan (AI Instructions)

When executing this command, you must output a markdown specification document containing:

### 1. Storage Struct Schema (Rust)
Detail the exact fields of the state account. Account for space constraints, alignment rules, and explicit sizes (e.g., using `InitSpace`).

### 2. PDA Seed Layout
Specify the exact byte structures for PDA derivations to avoid collision:
- **Escrow State PDA**: `[b"escrow", initializer.key().as_ref(), escrow_id.to_le_bytes().as_ref()]`
- **Vault Token PDA**: Associated Token Account owned by the Escrow State PDA.

### 3. State Machine Diagrams & Guards
Provide a Mermaid diagram of the lifecycle and list the checks that the program entrypoints must enforce (e.g., ensuring an escrow cannot be accepted if cancelled).

### 4. Code Stub Scaffolding
Provide Rust/Anchor boilerplate code containing the instructions and the account structures.

```rust
// Boilerplate template to include in output:
#[program]
pub mod my_escrow_program {
    use super::*;
    
    pub fn initialize_escrow(ctx: Context<InitializeEscrow>, escrow_id: u64, amount: u64) -> Result<()> {
        // Init logic...
        Ok(())
    }
    // ...
}
```
