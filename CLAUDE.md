# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules

Always follow Plan -> Execution patten.

Explore the code path and do not change and code yet.

Summarize flow and key dependencies.


# Claude Code Instructions

## Project Overview

A terminal-based English word learning tool built with Node.js. Package name: `@zhaochy/word-learner`

## How Claude Should Work in This Repo

### Primary Responsibilities
Claude **should**:
- Analyze existing code and architecture
- Propose refactors and improvements
- Generate draft implementations **with explanations**
- Help prepare clean, reviewable pull requests
- Write or update tests when generating code
- Summarize changes clearly for PR descriptions

Claude **must not**:
- Commit directly without explicit instruction
- Bypass existing abstractions or patterns
- Introduce new dependencies without explanation
- Modify security / auth / permission logic silently
- Assume production configuration details

## Coding Standards & Conventions

### General
- Follow existing code structure and naming conventions
- Prefer small, incremental changes
- Avoid speculative refactors unless requested
- Keep changes easy to review and revert

### Language-Specific Rules
- C#: respect async/await patterns, DI usage, Service/Engine abstractions
- TypeScript: prefer explicit types over `any`
- Tests: follow existing test framework and structure

---

## Architectural Constraints

If unsure, Claude must **ask or explain assumptions** before proceeding.

---

## Build, Test & Validation

When generating code, Claude should:
- Identify affected build or test commands
- Point out where tests should be added or updated
- Assume CI will block unsafe or incomplete changes

Claude should **never claim code is “safe” or “production-ready”** without tests.

---

## Git & PR Conventions

- Use clear, conventional commit messages
- PR descriptions should include:
  - What changed
  - Why it changed
  - Risk / impact assessment
- If Claude helped generate code, keep co-authorship metadata

(Using Git `Co-Authored-By: Claude <noreply@anthropic.com>` is recommended)

---

## Review Expectations

All Claude-generated code **must be reviewed by a human engineer**.

Claude should:
- Highlight risky areas
- Explain non-obvious logic
- Call out trade-offs explicitly

---

## Out of Scope

Claude should not:
- Change production configs
- Modify secrets / credentials
- Make licensing or compliance decisions
- Optimize prematurely without data

---

## Interaction Style

- Be concise, factual, and explicit
- Prefer reasoning over confidence
- When uncertain, say so
- Optimize for maintainability over cleverness
``

## Development Setup

```bash
# Install dependencies
npm install

# Run the application
npm start
# or
node index.js
```

## Features

The product.prd.md contains all features of this project.

## Architecture

- **Entry point**: `index.js` - Main application file
- **Runtime**: Node.js (ES modules)
- **Interface**: Terminal/CLI only (no web UI)

## Testing

```bash
npm test
```

## Commands

- `npm start` - Run the word learner application
- `npm test` - Run tests

## Notes

- This is a CLI-only application, no GUI or web interface
- Uses ES modules (type: "module" in package.json)
