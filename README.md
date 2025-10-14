# oss-doctor

> One command to heal your repo

`oss-doctor` scans your repository for missing OSS essentials and can
automatically fix them — optionally opening a pull request with all the
improvements.

## Quick Start

```bash
# Scan your repo
npx oss-doctor check

# Apply fixes locally
npx oss-doctor fix

# Apply fixes and open a PR
npx oss-doctor fix --pr
```

## What It Adds

### Community Pack

- `CODE_OF_CONDUCT.md`
- `CONTRIBUTING.md`
- `SECURITY.md`

### GitHub Pack

- `.github/ISSUE_TEMPLATE/bug_report.yml`
- `.github/ISSUE_TEMPLATE/feature_request.yml`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/FUNDING.yml`

### Code Pack

- `.editorconfig`
- `.gitattributes`

### CI Pack

- `.github/workflows/ci.yml`

## Release Flow

This project uses [Changesets](https://github.com/changesets/changesets) for
versioning and publishing:

1. **Create a changeset**: Run `npm run changeset` and describe your changes
2. **Prepare Release PR**: The `prepare-release.yml` workflow automatically
   opens or updates a "Prepare x.y.z" PR when changesets are merged to `main`
3. **Publish**: Merging the Prepare PR triggers the `release.yml` workflow
   which:
   - Publishes to npm with provenance
   - Creates a GitHub Release
   - Pushes git tags

### Setup

To enable releases, set the `NPM_TOKEN` secret in your repository settings.
The `GITHUB_TOKEN` is provided automatically by GitHub Actions.

## License

MIT
