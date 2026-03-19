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
eimerreis-linting init [targetDir] [--force] [--no-editor]
eimerreis-linting lint [targetDir] [--fix] [--ignore-path <path>] [--ignore-pattern <pattern>]
eimerreis-linting format [targetDir] [--check] [--ignore-path <path>] [--ignore-pattern <pattern>]
```

- `init --force`: overwrite existing `.oxlintrc.json` / `.oxfmtrc.json` and script values
- `init --no-editor`: skip generating VS Code editor support files
- `lint --fix`: run `oxlint --fix .` and then run react-doctor
- `format --check`: run `oxfmt --check .`
- `--ignore-path`: add one ignore file (repeatable) for lint/format
- `--ignore-pattern`: add one glob pattern (repeatable) for lint/format

`react-doctor` runs only when the target package has `react`, `react-dom`, or `next` in dependencies/devDependencies/peerDependencies.

### Ignoring files

Supported options:

```bash
eimerreis-linting lint --ignore-path .gitignore
eimerreis-linting format --check --ignore-path .gitignore --ignore-path .prettierignore
eimerreis-linting lint --ignore-pattern "dist/**" --ignore-pattern "coverage/**"
eimerreis-linting format --check --ignore-path .gitignore --ignore-pattern "**/*.generated.ts"
```

You can also add a dedicated ignore file at project root:

```text
.eimerreis-lintingignore
```

If present, it is picked up automatically by both lint and format.

### First-time one-shot usage

You do not need to run `init` first.

```bash
npx @eimerreis/linting lint
npx @eimerreis/linting format --check
```

Behavior:

- If project config exists (`.oxlintrc.*` / `oxlint.config.*`, `.oxfmtrc.*` / `oxfmt.config.*`), it uses that.
- If not, it falls back to the package's built-in defaults.

## Editor Support

`init` also creates editor support files for VS Code:

- `.vscode/settings.json`
- `.vscode/extensions.json`

These enable OXC as formatter/linter, format-on-save, and `source.fixAll.oxc` on save.

If you do not want editor files, use:

```bash
npx @eimerreis/linting init --no-editor
```

## CI Usage

For CI you can run directly with `npx` (no scaffold step required):

```bash
npx @eimerreis/linting lint
npx @eimerreis/linting format --check
```

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
        "format:check": "eimerreis-linting format --check",
        "lint:ignore": "eimerreis-linting lint --ignore-path .eimerreis-lintingignore",
        "format:check:ignore": "eimerreis-linting format --check --ignore-path .eimerreis-lintingignore"
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
