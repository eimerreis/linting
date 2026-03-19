# @eimerreis/linting

Personal linting and formatting defaults for new JavaScript/TypeScript projects.

Built on:

- `oxlint` for linting
- `oxfmt` for formatting

Default focus:

- React + TypeScript
- Next.js
- Tailwind class sorting
- Vitest rules

## Install

```bash
npm add -D @eimerreis/linting oxlint oxfmt
```

## Quick Start

From your project root:

```bash
npx @eimerreis/linting init
```

Or with explicit command name:

```bash
npx eimerreis-linting init
```

This creates:

- `.oxlintrc.json`
- `.oxfmtrc.json`

And updates `package.json` scripts (if present):

- `lint`
- `lint:fix`
- `format`
- `format:check`

### CLI options

```bash
eimerreis-linting [init] [targetDir] [--force]
```

- `targetDir`: scaffold config in another directory
- `--force`: overwrite existing `.oxlintrc.json` / `.oxfmtrc.json` and script values

## Manual Setup

If you do not want to use the init script, create the config files manually.

`.oxlintrc.json`

```json
{
  "extends": ["./node_modules/@eimerreis/linting/oxlint.config.json"]
}
```

`.oxfmtrc.json`

```json
{
  "extends": ["./node_modules/@eimerreis/linting/oxfmt.config.json"]
}
```
