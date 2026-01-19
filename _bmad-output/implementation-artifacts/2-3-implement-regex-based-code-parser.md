# Story 2.3: Implement Regex-Based Code Parser

Status: review

## Story

As a **system**,
I want **to parse promo codes from descriptions using predefined regex patterns**,
So that **most codes are extracted without LLM costs** (FR12).

## Acceptance Criteria

1. **Given** `scripts/parse.js` exists, **When** I run it with video descriptions, **Then** it attempts to match against patterns in `data/patterns.json`

2. **Given** `data/patterns.json` structure, **When** I inspect the file, **Then** it contains an array of pattern objects with id, regex, brand_hint, confidence

3. **Given** a description matches a regex, **When** the parser extracts codes, **Then** it returns: code, inferred brand, confidence score **And** marks the description as "parsed_by: regex" in parsing_logs

4. **Given** a description does NOT match any regex, **When** the parser finishes regex attempts, **Then** the description is queued for LLM fallback (marked as unparsed)

5. **Given** extracted codes, **When** they are stored, **Then** they are inserted into the `codes` table **And** the `brands` table is updated

6. **Given** the parser runs, **When** it processes descriptions, **Then** it logs structured JSON events for observability

## Tasks / Subtasks

- [x] Task 1: Create patterns.json structure (AC: #2)
  - [x] Create `data/patterns.json` with initial patterns
  - [x] Define pattern schema: id, regex, brand_hint, confidence
  - [x] Add 8 common promo code patterns for French content
  - [x] Document regex patterns with description field

- [x] Task 2: Create RegexParser class (AC: #1, #3)
  - [x] Create `scripts/parsers/regex-parser.js`
  - [x] Load patterns from `data/patterns.json`
  - [x] Implement `parseDescription(description)` method
  - [x] Return extracted codes with brand inference and confidence
  - [x] Handle multiple codes in single description

- [x] Task 3: Implement brand inference (AC: #3, #5)
  - [x] Infer brand from brand_hint in pattern
  - [x] Fallback: extract brand from common patterns (e.g., "code BRAND10")
  - [x] Generate slug from brand name (kebab-case)
  - [x] Create unique code ID (SHA256 hash)

- [x] Task 4: Create parse.js main entry point (AC: #1, #6)
  - [x] Create `scripts/parse.js`
  - [x] Read unparsed videos from `raw_videos` table (parsed=0)
  - [x] Apply RegexParser to each description
  - [x] Export `runParser()` function for testing

- [x] Task 5: Implement database storage (AC: #5)
  - [x] Insert extracted codes into `codes` table
  - [x] Update or insert brands in `brands` table
  - [x] Increment `code_count` for brands
  - [x] Handle duplicate codes (ON CONFLICT)

- [x] Task 6: Implement parsing_logs integration (AC: #3, #4)
  - [x] Log successful regex parses with parsed_by="regex"
  - [x] Log failed parses with parsed_by="none" for LLM fallback queue
  - [x] Mark raw_videos as parsed=1 after processing
  - [x] Store matched pattern id for traceability

- [x] Task 7: Add npm script and error handling
  - [x] Add `"parse": "node scripts/parse.js"` to package.json
  - [x] Add try/catch with JSON error logging
  - [x] Exit codes: 0=success, 1=recoverable, 2=config

- [x] Task 8: Write tests for parser
  - [x] Create `tests/parse.test.js`
  - [x] Test pattern loading and validation
  - [x] Test code extraction from sample descriptions
  - [x] Test brand inference logic
  - [x] Test generateCodeId and generateSlug
  - [x] Test edge cases (no match, multiple codes)

## Dev Notes

### Architecture Constraints (CRITICAL)

Per `architecture.md` and `project-context.md`:

1. **ES Modules only**: Use `import`/`export`, never `require()`
2. **File naming**: kebab-case for all files
3. **Error logging**: JSON format - `{ error: "message", code: "ERROR_CODE" }`
4. **Exit codes**: 0=success, 1=recoverable, 2=config error
5. **Column naming**: snake_case for SQLite/JSON

### patterns.json Schema

```json
{
  "patterns": [
    {
      "id": "generic-code-promo",
      "regex": "(?:code|promo|coupon)[:\\s]+([A-Z0-9]{4,20})",
      "brand_hint": null,
      "confidence": 0.7
    },
    {
      "id": "brand-percent-off",
      "regex": "([A-Z]+)(\\d{1,2})(?:%|pourcent)",
      "brand_hint": "$1",
      "confidence": 0.8
    },
    {
      "id": "nordvpn-pattern",
      "regex": "(?:nordvpn\\.com\\/|code[:\\s]+)(\\w+)",
      "brand_hint": "NordVPN",
      "confidence": 0.9
    }
  ]
}
```

**Pattern Fields:**
- `id`: Unique identifier for traceability
- `regex`: JavaScript regex pattern (case-insensitive applied)
- `brand_hint`: Static brand or `$1` for capture group, null for inference
- `confidence`: 0.0-1.0 score for code reliability

### Common French Promo Code Patterns

```javascript
// Pattern examples to include:
// 1. "code promo: SUMMER20" → code: SUMMER20
// 2. "utilisez NIKE15 pour 15%" → code: NIKE15, brand: Nike
// 3. "nordvpn.com/creator" → code: creator, brand: NordVPN
// 4. "-20% avec le code FLASH" → code: FLASH
// 5. "réduction: SAVE10" → code: SAVE10
```

### RegexParser Class Structure

```javascript
// scripts/parsers/regex-parser.js

/**
 * Parsed code result
 * @typedef {Object} ParsedCode
 * @property {string} code - The extracted promo code
 * @property {string} brand_name - Inferred or explicit brand name
 * @property {string} brand_slug - URL-safe brand slug
 * @property {number} confidence - Confidence score (0-1)
 * @property {string} pattern_id - ID of matching pattern
 */

export class RegexParser {
  constructor(patternsPath = 'data/patterns.json') {
    this.patterns = this.loadPatterns(patternsPath);
  }

  loadPatterns(path) {
    // Load and compile regex patterns
  }

  /**
   * Parse a description for promo codes
   * @param {string} description - Video description text
   * @returns {ParsedCode[]} Array of extracted codes
   */
  parseDescription(description) {
    // Apply each pattern, collect matches
  }

  inferBrand(code, brandHint, matchGroups) {
    // Infer brand from hint or code pattern
  }

  generateSlug(brandName) {
    // Convert "NordVPN" → "nordvpn"
  }
}
```

### Database Operations

```javascript
// Insert code (with conflict handling)
const insertCode = db.prepare(`
  INSERT INTO codes (id, code, brand_name, brand_slug, source_type, source_channel, source_video_id, found_at, confidence)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    confidence = MAX(confidence, excluded.confidence)
`);

// Update brand (upsert)
const upsertBrand = db.prepare(`
  INSERT INTO brands (slug, name, first_seen_at, code_count)
  VALUES (?, ?, ?, 1)
  ON CONFLICT(slug) DO UPDATE SET
    code_count = code_count + 1
`);

// Log parsing result
const insertLog = db.prepare(`
  INSERT INTO parsing_logs (video_id, description, parsed_by, suggested_regex, created_at)
  VALUES (?, ?, ?, ?, ?)
`);

// Mark video as parsed
const markParsed = db.prepare(`
  UPDATE raw_videos SET parsed = 1 WHERE video_id = ?
`);
```

### Code ID Generation

```javascript
import { createHash } from 'crypto';

function generateCodeId(code, brandSlug, videoId) {
  // Deterministic ID based on code content
  const content = `${code}:${brandSlug}:${videoId}`;
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}
```

### Testing Approach

```javascript
// tests/parse.test.js
import { test, describe } from 'node:test';
import assert from 'node:assert';
import { RegexParser } from '../scripts/parsers/regex-parser.js';

describe('RegexParser', () => {
  test('extracts simple promo code', () => {
    const parser = new RegexParser();
    const result = parser.parseDescription('Utilisez le code SUMMER20 pour -20%!');

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].code, 'SUMMER20');
  });

  test('infers brand from code pattern', () => {
    const parser = new RegexParser();
    const result = parser.parseDescription('Code promo: NIKE15');

    assert.strictEqual(result[0].brand_name, 'Nike');
  });

  test('returns empty array for no match', () => {
    const parser = new RegexParser();
    const result = parser.parseDescription('Just a regular video description');

    assert.strictEqual(result.length, 0);
  });
});
```

### Edge Cases to Handle

1. **Multiple codes in one description**: Return all matches
2. **Duplicate codes**: Same code from different videos → keep highest confidence
3. **Case sensitivity**: Codes usually uppercase, but match case-insensitive
4. **Special characters**: Handle accented chars in French text
5. **URL-embedded codes**: Extract from affiliate links

### Previous Story Learnings (Story 2.2)

- Use `fetchWithTimeout` pattern for any async operations
- Cache prepared statements outside loops
- Add defensive null checks
- Keep schema in `init-db.js`, not scattered

### References

- [Source: prd.md#FR12] - Regex parsing
- [Source: architecture.md#Data-Architecture] - patterns.json structure
- [Source: architecture.md#Parsing-Layer] - Regex as primary parser
- [Source: project-context.md] - Naming conventions, test location

### Project Structure Notes

Files to create/modify:
```
crowd-codes/
├── scripts/
│   ├── parsers/
│   │   └── regex-parser.js   # NEW: Parser class
│   └── parse.js              # NEW: Main entry point
├── data/
│   └── patterns.json         # NEW: Regex patterns
├── tests/
│   └── parse.test.js         # NEW: Parser tests
└── package.json              # MODIFY: Add parse script
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Tests run: `npm test` - 38/38 tests pass
- Parser tested with various French promo code patterns
- Brand inference tested: NIKE15 → Nike, ADIDAS20 → Adidas

### Completion Notes List

- Created `data/patterns.json` with 8 regex patterns for French promo codes
- Patterns include: code-keyword-fr, brand-percent-pattern, avec-code-pattern, reduction-pattern, nordvpn-pattern, surfshark-pattern, percent-off-code, standalone-uppercase
- Created `scripts/parsers/regex-parser.js` with RegexParser class
- Implemented `generateSlug()` for kebab-case brand slugs with accent handling
- Implemented `generateCodeId()` using SHA256 hash for deterministic IDs
- Created `scripts/parse.js` main entry point with database integration
- Proper transaction handling for atomicity
- JSON structured logging for all events
- Exit codes: 0=success, 1=recoverable, 2=config
- 18 new tests added (38 total)

### File List

**New files:**
- data/patterns.json
- scripts/parsers/regex-parser.js
- scripts/parse.js
- tests/parse.test.js

**Modified files:**
- package.json (added parse script)

