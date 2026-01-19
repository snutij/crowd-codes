# Story 2.6: Create Daily Pipeline GitHub Action

Status: done

## Story

As a **maintainer**,
I want **an automated daily pipeline that scrapes, parses, exports, and deploys**,
So that **the site has fresh codes every day with zero manual effort** (NFR-I3).

## Acceptance Criteria

1. **Given** `.github/workflows/daily-pipeline.yml` exists, **When** I inspect the workflow, **Then** it triggers on schedule (daily at 6 AM UTC) and workflow_dispatch

2. **Given** the workflow runs, **When** I check the job sequence, **Then** steps execute: checkout → setup node → npm ci → scrape → parse → export → commit → build → deploy

3. **Given** pipeline runtime (NFR-I3), **When** the full pipeline completes, **Then** total time is < 30 minutes

4. **Given** the workflow file, **When** I check for inline code, **Then** all logic is in external scripts

## Tasks / Subtasks

- [x] Task 1: Create daily-pipeline.yml workflow file (AC: #1)
  - [x] Create `.github/workflows/daily-pipeline.yml`
  - [x] Add schedule trigger for 6 AM UTC (`cron: '0 6 * * *'`)
  - [x] Add workflow_dispatch trigger for manual runs
  - [x] Set appropriate timeout (30 min per NFR-I3)

- [x] Task 2: Implement job steps (AC: #2)
  - [x] Checkout repository with actions/checkout@v4
  - [x] Setup Node.js 18 with actions/setup-node@v4
  - [x] Install dependencies with npm ci
  - [x] Run scrape: `node scripts/scrape.js`
  - [x] Run parse: `node scripts/parse.js`
  - [x] Run export: `node scripts/export.js`
  - [x] Commit data changes if any
  - [x] Build Eleventy: `npm run build`
  - [x] Deploy to Cloudflare Pages

- [x] Task 3: Implement data commit step (AC: #2)
  - [x] Configure git user for commits
  - [x] Check for changes in data/ and src/_data/
  - [x] Commit and push changes if modified
  - [x] Use GitHub token for push authentication

- [x] Task 4: Configure Cloudflare Pages deployment (AC: #2)
  - [x] Use cloudflare/pages-action@v1
  - [x] Reference existing secrets (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)
  - [x] Set project name and directory

- [x] Task 5: Add error handling and concurrency (AC: #3, #4)
  - [x] Add concurrency group to prevent parallel runs
  - [x] Set job timeout-minutes: 30
  - [x] Ensure external scripts handle their own errors (exit codes)

- [ ] Task 6: Test workflow manually (POST-MERGE - requires GitHub)
  - [ ] Trigger via workflow_dispatch
  - [ ] Verify all steps complete successfully
  - [ ] Verify data is committed if changed
  - [ ] Verify site is deployed to Cloudflare

## Dev Notes

### Architecture Constraints (CRITICAL)

Per `architecture.md` and `project-context.md`:

1. **Single workflow file**: `daily-pipeline.yml` (not multiple workflows)
2. **No inline code in YAML**: All logic must be in external scripts (`scripts/*.js`)
3. **Job sequence**: scrape → parse → export → commit → build → deploy
4. **Runtime limit**: < 30 minutes total (NFR-I3)
5. **File naming**: kebab-case for workflow file

### Workflow Structure (Architecture Spec)

```yaml
# .github/workflows/daily-pipeline.yml
name: Daily Pipeline

on:
  schedule:
    - cron: '0 6 * * *'  # 6 AM UTC daily
  workflow_dispatch:      # Manual trigger

concurrency:
  group: daily-pipeline
  cancel-in-progress: false  # Let current run complete

jobs:
  pipeline:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci

      - name: Run scraper
        run: node scripts/scrape.js
        env:
          YOUTUBE_API_KEY: ${{ secrets.YOUTUBE_API_KEY }}

      - name: Run parser
        run: node scripts/parse.js
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}

      - name: Export to JSON
        run: node scripts/export.js

      - name: Commit data changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data/ src/_data/
          git diff --staged --quiet || git commit -m "chore: update codes data $(date -u +%Y-%m-%d)"
          git push

      - name: Build site
        run: npm run build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: crowd-codes
          directory: _site
```

### Existing Infrastructure

From Story 1.4, the following secrets should already be configured:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Additional secrets needed for pipeline:
- `YOUTUBE_API_KEY` (for scrape.js)
- `GEMINI_API_KEY` (for parse.js LLM fallback)

### Existing Scripts (from Epic 2 Stories)

All pipeline scripts already exist:
- `scripts/scrape.js` (Story 2.2) - YouTube scraper with adapter pattern
- `scripts/parse.js` (Stories 2.3, 2.4) - Regex + LLM fallback parser
- `scripts/export.js` (Story 2.5) - JSON export for Eleventy

### Exit Code Convention

Per project-context.md, all scripts use:
- Exit 0: Success
- Exit 1: Recoverable error (should not fail pipeline)
- Exit 2: Config error (should fail pipeline)

### Git Commit Strategy

The commit step should:
1. Only commit if there are actual changes
2. Use a bot user for commits
3. Include date in commit message for traceability
4. Push with default GITHUB_TOKEN (has push permission)

### Previous Story Learnings (Stories 2.2-2.5)

- Scripts use ES Modules (`import`/`export`)
- Database path: `data/codes.db` (set via `CROWD_CODES_DB_PATH` env var)
- JSON output: `src/_data/codes.json`
- All scripts have JSON-format error logging
- better-sqlite3 is synchronous (no async/await needed for DB)

### NFR Compliance

- **NFR-I3**: GitHub Actions Runtime < 30 min/day
  - Set `timeout-minutes: 30` on job
  - Monitor actual runtime after deployment

- **NFR-S1**: API Keys Protection
  - All API keys in GitHub Secrets, never in source code
  - Referenced via `${{ secrets.* }}` in workflow

### Testing Strategy

Since this is a GitHub Actions workflow:
1. Manual trigger via workflow_dispatch to test
2. Verify each step completes in Actions logs
3. Verify data changes are committed
4. Verify Cloudflare deployment succeeds

No unit tests needed for YAML workflow file (tested by execution).

### Differences from deploy.yml

The existing `deploy.yml` triggers on push to main. The new `daily-pipeline.yml`:
1. Triggers on schedule (daily) + manual dispatch
2. Runs the data pipeline scripts before build
3. Commits data changes back to repo
4. Then builds and deploys

Both workflows deploy to the same Cloudflare Pages project.

### References

- [Source: prd.md#NFR-I3] - GitHub Actions Runtime < 30 min/day
- [Source: architecture.md#Pipeline-Architecture] - Workflow structure
- [Source: architecture.md#Integration-Points] - External service connections
- [Source: project-context.md] - Exit codes, naming conventions

### Project Structure Notes

Files to create/modify:
```
crowd-codes/
├── .github/
│   └── workflows/
│       ├── deploy.yml              # EXISTING: Push-triggered deploy
│       └── daily-pipeline.yml      # NEW: Daily scrape → deploy
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Tests run: `npm test` - 78/78 tests pass (no regressions)
- YAML validation: `yaml-lint` passed

### Completion Notes List

- Created `.github/workflows/daily-pipeline.yml` with complete pipeline
- Schedule trigger: 6 AM UTC daily (`cron: '0 6 * * *'`)
- Manual trigger: `workflow_dispatch` enabled
- Job timeout: 30 minutes per NFR-I3
- Concurrency group: `daily-pipeline` prevents parallel runs
- Step sequence: checkout → setup node → npm ci → init-db → scrape → parse → export → commit → build → deploy
- Git commit step: bot user, only commits if changes exist, includes date
- Cloudflare deployment: uses existing secrets (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)
- All logic in external scripts: no inline code in YAML (AC4 satisfied)
- Required new secrets documented: YOUTUBE_API_KEY, GEMINI_API_KEY

### Code Review Fixes (2026-01-19)

- **M1 Fixed**: Added `continue-on-error: true` for scrape.js and parse.js (recoverable errors don't block pipeline)
- **M2 Fixed**: Added `node scripts/init-db.js` step before scraper (ensures database exists)
- **M3 Fixed**: Added `git pull --rebase` before push (prevents race condition with concurrent workflows)

### File List

**New files:**
- .github/workflows/daily-pipeline.yml

**Modified files:**
- None
