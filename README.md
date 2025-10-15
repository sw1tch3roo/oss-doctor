# oss-doctor

> One command to heal your repo with configurable open-source best practices

`oss-doctor` scans your repository for missing OSS essentials and can automatically fix them — optionally opening a pull request with all the improvements.

**Key Features:**

- ✅ **Non-invasive**: Never overwrites existing files without `--force`
- ⚙️ **Configurable**: Control everything via `.ossdoctor.json`
- 🔒 **Opt-in**: Funding and governance packs require explicit enablement
- 📋 **Deterministic**: See exactly what will change before applying
- 🤖 **Changesets ready**: Built-in prepare-release & release workflows

## Quick Start

```bash
# Scan your repo
npx oss-doctor check

# See planned changes
npx oss-doctor plan

# Apply fixes (shows plan first)
npx oss-doctor fix

# Apply fixes without confirmation
npx oss-doctor fix --yes

# Apply fixes and open a PR
npx oss-doctor fix --yes --pr
```

## Installation

```bash
npm install --save-dev oss-doctor
```

## Commands

### `oss-doctor check [--pack <packs>] [--json]`

Scan repository and report missing files.

```bash
# Check all enabled packs
npx oss-doctor check

# Check specific packs
npx oss-doctor check --pack community,hygiene

# Output as JSON
npx oss-doctor check --json
```

### `oss-doctor plan [--pack <packs>] [--json]`

Show what changes would be made (dry-run).

```bash
# Show plan
npx oss-doctor plan

# Show plan for specific packs
npx oss-doctor plan --pack workflows
```

### `oss-doctor fix [--pack <packs>] [--pr] [--yes] [--force]`

Apply fixes to your repository.

```bash
# Show plan and require confirmation
npx oss-doctor fix

# Apply without confirmation
npx oss-doctor fix --yes

# Apply and open PR
npx oss-doctor fix --yes --pr

# Overwrite existing files
npx oss-doctor fix --yes --force
```

**Options:**

- `--yes, -y`: Skip confirmation
- `--pr`: Create a pull request with changes
- `--force`: Overwrite existing files (use with caution)
- `--pack <packs>`: Only process specific packs (comma-separated)

### `oss-doctor labels sync [--prune]`

Sync labels from your labels file to GitHub.

```bash
# Sync labels (create/update only)
npx oss-doctor labels sync

# Sync and remove unknown labels
npx oss-doctor labels sync --prune
```

Requires `project.labels` configured in `.ossdoctor.json`.

### `oss-doctor init`

Create a `.ossdoctor.json` configuration file.

```bash
npx oss-doctor init
```

## Configuration

Create `.ossdoctor.json` in your project root:

```json
{
  "packs": ["community", "hygiene", "project", "workflows", "docs"],
  "contacts": {
    "securityEmail": "security@example.org"
  },
  "workflows": {
    "ciNode": 20,
    "changesetsFlow": false
  },
  "funding": {
    "enabled": false,
    "providers": {
      "github": ["your-username"],
      "open_collective": "your-collective",
      "ko_fi": "your-kofi"
    }
  },
  "governance": {
    "enabled": false,
    "codeowners": {
      "mode": "explicit",
      "owners": ["@org/team-repo"],
      "paths": {
        "src/**": ["@org/team-repo"]
      }
    }
  },
  "project": {
    "labels": "./lib/packs/templates/labels.json",
    "stale": {
      "enabled": false,
      "days": 60,
      "exceptLabels": ["pinned", "security"]
    },
    "triage": {
      "enabled": true
    }
  },
  "docs": {
    "readmeHealth": true
  }
}
```

### Packs

**Default packs** (enabled by default):

- `community`: CODE_OF_CONDUCT.md, CONTRIBUTING.md, SECURITY.md
- `hygiene`: .editorconfig, .gitattributes
- `project`: Issue templates, PR template
- `workflows`: CI workflow
- `docs`: README health checks (read-only)

**Opt-in packs** (must be explicitly enabled):

- `funding`: FUNDING.yml (requires `funding.enabled: true` AND at least one provider)
- `governance`: CODEOWNERS (requires `governance.enabled: true`)

### Workflows

When `workflows.changesetsFlow: true`, adds:

- `.github/workflows/prepare-release.yml` - Opens "Prepare x.y.z" PR
- `.github/workflows/release.yml` - Publishes to npm on merge

These workflows replicate the [Changesets](https://github.com/changesets/changesets) release flow with provenance.

### Funding (Opt-in)

**Critical**: FUNDING.yml is **only** generated when:

1. `funding.enabled` is `true`, AND
2. At least one provider is configured with a value

```json
{
  "funding": {
    "enabled": true,
    "providers": {
      "github": ["username"],
      "open_collective": "collective-slug",
      "ko_fi": "kofi-name"
    }
  }
}
```

### Governance (Opt-in)

CODEOWNERS is **only** generated when:

1. `governance.enabled` is `true`, AND
2. `codeowners.mode` is `"explicit"`, AND
3. At least one owner is specified

```json
{
  "governance": {
    "enabled": true,
    "codeowners": {
      "mode": "explicit",
      "owners": ["@org/team"],
      "paths": {
        "src/**": ["@org/frontend"],
        "docs/**": ["@org/docs-team"]
      }
    }
  }
}
```

## Packs Reference

### community

- `CODE_OF_CONDUCT.md` - Links to Contributor Covenant
- `CONTRIBUTING.md` - Contribution guidelines
- `SECURITY.md` - Security policy (uses `contacts.securityEmail`)

### hygiene

- `.editorconfig` - Editor configuration
- `.gitattributes` - Git line endings

### project

- `.github/ISSUE_TEMPLATE/bug_report.yml`
- `.github/ISSUE_TEMPLATE/feature_request.yml`
- `.github/ISSUE_TEMPLATE/question.yml`
- `.github/PULL_REQUEST_TEMPLATE.md`

Additional workflows (when enabled):

- `.github/workflows/label-sync.yml` (if `project.labels` configured)
- `.github/workflows/stale.yml` (if `project.stale.enabled: true`)
- `.github/workflows/triage.yml` (if `project.triage.enabled: true`)

### workflows

- `.github/workflows/ci.yml` - Basic CI (uses `workflows.ciNode`)
- `.github/workflows/prepare-release.yml` (if `workflows.changesetsFlow: true`)
- `.github/workflows/release.yml` (if `workflows.changesetsFlow: true`)

### docs

- Checks README for required sections: description, install, usage, contributing, license
- Reports missing sections but does not auto-generate
- Suggests running `readme-shields-sync` if installed

### funding (opt-in)

- `.github/FUNDING.yml` - Only created when `funding.enabled: true` AND providers configured

### governance (opt-in)

- `CODEOWNERS` - Only created when `governance.enabled: true` AND owners specified

## Release Flow

This project uses [Changesets](https://github.com/changesets/changesets) for versioning and publishing. You can add the same flow to your project:

1. **Enable in config**:

   ```json
   {
     "workflows": {
       "changesetsFlow": true
     }
   }
   ```

2. **Run oss-doctor**:

   ```bash
   npx oss-doctor fix --yes
   ```

3. **Set up secrets**:
   - Add `NPM_TOKEN` to your repository secrets (required for publishing)
   - `GITHUB_TOKEN` is provided automatically

4. **Workflow**:
   - Create changesets: `npm run changeset`
   - Merge to `main`
   - `prepare-release.yml` opens "Prepare x.y.z" PR automatically
   - Merge the Prepare PR
   - `release.yml` publishes to npm with provenance and creates GitHub Release

## Safety

- ✅ Never overwrites existing files unless you use `--force`
- ✅ Shows plan before applying changes (unless `--yes`)
- ✅ All generated files include header comment explaining source
- ✅ Funding and governance are strictly opt-in
- ✅ No personal data collected or guessed
- ✅ Deterministic output (same config → same result)

## Examples

### Basic setup

```bash
npx oss-doctor init
npx oss-doctor check
npx oss-doctor fix --yes
```

### Enable funding

Edit `.ossdoctor.json`:

```json
{
  "packs": ["community", "hygiene", "project", "workflows", "funding"],
  "funding": {
    "enabled": true,
    "providers": {
      "github": ["your-username"]
    }
  }
}
```

```bash
npx oss-doctor fix --yes
```

### Enable changesets flow

```json
{
  "workflows": {
    "changesetsFlow": true
  }
}
```

```bash
npx oss-doctor fix --yes
# Add NPM_TOKEN to repo secrets
# Merge changes and start using Changesets!
```

### Sync labels

```json
{
  "project": {
    "labels": "./labels.json"
  }
}
```

Create `labels.json`:

```json
[
  {
    "name": "bug",
    "color": "d73a4a",
    "description": "Something isn't working"
  }
]
```

```bash
npx oss-doctor labels sync
```

## Requirements

- Node.js >= 18
- Git repository
- GitHub CLI (`gh`) for PR creation (optional)

## License

MIT

## Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

Report vulnerabilities by opening a private security advisory on GitHub.
