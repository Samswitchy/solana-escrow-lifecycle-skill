---
name: review-escrow-program
description: Audits a Solana escrow Anchor program file for critical vulnerabilities, signer checks, owner checks, PDA verification, and checked math overflows.
---

# Command: Review Escrow Program

Use this command when a developer asks to review or audit an existing Solana escrow program for security bugs.

## Checklist for Auditing

As the AI agent, you must inspect the target source file(s) and verify the following:

1. **Signer Verification**: 
   - Is `Signer<'info>` used for all participants modifying the escrow status?
   - Look for instruction definitions without `Signer` (e.g., `initializer: AccountInfo<'info>`) and flag them.
2. **PDA seed validation**:
   - Ensure the PDA validation matches `seeds = [...]` and `bump` constraints.
   - Flag any manual PDA derivation checks that don't verify the bump constraint properly.
3. **Owner Check**:
   - For all passed accounts (e.g. token accounts, state accounts), are the owner checks defined (`owner = Token::id()`)?
4. **Token Mint Mismatch**:
   - Does the input token account's mint match the escrow state's target mint?
5. **Checked Math**:
   - Are there calculations using raw mathematical operators (`+`, `-`, `*`, `/`)? Recommend wrapping them in `checked_add`, `checked_sub`, `checked_mul`, `checked_div`.
6. **Clock Precision**:
   - Check if clock calculations are used for sub-second precision. Warn that validator timestamp drift can affect calculations within small windows (e.g., less than 30 seconds).

---

## Output Template

Your audit report must follow this format:

```markdown
# Escrow Security Audit Report

## 1. Summary of Findings
- **Critical/High**: X findings
- **Medium/Low**: Y findings

## 2. Detailed Findings

### [Severity] [Finding Name]
- **Location**: `path/to/file.rs` (Lines LXX-LYY)
- **Vulnerability**: Describe the issue.
- **Risk**: What is the impact? (e.g. theft of vault funds).
- **Remediation**: Provide a diff showing the correct implementation.

```rust
// Show remediated diff
```
```
