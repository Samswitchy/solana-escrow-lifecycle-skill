# Solana Escrow Lifecycle Skill Submission

## Summary

Solana Escrow Lifecycle Skill is a production-grade AI Kit skill that helps coding agents design, test, and review non-custodial escrow systems across the full product lifecycle.

It covers:

- Anchor state-machine design.
- PDA vault custody for SPL and Token-2022 assets.
- Signer, owner, mint, and resolver authority checks.
- CPI ordering and checked arithmetic.
- Human/multisig dispute boundaries for AI-assisted evidence review.
- Backend read models and webhook reliability.
- Frontend transaction adapter patterns.
- Integration and adversarial test matrices.

## Why Builders Need It

Escrow is a recurring primitive for Solana products: marketplaces, OTC trades, service payments, milestone contracts, private settlement, grants, and token sales. Many examples show how to lock and release tokens, but fewer guide builders through production concerns such as terminal-state irreversibility, dispute authority, indexing correctness, and UI/backend separation.

This skill gives agents a focused operating manual for those concerns, reducing the chance that a builder ships a superficially working escrow with unsafe edge cases.

## Fit With Solana AI Kit

The repo follows the reference skill shape:

- `skill/SKILL.md` entry point with progressive routing.
- Focused sub-skill docs under `skill/`.
- Optional `agents/`, `commands/`, `rules/`, and `examples/`.
- `install.sh` that installs the complete skill package.
- MIT license.
- Local validation script and GitHub Actions workflow.

## Production Readiness

Production-grade improvements included for submission:

- Real installer for project-local and global Claude skill directories.
- Validation script covering structure, frontmatter, required files, stale snippets, and common rushed-format mistakes.
- CI workflow running validation.
- Corrected examples for create -> accept -> fund escrow lifecycle.
- Corrected invalid TypeScript snippets.
- Corrected enum/account naming in Anchor examples.
- Checked arithmetic in marketplace partial-fill example.
- Bounty-facing README with install, validation, and usage examples.

## Validation

Run:

```bash
npm test
```

Expected result:

```text
Skill validation passed
```

## License

MIT.
