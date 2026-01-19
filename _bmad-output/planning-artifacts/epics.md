---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
workflowCompleted: true
completedAt: '2026-01-19'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# crowd-codes - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for crowd-codes, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**Code Discovery (FR1-6)**
- FR1: Users can search for promo codes by brand name
- FR2: Users can see search results instantly (fuzzy matching)
- FR3: Users can see codes sorted by discovery date (most recent first)
- FR4: Users can see a contextual message explaining why no code exists for a brand
- FR5: Users can access a dedicated brand page directly (via URL or SEO)
- FR6: Users can distinguish a "no results" state from a "loading error" state

**Code Interaction (FR7-10)**
- FR7: Users can copy a code in a single click
- FR8: Users receive immediate visual feedback after copying ("Copied!")
- FR9: Users can see the code source (YouTube channel, date)
- FR10: Users can see the discovery date of each code

**Data Pipeline (FR11-17)**
- FR11: The system can scrape YouTube FR video descriptions daily
- FR12: The system can parse promo codes via predefined regex
- FR13: The system can use an LLM as fallback for unparsed descriptions
- FR14: The system can persist codes durably
- FR15: The system can serve data to the frontend performantly
- FR16: The system can filter videos by relevant keywords (promo code, discount, etc.)
- FR17: The system can abstract the data source (adapter pattern) to decouple YouTube from the internal model

**Self-Improvement (FR18-22)**
- FR18: The LLM can suggest a new regex when it parses successfully
- FR19: The LLM can return the original description to enrich the test dataset
- FR20: The system can create a daily aggregated GitHub PR with newly suggested regex
- FR21: The system can validate new regex against a golden dataset in CI
- FR22: The system can block a PR if regressions are detected

**Analytics & Observability (FR23-28)**
- FR23: Users can view a public /stats page
- FR24: The maintainer can see the last scraping status
- FR25: The maintainer can see the number of codes found per day
- FR26: The maintainer can see the parsing rate (regex vs LLM)
- FR27: The system can track code copies per user session (local UUID)
- FR28: The maintainer can see error logs including the unrecognized pattern and a regex suggestion

**SEO & Content (FR29-32)**
- FR29: The system can generate static HTML pages per brand
- FR30: The system can generate a sitemap.xml with all brand pages
- FR31: The system can include JSON-LD data (schema.org) for rich snippets
- FR32: Each brand page can have SEO-optimized meta tags

**Platform & UX (FR33-36)**
- FR33: Users can use the site on mobile with an optimized experience
- FR34: Users can use the site without creating an account
- FR35: Users can use the site without seeing ads or popups
- FR36: Users can use the site on modern browsers (Chrome, Firefox, Safari, Edge)

**Open Source & Forkability (FR37-38)**
- FR37: The project includes documentation allowing a third party to fork and deploy their own instance
- FR38: The project includes a `.env.example` file documenting required environment variables

### NonFunctional Requirements

**Performance (NFR-P1 to NFR-P6)**
- NFR-P1: Time to First Byte (TTFB) < 100ms
- NFR-P2: First Contentful Paint (FCP) < 1s
- NFR-P3: Time to Interactive (TTI) < 2s
- NFR-P4: Lighthouse Performance Score > 90
- NFR-P5: Search Response Time < 200ms (client-side Fuse.js)
- NFR-P6: Static Asset Size < 50KB (gzipped)

**Security (NFR-S1 to NFR-S4)**
- NFR-S1: API Keys Protection — Never in source code (GitHub Secrets only)
- NFR-S2: HTTPS Enforcement — 100% traffic (Cloudflare auto SSL)
- NFR-S3: Content Security Policy — Restrict external scripts (prevent XSS)
- NFR-S4: No User Data Collection — Zero PII stored (only anonymous UUID in localStorage)

**Accessibility (NFR-A1 to NFR-A5)**
- NFR-A1: Color Contrast Ratio — WCAG AA (4.5:1 minimum)
- NFR-A2: Form Labels — All inputs labeled
- NFR-A3: Keyboard Navigation — Full site navigable via keyboard
- NFR-A4: Focus Indicators — Visible focus states
- NFR-A5: Copy Action Feedback — Visual + ARIA announcement ("Copié !")

**Integration (NFR-I1 to NFR-I5)**
- NFR-I1: YouTube API Quota < 5000 units/day (free tier)
- NFR-I2: LLM API Quota < 150 calls/day (Gemini Flash free tier)
- NFR-I3: GitHub Actions Runtime < 30 min/day (free tier)
- NFR-I4: Graceful API Degradation — Buffer unparsed for retry
- NFR-I5: Cloudflare Pages Build < 5 min/build

**Reliability (NFR-R1 to NFR-R3)**
- NFR-R1: Site Availability — Best effort (no SLA, Cloudflare uptime)
- NFR-R2: Data Pipeline Recovery — Resume from last checkpoint (SQLite source of truth)
- NFR-R3: Build Failure Notification — Alert via webhook (Discord/Slack)

### Additional Requirements

**From Architecture:**
- **Starter Template:** Eleventy v3.0.0 (must be initialized in Epic 1 Story 1)
- **Database:** SQLite in repository (data/codes.db)
- **Pipeline Scripts:** External JS files (scripts/*.js), no inline code in YAML
- **Project Structure:** Defined folder structure (src/, scripts/, data/, public/, tests/)
- **Naming Conventions:** kebab-case files, camelCase JS, snake_case JSON/SQL
- **JSON Export:** Single codes.json file with meta + codes array
- **CI/CD:** GitHub Actions with daily-pipeline.yml and test-patterns.yml
- **Hosting:** Cloudflare Pages (zero cost)

**From UX Design:**
- **Design System:** Vanilla CSS with custom tokens (no framework)
- **Components:** 4 custom components (SearchInput, CodeCard, CopyButton, Toast)
- **Mobile-First:** Single breakpoint at 768px
- **Touch Targets:** Minimum 44×44px
- **Accessibility:** WCAG 2.1 AA compliance, Pa11y CI integration
- **Dark Mode:** CSS custom properties with prefers-color-scheme support
- **Motion:** Respect prefers-reduced-motion
- **Typography:** System fonts only (zero download)

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 3 | Search for promo codes by brand name |
| FR2 | Epic 3 | Instant search results (fuzzy matching) |
| FR3 | Epic 3 | Codes sorted by discovery date |
| FR4 | Epic 3 | Contextual empty state message |
| FR5 | Epic 3 | Direct brand page access |
| FR6 | Epic 3 | Distinguish "no results" from "error" |
| FR7 | Epic 3 | Single-click copy |
| FR8 | Epic 3 | Visual feedback after copying |
| FR9 | Epic 3 | Display code source |
| FR10 | Epic 3 | Display discovery date |
| FR11 | Epic 2 | Daily YouTube scraping |
| FR12 | Epic 2 | Regex-based parsing |
| FR13 | Epic 2 | LLM fallback parsing |
| FR14 | Epic 2 | Durable code persistence |
| FR15 | Epic 2 | Performant data serving |
| FR16 | Epic 2 | Keyword filtering |
| FR17 | Epic 2 | Data source abstraction (adapter pattern) |
| FR18 | Epic 6 | LLM suggests new regex |
| FR19 | Epic 6 | Return original description for dataset |
| FR20 | Epic 6 | Daily aggregated GitHub PR |
| FR21 | Epic 6 | CI validation against golden dataset |
| FR22 | Epic 6 | Block PR on regression |
| FR23 | Epic 5 | Public /stats page |
| FR24 | Epic 5 | Last scraping status |
| FR25 | Epic 5 | Codes found per day |
| FR26 | Epic 5 | Parsing rate (regex vs LLM) |
| FR27 | Epic 5 | Track code copies per session |
| FR28 | Epic 5 | Error logs with regex suggestions |
| FR29 | Epic 4 | Static HTML pages per brand |
| FR30 | Epic 4 | Generate sitemap.xml |
| FR31 | Epic 4 | JSON-LD for rich snippets |
| FR32 | Epic 4 | SEO-optimized meta tags |
| FR33 | Epic 1 | Mobile-optimized experience |
| FR34 | Epic 1 | No account required |
| FR35 | Epic 1 | No ads or popups |
| FR36 | Epic 1 | Modern browser support |
| FR37 | Epic 1 | Fork/deploy documentation |
| FR38 | Epic 1 | .env.example file |

## Epic List

### Epic 1: Project Foundation & Site Structure

The user can see a functional site with the base structure deployed and ready for development.

**Goal:** Initialize the Eleventy v3.0.0 project, set up the complete folder structure per architecture spec, create base templates, configure Cloudflare Pages deployment, and establish the vanilla CSS design system foundation.

**FRs covered:** FR33, FR34, FR35, FR36, FR37, FR38

**NFRs addressed:** NFR-P1, NFR-P2, NFR-S2, NFR-S3, NFR-I5

---

### Epic 2: Data Pipeline & Code Extraction

The system collects promo codes from YouTube daily and stores them for frontend consumption.

**Goal:** Build the complete data pipeline: YouTube API scraping with keyword filtering, regex + LLM fallback parsing, SQLite persistence with adapter pattern for source abstraction, and JSON export for Eleventy.

**FRs covered:** FR11, FR12, FR13, FR14, FR15, FR16, FR17

**NFRs addressed:** NFR-I1, NFR-I2, NFR-I3, NFR-I4, NFR-R2

---

### Epic 3: Code Discovery & Copy Experience

Lucas can search for a brand, find codes sorted by freshness, and copy one in under 5 seconds.

**Goal:** Implement the core user experience: homepage with auto-focus search input, Fuse.js fuzzy search, CodeCard components displaying code + metadata, one-tap CopyButton with Toast feedback, and empathetic empty states.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10

**NFRs addressed:** NFR-P3, NFR-P4, NFR-P5, NFR-P6, NFR-A1, NFR-A2, NFR-A3, NFR-A4, NFR-A5

---

### Epic 4: Brand Pages & SEO

Users can find crowd-codes through Google searches for "promo code [brand]".

**Goal:** Generate static brand pages at /brands/[slug]/, create sitemap.xml with all brand URLs, add JSON-LD schema.org markup for rich snippets, and implement SEO-optimized meta tags per brand.

**FRs covered:** FR29, FR30, FR31, FR32

**NFRs addressed:** NFR-P1, NFR-P2

---

### Epic 5: Observability & Analytics

Justin can monitor the system health and user behavior in under 5 minutes daily.

**Goal:** Build the public /stats page showing scraping status, codes found per day, and parsing rates. Implement local UUID tracking for copy events to infer success rates. Add error logging with actionable regex suggestions.

**FRs covered:** FR23, FR24, FR25, FR26, FR27, FR28

**NFRs addressed:** NFR-R3

---

### Epic 6: Self-Improvement System

The parsing system improves automatically over time with minimal maintainer effort.

**Goal:** Implement LLM regex suggestion generation, daily aggregated GitHub PR creation, golden dataset CI validation, and automatic PR blocking on regression detection.

**FRs covered:** FR18, FR19, FR20, FR21, FR22

**NFRs addressed:** NFR-I2, NFR-I4

---

## Epic 1: Project Foundation & Site Structure

The user can see a functional site with the base structure deployed and ready for development.

### Story 1.1: Initialize Eleventy Project with Architecture-Defined Structure

As a **developer**,
I want **an initialized Eleventy v3.0.0 project with the complete folder structure**,
So that **I have a solid foundation to build all features following the architecture spec**.

**Acceptance Criteria:**

**Given** a fresh project directory
**When** I run `npm install`
**Then** Eleventy v3.0.0 and eleventy-plugin-sitemap are installed
**And** the following folder structure exists:
- `src/` (Eleventy source)
- `src/_data/` (JSON data)
- `src/_includes/` (shared templates)
- `src/brands/` (brand page templates)
- `scripts/` (pipeline scripts)
- `data/` (SQLite + patterns)
- `public/css/` (stylesheets)
- `public/js/` (client scripts)
- `tests/` (test files)
- `.github/workflows/` (CI/CD)

**Given** the project is initialized
**When** I run `npx @11ty/eleventy`
**Then** the build completes without errors
**And** output is generated in `_site/`

**Given** the project structure
**When** I check naming conventions
**Then** all files use kebab-case

### Story 1.2: Create Base Nunjucks Templates

As a **developer**,
I want **base Nunjucks templates with semantic HTML structure**,
So that **all pages have consistent markup, meta tags, and accessibility foundations**.

**Acceptance Criteria:**

**Given** the src/_includes/ folder exists
**When** I create the base templates
**Then** the following files exist:
- `base.njk` (HTML5 doctype, lang="fr", head/body structure)
- `head.njk` (meta charset, viewport, CSP, title block)
- `header.njk` (site header with logo/title)
- `footer.njk` (minimal footer)

**Given** base.njk is rendered
**When** I inspect the HTML output
**Then** it includes `<!DOCTYPE html>` and `<html lang="fr">`
**And** it includes a Content-Security-Policy meta tag restricting external scripts (NFR-S3)
**And** it includes viewport meta for mobile (NFR-P2)

**Given** the templates are created
**When** I create src/index.njk extending base.njk
**Then** the page renders with header, main content area, and footer
**And** the HTML is semantically correct (`<main>`, `<header>`, `<footer>`)

### Story 1.3: Implement Design System CSS Foundation

As a **user**,
I want **a mobile-first, accessible design system**,
So that **the site is fast, readable, and works on all devices** (FR33, FR36).

**Acceptance Criteria:**

**Given** public/css/ folder exists
**When** I create the CSS files
**Then** the following structure exists:
- `tokens.css` (CSS custom properties)
- `reset.css` (minimal reset)
- `components.css` (placeholder for components)
- `utilities.css` (helper classes)
- `styles.css` (imports all in order)

**Given** tokens.css is created
**When** I inspect the CSS variables
**Then** it defines:
- Colors: `--color-bg`, `--color-text`, `--color-accent`, `--color-success`, `--color-muted`, `--color-border`
- Spacing: `--space-xs` (4px) through `--space-xl` (32px)
- Typography: `--font-sans`, `--font-mono`, font sizes
- Touch: `--touch-min: 44px`
- Transitions: `--transition-fast`, `--transition-normal`

**Given** the CSS is loaded
**When** I test color contrast
**Then** text (#1a1a1a) on background (#ffffff) exceeds 4.5:1 ratio (NFR-A1)

**Given** the CSS includes dark mode
**When** user prefers dark color scheme
**Then** colors invert appropriately via `@media (prefers-color-scheme: dark)`

**Given** the CSS includes motion preferences
**When** user prefers reduced motion
**Then** all transitions are disabled via `@media (prefers-reduced-motion: reduce)`

**Given** utilities.css exists
**When** I check for accessibility utilities
**Then** `.visually-hidden` class is defined for screen reader content

### Story 1.4: Configure Cloudflare Pages Deployment

As a **maintainer**,
I want **automatic deployment to Cloudflare Pages on git push**,
So that **the site is always up-to-date with zero manual intervention** (NFR-I5).

**Acceptance Criteria:**

**Given** the GitHub repository exists
**When** I create `.github/workflows/deploy.yml`
**Then** the workflow triggers on push to main branch

**Given** the workflow runs
**When** the build step executes
**Then** it runs `npm ci` and `npx @11ty/eleventy`
**And** build completes in < 5 minutes (NFR-I5)

**Given** the build succeeds
**When** the deploy step executes
**Then** it uses `cloudflare/pages-action@v1`
**And** deploys `_site/` to Cloudflare Pages

**Given** the site is deployed
**When** I access the URL
**Then** HTTPS is enforced (NFR-S2)
**And** TTFB is < 100ms (NFR-P1)

**Given** the workflow file
**When** I check for inline code
**Then** all commands are simple CLI calls (no complex inline scripts per architecture rule)

### Story 1.5: Create Open Source Documentation

As a **third-party developer**,
I want **clear documentation to fork and deploy my own instance**,
So that **I can run crowd-codes independently** (FR37, FR38).

**Acceptance Criteria:**

**Given** the project root
**When** I create README.md
**Then** it includes:
- Project description and philosophy
- Prerequisites (Node.js 18+)
- Installation steps (`npm install`)
- Development commands (`npx @11ty/eleventy --serve`)
- Deployment instructions for Cloudflare Pages
- Environment variable documentation

**Given** the project root
**When** I create .env.example
**Then** it documents all required environment variables:
- `YOUTUBE_API_KEY` (for Epic 2)
- `GEMINI_API_KEY` (for Epic 2)
- `CLOUDFLARE_API_TOKEN` (for deployment)
- `CLOUDFLARE_ACCOUNT_ID` (for deployment)

**Given** a developer reads the documentation
**When** they follow the steps
**Then** they can fork, configure secrets, and deploy their own instance

**Given** the README exists
**When** I check its content
**Then** it does NOT include actual API keys or secrets (NFR-S1)

---

## Epic 2: Data Pipeline & Code Extraction

The system collects promo codes from YouTube daily and stores them for frontend consumption.

### Story 2.1: Create SQLite Database Schema

As a **system**,
I want **a SQLite database with proper schema for codes, brands, and logs**,
So that **scraped data is persisted durably and can be queried efficiently** (FR14).

**Acceptance Criteria:**

**Given** the data/ folder exists
**When** I run the database initialization script
**Then** `data/codes.db` is created with the following tables:

**Table: codes**
- id TEXT PRIMARY KEY
- code TEXT NOT NULL
- brand_name TEXT NOT NULL
- brand_slug TEXT NOT NULL
- source_type TEXT NOT NULL
- source_channel TEXT
- source_video_id TEXT
- found_at TEXT NOT NULL
- confidence REAL DEFAULT 1.0

**Table: brands**
- slug TEXT PRIMARY KEY
- name TEXT NOT NULL
- first_seen_at TEXT NOT NULL
- code_count INTEGER DEFAULT 0

**Table: parsing_logs**
- id INTEGER PRIMARY KEY AUTOINCREMENT
- video_id TEXT NOT NULL
- description TEXT NOT NULL
- parsed_by TEXT NOT NULL
- suggested_regex TEXT
- created_at TEXT NOT NULL

**Given** the schema is created
**When** I check column naming
**Then** all columns use snake_case per architecture spec

**Given** the database exists
**When** I check the file
**Then** it is committed to the repository (source of truth per NFR-R2)

### Story 2.2: Implement YouTube Scraper with Adapter Pattern

As a **system**,
I want **to scrape YouTube FR video descriptions daily with keyword filtering**,
So that **I collect fresh promo codes from influencers** (FR11, FR16, FR17).

**Acceptance Criteria:**

**Given** `scripts/scrape.js` exists
**When** I run `node scripts/scrape.js`
**Then** it queries YouTube Data API v3 for French videos
**And** filters by keywords: "code promo", "réduction", "discount", "promo code"

**Given** the scraper runs
**When** it finds matching videos
**Then** it extracts: video_id, channel_name, description, published_at
**And** stores raw descriptions for parsing

**Given** the scraper implements adapter pattern (FR17)
**When** I inspect the code
**Then** a `YouTubeAdapter` class exists that returns `InternalCodeModel` format

**Given** the YouTube API quota (NFR-I1)
**When** the scraper runs daily
**Then** it uses < 5000 units/day
**And** logs the quota usage

**Given** the scraper encounters an error
**When** the API fails or quota exceeded
**Then** it logs a structured JSON error
**And** exits with code 1 (recoverable)

**Given** environment variables
**When** the script runs
**Then** `YOUTUBE_API_KEY` is read from environment (never hardcoded, NFR-S1)

### Story 2.3: Implement Regex-Based Code Parser

As a **system**,
I want **to parse promo codes from descriptions using predefined regex patterns**,
So that **most codes are extracted without LLM costs** (FR12).

**Acceptance Criteria:**

**Given** `scripts/parse.js` exists
**When** I run it with video descriptions
**Then** it attempts to match against patterns in `data/patterns.json`

**Given** `data/patterns.json` structure
**When** I inspect the file
**Then** it contains an array of pattern objects with id, regex, brand_hint, confidence

**Given** a description matches a regex
**When** the parser extracts codes
**Then** it returns: code, inferred brand, confidence score
**And** marks the description as "parsed_by: regex" in parsing_logs

**Given** a description does NOT match any regex
**When** the parser finishes regex attempts
**Then** the description is queued for LLM fallback

**Given** extracted codes
**When** they are stored
**Then** they are inserted into the `codes` table
**And** the `brands` table is updated

### Story 2.4: Implement LLM Fallback Parser

As a **system**,
I want **to use Gemini Flash as fallback for descriptions regex couldn't parse**,
So that **I maximize code extraction while preserving free tier quota** (FR13, NFR-I2).

**Acceptance Criteria:**

**Given** `scripts/parse.js` handles LLM fallback
**When** a description wasn't parsed by regex
**Then** it is sent to Gemini Flash API with a structured prompt

**Given** the LLM successfully parses
**When** the response is received
**Then** the code is stored with `parsed_by: "llm"`
**And** the suggested_regex is stored in `parsing_logs`
**And** the original description is stored for golden dataset enrichment (FR19)

**Given** LLM quota limits (NFR-I2)
**When** daily parsing runs
**Then** it batches requests to stay < 150 calls/day

**Given** LLM quota is exceeded (NFR-I4)
**When** the limit is reached
**Then** remaining unparsed descriptions are buffered for retry next day
**And** script exits with code 0 (graceful degradation)

**Given** environment variables
**When** the script runs
**Then** `GEMINI_API_KEY` is read from environment (never hardcoded)

### Story 2.5: Implement JSON Export for Eleventy

As a **frontend**,
I want **a codes.json file with all codes in the architecture-defined format**,
So that **Eleventy can generate pages from fresh data** (FR15).

**Acceptance Criteria:**

**Given** `scripts/export.js` exists
**When** I run `node scripts/export.js`
**Then** it reads from SQLite `codes` table
**And** generates `src/_data/codes.json`

**Given** the exported JSON
**When** I inspect its structure
**Then** it matches the architecture spec with meta and codes array

**Given** the codes array
**When** I check the order
**Then** codes are sorted by `found_at` descending (most recent first, FR3)

**Given** the JSON field names
**When** I verify naming convention
**Then** all fields use snake_case per architecture spec

### Story 2.6: Create Daily Pipeline GitHub Action

As a **maintainer**,
I want **an automated daily pipeline that scrapes, parses, exports, and deploys**,
So that **the site has fresh codes every day with zero manual effort** (NFR-I3).

**Acceptance Criteria:**

**Given** `.github/workflows/daily-pipeline.yml` exists
**When** I inspect the workflow
**Then** it triggers on schedule (daily at 6 AM UTC) and workflow_dispatch

**Given** the workflow runs
**When** I check the job sequence
**Then** steps execute: checkout → setup node → npm ci → scrape → parse → export → commit → build → deploy

**Given** pipeline runtime (NFR-I3)
**When** the full pipeline completes
**Then** total time is < 30 minutes

**Given** the workflow file
**When** I check for inline code
**Then** all logic is in external scripts

---

## Epic 3: Code Discovery & Copy Experience

Lucas can search for a brand, find codes sorted by freshness, and copy one in under 5 seconds.

### Story 3.1: Create Homepage with Search Input

As a **user (Lucas)**,
I want **to land on a page with an auto-focused search field**,
So that **I can immediately start typing a brand name without clicking** (FR1).

**Acceptance Criteria:**

**Given** I navigate to the homepage
**When** the page loads
**Then** the search input has focus automatically (`autofocus`)

**Given** the search input component
**When** I inspect the HTML
**Then** it uses semantic markup with `aria-label`

**Given** the search input styling
**When** I view on mobile
**Then** it is full-width with minimum height 44px (touch target)

**Given** the page structure
**When** I inspect the HTML
**Then** no ads, popups, or unnecessary elements exist (FR35)

### Story 3.2: Implement Fuse.js Fuzzy Search

As a **user (Lucas)**,
I want **instant search results as I type**,
So that **I find codes in under 5 seconds without waiting for network** (FR2, NFR-P5).

**Acceptance Criteria:**

**Given** `public/js/search.js` exists
**When** the page loads
**Then** Fuse.js is initialized with the codes data

**Given** I type in the search input
**When** I enter "nord"
**Then** results appear within 200ms (NFR-P5)
**And** results update on each keystroke (debounced 50ms)

**Given** search results exist
**When** I view the results list
**Then** codes are displayed sorted by `found_at` descending (FR3)

### Story 3.3: Create CodeCard Component

As a **user (Lucas)**,
I want **to see each code with its source and date clearly displayed**,
So that **I can judge freshness and trustworthiness** (FR9, FR10).

**Acceptance Criteria:**

**Given** the CodeCard component
**When** I view a code card
**Then** it displays: code in monospace, brand name, relative date, source channel

**Given** the card layout
**When** I view on mobile
**Then** code and copy button are on same row, metadata below

**Given** the date display
**When** I check the format
**Then** it shows relative time in French

### Story 3.4: Implement CopyButton with Clipboard API

As a **user (Lucas)**,
I want **to copy a code with a single tap**,
So that **I can paste it at the merchant site instantly** (FR7).

**Acceptance Criteria:**

**Given** `public/js/copy.js` exists
**When** I tap/click a copy button
**Then** the code is copied to clipboard immediately

**Given** I tap the copy button
**When** the copy succeeds
**Then** the button text changes to "Copié ✓" for 2 seconds

**Given** the button styling
**When** I view on mobile
**Then** minimum touch target is 44×44px (NFR-A3)

**Given** keyboard navigation
**When** I tab to a copy button and press Enter
**Then** the code is copied and focus indicator is visible (NFR-A4)

### Story 3.5: Implement Toast Notification

As a **user (Lucas)**,
I want **clear feedback that my copy action worked**,
So that **I can confidently return to the merchant site** (FR8, NFR-A5).

**Acceptance Criteria:**

**Given** a code is copied
**When** the toast appears
**Then** it shows "✓ Code copié" and auto-dismisses after 2 seconds

**Given** accessibility requirements (NFR-A5)
**When** the toast appears
**Then** it has `role="status"` and `aria-live="polite"`

### Story 3.6: Implement Empty State & Error Handling

As a **user (Lucas)**,
I want **a helpful message when no codes are found**,
So that **I understand why and know what to do next** (FR4, FR6).

**Acceptance Criteria:**

**Given** I search for a brand with no codes
**When** no results are found
**Then** an empathetic empty state is displayed explaining why

**Given** a loading or fetch error
**When** the error state is triggered
**Then** a different message is displayed (FR6)

### Story 3.7: Create Basic Brand Page Access

As a **user (Lucas)**,
I want **to access a brand's codes directly via URL**,
So that **I can bookmark or share a link** (FR5).

**Acceptance Criteria:**

**Given** `src/brands/brand.njk` template exists
**When** Eleventy builds
**Then** it generates `/brands/[slug]/index.html` for each brand

**Given** I navigate to `/brands/nordvpn/`
**When** the page loads
**Then** I see all NordVPN codes with copy functionality

---

## Epic 4: Brand Pages & SEO

Users can find crowd-codes through Google searches for "promo code [brand]".

### Story 4.1: Enhance Brand Pages with SEO Meta Tags

As a **search engine**,
I want **optimized meta tags on each brand page**,
So that **crowd-codes ranks for "promo code [brand]" searches** (FR29, FR32).

**Acceptance Criteria:**

**Given** `src/brands/brand.njk` template
**When** Eleventy generates a brand page
**Then** each page has unique, SEO-optimized title and description meta tags

**Given** the brand page
**When** I check the Open Graph tags
**Then** og:title, og:description, og:type, og:url are present

**Given** the brand page
**When** I check canonical URL
**Then** it includes `<link rel="canonical">`

### Story 4.2: Generate Sitemap.xml

As a **search engine crawler**,
I want **a sitemap listing all brand pages**,
So that **Google can discover and index all pages efficiently** (FR30).

**Acceptance Criteria:**

**Given** sitemap generation is configured
**When** Eleventy builds
**Then** `/sitemap.xml` is generated with all pages

**Given** the sitemap URLs
**When** I check the list
**Then** it includes homepage, all brand pages, and stats page

### Story 4.3: Add JSON-LD Schema.org Markup

As a **search engine**,
I want **structured data for rich snippets**,
So that **Google can display enhanced results with code info** (FR31).

**Acceptance Criteria:**

**Given** the brand page template
**When** I inspect the HTML head
**Then** it includes valid JSON-LD script with schema.org markup

**Given** the homepage
**When** I check JSON-LD
**Then** it includes WebSite schema with SearchAction

---

## Epic 5: Observability & Analytics

Justin can monitor the system health and user behavior in under 5 minutes daily.

### Story 5.1: Create Public /stats Page

As a **maintainer (Justin)**,
I want **a public stats page showing system health at a glance**,
So that **I can monitor the pipeline in under 5 minutes daily** (FR23, FR24, FR25, FR26).

**Acceptance Criteria:**

**Given** `src/stats.njk` template exists
**When** Eleventy builds
**Then** `/stats/index.html` is generated

**Given** I navigate to `/stats`
**When** the page loads
**Then** I see: last scrape timestamp/status, total codes, codes today, parsing rate breakdown

**Given** the stats page design
**When** I view it
**Then** it is 100% public (radical transparency)

### Story 5.2: Implement Copy Event Tracking

As a **system**,
I want **to track which codes are copied per user session**,
So that **I can infer success rates by analyzing copy patterns** (FR27).

**Acceptance Criteria:**

**Given** `public/js/analytics.js` exists
**When** the page loads for the first time
**Then** a UUID is generated and stored in localStorage

**Given** a user copies a code
**When** the copy event fires
**Then** an event is recorded locally with uuid, code_id, brand_slug, timestamp

**Given** privacy constraints (NFR-S4)
**When** I check the data stored
**Then** zero PII is collected

### Story 5.3: Implement Error Logging with Regex Suggestions

As a **maintainer (Justin)**,
I want **clear logs showing unparsed descriptions with suggested fixes**,
So that **I can improve parsing with minimal effort** (FR28).

**Acceptance Criteria:**

**Given** the LLM parses a description
**When** successful
**Then** a log entry is created with video_id, description, parsed_by, suggested_regex

**Given** the /stats page
**When** I scroll to the logs section
**Then** I see recent parsing issues with pattern description and suggested regex

### Story 5.4: Add Build Failure Notifications

As a **maintainer (Justin)**,
I want **to be alerted when the pipeline fails**,
So that **I can fix issues before users notice stale data** (NFR-R3).

**Acceptance Criteria:**

**Given** the daily pipeline workflow
**When** any step fails
**Then** a notification is sent via webhook (Discord/Slack)

**Given** a pipeline failure
**When** the notification is sent
**Then** it includes workflow name, failed step, and link to run

---

## Epic 6: Self-Improvement System

The parsing system improves automatically over time with minimal maintainer effort.

### Story 6.1: Generate Regex Suggestions from LLM

As a **system**,
I want **the LLM to suggest a new regex pattern when it successfully parses a description**,
So that **future similar descriptions can be parsed without LLM costs** (FR18).

**Acceptance Criteria:**

**Given** `scripts/parse.js` uses LLM fallback
**When** Gemini successfully extracts a code
**Then** the prompt also requests a suggested regex pattern

**Given** the LLM response
**When** it includes a suggested_regex
**Then** the regex is validated for syntax and stored in parsing_logs

### Story 6.2: Store Original Descriptions for Golden Dataset

As a **system**,
I want **to store original descriptions that the LLM successfully parsed**,
So that **they become test cases for validating new regex patterns** (FR19).

**Acceptance Criteria:**

**Given** the LLM parses a description
**When** the parse is successful
**Then** the full original description is stored in parsing_logs

**Given** `scripts/suggest-patterns.js` runs
**When** it processes new LLM-parsed entries
**Then** new test cases are added to `data/golden-dataset.json`

### Story 6.3: Create Daily Aggregated GitHub PR

As a **maintainer (Justin)**,
I want **a single daily PR with all suggested regex patterns**,
So that **I can review and merge improvements in one action** (FR20).

**Acceptance Criteria:**

**Given** `scripts/create-pr.js` exists
**When** I run it
**Then** it collects all new suggested_regex from parsing_logs (last 24h)

**Given** new regex suggestions exist (1-20 patterns)
**When** the script runs
**Then** it creates a GitHub PR modifying data/patterns.json

**Given** fewer than 1 suggestion
**When** the script runs
**Then** no PR is created

### Story 6.4: Implement Golden Dataset CI Validation

As a **system**,
I want **automated tests that validate patterns against the golden dataset**,
So that **new patterns are verified before merge** (FR21).

**Acceptance Criteria:**

**Given** `tests/golden-dataset.test.js` exists
**When** I run `npm test`
**Then** it loads patterns.json and golden-dataset.json and validates

**Given** `.github/workflows/test-patterns.yml` exists
**When** a PR modifies data/patterns.json
**Then** the workflow triggers and runs tests

### Story 6.5: Block PR on Regression Detection

As a **maintainer (Justin)**,
I want **PRs automatically blocked if patterns cause regressions**,
So that **I can never accidentally break existing parsing** (FR22).

**Acceptance Criteria:**

**Given** the CI workflow test-patterns.yml
**When** any golden dataset test fails
**Then** the workflow exits with code 1 and PR check fails

**Given** a failed PR check
**When** I view the PR on GitHub
**Then** merge is blocked (branch protection rule)

**Given** the test compares current vs previous
**When** regression is detected
**Then** clear error message shows which tests failed
