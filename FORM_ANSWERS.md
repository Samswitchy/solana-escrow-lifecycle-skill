# Bounty Form Answers

## Project Name

Solana Escrow Lifecycle Skill

## Repository / PR Link

https://github.com/Samswitchy/solana-escrow-lifecycle-skill

## What Did You Build?

A Solana AI Kit skill that teaches coding agents how to design, test, and review production-grade non-custodial escrow systems. It includes a progressive `SKILL.md` router, focused sub-skills, command templates, agent personas, Cursor/Claude rules, concrete escrow examples, an installer, validation tests, and CI.

## What Problem Does It Solve?

Solana builders frequently need escrow flows for marketplaces, OTC settlement, service payments, milestone contracts, grants, and token sales. Basic escrow examples are common, but production escrow requires much more: signer checks, PDA vault custody, checked token transfers, lifecycle invariants, timeout handling, dispute boundaries, frontend adapters, backend indexing, and adversarial tests.

This skill helps coding agents preserve those requirements throughout the build process instead of treating escrow as a simple lock-and-release instruction.

## Why Is It Useful?

Builders can invoke the skill when they need to:

- Design an escrow state machine.
- Audit an Anchor escrow program.
- Generate integration tests and negative tests.
- Define safe SPL vault custody.
- Keep AI dispute tooling away from signing authority.
- Build read models and webhook flows.
- Create frontend adapters that hide raw Anchor details from UI views.

## Why Is It Novel?

The skill treats escrow as a full product lifecycle rather than a single smart-contract snippet. It combines program architecture, security review, AI safety, backend indexing, frontend integration, and test strategy in one progressively loaded skill package.

## How Does It Fit The Solana AI Kit?

It follows the reference skill structure:

- `skill/SKILL.md` entry point.
- Focused sub-skill markdown files.
- Optional `agents/`, `commands/`, `rules/`, and `examples/`.
- `install.sh` for complete package installation.
- MIT license.
- Validation workflow for CI.

## How Do You Install It?

Project-local install:

```bash
bash install.sh --project /path/to/your/solana-project
```

Global install:

```bash
bash install.sh --global
```

Then register:

```bash
claude add-skill /path/to/.claude/skills/solana-escrow-lifecycle/skill/SKILL.md
```

## How Do You Validate It?

```bash
npm test
```

The validation script checks the expected AI Kit shape, required docs, frontmatter, installer coverage, CI workflow, and known snippet-quality regressions.

## License

MIT.
