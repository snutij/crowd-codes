---
project_name: 'crowd-codes'
user_name: 'Justin'
date: '2026-01-18'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality', 'workflow_rules', 'critical_rules']
status: 'complete'
rule_count: 35
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| Eleventy | 3.0.0 | Static site generator |
| Nunjucks | (bundled) | Templating |
| SQLite | 3.x (better-sqlite3) | Database |
| Fuse.js | latest | Client-side search |
| Cloudflare Pages | - | CDN hosting |
| GitHub Actions | - | CI/CD pipeline |

**Initialization:**
```bash
npm init -y
npm install @11ty/eleventy@^3.0.0 --save-dev
npm install @11ty/eleventy-plugin-sitemap --save-dev
npm install better-sqlite3 fuse.js
```

---

## Critical Implementation Rules

### Language-Specific Rules (JavaScript/Node.js)

- **ES Modules only** — Use `import`/`export`, never `require()`
- **Async/await preferred** — No raw Promise chains unless necessary
- **Strict error handling** — All async functions must have try/catch
- **JSON logging** — Use `console.log(JSON.stringify({...}))` for structured logs
- **Exit codes** — `0` = success, `1` = recoverable error, `2` = config error

### Framework-Specific Rules (Eleventy)

- **Data files in `src/_data/`** — JSON files auto-available in templates
- **Templates in `src/_includes/`** — Shared Nunjucks partials
- **No client JS by default** — Eleventy outputs static HTML only
- **Build output to `_site/`** — Never commit build artifacts
- **Config in `.eleventy.js`** — Not `eleventy.config.js`

### Naming Conventions (CRITICAL)

| Context | Convention | Example |
|---------|------------|---------|
| Files & folders | kebab-case | `golden-dataset.json` |
| JS variables | camelCase | `brandName`, `parseDescription()` |
| JS constants | SCREAMING_SNAKE | `MAX_RETRY_COUNT` |
| JSON fields | snake_case | `brand_name`, `found_at` |
| SQLite tables | snake_case, plural | `codes`, `parsing_logs` |
| SQLite columns | snake_case | `video_id`, `created_at` |
| URL slugs | kebab-case | `/brands/nord-vpn/` |

### Date/Time Format

- **Always ISO 8601** — `YYYY-MM-DDTHH:mm:ssZ`
- **Always UTC** — Convert for display only
- **Example:** `"2026-01-18T10:30:00Z"`

### Testing Rules

- **Test location:** `tests/` directory (NOT co-located)
- **Test naming:** `{feature}.test.js`
- **Golden dataset:** `data/golden-dataset.json` for regex validation
- **CI gate:** All pattern PRs must pass golden dataset tests
- **Framework:** Node.js native test runner or Vitest

### Code Quality & Style Rules

- **No inline code in YAML** — GitHub Actions call external scripts only
- **Scripts in `scripts/`** — All pipeline logic in separate `.js` files
- **Lintable code** — Never embed JS/Bash as YAML strings
- **Simple error format:**
  ```js
  { error: "Description", code: "ERROR_CODE" }
  ```

### API Quotas (CRITICAL)

| API | Daily Limit | Strategy |
|-----|-------------|----------|
| YouTube Data API | 5,000 units | Batch requests, cache results |
| Gemini Flash | 150 calls | Fallback only, batch unparsed |
| GitHub Actions | 2,000 min/month | Single daily workflow |

### Development Workflow Rules

- **Branch naming:** `{type}/description` (e.g., `feature/add-search`)
- **Commits:** Conventional Commits format
- **No force push** to main
- **PR required** for all changes
- **Daily aggregated PR** for regex suggestions (max ~20 patterns)

---

## Critical Don't-Miss Rules

### NEVER Do This

❌ Inline code in GitHub Actions YAML
❌ Use `require()` instead of `import`
❌ Store API keys in source code
❌ Use camelCase for JSON fields
❌ Put tests next to source files
❌ Use Unix timestamps instead of ISO 8601
❌ Auto-merge regex PRs without CI validation

### ALWAYS Do This

✅ Call scripts from workflow: `run: node scripts/scrape.js`
✅ Store secrets in GitHub Secrets only
✅ Use snake_case for all JSON/SQLite
✅ Run golden dataset tests on pattern changes
✅ Log errors as JSON for parseability
✅ Handle API quota exhaustion gracefully (defer to next day)

### Security Rules

- **Zero PII** — Only anonymous UUID in localStorage
- **CSP strict** — No external scripts allowed
- **HTTPS enforced** — Via Cloudflare (automatic)
- **No user accounts** — Architectural constraint

---

## Project Structure Reference

```
crowd-codes/
├── .github/workflows/     # CI/CD (no inline code!)
├── data/                  # SQLite + patterns + golden dataset
├── scripts/               # Pipeline scripts (JS)
├── src/                   # Eleventy source
│   ├── _data/             # JSON for templates
│   ├── _includes/         # Shared Nunjucks
│   └── brands/            # Brand page templates
├── public/                # Static assets (CSS, client JS)
├── tests/                 # All tests here
└── .eleventy.js           # Eleventy config
```

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Reference architecture.md for detailed decisions

**For Humans:**

- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time

---

_Last updated: 2026-01-18_
