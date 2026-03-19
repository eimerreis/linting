# @eimerreis/linting

Personal linting and formatting defaults for new JavaScript/TypeScript projects.

Requires Node `^20.19.0 || >=22.12.0` (matches current `oxlint` and `oxfmt` engines).

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

## Opinionated Defaults

- Prettier-like formatting values from your old setup:
  - `printWidth: 125`
  - `tabWidth: 4`
  - `semi: true`
  - `singleQuote: false`
  - `trailingComma: "es5"`
- Import sorting handled by `oxfmt.sortImports`
- Tailwind class sorting handled by `oxfmt.sortTailwindcss`
- `typescript/no-explicit-any` disabled
- `react/react-in-jsx-scope` disabled
- `react-hooks/refs` and `react-hooks/incompatible-library` explicitly disabled

## Scripts

```json
{
  "scripts": {
    "lint": "oxlint .",
    "lint:fix": "oxlint --fix .",
    "format": "oxfmt .",
    "format:check": "oxfmt --check ."
  }
}
```

## Publish

### Git-based release workflow (Changesets + GitHub Actions)

This repo is set up to release from git history:

1. Add a changeset for every user-facing change:

```bash
npm run changeset
```

2. Commit the generated `.changeset/*.md` file and merge to `main`.
3. GitHub Action `Release` detects pending changesets.
4. If present, it versions, commits `chore: version packages`, and publishes automatically.

Trusted publishing setup (one-time):

1. Open your package on npmjs.com (`@eimerreis/linting`) -> **Settings** -> **Trusted Publisher**
2. Add GitHub Actions publisher with:
   - Organization/user: `eimerreis`
   - Repository: `eimerreis-linting`
   - Workflow filename: `release.yml`
3. No `NPM_TOKEN` secret required for publishing

Notes:

- Trusted publishing requires npm CLI `11.5.1+`; workflow upgrades npm automatically
- For highest security, set package publishing access to "Require two-factor authentication and disallow tokens"

Manual commands (fallback):

```bash
npm run version-packages
npm run release
```

### Manual publish (without changesets)

```bash
npm login
npm publish --access public
```

Since package name is scoped, ensure scope exists and npm account has publish rights for `@eimerreis`.
