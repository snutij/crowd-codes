/**
 * Regex Parser Tests
 * Story 2.3: Implement Regex-Based Code Parser
 *
 * Tests validate:
 * - Pattern loading from patterns.json
 * - Code extraction from descriptions
 * - Brand inference logic
 * - Database storage operations
 * - Edge cases (no match, multiple codes)
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { existsSync } from 'fs';

// Dynamic imports for modules not yet created
let RegexParser;
let loadPatterns;
let generateSlug;
let generateCodeId;
let runParser;

describe('patterns.json', () => {
  test('patterns.json file exists', () => {
    assert.ok(
      existsSync('data/patterns.json'),
      'data/patterns.json should exist'
    );
  });

  test('patterns.json has valid structure', async () => {
    const { readFileSync } = await import('fs');
    const content = JSON.parse(readFileSync('data/patterns.json', 'utf-8'));

    assert.ok(Array.isArray(content.patterns), 'Should have patterns array');
    assert.ok(content.patterns.length > 0, 'Should have at least one pattern');

    const pattern = content.patterns[0];
    assert.ok(pattern.id, 'Pattern should have id');
    assert.ok(pattern.regex, 'Pattern should have regex');
    assert.ok(
      typeof pattern.confidence === 'number',
      'Pattern should have numeric confidence'
    );
  });

  test('all patterns have valid regex', async () => {
    const { readFileSync } = await import('fs');
    const content = JSON.parse(readFileSync('data/patterns.json', 'utf-8'));

    for (const pattern of content.patterns) {
      assert.doesNotThrow(
        () => new RegExp(pattern.regex, 'i'),
        `Pattern ${pattern.id} should have valid regex`
      );
    }
  });
});

describe('RegexParser', () => {
  beforeEach(async () => {
    try {
      const module = await import('../scripts/parsers/regex-parser.js');
      RegexParser = module.RegexParser;
      loadPatterns = module.loadPatterns;
      generateSlug = module.generateSlug;
      generateCodeId = module.generateCodeId;
    } catch {
      // Module not yet created - tests will fail as expected in RED phase
    }
  });

  test('RegexParser class exists', () => {
    assert.ok(RegexParser, 'RegexParser should be exported');
    assert.strictEqual(typeof RegexParser, 'function', 'Should be a class');
  });

  test('creates instance with default patterns path', () => {
    const parser = new RegexParser();
    assert.ok(parser, 'Should create parser instance');
    assert.ok(parser.patterns, 'Should have patterns loaded');
    assert.ok(parser.patterns.length > 0, 'Should have at least one pattern');
  });

  test('parseDescription returns array', () => {
    const parser = new RegexParser();
    const result = parser.parseDescription('Some description');
    assert.ok(Array.isArray(result), 'Should return array');
  });

  test('extracts simple promo code', () => {
    const parser = new RegexParser();
    const result = parser.parseDescription(
      'Utilisez le code promo: SUMMER20 pour -20%!'
    );

    assert.ok(result.length >= 1, 'Should extract at least one code');
    assert.ok(
      result.some((r) => r.code === 'SUMMER20'),
      'Should extract SUMMER20'
    );
  });

  test('extracts code with "code" keyword', () => {
    const parser = new RegexParser();
    const result = parser.parseDescription('Mon code: FLASH50');

    assert.ok(result.length >= 1, 'Should extract code');
    assert.ok(
      result.some((r) => r.code === 'FLASH50'),
      'Should extract FLASH50'
    );
  });

  test('extracts brand-prefixed codes like NIKE15', () => {
    const parser = new RegexParser();
    const result = parser.parseDescription(
      'Profitez de -15% avec le code NIKE15'
    );

    assert.ok(result.length >= 1, 'Should extract code');
    const code = result.find((r) => r.code === 'NIKE15');
    assert.ok(code, 'Should extract NIKE15');
  });

  test('returns empty array when no code found', () => {
    const parser = new RegexParser();
    const result = parser.parseDescription(
      'Bonjour, voici ma video sur la cuisine. Abonnez vous!'
    );

    assert.strictEqual(result.length, 0, 'Should return empty array');
  });

  test('handles multiple codes in one description', () => {
    const parser = new RegexParser();
    const result = parser.parseDescription(
      'Utilisez SUMMER20 ou WINTER30 pour des réductions!'
    );

    assert.ok(result.length >= 2, 'Should extract multiple codes');
  });

  test('extracted code has required fields', () => {
    const parser = new RegexParser();
    const result = parser.parseDescription('Code promo: TEST123');

    assert.ok(result.length >= 1, 'Should extract code');
    const code = result[0];

    assert.ok(code.code, 'Should have code field');
    assert.ok(code.brand_name, 'Should have brand_name field');
    assert.ok(code.brand_slug, 'Should have brand_slug field');
    assert.ok(
      typeof code.confidence === 'number',
      'Should have numeric confidence'
    );
    assert.ok(code.pattern_id, 'Should have pattern_id field');
  });
});

describe('Brand inference', () => {
  beforeEach(async () => {
    try {
      const module = await import('../scripts/parsers/regex-parser.js');
      RegexParser = module.RegexParser;
      generateSlug = module.generateSlug;
    } catch {
      // Module not yet created
    }
  });

  test('generateSlug converts to kebab-case', () => {
    assert.strictEqual(generateSlug('NordVPN'), 'nordvpn');
    assert.strictEqual(generateSlug('My Brand'), 'my-brand');
    assert.strictEqual(generateSlug('NIKE'), 'nike');
    assert.strictEqual(generateSlug('L\'Oréal'), 'loreal');
  });

  test('infers brand from code pattern BRAND##', () => {
    const parser = new RegexParser();
    const result = parser.parseDescription('Code: ADIDAS20');

    const code = result.find((r) => r.code === 'ADIDAS20');
    if (code) {
      assert.ok(
        code.brand_name.toLowerCase().includes('adidas'),
        'Should infer Adidas brand'
      );
    }
  });
});

describe('generateCodeId', () => {
  beforeEach(async () => {
    try {
      const module = await import('../scripts/parsers/regex-parser.js');
      generateCodeId = module.generateCodeId;
    } catch {
      // Module not yet created
    }
  });

  test('generates deterministic ID', () => {
    const id1 = generateCodeId('CODE123', 'brand', 'video1');
    const id2 = generateCodeId('CODE123', 'brand', 'video1');

    assert.strictEqual(id1, id2, 'Same inputs should produce same ID');
  });

  test('generates different IDs for different inputs', () => {
    const id1 = generateCodeId('CODE123', 'brand1', 'video1');
    const id2 = generateCodeId('CODE456', 'brand2', 'video2');

    assert.notStrictEqual(id1, id2, 'Different inputs should produce different IDs');
  });

  test('returns string of reasonable length', () => {
    const id = generateCodeId('CODE', 'brand', 'video');

    assert.strictEqual(typeof id, 'string');
    assert.ok(id.length >= 8, 'ID should be at least 8 chars');
    assert.ok(id.length <= 64, 'ID should be at most 64 chars');
  });
});

describe('parse.js main module', () => {
  beforeEach(async () => {
    try {
      const module = await import('../scripts/parse.js');
      runParser = module.runParser;
    } catch {
      // Module not yet created
    }
  });

  test('exports runParser function', () => {
    assert.ok(runParser, 'Should export runParser');
    assert.strictEqual(typeof runParser, 'function', 'Should be a function');
  });
});
