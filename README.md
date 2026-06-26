# Solana Escrow Lifecycle Skill

[![Validate Skill](https://github.com/Samswitchy/solana-escrow-lifecycle-skill/actions/workflows/validate.yml/badge.svg)](https://github.com/Samswitchy/solana-escrow-lifecycle-skill/actions/workflows/validate.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Solana AI Kit Skill](https://img.shields.io/badge/Solana%20AI%20Kit-skill-14F195.svg)](https://github.com/solanabr/solana-ai-kit)

A production-grade Solana AI Kit skill for designing, testing, and reviewing non-custodial escrow systems. It gives Claude Code, Codex, Cursor, and other coding agents a focused playbook for escrow lifecycle safety: state machines, SPL vault custody, dispute boundaries, backend indexing, frontend adapters, and integration test coverage.

## Problem

Escrow is one of the most common product primitives in Solana apps: marketplaces, OTC desks, service payments, grants, milestone contracts, token sales, and private settlement flows all need it. Basic escrow examples are easy to find, but production systems fail in the details:

- Missing signer and participant checks.
- PDA seed layouts that collide or cannot be audited.
- Token vaults controlled by the wrong authority.
- State updates emitted before CPI transfers succeed.
- Dispute flows that give an AI agent or backend too much authority.
- Frontends tightly coupled to raw Anchor calls.
- Indexers and webhooks that become trusted sources of truth instead of projections.
- Test suites that cover happy paths but miss timeout, replay, and unauthorized-actor cases.

This skill packages those lifecycle concerns into progressive, token-efficient guidance an agent can load only when needed.

## Why It Is Novel

Most Solana skills focus on one layer: program development, security review, frontend wiring, or indexing. Escrow work crosses all of those boundaries. This skill treats escrow as a product lifecycle, not a single instruction handler:

- **Program layer:** state invariants, PDA custody, checked transfers, terminal-state guards.
- **Security layer:** signer/owner checks, mint constraints, resolver authority, checked math.
- **AI safety layer:** AI can synthesize dispute evidence, but cannot sign payout decisions.
- **Backend layer:** event-driven read models and webhook reliability without trusting the database for authorization.
- **Frontend layer:** semantic transaction adapters instead of raw Anchor calls in UI components.
- **Testing layer:** happy path, timeout, dispute, and adversarial test matrices.

## Repository Layout

```text
solana-escrow-lifecycle-skill/
├── README.md
├── LICENSE
├── install.sh
├── package.json
├── SUBMISSION.md
├── FORM_ANSWERS.md
├── .github/workflows/validate.yml
├── tests/validate-skill.mjs
├── skill/
│   ├── SKILL.md
│   ├── escrow-state-machines.md
│   ├── spl-vault-custody.md
│   ├── escrow-dispute-boundaries.md
│   ├── backend-read-models-webhooks.md
│   ├── frontend-adapter-patterns.md
│   └── escrow-test-matrix.md
├── commands/
│   ├── create-escrow-spec.md
│   ├── review-escrow-program.md
│   ├── generate-escrow-tests.md
│   └── design-escrow-read-model.md
├── agents/
│   ├── escrow-architect.md
│   ├── escrow-security-reviewer.md
│   └── dispute-boundary-reviewer.md
├── rules/
│   ├── escrow-security.mdc
│   └── escrow-design.mdc
└── examples/
    ├── private-escrow-example.md
    ├── service-escrow-example.md
    └── marketplace-escrow-example.md
```

## Install

Install into a project-local Claude skill directory:

```bash
bash install.sh --project /path/to/your/solana-project
```

If no target directory is supplied, `--project` installs into the current working directory.

This copies `skill/`, `agents/`, `commands/`, `rules/`, and `examples/` to:

```text
/path/to/your/solana-project/.claude/skills/solana-escrow-lifecycle/
```

Install globally for your user:

```bash
bash install.sh --global
```

This copies the same bundle to:

```text
~/.claude/skills/solana-escrow-lifecycle/
```

Then register the entry point with Claude Code:

```bash
claude add-skill /path/to/.claude/skills/solana-escrow-lifecycle/skill/SKILL.md
```

## Usage Examples

Ask your coding agent:

- "Design a private SPL-token escrow with timeout cancellation and dispute resolution."
- "Audit this Anchor escrow program for signer, PDA, mint, and CPI ordering bugs."
- "Generate a test matrix for create, accept, fund, confirm, cancel, dispute, and resolve."
- "Design a Postgres read model and webhook flow for my escrow events."
- "Wrap this Anchor escrow client in a frontend adapter so React views do not call raw methods."
- "Review whether my AI dispute assistant has unsafe authority over settlement."

## Skill Routing

The entry point is `skill/SKILL.md`. It routes agents to focused files:

- `escrow-state-machines.md` for lifecycle invariants and timeout rules.
- `spl-vault-custody.md` for PDA vault ownership and checked token transfers.
- `escrow-dispute-boundaries.md` for human/multisig dispute authority and AI limits.
- `backend-read-models-webhooks.md` for event indexing and webhook delivery.
- `frontend-adapter-patterns.md` for client-side transaction adapters.
- `escrow-test-matrix.md` for integration and negative test coverage.

## Validate

Run the local validation script:

```bash
npm test
```

The validation checks that the skill has the expected AI Kit shape, required frontmatter, installable folders, submission docs, CI workflow, and no known rushed-snippet regressions such as Rust-style zero-filled array syntax inside TypeScript examples.

## Submission Fit

This repo is MIT licensed and structured to slot into the Solana AI Kit as a standalone skill. It is designed for builders who are shipping escrow-backed products and need an agent to preserve safety across program code, tests, UI, indexing, and dispute operations.
