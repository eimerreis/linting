# Changesets

Create a version bump note:

```bash
npm run changeset
```

This creates a markdown file in `.changeset/`.

When merged to `main`, GitHub Actions will:

1. Detect pending changesets
2. Apply version updates on `main` and commit them
3. Publish to npm via trusted publishing (OIDC)
