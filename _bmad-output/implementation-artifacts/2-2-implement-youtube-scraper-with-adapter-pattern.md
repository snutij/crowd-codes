# Story 2.2: Implement YouTube Scraper with Adapter Pattern

Status: done

## Story

As a **system**,
I want **to scrape YouTube FR video descriptions daily with keyword filtering**,
So that **I collect fresh promo codes from influencers** (FR11, FR16, FR17).

## Acceptance Criteria

1. **Given** `scripts/scrape.js` exists, **When** I run `node scripts/scrape.js`, **Then** it queries YouTube Data API v3 for French videos **And** filters by keywords: "code promo", "réduction", "discount", "promo code"

2. **Given** the scraper runs, **When** it finds matching videos, **Then** it extracts: video_id, channel_name, description, published_at **And** stores raw descriptions for parsing

3. **Given** the scraper implements adapter pattern (FR17), **When** I inspect the code, **Then** a `YouTubeAdapter` class exists that returns `InternalCodeModel` format

4. **Given** the YouTube API quota (NFR-I1), **When** the scraper runs daily, **Then** it uses < 5000 units/day **And** logs the quota usage

5. **Given** the scraper encounters an error, **When** the API fails or quota exceeded, **Then** it logs a structured JSON error **And** exits with code 1 (recoverable)

6. **Given** environment variables, **When** the script runs, **Then** `YOUTUBE_API_KEY` is read from environment (never hardcoded, NFR-S1)

## Tasks / Subtasks

- [x] Task 1: Create YouTubeAdapter class with adapter pattern (AC: #3)
  - [x] Create `scripts/adapters/youtube-adapter.js`
  - [x] Define `InternalVideoModel` interface/type (video_id, channel_name, description, published_at)
  - [x] Implement `YouTubeAdapter` class with `fetchVideos()` method
  - [x] Return normalized `InternalVideoModel` objects (source abstraction)
  - [x] Add JSDoc documentation for the adapter interface

- [x] Task 2: Implement YouTube API integration (AC: #1, #6)
  - [x] Create `scripts/scrape.js` main entry point
  - [x] Read `YOUTUBE_API_KEY` from environment (throw if missing)
  - [x] Build YouTube Data API v3 search request
  - [x] Filter by keywords: "code promo", "réduction", "discount", "promo code"
  - [x] Filter by region: France (regionCode=FR)
  - [x] Filter by type: video
  - [x] Fetch video details to get full descriptions

- [x] Task 3: Implement quota management (AC: #4)
  - [x] Track API units consumed per request
  - [x] Log quota usage in JSON format
  - [x] Implement batch fetching to minimize API calls
  - [x] Ensure < 5000 units/day usage

- [x] Task 4: Store scraped data in SQLite (AC: #2)
  - [x] Create raw_videos table if not exists
  - [x] Insert/update raw video data for parsing
  - [x] Avoid duplicate video_id entries (ON CONFLICT)

- [x] Task 5: Implement error handling (AC: #5)
  - [x] Add try/catch around API calls
  - [x] Log structured JSON errors
  - [x] Exit with code 1 on recoverable errors (API fail, quota exceeded)
  - [x] Exit with code 2 on config errors (missing API key)

- [x] Task 6: Add npm script for convenience
  - [x] Add `"scrape": "node scripts/scrape.js"` to package.json

- [x] Task 7: Write tests for scraper
  - [x] Create `tests/scrape.test.js`
  - [x] Test YouTubeAdapter returns correct format
  - [x] Test error handling (missing API key)
  - [x] Test quota tracking logic
  - [x] Test KEYWORDS, QUOTA_COSTS, DAILY_QUOTA_LIMIT exports

## Dev Notes

### Architecture Constraints (CRITICAL)

Per `architecture.md` and `project-context.md`:

1. **ES Modules only**: Use `import`/`export`, never `require()`
2. **File naming**: kebab-case for all files
3. **Error logging**: JSON format - `{ error: "message", code: "ERROR_CODE" }`
4. **Exit codes**: 0=success, 1=recoverable, 2=config error
5. **API keys**: NEVER hardcode, always from environment
6. **Adapter pattern**: Abstract data source, return internal model

### YouTube Data API v3 Overview

**Quota Cost:**
- `search.list`: 100 units per request
- `videos.list`: 1 unit per video ID

**Strategy for < 5000 units/day:**
- 1 search request = 100 units (returns up to 50 results)
- 50 video details = 50 units
- Total per batch: ~150 units
- Can do ~30 batches/day safely

**API Request Example:**

```javascript
// Search for videos with keywords
const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
searchUrl.searchParams.set('part', 'snippet');
searchUrl.searchParams.set('q', 'code promo');
searchUrl.searchParams.set('type', 'video');
searchUrl.searchParams.set('regionCode', 'FR');
searchUrl.searchParams.set('relevanceLanguage', 'fr');
searchUrl.searchParams.set('maxResults', '50');
searchUrl.searchParams.set('publishedAfter', new Date(Date.now() - 24*60*60*1000).toISOString());
searchUrl.searchParams.set('key', process.env.YOUTUBE_API_KEY);

// Get full descriptions (search only returns truncated)
const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
videosUrl.searchParams.set('part', 'snippet');
videosUrl.searchParams.set('id', videoIds.join(','));
videosUrl.searchParams.set('key', process.env.YOUTUBE_API_KEY);
```

### Adapter Pattern Implementation

```javascript
// scripts/adapters/youtube-adapter.js

/**
 * Internal video model - abstracted from source
 * @typedef {Object} InternalVideoModel
 * @property {string} video_id - Unique video identifier
 * @property {string} channel_name - Channel/creator name
 * @property {string} description - Full video description
 * @property {string} published_at - ISO 8601 timestamp
 * @property {string} source_type - Always "youtube" for this adapter
 */

export class YouTubeAdapter {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('YOUTUBE_API_KEY is required');
    }
    this.apiKey = apiKey;
    this.quotaUsed = 0;
  }

  /**
   * Fetch videos matching keywords
   * @param {string[]} keywords - Search keywords
   * @param {Object} options - Fetch options
   * @returns {Promise<InternalVideoModel[]>}
   */
  async fetchVideos(keywords, options = {}) {
    // Implementation...
  }

  getQuotaUsed() {
    return this.quotaUsed;
  }
}
```

### Keywords to Search

Per AC #1:
- "code promo"
- "réduction"
- "discount"
- "promo code"

Strategy: Search each keyword separately or combine with OR logic.

### SQLite Integration

```javascript
import Database from 'better-sqlite3';

const db = new Database('data/codes.db');

// Store raw video for later parsing
const insertVideo = db.prepare(`
  INSERT OR IGNORE INTO raw_videos (video_id, channel_name, description, published_at, scraped_at)
  VALUES (?, ?, ?, ?, ?)
`);
```

**Note:** We may need to add a `raw_videos` table or store directly in parsing_logs. Check architecture for guidance.

### Testing Approach

```javascript
// tests/scrape.test.js
import { test, describe, mock } from 'node:test';
import assert from 'node:assert';
import { YouTubeAdapter } from '../scripts/adapters/youtube-adapter.js';

describe('YouTubeAdapter', () => {
  test('throws error if API key missing', () => {
    assert.throws(() => new YouTubeAdapter(undefined), /YOUTUBE_API_KEY/);
  });

  test('returns InternalVideoModel format', async () => {
    // Mock fetch...
  });
});
```

### Environment Variables

Required:
- `YOUTUBE_API_KEY` - YouTube Data API v3 key

Already in `.env.example`:
```
YOUTUBE_API_KEY=your_youtube_api_key_here
```

### Previous Story Learnings (Story 2.1)

- Use `export function` for testability
- Add proper error handling with try/catch
- Use JSON logging format
- Tests should be isolated (don't modify production data)

### References

- [Source: prd.md#FR11] - Daily YouTube scraping
- [Source: prd.md#FR16] - Keyword filtering
- [Source: prd.md#FR17] - Adapter pattern for source abstraction
- [Source: prd.md#NFR-I1] - YouTube API quota < 5000 units/day
- [Source: prd.md#NFR-S1] - API keys never in source code
- [Source: architecture.md#Pipeline-Architecture] - External scripts pattern
- [Source: architecture.md#Data-Flow] - Scrape → Parse → Export flow
- [Source: project-context.md] - ES modules, exit codes, JSON logging

### Project Structure Notes

Files to create/modify:
```
crowd-codes/
├── scripts/
│   ├── adapters/
│   │   └── youtube-adapter.js   # NEW: Adapter class
│   └── scrape.js                # NEW: Main scraper entry point
├── tests/
│   └── scrape.test.js           # NEW: Scraper tests
└── package.json                 # MODIFY: Add scrape script
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Tests run: `npm test` - 19/19 tests pass
- Scraper tested with missing API key: exits with code 2 (CONFIG_ERROR)
- YouTubeAdapter unit tests cover: constructor validation, quota tracking, exports

### Completion Notes List

- Created `scripts/adapters/youtube-adapter.js` with full adapter pattern implementation
- YouTubeAdapter class with `fetchVideos()`, `searchVideos()`, `getVideoDetails()`, `getQuotaUsed()`
- Exported constants: KEYWORDS, QUOTA_COSTS (SEARCH=100, VIDEO_DETAILS=1), DAILY_QUOTA_LIMIT (5000)
- `normalizeVideoItem()` transforms YouTube API response to InternalVideoModel format
- Created `scripts/scrape.js` main entry point with `runScraper()` exported function
- Added `raw_videos` table creation (idempotent) for storing scraped data
- Proper error handling: exit code 1 (recoverable), exit code 2 (config error)
- JSON structured logging for all events and errors
- Created comprehensive test suite with 19 tests (10 for db, 9 for scraper)
- Added `scrape` npm script to package.json
- All columns use snake_case, all files use kebab-case
- ES Modules only (import/export)

### File List

**New files:**
- scripts/adapters/youtube-adapter.js
- scripts/scrape.js
- tests/scrape.test.js

**Modified files:**
- package.json (added scrape script)
- scripts/init-db.js (added raw_videos table)
- tests/init-db.test.js (added raw_videos tests)

## Senior Developer Review (AI)

**Review Date:** 2026-01-19
**Review Outcome:** Approved with fixes applied
**Reviewer:** Claude Opus 4.5

### Summary

All 6 Acceptance Criteria validated. Code review found 1 HIGH, 3 MEDIUM, 3 LOW issues. All HIGH and MEDIUM issues fixed automatically.

### Issues Found & Resolved

| Severity | Issue | Resolution |
|----------|-------|------------|
| HIGH | No timeout on fetch requests - could hang indefinitely | ✅ Fixed: Added fetchWithTimeout with AbortController (30s timeout) |
| MEDIUM | normalizeVideoItem doesn't handle missing snippet fields | ✅ Fixed: Added null checks, returns null for invalid items |
| MEDIUM | Prepared statement recreated on every storeVideo call | ✅ Fixed: Moved statement creation outside loop |
| MEDIUM | raw_videos table created in scrape.js, not init-db.js | ✅ Fixed: Moved to init-db.js with proper indexes |
| LOW | Comment said "10,000 units" but limit is 5000 | ✅ Fixed: Removed misleading comment |
| LOW | storeVideo comment incorrect (returns true for UPDATE too) | ✅ Fixed: Updated JSDoc |
| LOW | No test for runScraper with mock adapter | Noted for future enhancement |

### Improvements Made

- Added `fetchWithTimeout` helper with AbortController for 30-second timeout
- Defensive coding in `normalizeVideoItem` with null checks and fallback values
- Cached prepared statement for performance (created once, used in transaction)
- Unified schema: `raw_videos` table now in `init-db.js` with 2 indexes
- Added test for `raw_videos` table structure
- 20 tests now pass (was 19)

### Action Items

- [x] [AI-Review][HIGH] Add timeout to fetch requests
- [x] [AI-Review][MEDIUM] Add defensive coding to normalizeVideoItem
- [x] [AI-Review][MEDIUM] Cache prepared statement outside loop
- [x] [AI-Review][MEDIUM] Move raw_videos table to init-db.js

## Change Log

- **2026-01-19**: Story created by SM Agent (create-story workflow)
- **2026-01-19**: Implementation completed by Dev Agent - all 7 tasks done, 19 tests passing
- **2026-01-19**: Code review completed - 4 issues fixed, 20 tests passing
