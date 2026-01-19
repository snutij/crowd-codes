# Story 2.5: Implement JSON Export for Eleventy

Status: done

## Story

As a **frontend**,
I want **a codes.json file with all codes in the architecture-defined format**,
So that **Eleventy can generate pages from fresh data** (FR15).

## Acceptance Criteria

1. **Given** `scripts/export.js` exists, **When** I run `node scripts/export.js`, **Then** it reads from SQLite `codes` table **And** generates `src/_data/codes.json`

2. **Given** the exported JSON, **When** I inspect its structure, **Then** it matches the architecture spec with `meta` and `codes` array

3. **Given** the codes array, **When** I check the order, **Then** codes are sorted by `found_at` descending (most recent first, FR3)

4. **Given** the JSON field names, **When** I verify naming convention, **Then** all fields use snake_case per architecture spec

5. **Given** the database is empty, **When** I run the export, **Then** it generates valid JSON with empty `codes` array and `total_codes: 0`

6. **Given** the export completes, **When** I check the output, **Then** it logs the export stats in JSON format

## Tasks / Subtasks

- [x] Task 1: Create export.js script structure (AC: #1)
  - [x] Create `scripts/export.js` with ES module imports
  - [x] Implement database connection with better-sqlite3
  - [x] Add environment variable for database path
  - [x] Implement main `runExport()` function

- [x] Task 2: Implement SQLite read operations (AC: #1, #3)
  - [x] Query all codes sorted by `found_at DESC`
  - [x] Query total brands count
  - [x] Prepare statements for performance

- [x] Task 3: Generate JSON structure per architecture (AC: #2, #4)
  - [x] Create `meta` object with `generated_at`, `total_codes`, `total_brands`
  - [x] Format codes array with all required fields
  - [x] Use snake_case for all field names
  - [x] Use ISO 8601 for all dates

- [x] Task 4: Write JSON file to src/_data/ (AC: #1, #5)
  - [x] Ensure `src/_data/` directory exists
  - [x] Write formatted JSON with 2-space indentation
  - [x] Handle empty database case gracefully

- [x] Task 5: Add logging and exit codes (AC: #6)
  - [x] Log export stats in JSON format
  - [x] Exit 0 on success
  - [x] Exit 1 on recoverable error (DB read failure)
  - [x] Exit 2 on config error (DB not found)

- [x] Task 6: Write tests for export script
  - [x] Create `tests/export.test.js`
  - [x] Test JSON structure validation
  - [x] Test sort order verification
  - [x] Test empty database handling
  - [x] Test field naming conventions

- [x] Task 7: Add npm script
  - [x] Add `"export": "node scripts/export.js"` to package.json

## Dev Notes

### Architecture Constraints (CRITICAL)

Per `architecture.md` and `project-context.md`:

1. **ES Modules only**: Use `import`/`export`, never `require()`
2. **File naming**: kebab-case for all files
3. **JSON field naming**: snake_case for all fields
4. **Date format**: ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`)
5. **Error logging**: JSON format - `{ error: "message", code: "ERROR_CODE" }`
6. **Exit codes**: 0=success, 1=recoverable, 2=config error

### JSON Output Structure (Architecture Spec)

```json
{
  "meta": {
    "generated_at": "2026-01-18T10:30:00Z",
    "total_codes": 847,
    "total_brands": 52
  },
  "codes": [
    {
      "id": "abc123",
      "code": "NORD50",
      "brand_name": "NordVPN",
      "brand_slug": "nordvpn",
      "source_type": "youtube",
      "source_channel": "Linus Tech Tips",
      "source_video_id": "dQw4w9WgXcQ",
      "found_at": "2026-01-18T08:00:00Z",
      "confidence": 0.95
    }
  ]
}
```

### Export Script Structure

```javascript
// scripts/export.js

import Database from 'better-sqlite3';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';

const DB_PATH = process.env.CROWD_CODES_DB_PATH || 'data/codes.db';
const OUTPUT_PATH = 'src/_data/codes.json';

/**
 * Run the JSON export
 * @returns {{success: boolean, totalCodes: number, totalBrands: number}}
 */
export function runExport(options = {}) {
  const dbPath = options.dbPath || DB_PATH;
  const outputPath = options.outputPath || OUTPUT_PATH;

  // Validate database exists
  if (!existsSync(dbPath)) {
    console.error(JSON.stringify({
      error: `Database not found at ${dbPath}`,
      code: 'CONFIG_ERROR'
    }));
    return { success: false };
  }

  // Connect and export
  const db = new Database(dbPath, { readonly: true });
  // ...
}
```

### Database Queries

```javascript
// Get all codes sorted by found_at DESC
const getCodes = db.prepare(`
  SELECT id, code, brand_name, brand_slug, source_type,
         source_channel, source_video_id, found_at, confidence
  FROM codes
  ORDER BY found_at DESC
`);

// Get total brands count
const getBrandsCount = db.prepare(`
  SELECT COUNT(*) as count FROM brands
`);
```

### Previous Story Learnings (Stories 2.2, 2.3, 2.4)

- Use `better-sqlite3` synchronous API (not async)
- Open database with `{ readonly: true }` for read-only operations
- Cache prepared statements outside loops
- Add defensive null checks on all database results
- Wrap JSON.parse/JSON.stringify in try/catch
- Use `existsSync` to validate file paths before operations
- Create directories with `mkdirSync(path, { recursive: true })`

### Error Handling Pattern

```javascript
// Config error (missing database)
if (!existsSync(dbPath)) {
  console.error(JSON.stringify({
    error: 'Database not found',
    code: 'CONFIG_ERROR'
  }));
  process.exit(2);
}

// Recoverable error (DB read failure)
try {
  const codes = getCodes.all();
} catch (error) {
  console.error(JSON.stringify({
    error: error.message,
    code: 'DB_READ_ERROR'
  }));
  process.exit(1);
}

// Success logging
console.log(JSON.stringify({
  event: 'export_complete',
  total_codes: codes.length,
  total_brands: brandsCount,
  output_path: outputPath
}));
```

### Testing Approach

```javascript
// tests/export.test.js
import { test, describe } from 'node:test';
import assert from 'node:assert';
import { existsSync, readFileSync, unlinkSync } from 'fs';

describe('export.js', () => {
  test('exports valid JSON structure', async () => {
    // Setup test database
    // Run export
    // Validate JSON structure
  });

  test('codes are sorted by found_at descending', async () => {
    // Insert test data with different dates
    // Run export
    // Verify order
  });

  test('handles empty database', async () => {
    // Run export on empty DB
    // Verify { meta: {...}, codes: [] }
  });

  test('all fields use snake_case', async () => {
    // Run export
    // Check all keys match /^[a-z_]+$/
  });
});
```

### References

- [Source: prd.md#FR15] - Performant data serving
- [Source: prd.md#FR3] - Codes sorted by discovery date
- [Source: architecture.md#Data-Architecture] - JSON export format
- [Source: architecture.md#Format-Patterns] - snake_case for JSON fields
- [Source: project-context.md] - Naming conventions, exit codes

### Project Structure Notes

Files to create/modify:
```
crowd-codes/
├── scripts/
│   └── export.js           # NEW: JSON export script
├── src/
│   └── _data/
│       └── codes.json      # GENERATED: Output file
├── tests/
│   └── export.test.js      # NEW: Export tests
└── package.json            # MODIFY: Add npm script
```

### Integration with Daily Pipeline

This script will be called in the daily pipeline after `parse.js`:

```yaml
# .github/workflows/daily-pipeline.yml
- run: node scripts/scrape.js
- run: node scripts/parse.js
- run: node scripts/export.js  # <-- This story
- run: npx @11ty/eleventy
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Tests run: `npm test` - 77/77 tests pass
- 11 new tests for export functionality

### Completion Notes List

- Created `scripts/export.js` with runExport function
- Implemented read-only SQLite connection with better-sqlite3
- Generates JSON with `meta` (generated_at, total_codes, total_brands) and `codes` array
- Codes sorted by found_at DESC (most recent first)
- All JSON fields use snake_case per architecture spec
- All dates use ISO 8601 format
- Handles empty database gracefully (empty codes array)
- Creates output directory if it doesn't exist
- JSON output with 2-space indentation
- Exit codes: 0=success, 1=recoverable, 2=config error
- Added npm script `"export": "node scripts/export.js"`

### File List

**New files:**
- scripts/export.js
- tests/export.test.js

**Modified files:**
- package.json (added export npm script)
