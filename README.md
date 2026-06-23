# Solana Escrow Lifecycle Skill (Solana AI Kit)

An opinionated, production-ready skill addon for **Claude Code** and **Cursor** that instructs AI coding assistants on how to build and maintain secure, non-custodial escrow programs on Solana. 

This skill provides the rule definitions, command specifications, and architectural patterns needed to manage the entire lifecycle of an escrow, avoiding common on-chain footguns like missing signer checks, incorrect PDA authority management, and frontrunnable dispute logic.

---

## Why This Skill?

Writing a basic two-party escrow on Solana is straightforward, but productionizing it introduces several subtle gotchas:
* **State Machine Invariants**: Preventing terminal states (like a cancelled or completed escrow) from being mutated or processed twice.
* **CPI Race Conditions**: Mutating state variables or emitting logs *before* verifying that the underlying token transfer CPI succeeded.
* **AI Dispute Boundaries**: Over-relying on LLMs to determine on-chain payout decisions instead of restricting AI to evidence synthesis.
* **Tight Frontend Coupling**: Embedding raw Anchor context and transaction builders directly inside UI views instead of abstracting them behind semantic adapters.
* **PDA Seed Collisions**: Deriving account seeds without proper domain separation, exposing the program to exploit vectors.

This skill equips your coding agent to handle these issues automatically.

---

## Directory Layout

```
solana-escrow-lifecycle-skill/
├── README.md               # You are here
├── LICENSE                 # MIT License
├── install.sh              # Copies custom rules to your active project
├── rules/
│   ├── escrow-security.mdc # Enforces signer, owner, and CPI checks
│   └── escrow-design.mdc   # Standardizes PDA layouts and state updates
├── skill/
│   ├── SKILL.md            # Entrypoint routing logic (saves token context)
│   ├── escrow-state-machines.md      # State validation & timeout logic
│   ├── spl-vault-custody.md          # Token vault ownership & checked transfers
│   ├── escrow-dispute-boundaries.md  # Dispute limits & AI safety rules
│   ├── backend-read-models-webhooks.md # Indexer sync schemas & webhooks
│   ├── frontend-adapter-patterns.md  # Decoupling frontends via adapters
│   └── escrow-test-matrix.md         # Happy-path and negative test matrices
├── commands/
│   ├── create-escrow-spec.md         # Scaffold escrow specs
│   ├── review-escrow-program.md      # Static program security checks
│   ├── generate-escrow-tests.md      # Scaffolding integration tests
│   └── design-escrow-read-model.md   # Indexer schemas
├── agents/
│   ├── escrow-architect.md           # Systems Designer persona
│   ├── escrow-security-reviewer.md   # Code Auditor persona
│   └── dispute-boundary-reviewer.md  # Governance Analyst persona
├── examples/
│   ├── private-escrow-example.md      # Simple P2P escrow walk-through
│   ├── service-escrow-example.md      # Milestone-based contract flow
│   └── marketplace-escrow-example.md  # OTC partial-fills + relayer permits
└── reference/
    └── solia_escrow/       # Code template based on a live production program
```

---

## Setup & Usage

### 1. Copy Custom Rules to Your Workspace
Copy the custom rules (`.mdc` files) into your target project directory:
```bash
bash install.sh
```
This registers:
- `escrow-security.mdc` (runs static checks for signer/owner constraints)
- `escrow-design.mdc` (standardizes PDA seed structures and event layout)

### 2. Register with Claude Code
If you are using Claude Code, point it to the main routing file:
```bash
claude add-skill $(pwd)/skill/SKILL.md
```

You can now ask your coding agent questions like:
* *"Audit this program for escrow-related vulnerabilities."*
* *"Show me how to structure the PDA seeds for a P2P token escrow."*
* *"How should I sync my backend DB with the program events?"*
* *"Write an integration test suite for this escrow using Bankrun."*
