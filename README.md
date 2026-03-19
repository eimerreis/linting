# @eimerreis/linting

Personal linting and formatting defaults for new JavaScript/TypeScript projects.

Requires Node `^20.19.0 || >=22.12.0`.

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

`lint` also executes `react-doctor` via:

```bash
npx react-doctor -y .
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

And updates `package.json` scripts (if present) so linting is executed through this package:

- `lint`
- `lint:fix`
- `format`
- `format:check`

### CLI options

```bash
eimerreis-linting init [targetDir] [--force]
eimerreis-linting lint [targetDir] [--fix]
eimerreis-linting format [targetDir] [--check]
```

- `init --force`: overwrite existing `.oxlintrc.json` / `.oxfmtrc.json` and script values
- `lint --fix`: run `oxlint --fix .` and then `npx react-doctor -y .`
- `format --check`: run `oxfmt --check .`

`react-doctor` runs only when the target package has `react`, `react-dom`, or `next` in dependencies/devDependencies/peerDependencies.

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
