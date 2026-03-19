# @eimerreis/linting

Personal linting and formatting defaults for new JavaScript/TypeScript projects.

Requires Node `^20.19.0 || >=22.12.0`.

Zero peer-dependency setup for consumers: install only `@eimerreis/linting`.

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
npm add -D @eimerreis/linting
```

`lint` also executes react-doctor via:

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
- `lint --fix`: run `oxlint --fix .` and then run react-doctor
- `format --check`: run `oxfmt --check .`

`react-doctor` runs only when the target package has `react`, `react-dom`, or `next` in dependencies/devDependencies/peerDependencies.

### First-time one-shot usage

You do not need to run `init` first.

```bash
npx @eimerreis/linting lint
npx @eimerreis/linting format --check
```

Behavior:

- If project config exists (`.oxlintrc.*` / `oxlint.config.*`, `.oxfmtrc.*` / `oxfmt.config.*`), it uses that.
- If not, it falls back to the package's built-in defaults.

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

## Scripts

Generated project scripts:

```json
{
    "scripts": {
        "lint": "eimerreis-linting lint",
        "lint:fix": "eimerreis-linting lint --fix",
        "format": "eimerreis-linting format",
        "format:check": "eimerreis-linting format --check"
    }
}
```

`init` also adds this dev dependency automatically (if missing):

```json
{
    "devDependencies": {
        "@eimerreis/linting": "^<current-version>"
    }
}
```

## Publish

### Git-based release workflow (Changesets + GitHub Actions)

1. Create a changeset:

```bash
npm run changeset
```

2. Commit `.changeset/*.md` and push to `main`.
3. Workflow `Release` checks for pending changesets.
4. If changesets exist, it versions, publishes via npm trusted publishing (OIDC), and commits `chore: version packages`.

Trusted publishing setup (one-time on npmjs.com):

1. Package `@eimerreis/linting` -> Settings -> Trusted Publisher
2. Provider: GitHub Actions
3. Organization/user: `eimerreis`
4. Repository: `eimerreis-linting`
5. Workflow filename: `release.yml`

No `NPM_TOKEN` secret is required for publishing.
