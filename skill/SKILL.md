---
name: solana-escrow-lifecycle
description: A production-ready Solana skill for designing, testing, and reviewing non-custodial escrow systems, covering SPL vault custody, lifecycle state machines, dispute boundaries, indexing read models, and frontend adapter flows.
user-invocable: true
---

# Solana Escrow Lifecycle Skill

This skill teaches coding agents how to build, test, and audit non-custodial escrow programs on Solana. It focuses on the end-to-end deal lifecycle—from initial token locking to final confirmation, timeout cancellation, and dispute handling.

> **Extends**: [solana-dev-skill](https://github.com/solana-foundation/solana-dev-skill)

---

## When to Invoke

Load this skill when the developer is:
- **Designing State Transitions**: Enforcing state invariants (Created, Accepted, Funded, Completed, Disputed, Cancelled).
- **Managing Vault Custody**: Deriving vault PDAs, implementing checked token transfers, and protecting vaults against exploit vectors.
- **Handling Disputes**: Setting up trust boundaries (ensuring the AI only digests dispute evidence but does not sign payout transactions).
- **Indexing Events**: Writing block walkers or WebSocket logs to feed Postgres/MongoDB read models.
- **Abstracting Transactions**: Packaging raw Anchor instructions into clean client-side adapters.

---

## Sub-Skill Router

Refer to these focused sub-skills to resolve specific tasks without overloading context:

| File | Core Subject |
|------|--------------|
| [escrow-state-machines.md](escrow-state-machines.md) | Storage structures, status enums, and transition guards. |
| [spl-vault-custody.md](spl-vault-custody.md) | Safe token custody, checked transfers, and PDA authority derivation. |
| [escrow-dispute-boundaries.md](escrow-dispute-boundaries.md) | Dispute mechanics, trust layouts, and safety guardrails. |
| [backend-read-models-webhooks.md](backend-read-models-webhooks.md) | Parsing transaction log events, indexing strategies, and webhooks. |
| [frontend-adapter-patterns.md](frontend-adapter-patterns.md) | Structuring client adapters to decouple UI views from raw Anchor Web3 calls. |
| [escrow-test-matrix.md](escrow-test-matrix.md) | Integration test scenarios, mock clocks, and negative boundary test scripts. |

---

## Workspace Tools & Commands

Use these templates to automate standard tasks:
- [create-escrow-spec.md](../commands/create-escrow-spec.md) - Generate technical spec files.
- [review-escrow-program.md](../commands/review-escrow-program.md) - Static code audit checklists.
- [generate-escrow-tests.md](../commands/generate-escrow-tests.md) - Mocha/TypeScript test scaffolding.
- [design-escrow-read-model.md](../commands/design-escrow-read-model.md) - Database indexing and webhook definitions.

---

## Personas & Templates

- [escrow-architect.md](../agents/escrow-architect.md) - Architecture & PDA optimization guidance.
- [escrow-security-reviewer.md](../agents/escrow-security-reviewer.md) - Security auditing checklists.
- [dispute-boundary-reviewer.md](../agents/dispute-boundary-reviewer.md) - Trust alignment and AI boundaries.
- [private-escrow-example.md](../examples/private-escrow-example.md) - Standard P2P escrow reference code.
- [service-escrow-example.md](../examples/service-escrow-example.md) - Milestone contract reference code.
- [marketplace-escrow-example.md](../examples/marketplace-escrow-example.md) - Partial fills and gasless relayer reference code.
