# Story 2.4: Implement LLM Fallback Parser

Status: done

## Story

As a **system**,
I want **to use Gemini Flash as fallback for descriptions regex couldn't parse**,
So that **I maximize code extraction while preserving free tier quota** (FR13, NFR-I2).

## Acceptance Criteria

1. **Given** `scripts/parse.js` handles LLM fallback, **When** a description wasn't parsed by regex, **Then** it is sent to Gemini Flash API with a structured prompt

2. **Given** the LLM successfully parses, **When** the response is received, **Then** the code is stored with `parsed_by: "llm"` **And** the suggested_regex is stored in `parsing_logs` **And** the original description is stored for golden dataset enrichment (FR19)

3. **Given** LLM quota limits (NFR-I2), **When** daily parsing runs, **Then** it batches requests to stay < 150 calls/day

4. **Given** LLM quota is exceeded (NFR-I4), **When** the limit is reached, **Then** remaining unparsed descriptions are buffered for retry next day **And** script exits with code 0 (graceful degradation)

5. **Given** environment variables, **When** the script runs, **Then** `GEMINI_API_KEY` is read from environment (never hardcoded, NFR-S1)

6. **Given** the LLM response, **When** it includes a suggested_regex, **Then** the regex is validated for syntax before storage

## Tasks / Subtasks

- [x] Task 1: Create LLM Parser module (AC: #1, #5)
  - [x] Create `scripts/parsers/llm-parser.js`
  - [x] Implement LlmParser class with rate limiting
  - [x] Read `GEMINI_API_KEY` from environment
  - [x] Implement `parseDescription(description)` method
  - [x] Add fetch timeout handling (reuse pattern from youtube-adapter)

- [x] Task 2: Design structured prompt (AC: #1, #2)
  - [x] Create prompt template for code extraction
  - [x] Include instructions for brand inference
  - [x] Request suggested_regex in response
  - [x] Define JSON response schema for parsing

- [x] Task 3: Implement quota management (AC: #3, #4)
  - [x] Track daily LLM calls in memory
  - [x] Implement 150 calls/day limit check
  - [x] Create `isQuotaExhausted()` function
  - [x] Buffer remaining unparsed for next day
  - [x] Log quota status in JSON format

- [x] Task 4: Integrate with parse.js (AC: #1, #2, #4)
  - [x] Modify `runParser()` to handle LLM fallback
  - [x] Process unparsed videos (parsed_by="none" in parsing_logs)
  - [x] Store codes with parsed_by="llm"
  - [x] Update parsing_logs with suggested_regex
  - [x] Exit with code 0 even when quota exceeded (graceful)

- [x] Task 5: Validate suggested regex (AC: #6)
  - [x] Implement `validateRegex(pattern)` function
  - [x] Test regex compilation
  - [x] Store only valid patterns
  - [x] Log invalid patterns for debugging

- [x] Task 6: Add npm script and environment setup
  - [x] `.env.example` already has `GEMINI_API_KEY`
  - [x] Add error handling for missing API key
  - [x] Exit with code 2 for config errors

- [x] Task 7: Write tests for LLM parser
  - [x] Create `tests/llm-parser.test.js`
  - [x] Test quota management logic
  - [x] Test regex validation
  - [x] Test graceful degradation
  - [x] Test response parsing

## Dev Notes

### Architecture Constraints (CRITICAL)

Per `architecture.md` and `project-context.md`:

1. **ES Modules only**: Use `import`/`export`, never `require()`
2. **File naming**: kebab-case for all files
3. **Error logging**: JSON format - `{ error: "message", code: "ERROR_CODE" }`
4. **Exit codes**: 0=success (even with quota exhaustion), 1=recoverable, 2=config error
5. **Column naming**: snake_case for SQLite/JSON
6. **API key**: Read from environment, NEVER hardcode

### Gemini Flash API

```javascript
// Gemini API endpoint
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Request format
const request = {
  contents: [{
    parts: [{
      text: prompt
    }]
  }],
  generationConfig: {
    responseMimeType: 'application/json'
  }
};

// Call with API key as query param
fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(request)
});
```

### Structured Prompt Template

```javascript
const PROMPT_TEMPLATE = `Tu es un assistant spécialisé dans l'extraction de codes promo depuis des descriptions YouTube.

Analyse cette description et extrais les codes promo:

---
{description}
---

Retourne un JSON avec ce format exact:
{
  "codes": [
    {
      "code": "CODE123",
      "brand_name": "NomMarque",
      "confidence": 0.9
    }
  ],
  "suggested_regex": "pattern regex pour matcher ce type de code",
  "reasoning": "courte explication"
}

Si aucun code trouvé, retourne: { "codes": [], "suggested_regex": null, "reasoning": "..." }`;
```

### LLM Parser Class Structure

```javascript
// scripts/parsers/llm-parser.js

export const DAILY_QUOTA_LIMIT = 150;
export const FETCH_TIMEOUT_MS = 30000;

export class LlmParser {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }
    this.apiKey = apiKey;
    this.callsToday = 0;
  }

  isQuotaExhausted() {
    return this.callsToday >= DAILY_QUOTA_LIMIT;
  }

  async parseDescription(description, videoId) {
    if (this.isQuotaExhausted()) {
      return { success: false, reason: 'quota_exhausted' };
    }

    this.callsToday++;
    // ... call Gemini API
  }

  validateRegex(pattern) {
    try {
      new RegExp(pattern, 'gi');
      return true;
    } catch {
      return false;
    }
  }
}
```

### Database Operations

```javascript
// Update parsing_logs with LLM result
const updateLog = db.prepare(`
  UPDATE parsing_logs
  SET parsed_by = 'llm',
      suggested_regex = ?
  WHERE video_id = ? AND parsed_by = 'none'
`);

// Get unparsed videos (for LLM fallback)
const getUnparsedForLlm = db.prepare(`
  SELECT pl.video_id, rv.description
  FROM parsing_logs pl
  JOIN raw_videos rv ON pl.video_id = rv.video_id
  WHERE pl.parsed_by = 'none'
  ORDER BY pl.created_at DESC
  LIMIT ?
`);
```

### Quota Tracking Strategy

Option A: In-memory (simple, resets on restart)
```javascript
// Reset daily via cron schedule
this.callsToday = 0;
```

Option B: SQLite tracking (persistent)
```javascript
// Table: llm_quota_tracking
// - date TEXT PRIMARY KEY
// - calls_made INTEGER
```

**Recommendation**: Start with Option A (in-memory) since pipeline runs once daily.

### Graceful Degradation Flow

```
1. Get unparsed videos (parsed_by="none")
2. For each video:
   a. Check quota → if exhausted, break loop
   b. Call Gemini API
   c. Parse response
   d. Store codes with parsed_by="llm"
   e. Store suggested_regex if valid
3. Log final stats
4. Exit with code 0 (success, even if quota hit)
```

### Error Handling

```javascript
// Config error (missing API key)
if (!process.env.GEMINI_API_KEY) {
  console.error(JSON.stringify({
    error: 'GEMINI_API_KEY not set',
    code: 'CONFIG_ERROR'
  }));
  process.exit(2);
}

// API error (recoverable)
try {
  const response = await callGemini(description);
} catch (error) {
  console.error(JSON.stringify({
    error: error.message,
    code: 'LLM_API_ERROR',
    video_id: videoId
  }));
  // Continue with next video
}

// Quota exhausted (graceful)
if (parser.isQuotaExhausted()) {
  console.log(JSON.stringify({
    event: 'quota_exhausted',
    calls_made: parser.callsToday,
    remaining_unparsed: unparsedVideos.length - processed
  }));
  // Exit 0 - this is expected behavior
}
```

### Testing Approach

```javascript
// tests/llm-parser.test.js
import { test, describe, mock } from 'node:test';
import assert from 'node:assert';
import { LlmParser, DAILY_QUOTA_LIMIT } from '../scripts/parsers/llm-parser.js';

describe('LlmParser', () => {
  test('throws if API key missing', () => {
    assert.throws(() => new LlmParser(), /GEMINI_API_KEY/);
  });

  test('quota exhausted after limit', () => {
    const parser = new LlmParser('test-key');
    parser.callsToday = DAILY_QUOTA_LIMIT;
    assert.ok(parser.isQuotaExhausted());
  });

  test('validates correct regex', () => {
    const parser = new LlmParser('test-key');
    assert.ok(parser.validateRegex('code[:\\s]+([A-Z0-9]+)'));
  });

  test('rejects invalid regex', () => {
    const parser = new LlmParser('test-key');
    assert.ok(!parser.validateRegex('code[unclosed'));
  });
});
```

### Previous Story Learnings (Stories 2.2 & 2.3)

- Use `fetchWithTimeout` pattern with AbortController
- Cache prepared statements outside loops
- Add defensive null checks on all inputs
- Wrap JSON.parse in try/catch with clear error messages
- Check if code exists before incrementing brand count
- Validate all input fields before processing

### References

- [Source: prd.md#FR13] - LLM fallback parsing
- [Source: prd.md#FR19] - Store original for golden dataset
- [Source: architecture.md#Parsing-Layer] - LLM fallback strategy
- [Source: project-context.md] - API quotas, naming conventions

### Project Structure Notes

Files to create/modify:
```
crowd-codes/
├── scripts/
│   ├── parsers/
│   │   ├── regex-parser.js   # EXISTING
│   │   └── llm-parser.js     # NEW: LLM parser class
│   └── parse.js              # MODIFY: Add LLM fallback
├── tests/
│   └── llm-parser.test.js    # NEW: LLM parser tests
└── .env.example              # MODIFY: Add GEMINI_API_KEY
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Tests run: `npm test` - 67/67 tests pass
- 29 new tests for LLM parser (quota, validation, response parsing)

### Completion Notes List

- Created `scripts/parsers/llm-parser.js` with LlmParser class
- Implemented quota management (150 calls/day limit)
- Implemented regex validation for suggested patterns
- Implemented Gemini API response parsing with JSON extraction
- Added fetch timeout handling with AbortController
- Integrated LLM fallback into `scripts/parse.js`
- Added new prepared statements for LLM fallback queue
- Graceful degradation when quota exhausted (exit 0)
- JSON structured logging for all events
- `.env.example` already contains GEMINI_API_KEY

### File List

**New files:**
- scripts/parsers/llm-parser.js
- tests/llm-parser.test.js

**Modified files:**
- scripts/parse.js (LLM fallback integration)
