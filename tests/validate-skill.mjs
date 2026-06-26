import { access, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const requiredFiles = [
  'README.md',
  'LICENSE',
  'install.sh',
  'package.json',
  'SUBMISSION.md',
  'FORM_ANSWERS.md',
  '.github/workflows/validate.yml',
  'skill/SKILL.md',
  'skill/escrow-state-machines.md',
  'skill/spl-vault-custody.md',
  'skill/escrow-dispute-boundaries.md',
  'skill/backend-read-models-webhooks.md',
  'skill/frontend-adapter-patterns.md',
  'skill/escrow-test-matrix.md',
  'commands/create-escrow-spec.md',
  'commands/review-escrow-program.md',
  'commands/generate-escrow-tests.md',
  'commands/design-escrow-read-model.md',
  'agents/escrow-architect.md',
  'agents/escrow-security-reviewer.md',
  'agents/dispute-boundary-reviewer.md',
  'rules/escrow-security.mdc',
  'rules/escrow-design.mdc',
  'examples/private-escrow-example.md',
  'examples/service-escrow-example.md',
  'examples/marketplace-escrow-example.md'
];

const requiredDirs = ['skill', 'agents', 'commands', 'rules', 'examples', 'tests', '.github/workflows'];
const failures = [];

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function read(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

for (const dir of requiredDirs) {
  const absolute = path.join(root, dir);
  try {
    const info = await stat(absolute);
    assert(info.isDirectory(), `${dir} must be a directory`);
  } catch {
    failures.push(`${dir} is missing`);
  }
}

for (const file of requiredFiles) {
  assert(await exists(file), `${file} is missing`);
}

const skillEntry = await read('skill/SKILL.md');
assert(skillEntry.startsWith('---\n'), 'skill/SKILL.md must start with YAML frontmatter');
assert(skillEntry.includes('\nname: solana-escrow-lifecycle\n'), 'SKILL.md must declare the expected skill name');
assert(skillEntry.includes('\nuser-invocable: true\n'), 'SKILL.md must be user-invocable');
assert(skillEntry.includes('## Sub-Skill Router'), 'SKILL.md must include progressive routing');

const install = await read('install.sh');
for (const dir of ['skill', 'agents', 'commands', 'rules', 'examples']) {
  assert(install.includes(dir), `install.sh must copy ${dir}/`);
}
assert(install.includes('.claude/skills'), 'install.sh must install into a Claude skills directory');
assert(install.includes('--global'), 'install.sh must support global installation');
assert(install.includes('--project'), 'install.sh must support project installation');

const readme = await read('README.md');
assert(readme.includes('## Problem'), 'README must explain the problem');
assert(readme.includes('## Why It Is Novel'), 'README must explain novelty');
assert(readme.includes('## Install'), 'README must document installation');
assert(readme.includes('## Validate'), 'README must document validation');
assert(readme.includes('actions/workflows/validate.yml/badge.svg'), 'README must include validation status badge');
assert(readme.includes('License-MIT'), 'README must include MIT license badge');
assert(!readme.includes('reference/solia_escrow'), 'README must not reference missing reference/solia_escrow');

const privateExample = await read('examples/private-escrow-example.md');
assert(privateExample.includes('accept_escrow'), 'private escrow example must include accept_escrow');
assert(privateExample.includes('EscrowState::Accepted'), 'private escrow funding must require Accepted state');
assert(!privateExample.includes('ctx.bumps.get'), 'private escrow example should use current Anchor bump access');

const marketplaceExample = await read('examples/marketplace-escrow-example.md');
assert(!marketplaceExample.includes('remaining_amount -='), 'marketplace example must avoid unchecked subtraction');
assert(marketplaceExample.includes('checked_sub(fill_amount)'), 'marketplace example must use checked subtraction');

const allMarkdownFiles = [];
async function collectMarkdown(dir) {
  const entries = await readdir(path.join(root, dir), { withFileTypes: true });
  for (const entry of entries) {
    const relative = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectMarkdown(relative);
    } else if (/\.(md|mdc)$/.test(entry.name)) {
      allMarkdownFiles.push(relative);
    }
  }
}

for (const dir of ['skill', 'commands', 'agents', 'rules', 'examples']) {
  await collectMarkdown(dir);
}
allMarkdownFiles.push('README.md', 'SUBMISSION.md', 'FORM_ANSWERS.md');

for (const file of allMarkdownFiles) {
  const content = await read(file);
  assert(!content.includes('[0; 32]'), `${file} contains Rust-style [0; 32] outside Rust context`);
  assert(!content.includes("Account<'info, EscrowState>"), `${file} treats EscrowState enum as an account`);
  assert(!content.includes('EscrowState::INIT_SPACE'), `${file} uses enum INIT_SPACE instead of an account INIT_SPACE`);
  assert(!content.includes('solia_escrow'), `${file} contains stale solia_escrow reference`);
  assert(!content.includes('YOUR_'), `${file} contains placeholder YOUR_ text`);
}

if (failures.length > 0) {
  console.error('Skill validation failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Skill validation passed (${requiredFiles.length} files, ${requiredDirs.length} directories).`);
