/**
 * LLM Parser Tests
 * Story 2.4: Implement LLM Fallback Parser
 *
 * Tests validate:
 * - LlmParser class construction
 * - API key requirement
 * - Quota management
 * - Regex validation
 * - Response parsing
 */

import { test, describe, beforeEach, mock } from 'node:test';
import assert from 'node:assert';

// Dynamic imports for modules not yet created
let LlmParser;
let DAILY_QUOTA_LIMIT;
let FETCH_TIMEOUT_MS;
let validateRegex;
let parseGeminiResponse;

describe('LlmParser', () => {
  beforeEach(async () => {
    try {
      const module = await import('../scripts/parsers/llm-parser.js');
      LlmParser = module.LlmParser;
      DAILY_QUOTA_LIMIT = module.DAILY_QUOTA_LIMIT;
      FETCH_TIMEOUT_MS = module.FETCH_TIMEOUT_MS;
      validateRegex = module.validateRegex;
      parseGeminiResponse = module.parseGeminiResponse;
    } catch {
      // Module not yet created - tests will fail as expected in RED phase
    }
  });

  test('LlmParser class exists', () => {
    assert.ok(LlmParser, 'LlmParser should be exported');
    assert.strictEqual(typeof LlmParser, 'function', 'Should be a class');
  });

  test('throws error if API key is missing', () => {
    assert.throws(
      () => new LlmParser(),
      /GEMINI_API_KEY|api.?key/i,
      'Should throw if API key missing'
    );
  });

  test('throws error if API key is empty string', () => {
    assert.throws(
      () => new LlmParser(''),
      /GEMINI_API_KEY|api.?key/i,
      'Should throw if API key is empty'
    );
  });

  test('creates instance with valid API key', () => {
    const parser = new LlmParser('test-api-key');
    assert.ok(parser, 'Should create parser instance');
  });

  test('DAILY_QUOTA_LIMIT is 150', () => {
    assert.strictEqual(DAILY_QUOTA_LIMIT, 150, 'Daily quota should be 150');
  });

  test('FETCH_TIMEOUT_MS is defined', () => {
    assert.ok(FETCH_TIMEOUT_MS, 'FETCH_TIMEOUT_MS should be defined');
    assert.ok(FETCH_TIMEOUT_MS >= 10000, 'Timeout should be at least 10 seconds');
  });
});

describe('Quota Management', () => {
  beforeEach(async () => {
    try {
      const module = await import('../scripts/parsers/llm-parser.js');
      LlmParser = module.LlmParser;
      DAILY_QUOTA_LIMIT = module.DAILY_QUOTA_LIMIT;
    } catch {
      // Module not yet created
    }
  });

  test('isQuotaExhausted returns false initially', () => {
    const parser = new LlmParser('test-api-key');
    assert.strictEqual(parser.isQuotaExhausted(), false);
  });

  test('isQuotaExhausted returns true after limit reached', () => {
    const parser = new LlmParser('test-api-key');
    parser.callsToday = DAILY_QUOTA_LIMIT;
    assert.strictEqual(parser.isQuotaExhausted(), true);
  });

  test('getCallsRemaining returns correct count', () => {
    const parser = new LlmParser('test-api-key');
    parser.callsToday = 50;
    assert.strictEqual(parser.getCallsRemaining(), 100);
  });

  test('getCallsRemaining returns 0 when exhausted', () => {
    const parser = new LlmParser('test-api-key');
    parser.callsToday = DAILY_QUOTA_LIMIT;
    assert.strictEqual(parser.getCallsRemaining(), 0);
  });

  test('incrementCallCount increases calls', () => {
    const parser = new LlmParser('test-api-key');
    assert.strictEqual(parser.callsToday, 0);
    parser.incrementCallCount();
    assert.strictEqual(parser.callsToday, 1);
  });
});

describe('Regex Validation', () => {
  beforeEach(async () => {
    try {
      const module = await import('../scripts/parsers/llm-parser.js');
      validateRegex = module.validateRegex;
    } catch {
      // Module not yet created
    }
  });

  test('validateRegex accepts valid pattern', () => {
    assert.strictEqual(
      validateRegex('code[:\\s]+([A-Z0-9]+)'),
      true,
      'Should accept valid regex'
    );
  });

  test('validateRegex accepts complex pattern', () => {
    assert.strictEqual(
      validateRegex('(?:code|promo)[:\\s]+([A-Z0-9]{4,20})'),
      true,
      'Should accept complex regex'
    );
  });

  test('validateRegex rejects unclosed bracket', () => {
    assert.strictEqual(
      validateRegex('code[unclosed'),
      false,
      'Should reject invalid regex'
    );
  });

  test('validateRegex rejects unclosed group', () => {
    assert.strictEqual(
      validateRegex('(unclosed'),
      false,
      'Should reject unclosed group'
    );
  });

  test('validateRegex handles null input', () => {
    assert.strictEqual(validateRegex(null), false, 'Should reject null');
  });

  test('validateRegex handles undefined input', () => {
    assert.strictEqual(validateRegex(undefined), false, 'Should reject undefined');
  });

  test('validateRegex handles empty string', () => {
    assert.strictEqual(validateRegex(''), false, 'Should reject empty string');
  });
});

describe('Response Parsing', () => {
  beforeEach(async () => {
    try {
      const module = await import('../scripts/parsers/llm-parser.js');
      parseGeminiResponse = module.parseGeminiResponse;
    } catch {
      // Module not yet created
    }
  });

  test('parseGeminiResponse extracts codes from valid response', () => {
    const response = {
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              codes: [{ code: 'TEST123', brand_name: 'TestBrand', confidence: 0.9 }],
              suggested_regex: 'code[:\\s]+([A-Z0-9]+)',
              reasoning: 'Found code pattern'
            })
          }]
        }
      }]
    };

    const result = parseGeminiResponse(response);
    assert.ok(result.success, 'Should parse successfully');
    assert.strictEqual(result.codes.length, 1);
    assert.strictEqual(result.codes[0].code, 'TEST123');
    assert.strictEqual(result.suggested_regex, 'code[:\\s]+([A-Z0-9]+)');
  });

  test('parseGeminiResponse handles empty codes array', () => {
    const response = {
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              codes: [],
              suggested_regex: null,
              reasoning: 'No codes found'
            })
          }]
        }
      }]
    };

    const result = parseGeminiResponse(response);
    assert.ok(result.success, 'Should parse successfully even with no codes');
    assert.strictEqual(result.codes.length, 0);
  });

  test('parseGeminiResponse handles malformed JSON', () => {
    const response = {
      candidates: [{
        content: {
          parts: [{
            text: 'not valid json'
          }]
        }
      }]
    };

    const result = parseGeminiResponse(response);
    assert.strictEqual(result.success, false, 'Should fail on malformed JSON');
  });

  test('parseGeminiResponse handles empty response', () => {
    const result = parseGeminiResponse(null);
    assert.strictEqual(result.success, false, 'Should fail on null response');
  });

  test('parseGeminiResponse handles missing candidates', () => {
    const response = { candidates: [] };
    const result = parseGeminiResponse(response);
    assert.strictEqual(result.success, false, 'Should fail on empty candidates');
  });
});

describe('Prompt Building', () => {
  beforeEach(async () => {
    try {
      const module = await import('../scripts/parsers/llm-parser.js');
      LlmParser = module.LlmParser;
    } catch {
      // Module not yet created
    }
  });

  test('buildPrompt includes description', () => {
    const parser = new LlmParser('test-api-key');
    const prompt = parser.buildPrompt('Test description with code PROMO123');
    assert.ok(prompt.includes('Test description'), 'Prompt should include description');
    assert.ok(prompt.includes('PROMO123'), 'Prompt should include the code');
  });

  test('buildPrompt requests JSON response format', () => {
    const parser = new LlmParser('test-api-key');
    const prompt = parser.buildPrompt('Test description');
    assert.ok(
      prompt.includes('JSON') || prompt.includes('json'),
      'Prompt should request JSON format'
    );
  });

  test('buildPrompt requests suggested_regex', () => {
    const parser = new LlmParser('test-api-key');
    const prompt = parser.buildPrompt('Test description');
    assert.ok(
      prompt.includes('suggested_regex') || prompt.includes('regex'),
      'Prompt should request suggested regex'
    );
  });
});

describe('parseDescription method', () => {
  beforeEach(async () => {
    try {
      const module = await import('../scripts/parsers/llm-parser.js');
      LlmParser = module.LlmParser;
    } catch {
      // Module not yet created
    }
  });

  test('parseDescription method exists', () => {
    const parser = new LlmParser('test-api-key');
    assert.ok(parser.parseDescription, 'Should have parseDescription method');
    assert.strictEqual(typeof parser.parseDescription, 'function');
  });

  test('parseDescription returns quota_exhausted when limit reached', async () => {
    const parser = new LlmParser('test-api-key');
    parser.callsToday = 150;

    const result = await parser.parseDescription('Test description', 'video123');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, 'quota_exhausted');
  });

  test('parseDescription returns error for empty description', async () => {
    const parser = new LlmParser('test-api-key');
    const result = await parser.parseDescription('', 'video123');
    assert.strictEqual(result.success, false);
  });
});
